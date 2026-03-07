import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: process.cwd()
  },
  experimental: {
    globalNotFound: true
  }
};

export default withNextIntl(nextConfig);
