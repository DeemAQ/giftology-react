import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import { GiftologyHome } from '../components/giftology/GiftologyHome';

/**
 * Home route, owned by the theme (see FORKS.md): the engine's head (title,
 * description, canonical, Open Graph) with Giftology's curated sections in place
 * of the merchant's home blocks, so the engine's home loader isn't called.
 */
export const Route = createFileRoute('/{-$locale}/')({
  head: withHead(Home),
  component: GiftologyHome,
});
