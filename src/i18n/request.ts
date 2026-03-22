import {getRequestConfig} from 'next-intl/server';

import {defaultLocale, isLocale} from '@/config/site';
import {messagesByLocale} from '@/i18n/messages';

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale]
  };
});
