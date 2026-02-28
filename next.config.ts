import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  typedRoutes: true,
  experimental: {
    globalNotFound: true
  }
};

export default withNextIntl(nextConfig);
