/**
 * Auth: googleapis npm package (google-auth-library 포함)
 *
 * 선택 근거:
 * - googleapis/google-auth-library는 Google 공식 Node.js 클라이언트로,
 *   토큰 갱신·재시도·타입 정의를 포함한다.
 * - Sync 스크립트는 Node 서버 환경(GitHub Actions)에서만 실행되므로
 *   번들 크기 제약이 없다.
 */
import {google, type sheets_v4} from 'googleapis';

import {
  normalizeQuestionSheetRow,
  parseLocaleColumnKey,
  type NormalizedQuestionSourceRow
} from '@/features/variant-registry/sheets-row-normalizer';
import type {
  LandingCardAttribute,
  LocalizedStringList,
  LocalizedText,
  VariantRegistrySourceCard
} from '@/features/variant-registry/types';

export type SheetsClient = sheets_v4.Sheets;

type LandingLocaleField = 'title' | 'subtitle' | 'instruction' | 'tags';
type SheetCellValue = string | number | boolean | null | undefined;
type SheetRecord = Record<string, SheetCellValue>;

const LANDING_ATTRIBUTE_VALUES = new Set<LandingCardAttribute>([
  'available',
  'unavailable',
  'hide',
  'opt_out',
  'debug'
]);
const LANDING_LOCALE_FIELDS = new Set<LandingLocaleField>(['title', 'subtitle', 'instruction', 'tags']);
const SEQ_PATTERN = /^(?:q\.\d+|\d+)$/u;

export function createSheetsClient(serviceAccountKeyJson: string): SheetsClient {
  const key = JSON.parse(serviceAccountKeyJson) as Record<string, unknown>;
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  return google.sheets({version: 'v4', auth});
}

export async function loadLandingSheet(
  client: SheetsClient,
  spreadsheetId: string
): Promise<ReadonlyArray<VariantRegistrySourceCard>> {
  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range: 'Landing',
    valueRenderOption: 'UNFORMATTED_VALUE'
  });
  const records = valuesToRecords(response.data.values ?? []);
  const sourceCards: VariantRegistrySourceCard[] = [];

  for (const [index, record] of records.entries()) {
    if (isEmptyRecord(record)) {
      continue;
    }

    const card = parseLandingSourceCard(record, index + 2);
    if (card) {
      sourceCards.push(card);
    }
  }

  return sourceCards;
}

export async function loadQuestionsWorkbook(
  client: SheetsClient,
  spreadsheetId: string,
  locales: readonly string[]
): Promise<Map<string, NormalizedQuestionSourceRow[]>> {
  const workbook = await client.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title'
  });
  const sheetTitles =
    workbook.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => typeof title === 'string' && title.length > 0) ?? [];
  const rowsByVariant = new Map<string, NormalizedQuestionSourceRow[]>();

  for (const sheetTitle of sheetTitles) {
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: quoteSheetRange(sheetTitle),
      valueRenderOption: 'FORMATTED_VALUE'
    });
    const records = valuesToRecords(response.data.values ?? []);
    const normalizedRows = records
      .filter((record) => !isEmptyRecord(record) && hasParseableQuestionSeq(record.seq))
      .map((record) => normalizeQuestionSheetRow(stringifyRecord(record), locales));

    rowsByVariant.set(sheetTitle, normalizedRows);
  }

  return rowsByVariant;
}

// TODO(results): Results Sheets 준비 완료 시 loadResultsSheet(client, spreadsheetId) 함수를 추가한다.

function valuesToRecords(values: SheetCellValue[][]): SheetRecord[] {
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0].map((header) => String(header ?? '').trim());

  return values.slice(1).map((row) =>
    headers.reduce<SheetRecord>((record, header, index) => {
      if (header.length > 0) {
        record[header] = row[index];
      }

      return record;
    }, {})
  );
}

function isEmptyRecord(record: SheetRecord): boolean {
  return Object.values(record).every((value) => !hasNonEmptyValue(value));
}

function hasNonEmptyValue(value: SheetCellValue): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

function readTextCell(value: SheetCellValue): string | null {
  if (!hasNonEmptyValue(value)) {
    return null;
  }

  return String(value).trim();
}

function parseNumberCell(value: SheetCellValue): number {
  if (!hasNonEmptyValue(value)) {
    return Number.NaN;
  }

  return Number(value);
}

function parseLandingSourceCard(record: SheetRecord, rowNumber: number): VariantRegistrySourceCard | null {
  const variant = readTextCell(record.variant);
  if (!variant) {
    warnSkippedLandingRow(rowNumber, 'missing variant');
    return null;
  }

  const type = readTextCell(record.type);
  if (type !== 'test' && type !== 'blog') {
    warnSkippedLandingRow(rowNumber, `unsupported type "${type ?? ''}"`);
    return null;
  }

  const attribute = readTextCell(record.attribute);
  if (!isLandingCardAttribute(attribute)) {
    warnSkippedLandingRow(rowNumber, `unsupported attribute "${attribute ?? ''}"`);
    return null;
  }

  const seq = parseNumberCell(record.seq);
  const durationM = parseNumberCell(record.durationM);
  const sharedC = parseNumberCell(record.sharedC);
  const engagedC = parseNumberCell(record.engagedC);

  if (![seq, durationM, sharedC, engagedC].every(Number.isFinite)) {
    warnSkippedLandingRow(rowNumber, 'non-numeric seq/durationM/sharedC/engagedC');
    return null;
  }

  const commonCard = {
    seq,
    variant,
    attribute,
    title: buildLocalizedText(record, 'title'),
    subtitle: buildLocalizedText(record, 'subtitle'),
    tags: buildLocalizedStringList(record, 'tags'),
    durationM,
    sharedC,
    engagedC
  };

  if (type === 'test') {
    return {
      ...commonCard,
      type,
      instruction: buildLocalizedText(record, 'instruction')
    };
  }

  return {
    ...commonCard,
    type
  };
}

function isLandingCardAttribute(value: string | null): value is LandingCardAttribute {
  return !!value && LANDING_ATTRIBUTE_VALUES.has(value as LandingCardAttribute);
}

function buildLocalizedText(record: SheetRecord, targetField: LandingLocaleField): LocalizedText {
  return Object.entries(record).reduce<LocalizedText>((localizedText, [columnName, value]) => {
    const locale = parseLandingLocaleColumn(columnName, targetField);
    const text = readTextCell(value);

    if (locale && text) {
      localizedText[locale as keyof LocalizedText] = text;
    }

    return localizedText;
  }, {});
}

function buildLocalizedStringList(record: SheetRecord, targetField: LandingLocaleField): LocalizedStringList {
  return Object.entries(record).reduce<LocalizedStringList>((localizedList, [columnName, value]) => {
    const locale = parseLandingLocaleColumn(columnName, targetField);
    const text = readTextCell(value);

    if (locale && text) {
      const tags = text
        .split(' | ')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      localizedList[locale as keyof LocalizedStringList] = tags;
    }

    return localizedList;
  }, {});
}

function parseLandingLocaleColumn(columnName: string, targetField: LandingLocaleField): string | null {
  const separatorIndex = columnName.lastIndexOf('_');
  if (separatorIndex <= 0) {
    return null;
  }

  const field = columnName.slice(0, separatorIndex);
  if (field !== targetField || !LANDING_LOCALE_FIELDS.has(field as LandingLocaleField)) {
    return null;
  }

  const suffix = columnName.slice(separatorIndex + 1);
  const {locale} = parseLocaleColumnKey(`question_${suffix}`);

  return locale;
}

function stringifyRecord(record: SheetRecord): Record<string, string> {
  return Object.entries(record).reduce<Record<string, string>>((stringRecord, [key, value]) => {
    if (value !== null && value !== undefined) {
      stringRecord[key] = String(value);
    }

    return stringRecord;
  }, {});
}

function hasParseableQuestionSeq(value: SheetCellValue): boolean {
  const seq = readTextCell(value);

  return !!seq && SEQ_PATTERN.test(seq);
}

function quoteSheetRange(sheetTitle: string): string {
  return `'${sheetTitle.replaceAll("'", "''")}'`;
}

function warnSkippedLandingRow(rowNumber: number, reason: string): void {
  console.warn(`Skipping Landing row ${String(rowNumber)}: ${reason}.`);
}
