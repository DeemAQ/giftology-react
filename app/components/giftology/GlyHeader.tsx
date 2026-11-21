import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { SallaSearch } from '@salla.sa/twilight-components-react/search';
import { SallaUserMenu } from '@salla.sa/twilight-components-react/user-menu';
import { SallaCartSummary } from '@salla.sa/twilight-components-react/cart-summary';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import logo from '../../assets/images/teal_logo_trim.webp';
import { homeAnchor, settingOn } from '../../lib/giftology';
import { HOME_ROUTE_ID } from '../../lib/routeIds';
import { ShoppingBagIcon } from '../icons';
import { PageAdvertisements } from '../layout';
import { BurgerIcon, GlobeIcon, SearchIcon } from './icons';
import { useHomeSections } from './homeSections';
import { sectionLinks } from './navItems';
import { useGly } from './useGly';

const openSearch = () => window.salla?.event?.dispatch('search::open');
const openLocalization = () => window.salla?.event?.dispatch('localization::open');

interface GlyHeaderProps {
  menuOpen: boolean;
  onOpenMenu: () => void;
}

/**
 * Giftology header: at the start the logo and the "الأقسام" button that opens the
 * store's menu (on the same side, the right in Arabic); at the end search, language,
 * account and cart.
 *
 * The bar carries no other links unless the merchant turns them on
 * (`gly_header_links`): then the home sections that are on the page are linked beside
 * the button on wide screens, pointing back to the home page from any other page.
 * The menu holds them either way, so by default nothing is said twice.
 *
 * The bar turns solid once the page scrolls. On phones the bottom nav takes over
 * everything but the logo and the language button (`_home.scss`).
 * The `header:start` / `header:end` slots are kept for installed apps.
 */
export function GlyHeader({ menuOpen, onOpenMenu }: GlyHeaderProps) {
  const { store, settings, t, homeUrl } = useGly();
  const shown = useHomeSections();
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

  // Off unless asked for. The circles' own link is left out: the button beside them is "الأقسام".
  const barLinks = settingOn(settings, 'gly_header_links', false)
    ? sectionLinks(shown).filter((item) => item.id !== 'gly-cats')
    : [];

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

          <button
            type="button"
            className="gly-menu-btn"
            id="gly-burger"
            aria-expanded={menuOpen}
            aria-controls="gly-mmenu"
            aria-haspopup="dialog"
            onClick={onOpenMenu}
          >
            <BurgerIcon />
            {t('blocks.gly.nav.sections')}
          </button>

          {barLinks.length > 0 && (
            <div className="gly-menu">
              {barLinks.map((item) => (
                <a key={item.id} href={isHome ? `#${item.id}` : homeAnchor(homeUrl, item.id)}>
                  {t(item.label)}
                </a>
              ))}
            </div>
          )}
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
        </div>
      </nav>

      <SallaSearch suppressHydrationWarning />
      <HookSlot name="header:end" />
    </header>
  );
}
