/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const LATEST = { queryKey: ['products', 'list', 'latest'] };

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
}));
vi.mock('@salla.sa/twilight-theme-engine/routes/home', () => ({ Home: {} }));
vi.mock('@salla.sa/twilight-theme-engine/tanstack', () => ({ withHead: () => () => ({}) }));
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
    const result = loaderWith(prefetchQuery);
    await result;
    expect(prefetchQuery).toHaveBeenCalledWith(LATEST);
    expect(finished).toBe(true);
  });

  it('starts the request in the browser without holding the page back', async () => {
    vi.stubEnv('SSR', false);
    const prefetchQuery = vi.fn(() => new Promise<void>(() => {}));
    expect(await loaderWith(prefetchQuery)).toBeUndefined();
    expect(prefetchQuery).toHaveBeenCalledWith(LATEST);
  });
});
