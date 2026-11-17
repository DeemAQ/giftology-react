import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import pattern from '../assets/images/teal_pattern_with_bg.webp';
import { GiftologyHome } from '../components/giftology/GiftologyHome';
import { latestProductsQuery } from '../components/giftology/LatestProducts';

/**
 * Home route, owned by the theme (see FORKS.md): the engine's head (title,
 * description, canonical, Open Graph) with Giftology's curated sections in place
 * of the merchant's home blocks, so the engine's home loader isn't called.
 *
 * The loader fetches the latest products into the shared query cache. The server
 * waits for them, so they are in the HTML it sends; in the browser the page shows
 * at once and the section fills in. A failed request leaves the section to fetch
 * for itself (`prefetchQuery` never rejects).
 *
 * The loader must return something: `withHead` builds no head for a route without
 * loader data, which is how the home page went without its canonical and hreflang
 * links. `Home.head` itself reads only the store's settings.
 *
 * The head also preloads the hero's pattern where the hero art is the largest thing
 * on screen (tablet and up). It is a CSS background, which the browser otherwise
 * finds late and fetches at low priority. Same file as `--gly-pat` in `_tokens.scss`.
 */
export const Route = createFileRoute('/{-$locale}/')({
  loader: async ({ context }) => {
    const products = context.queryClient.prefetchQuery(latestProductsQuery());
    if (import.meta.env.SSR) await products;
    return { page: { slug: Home.id } };
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
  component: GiftologyHome,
});
