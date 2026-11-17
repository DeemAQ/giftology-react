/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HOME_ROUTE_ID, PRODUCT_ROUTE_ID } from '../../../app/lib/routeIds';

const state = vi.hoisted(() => ({ routeIds: [] as string[] }));

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: { matches: { routeId: string }[] }) => unknown }) =>
    select({ matches: state.routeIds.map((routeId) => ({ routeId })) }),
}));

const { FontPreloads } = await import('../../../app/components/giftology/FontPreloads');

/** The font file names preloaded for `locale`, in order. */
function preloaded(locale: string): string[] {
  const html = renderToStaticMarkup(<FontPreloads locale={locale} />);
  const links = html.match(/<link[^>]+>/g) ?? [];
  for (const link of links) {
    expect(link).toContain('rel="preload"');
    expect(link).toContain('as="font"');
    expect(link).toContain('type="font/woff2"');
    // Without it the browser fetches the font twice.
    expect(link).toContain('crossorigin="anonymous"');
  }
  return links.map((link) => /href="[^"]*?([a-z-]+-\d+-normal)/.exec(link)?.[1] ?? link);
}

beforeEach(() => {
  state.routeIds = ['__root__', PRODUCT_ROUTE_ID];
});

describe('FontPreloads', () => {
  it('preloads the Arabic body font, regular and bold, on an Arabic page', () => {
    expect(preloaded('ar')).toEqual(['tajawal-arabic-400-normal', 'tajawal-arabic-700-normal']);
  });

  it('preloads the Latin files on an English page', () => {
    expect(preloaded('en')).toEqual(['tajawal-latin-400-normal', 'tajawal-latin-700-normal']);
  });

  it('adds the headline font on the home page, for the hero title', () => {
    state.routeIds = ['__root__', HOME_ROUTE_ID];
    expect(preloaded('ar')).toEqual([
      'tajawal-arabic-400-normal',
      'tajawal-arabic-700-normal',
      'amiri-arabic-700-normal',
    ]);
    expect(preloaded('en')[2]).toBe('amiri-latin-700-normal');
  });
});
