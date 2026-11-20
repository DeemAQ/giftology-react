/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const LATEST = { queryKey: ['products', 'list', 'latest'] };
const CATEGORIES = { queryKey: ['categories', 'list'] };

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
}));
const blocks = vi.hoisted(() => ({
  load: (_ctx: { locale?: string }): Promise<unknown> => Promise.resolve(null),
}));
vi.mock('@salla.sa/twilight-theme-engine/routes/home', () => ({
  Home: { id: 'index', loader: (ctx: { locale?: string }) => blocks.load(ctx) },
}));
// `withHead(route, extend)`: the route's head is the engine's, passed through `extend`.
vi.mock('@salla.sa/twilight-theme-engine/tanstack', () => ({
  withHead:
    (_route: unknown, extend: (head: Record<string, unknown>) => Record<string, unknown>) => () =>
      extend({ title: 'Home', links: [{ rel: 'canonical', href: 'https://shop.test/ar' }] }),
}));
vi.mock('../../app/assets/images/teal_pattern_with_bg.webp', () => ({ default: '/assets/pattern.webp' }));
vi.mock('../../app/components/giftology/GiftologyHome', () => ({ GiftologyHome: () => null }));
vi.mock('../../app/components/giftology/LatestProducts', () => ({
  latestProductsQuery: () => LATEST,
}));
vi.mock('../../app/components/giftology/categoryTree', () => ({
  categoryTreeQuery: () => CATEGORIES,
}));

type Loader = (ctx: {
  context: { queryClient: { prefetchQuery: (q: unknown) => Promise<void> } };
  params: { locale?: string };
}) => Promise<unknown>;

const STORE_BLOCKS = {
  locale: 'en',
  components: [{ path: 'brands' }],
  page: { slug: 'index' },
};

async function loaderWith(prefetchQuery: (q: unknown) => Promise<void>, locale = 'en') {
  const { Route } = await import('../../app/routes/index');
  const { loader } = Route as unknown as { loader: Loader };
  return loader({ context: { queryClient: { prefetchQuery } }, params: { locale } });
}

describe('home route loader', () => {
  beforeEach(() => {
    blocks.load = vi.fn(async () => STORE_BLOCKS);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the merchant's home blocks, asked for in the page's language", async () => {
    expect(await loaderWith(async () => {})).toEqual(STORE_BLOCKS);
    expect(blocks.load).toHaveBeenCalledWith({ locale: 'en' });
  });

  it('still opens the page, without blocks, when they cannot be loaded', async () => {
    blocks.load = async () => {
      throw new Error('network');
    };
    // Data is returned either way: `withHead` builds no head without it.
    expect(await loaderWith(async () => {}, 'ar')).toEqual({
      locale: 'ar',
      components: [],
      page: { slug: 'index' },
    });
  });

  it('waits for the latest products and the category tree on the server, so they are in the HTML', async () => {
    vi.stubEnv('SSR', true);
    let finished = 0;
    const prefetchQuery = vi.fn(async () => {
      await Promise.resolve();
      finished += 1;
    });
    await loaderWith(prefetchQuery);
    expect(prefetchQuery).toHaveBeenCalledWith(LATEST);
    // The circles and the gift finder's first question are built from it.
    expect(prefetchQuery).toHaveBeenCalledWith(CATEGORIES);
    expect(finished).toBe(2);
  });

  it('starts those requests in the browser without holding the page back', async () => {
    vi.stubEnv('SSR', false);
    const prefetchQuery = vi.fn(() => new Promise<void>(() => {}));
    // Resolves although the request never finishes.
    await loaderWith(prefetchQuery);
    expect(prefetchQuery).toHaveBeenCalledWith(LATEST);
  });
});

describe('home route head', () => {
  it("keeps the engine's head and preloads the hero pattern on wide screens", async () => {
    const { Route } = await import('../../app/routes/index');
    const head = (Route as unknown as { head: () => { title: string; links: Record<string, string>[] } }).head();

    expect(head.title).toBe('Home');
    expect(head.links).toEqual([
      { rel: 'canonical', href: 'https://shop.test/ar' },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        href: '/assets/pattern.webp',
        media: '(min-width: 768px)',
        fetchPriority: 'high',
      },
    ]);
  });
});
