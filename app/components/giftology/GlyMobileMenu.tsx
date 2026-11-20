import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import logo from '../../assets/images/teal_logo_trim.webp';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useScrollLock } from '../../hooks/useScrollLock';
import { isCategory } from '../../lib/giftFinder';
import {
  allProductsUrl,
  categoryCircles,
  homeAnchor,
  menuLabel,
  settingChoice,
  settingText,
} from '../../lib/giftology';
import { BrandIcon } from './BrandIcon';
import type { BrandIconName } from './tileIcons';
import { categoryTreeQuery } from './categoryTree';
import { useHomeSections } from './homeSections';
import { CloseIcon, InstagramIcon, SearchIcon, SparkIcon, WhatsAppIcon } from './icons';
import { sectionLinks } from './navItems';
import { useGly } from './useGly';

interface GlyMobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** The two things only this store does: each gets a card of its own in the menu. */
const FEATURED = ['gly-custom', 'gly-finder'];

/**
 * Full-screen menu behind the header's menu button and the phone bar's Menu tab.
 *
 * It is a shop's menu, so the categories come first and are shown, not folded away:
 * the store's top-level categories as circles with their Salla images (the brand
 * icon when a category has none), each opening its page, where its subcategories
 * are. Then the custom gift and the gift finder as two cards, the remaining home
 * sections and the store's own menu entries (offers, brands, blog) as plain links,
 * and at the foot the WhatsApp button and Instagram.
 *
 * The tree is fetched the first time the menu opens (the home page already holds
 * it). Until it arrives, or if it fails, the link to all products stands alone.
 * `gly_subcats_style` says whether a category image fills its circle like a photo.
 *
 * While open it behaves as a modal dialog: the page behind doesn't scroll, Tab stays
 * inside it, Escape closes it, and focus returns to the button that opened it.
 */
export function GlyMobileMenu({ open, onClose }: GlyMobileMenuProps) {
  const { settings, store, t, homeUrl, whatsappGeneral } = useGly();
  const shown = useHomeSections();
  const menuRef = useRef<HTMLDivElement>(null);
  // Once opened, the tree stays loaded for later openings.
  const [wanted, setWanted] = useState(false);
  const { data: tree } = useQuery({ ...categoryTreeQuery(), enabled: wanted });

  useScrollLock(open);
  // Focuses the close button (the first control) on open, and the opener again on close.
  useDialogFocus(menuRef, open);

  useEffect(() => {
    if (!open) return;
    setWanted(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const circles = categoryCircles(tree, [], t);
  const photos = settingChoice(settings, 'gly_subcats_style') === 'cover';
  // Salla's list also carries the store's own menu entries, which are not categories.
  const storeLinks = (tree ?? []).filter((node) => !isCategory(node) && node.url);
  const sections = sectionLinks(shown).filter((section) => section.id !== 'gly-cats');
  const featured = sections.filter((section) => FEATURED.includes(section.id));
  const others = sections.filter((section) => !FEATURED.includes(section.id));
  const latestUrl = settingText(settings, 'gly_latest_url') || homeAnchor(homeUrl, 'gly-latest');
  const instagram = settingText(settings, 'gly_instagram') || store?.social?.instagram;

  return (
    <div
      ref={menuRef}
      tabIndex={-1}
      className={`gly-mmenu${open ? ' open' : ''}`}
      id="gly-mmenu"
      role="dialog"
      aria-modal="true"
      aria-label={t('blocks.gly.nav.menu')}
      // Off screen while closed: keep it out of the tab order and the reading order.
      inert={!open}
    >
      <div className="gly-mmenu__top">
        {/* First in the page's order, so it is what focus lands on; drawn at the far end. */}
        <button
          type="button"
          className="gly-mclose"
          id="gly-mclose"
          aria-label={t('blocks.gly.nav.close')}
          onClick={onClose}
        >
          <CloseIcon width={22} height={22} />
        </button>
        <Link to="/" className="gly-mmenu__brand" onClick={onClose}>
          <img src={logo} alt="" width={87} height={52} />
          <span className="sr-only">{t('blocks.gly.nav.home')}</span>
        </Link>
      </div>

      <div className="gly-mmenu__body">
        <div className="gly-mmenu__head">
          <h2>{t('blocks.gly.nav.sections')}</h2>
          <Link to={allProductsUrl(homeUrl)} onClick={onClose}>
            {t('blocks.home.display_all', 'All')}
          </Link>
        </div>
        {circles.length > 0 && (
          <ul className={`gly-mcats${photos ? ' gly-mcats--photos' : ''}`}>
            {circles.map((circle) => (
              <li key={circle.url}>
                <Link to={circle.url} className="gly-mcat" onClick={onClose}>
                  <span className="gly-mcat__ic">
                    {circle.image ? (
                      <img src={circle.image} alt="" width={40} height={40} loading="lazy" />
                    ) : (
                      <BrandIcon name={circle.icon as BrandIconName} />
                    )}
                  </span>
                  <span>{circle.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {featured.length > 0 && (
          <div className="gly-mfeat">
            {featured.map((section) => (
              <a key={section.id} href={homeAnchor(homeUrl, section.id)} onClick={onClose}>
                {section.id === 'gly-custom' ? <SparkIcon /> : <SearchIcon />}
                {t(section.label)}
              </a>
            ))}
          </div>
        )}

        <ul className="gly-mlinks">
          {shown.has('latest') && (
            <li>
              <a href={latestUrl} onClick={onClose}>
                {t('blocks.gly.nav.latest')}
              </a>
            </li>
          )}
          {others.map((section) => (
            <li key={section.id}>
              <a href={homeAnchor(homeUrl, section.id)} onClick={onClose}>
                {t(section.label)}
              </a>
            </li>
          ))}
          {storeLinks.map((node) => (
            <li key={node.id}>
              <Link to={node.url} onClick={onClose}>
                {menuLabel(node.name, t)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {(whatsappGeneral || instagram) && (
        <div className="gly-mmenu__foot">
          {whatsappGeneral && (
            <a className="gly-btn gly-btn-wa" href={whatsappGeneral} target="_blank" rel="noopener">
              <WhatsAppIcon />
              {t('blocks.gly.wa.float_label')}
            </a>
          )}
          {instagram && (
            <a
              className="gly-mmenu__social"
              href={instagram}
              target="_blank"
              rel="noopener"
              aria-label={t('blocks.gly.footer.instagram')}
            >
              <InstagramIcon />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
