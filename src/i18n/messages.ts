import type {AppLocale} from '@/config/site';
import en from '@/messages/en.json';
import ja from '@/messages/ja.json';
import kr from '@/messages/kr.json';

export const messagesByLocale: Record<AppLocale, typeof en> = {
  en,
  kr,
  ja
};
