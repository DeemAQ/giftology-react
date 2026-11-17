/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const LATEST = { queryKey: ['products', 'list', 'latest'] };

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
}));
vi.mock('@salla.sa/twilight-theme-engine/routes/home', () => ({ Home: { id: 'index' } }));
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

type Loader = (ctx: { context: { queryClient: { prefetchQuery: (q: unknown) => Promise<void> } } }) => unknown;

async function loaderWith(prefetchQuery: (q: unknown) => Promise<void>) {
  const { Route } = await import('../../app/routes/index');
  const { loader } = Route as unknown as { loader: Loader };
  return loader({ context: { queryClient: { prefetchQuery } } });
}

describe('home route loader', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('waits for the latest products on the server, so they are in the HTML', async () => {
    vi.stubEnv('SSR', true);
    let finished = false;
    const prefetchQuery = vi.fn(async () => {
      await Promise.resolve();
      finished = true;
    });
    await loaderWith(prefetchQuery);
    expect(prefetchQuery).toHaveBeenCalledWith(LATEST);
    expect(finished).toBe(true);
  });

  it('starts the request in the browser without holding the page back', async () => {
    vi.stubEnv('SSR', false);
    const prefetchQuery = vi.fn(() => new Promise<void>(() => {}));
    // Resolves although the request never finishes.
    await loaderWith(prefetchQuery);
    expect(prefetchQuery).toHaveBeenCalledWith(LATEST);
  });

  it('returns loader data either way, because `withHead` skips the head without it', async () => {
    for (const ssr of [true, false]) {
      vi.stubEnv('SSR', ssr);
      expect(await loaderWith(async () => {})).toEqual({ page: { slug: 'index' } });
    }
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
