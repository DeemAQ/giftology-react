import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import type { HomeLoaderData } from '@salla.sa/twilight-theme-engine/routes/home';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import pattern from '../assets/images/teal_pattern_with_bg.webp';
import { GiftologyHome } from '../components/giftology/GiftologyHome';
import { latestProductsQuery } from '../components/giftology/LatestProducts';

/**
 * Home route, owned by the theme (see FORKS.md): the engine's loader and head, with
 * Giftology's curated sections around the merchant's home blocks.
 *
 * The loader also fetches the latest products into the shared query cache. The
 * server waits for them, so they are in the HTML it sends; in the browser the page
 * shows at once and the section fills in (`prefetchQuery` never rejects).
 *
 * If the blocks can't be loaded the page still opens, with the Giftology sections
 * only. The loader always returns data: `withHead` builds no head without it, which
 * is how the home page once went without its canonical and hreflang links.
 *
 * The head also preloads the hero's pattern where the hero art is the largest thing
 * on screen (tablet and up). It is a CSS background, which the browser otherwise
 * finds late and fetches at low priority. Same file as `--gly-pat` in `_tokens.scss`.
 */
export const Route = createFileRoute('/{-$locale}/')({
  loader: async ({ context, params }): Promise<HomeLoaderData> => {
    const products = context.queryClient.prefetchQuery(latestProductsQuery());
    const blocks = Home.loader({ locale: params.locale }).catch(
      (): HomeLoaderData => ({
        locale: params.locale ?? 'ar',
        components: [],
        page: { slug: Home.id },
      })
    );
    if (import.meta.env.SSR) await products;
    return blocks;
  },
  head: withHead(Home, (head) => ({
    ...head,
    links: [
      ...(head.links ?? []),
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        href: pattern,
        media: '(min-width: 768px)',
        fetchPriority: 'high',
      },
    ],
  })),
  component: HomeComponent,
});

function HomeComponent() {
  const data: HomeLoaderData = Route.useLoaderData();
  return <GiftologyHome components={data.components} />;
}
