import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const googleMocks = vi.hoisted(() => {
  const sheetsClient = {spreadsheets: {values: {get: vi.fn()}, get: vi.fn()}};
  const GoogleAuth = vi.fn(function GoogleAuth(options: unknown) {
    return {kind: 'google-auth', options};
  });
  const sheets = vi.fn(() => sheetsClient);

  return {GoogleAuth, sheets, sheetsClient};
});

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: googleMocks.GoogleAuth
    },
    sheets: googleMocks.sheets
  }
}));

import {
  createSheetsClient,
  loadLandingSheet,
  loadQuestionsWorkbook,
  type SheetsClient
} from '../../scripts/sync/sheets-loader';

type MockSheetsClient = {
  spreadsheets: {
    values: {
      get: ReturnType<typeof vi.fn>;
    };
    get: ReturnType<typeof vi.fn>;
  };
};

const landingHeaders = [
  'seq',
  'type',
  'variant',
  'attribute',
  'title_EN',
  'title_KR',
  'subtitle_EN',
  'subtitle_KR',
  'tags_EN',
  'tags_KR',
  'instruction_EN',
  'instruction_KR',
  'durationM',
  'sharedC',
  'engagedC'
] as const;

const questionHeaders = [
  'seq',
  'question_EN',
  'pole_A',
  'pole_B',
  'answerA_EN',
  'answerB_EN',
  'question_KR',
  'answerA_KR',
  'answerB_KR',
  'question_XX'
] as const;

function createMockClient(): MockSheetsClient {
  return {
    spreadsheets: {
      values: {
        get: vi.fn()
      },
      get: vi.fn()
    }
  };
}

function landingRow(values: Partial<Record<(typeof landingHeaders)[number], unknown>>) {
  return landingHeaders.map((header) => values[header]);
}

function questionRow(values: Partial<Record<(typeof questionHeaders)[number], unknown>>) {
  return questionHeaders.map((header) => values[header]);
}

describe('createSheetsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('googleapis GoogleAuth와 readonly Sheets scope로 v4 client를 생성한다', () => {
    const key = {client_email: 'sync@example.com', private_key: 'secret'};

    const client = createSheetsClient(JSON.stringify(key));

    expect(googleMocks.GoogleAuth).toHaveBeenCalledWith({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    expect(googleMocks.sheets).toHaveBeenCalledWith({
      version: 'v4',
      auth: expect.objectContaining({kind: 'google-auth'})
    });
    expect(client).toBe(googleMocks.sheetsClient);
  });
});

describe('loadLandingSheet', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Landing flat locale columns를 builder가 소비하는 test/blog source card union으로 변환한다', async () => {
    const client = createMockClient();
    client.spreadsheets.values.get.mockResolvedValue({
      data: {
        values: [
          landingHeaders,
          landingRow({
            seq: '10',
            type: 'test',
            variant: 'qmbti',
            attribute: 'available',
            title_EN: '10m MBTI test',
            title_KR: '',
            subtitle_EN: 'Find your default cadence.',
            subtitle_KR: '기본 리듬을 찾아보세요.',
            tags_EN: 'Rapid | ipsum | Lorem',
            tags_KR: '',
            instruction_EN: 'Start with your rhythm.',
            instruction_KR: '리듬부터 시작합니다.',
            durationM: '3',
            sharedC: 2184,
            engagedC: '15236'
          }),
          landingRow({
            seq: 20,
            type: 'blog',
            variant: 'ops-handbook',
            attribute: 'available',
            title_EN: 'Operational Handbook',
            title_KR: '운영 핸드북',
            subtitle_EN: 'Release operations guide.',
            subtitle_KR: '릴리스 운영 가이드.',
            tags_EN: 'operations | release',
            tags_KR: '운영 | 배포',
            instruction_EN: 'This must be ignored for blog cards.',
            instruction_KR: '블로그 카드에서는 무시되어야 합니다.',
            durationM: '8',
            sharedC: '1920',
            engagedC: 42401
          }),
          landingRow({
            seq: 30,
            type: 'quiz',
            variant: 'unknown-type',
            attribute: 'available',
            title_EN: 'Unknown',
            subtitle_EN: 'Skipped',
            durationM: 1,
            sharedC: 1,
            engagedC: 1
          }),
          landingRow({
            seq: 40,
            type: 'test',
            variant: 'bad-duration',
            attribute: 'available',
            title_EN: 'Bad duration',
            subtitle_EN: 'Skipped',
            durationM: 'not-a-number',
            sharedC: 1,
            engagedC: 1
          }),
          landingRow({
            seq: 50,
            type: 'test',
            variant: 'bad-attribute',
            attribute: 'archived',
            title_EN: 'Bad attribute',
            subtitle_EN: 'Skipped',
            durationM: 1,
            sharedC: 1,
            engagedC: 1
          })
        ]
      }
    });

    const rows = await loadLandingSheet(client as unknown as SheetsClient, 'landing-spreadsheet');

    expect(client.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: 'landing-spreadsheet',
      range: 'Landing',
      valueRenderOption: 'UNFORMATTED_VALUE'
    });
    expect(rows).toHaveLength(2);

    const [testCard, blogCard] = rows;

    expect(testCard.type).toBe('test');
    if (testCard.type !== 'test') {
      throw new Error('expected test card');
    }
    expect(testCard).toEqual({
      seq: 10,
      type: 'test',
      variant: 'qmbti',
      attribute: 'available',
      title: {en: '10m MBTI test'},
      subtitle: {en: 'Find your default cadence.', kr: '기본 리듬을 찾아보세요.'},
      tags: {en: ['Rapid', 'ipsum', 'Lorem']},
      instruction: {en: 'Start with your rhythm.', kr: '리듬부터 시작합니다.'},
      durationM: 3,
      sharedC: 2184,
      engagedC: 15236
    });
    expect(testCard.title).not.toHaveProperty('kr');
    expect(testCard.tags).not.toHaveProperty('kr');

    expect(blogCard.type).toBe('blog');
    if (blogCard.type !== 'blog') {
      throw new Error('expected blog card');
    }
    expect(blogCard).toEqual({
      seq: 20,
      type: 'blog',
      variant: 'ops-handbook',
      attribute: 'available',
      title: {en: 'Operational Handbook', kr: '운영 핸드북'},
      subtitle: {en: 'Release operations guide.', kr: '릴리스 운영 가이드.'},
      tags: {en: ['operations', 'release'], kr: ['운영', '배포']},
      durationM: 8,
      sharedC: 1920,
      engagedC: 42401
    });
    expect('instruction' in blogCard).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });

  it('header만 있는 빈 Landing sheet는 빈 배열을 반환한다', async () => {
    const client = createMockClient();
    client.spreadsheets.values.get.mockResolvedValue({
      data: {
        values: [landingHeaders]
      }
    });

    await expect(loadLandingSheet(client as unknown as SheetsClient, 'landing-spreadsheet')).resolves.toEqual([]);
  });

  it('Landing API 오류는 caller가 판단하도록 그대로 throw한다', async () => {
    const client = createMockClient();
    const error = new Error('auth failed');
    client.spreadsheets.values.get.mockRejectedValue(error);

    await expect(loadLandingSheet(client as unknown as SheetsClient, 'landing-spreadsheet')).rejects.toThrow(error);
  });
});

describe('loadQuestionsWorkbook', () => {
  it('sheet title을 raw variant key로 유지하고 각 row를 normalizer-compatible shape로 변환한다', async () => {
    const client = createMockClient();
    client.spreadsheets.get.mockResolvedValue({
      data: {
        sheets: [
          {properties: {title: 'qmbti'}},
          {properties: {title: 'rhythm-b'}}
        ]
      }
    });
    client.spreadsheets.values.get.mockImplementation(({range}: {range: string}) => {
      if (range === "'qmbti'") {
        return Promise.resolve({
          data: {
            values: [
              questionHeaders,
              questionRow({
                seq: 'q.1',
                question_EN: 'Choose your profile.',
                answerA_EN: 'Profile A',
                answerB_EN: 'Profile B',
                question_KR: '프로필을 고르세요.',
                answerA_KR: '프로필 A',
                answerB_KR: '프로필 B',
                question_XX: 'Unsupported locale'
              }),
              questionRow({
                seq: '1',
                question_EN: 'Prefer fast starts?',
                pole_A: 'E',
                pole_B: 'I',
                answerA_EN: 'Yes',
                answerB_EN: 'No'
              }),
              questionRow({
                question_EN: 'Missing seq',
                answerA_EN: 'A',
                answerB_EN: 'B'
              })
            ]
          }
        });
      }

      return Promise.resolve({
        data: {
          values: [questionHeaders]
        }
      });
    });

    const rowsByVariant = await loadQuestionsWorkbook(
      client as unknown as SheetsClient,
      'questions-spreadsheet',
      ['en', 'kr']
    );

    expect(client.spreadsheets.get).toHaveBeenCalledWith({
      spreadsheetId: 'questions-spreadsheet',
      fields: 'sheets.properties.title'
    });
    expect(client.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: 'questions-spreadsheet',
      range: "'qmbti'",
      valueRenderOption: 'FORMATTED_VALUE'
    });
    expect(client.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: 'questions-spreadsheet',
      range: "'rhythm-b'",
      valueRenderOption: 'FORMATTED_VALUE'
    });
    expect([...rowsByVariant.keys()]).toEqual(['qmbti', 'rhythm-b']);
    expect(rowsByVariant.get('rhythm-b')).toEqual([]);
    expect(rowsByVariant.get('qmbti')).toEqual([
      {
        seq: 'q.1',
        question: {en: 'Choose your profile.', kr: '프로필을 고르세요.'},
        answerA: {en: 'Profile A', kr: '프로필 A'},
        answerB: {en: 'Profile B', kr: '프로필 B'}
      },
      {
        seq: '1',
        question: {en: 'Prefer fast starts?'},
        poleA: 'E',
        poleB: 'I',
        answerA: {en: 'Yes'},
        answerB: {en: 'No'}
      }
    ]);
  });

  it('Questions API 오류는 caller가 판단하도록 그대로 throw한다', async () => {
    const client = createMockClient();
    const error = new Error('network failed');
    client.spreadsheets.get.mockRejectedValue(error);

    await expect(
      loadQuestionsWorkbook(client as unknown as SheetsClient, 'questions-spreadsheet', ['en'])
    ).rejects.toThrow(error);
  });
});
