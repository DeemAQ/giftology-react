import { useRouterState } from '@tanstack/react-router';
import amiriArabic from '../../assets/fonts/amiri-arabic-700-normal.woff2?url';
import amiriLatin from '../../assets/fonts/amiri-latin-700-normal.woff2?url';
import tajawalArabic400 from '../../assets/fonts/tajawal-arabic-400-normal.woff2?url';
import tajawalArabic700 from '../../assets/fonts/tajawal-arabic-700-normal.woff2?url';
import tajawalLatin400 from '../../assets/fonts/tajawal-latin-400-normal.woff2?url';
import tajawalLatin700 from '../../assets/fonts/tajawal-latin-700-normal.woff2?url';
import { HOME_ROUTE_ID } from '../../lib/routeIds';

const BODY = { arabic: [tajawalArabic400, tajawalArabic700], latin: [tajawalLatin400, tajawalLatin700] };
const HEADLINE = { arabic: amiriArabic, latin: amiriLatin };

/**
 * Preloads the fonts of the first screen, so its text is drawn in the brand fonts
 * from the start instead of swapping in: the body font's regular and bold on every
 * page, plus the headline font on the home page (the hero title). Only the files
 * for the page's language; the rest of `_fonts.scss` loads when text needs it.
 *
 * Rendered in `<head>` by `__root.tsx`.
 */
export function FontPreloads({ locale }: { locale: string }) {
  const isHome = useRouterState({
    select: (state) => state.matches.some((match) => match.routeId === HOME_ROUTE_ID),
  });
  const script = locale === 'ar' ? 'arabic' : 'latin';
  const fonts = isHome ? [...BODY[script], HEADLINE[script]] : BODY[script];

  return (
    <>
      {fonts.map((href) => (
        <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />
      ))}
    </>
  );
}
