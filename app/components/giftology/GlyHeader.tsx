import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { SallaSearch } from '@salla.sa/twilight-components-react/search';
import { SallaUserMenu } from '@salla.sa/twilight-components-react/user-menu';
import { SallaCartSummary } from '@salla.sa/twilight-components-react/cart-summary';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import logo from '../../assets/images/teal_logo_trim.webp';
import { homeAnchor } from '../../lib/giftology';
import { HOME_ROUTE_ID } from '../../lib/routeIds';
import { ShoppingBagIcon } from '../icons';
import { PageAdvertisements } from '../layout';
import { BurgerIcon, GlobeIcon, SearchIcon } from './icons';
import { enabledSections } from './navItems';
import { useGly } from './useGly';

const openSearch = () => window.salla?.event?.dispatch('search::open');
const openLocalization = () => window.salla?.event?.dispatch('localization::open');

interface GlyHeaderProps {
  menuOpen: boolean;
  onOpenMenu: () => void;
}

/**
 * Giftology header: logo and the home-section links at the start, then search,
 * language, account, cart and the menu button. The section links follow the
 * section toggles, so the nav grows and shrinks with the home page.
 *
 * The bar turns solid once the page scrolls. Off the home page the inline links
 * give way to the menu button (`.gly-header--inner`), as they do on small screens.
 * The `header:start` / `header:end` slots are kept for installed apps.
 */
export function GlyHeader({ menuOpen, onOpenMenu }: GlyHeaderProps) {
  const { store, settings, t, homeUrl } = useGly();
  const [solid, setSolid] = useState(false);
  // The route match, which the server and the client agree on.
  const isHome = useRouterState({
    select: (state) => state.matches.some((match) => match.routeId === HOME_ROUTE_ID),
  });

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showLocalization =
    !!store?.settings?.is_multilingual || !!store?.settings?.currencies_enabled;

  return (
    <header
      id="gly-hdr"
      className={`gly-header store-header${isHome ? '' : ' gly-header--inner'}${solid ? ' solid' : ''}`}
    >
      <HookSlot name="header:start" />
      <PageAdvertisements />
      <div className="gly-nav-bg" />
      <nav className="gly-nav gly-wrap" aria-label={t('blocks.gly.nav.menu')}>
        <div className="gly-nav-start">
          <Link to="/" className="gly-brand">
            <img src={logo} alt="" width={87} height={52} fetchPriority="high" />
            <span className="sr-only">{store?.name || 'Giftology'}</span>
          </Link>

          <div className="gly-menu">
            {enabledSections(settings).map((item) => (
              <a key={item.id} href={isHome ? `#${item.id}` : homeAnchor(homeUrl, item.id)}>
                {t(item.label)}
              </a>
            ))}
          </div>
        </div>

        <div className="gly-icons">
          <button
            type="button"
            className="gly-ibtn"
            aria-label={t('blocks.gly.nav.search')}
            onClick={openSearch}
          >
            <SearchIcon />
          </button>

          {showLocalization && (
            <button
              type="button"
              className="gly-ibtn gly-loc"
              aria-label={t('blocks.gly.nav.language')}
              aria-haspopup="dialog"
              onClick={openLocalization}
            >
              <GlobeIcon />
            </button>
          )}

          <SallaUserMenu avatarOnly showHeader relativeDropdown />

          <SallaCartSummary>
            <ShoppingBagIcon slot="icon" aria-hidden="true" />
          </SallaCartSummary>

          <button
            type="button"
            className="gly-ibtn gly-burger"
            id="gly-burger"
            aria-label={t('blocks.gly.nav.menu')}
            aria-expanded={menuOpen}
            aria-controls="gly-mmenu"
            onClick={onOpenMenu}
          >
            <BurgerIcon />
          </button>
        </div>
      </nav>

      <SallaSearch suppressHydrationWarning />
      <HookSlot name="header:end" />
    </header>
  );
}
