import {getRequestConfig} from 'next-intl/server';

import {defaultLocale, isLocale, type AppLocale} from '@/config/site';
import en from '@/messages/en.json';
import kr from '@/messages/kr.json';

const messagesByLocale: Record<AppLocale, typeof en> = {
  en,
  kr
};

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale]
  };
});
