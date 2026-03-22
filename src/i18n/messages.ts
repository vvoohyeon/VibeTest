import type {AppLocale} from '@/config/site';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import hi from '@/messages/hi.json';
import id from '@/messages/id.json';
import ja from '@/messages/ja.json';
import kr from '@/messages/kr.json';
import pt from '@/messages/pt.json';
import ru from '@/messages/ru.json';
import zs from '@/messages/zs.json';
import zt from '@/messages/zt.json';

export const messagesByLocale: Record<AppLocale, typeof en> = {
  en,
  kr,
  zs,
  zt,
  ja,
  es,
  fr,
  pt,
  de,
  hi,
  id,
  ru
};
