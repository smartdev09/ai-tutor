import createMiddleware from 'next-intl/middleware';
export default createMiddleware({
    locales: ['en', 'de', 'ar'],
    defaultLocale: 'en',
    localePrefix: 'as-needed'
});
export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};