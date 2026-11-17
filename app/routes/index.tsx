import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
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
 */
export const Route = createFileRoute('/{-$locale}/')({
  loader: ({ context }) => {
    const products = context.queryClient.prefetchQuery(latestProductsQuery());
    return import.meta.env.SSR ? products : undefined;
  },
  head: withHead(Home),
  component: GiftologyHome,
});
