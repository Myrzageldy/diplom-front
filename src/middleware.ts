import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files
  // - _next
  matcher: ['/', '/(ru|kk)/:path*', '/((?!api|_next|.*\\..*).*)']
};
