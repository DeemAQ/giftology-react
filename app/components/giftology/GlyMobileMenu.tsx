import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import logo from '../../assets/images/teal_logo_trim.webp';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useScrollLock } from '../../hooks/useScrollLock';
import { isCategory } from '../../lib/giftFinder';
import type { CategoryNode } from '../../lib/giftFinder';
import {
  allProductsUrl,
  blockLink,
  blockRows,
  categoryCircles,
  homeAnchor,
  menuLabel,
  resolveCategoryUrl,
  rowText,
  settingChoice,
  settingOn,
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
 * The store's menu, behind the header's menu button on every screen and the phone
 * bar's Menu tab: the whole screen on a phone, a side panel over a dimmed page on
 * anything wider.
 *
 * It is a shop's menu, so the categories come first and are shown, not folded away:
 * as circles with their Salla images (the brand icon when a category has none), each
 * opening its page, where its subcategories are. Then the custom gift and the gift
 * finder as two cards, the remaining home sections, the store's own menu entries
 * (offers, brands, blog) and the merchant's extra links as plain links, and at the
 * foot the WhatsApp button and Instagram.
 *
 * It fills itself from the store, and the "القائمة" settings say what shows:
 * - `gly_menu_categories`: the categories picked, in that order; none picked means
 *   the top-level ones that hold products;
 * - `gly_menu_show_sections`, `gly_menu_show_store_links`, `gly_menu_show_contact`:
 *   switches for the home-section links, the store's menu entries and the foot;
 * - `gly_menu_links`: links added by hand;
 * - `gly_subcats_style`: whether a category image fills its circle like a photo.
 *
 * The tree is fetched the first time the menu opens (the home page already holds
 * it). Until it arrives, or if it fails, the link to all products stands alone.
 *
 * While open it behaves as a modal dialog: the page behind doesn't scroll, Tab stays
 * inside it, Escape closes it, and focus returns to the button that opened it.
 */
export function GlyMobileMenu({ open, onClose }: GlyMobileMenuProps) {
  const { settings, store, t, locale, homeUrl, whatsappGeneral } = useGly();
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

  const picked = Array.isArray(settings?.gly_menu_categories)
    ? (settings.gly_menu_categories as Partial<CategoryNode>[])
    : [];
  const circles = categoryCircles(tree, picked, t);
  const photos = settingChoice(settings, 'gly_subcats_style') === 'cover';
  // Salla's list also carries the store's own menu entries, which are not categories.
  const storeLinks = settingOn(settings, 'gly_menu_show_store_links')
    ? (tree ?? []).filter((node) => !isCategory(node) && node.url)
    : [];
  const sections = settingOn(settings, 'gly_menu_show_sections')
    ? sectionLinks(shown).filter((section) => section.id !== 'gly-cats')
    : [];
  const featured = sections.filter((section) => FEATURED.includes(section.id));
  const others = sections.filter((section) => !FEATURED.includes(section.id));
  const showLatest = settingOn(settings, 'gly_menu_show_sections') && shown.has('latest');
  const latestUrl = settingText(settings, 'gly_latest_url') || homeAnchor(homeUrl, 'gly-latest');
  // Links the merchant added by hand: each needs its text and somewhere to go.
  const extraLinks = blockRows(settings, 'gly_menu_links')
    .map((row) => ({
      name: rowText(row, 'name', locale, t),
      url: resolveCategoryUrl(row.url, '', locale),
    }))
    .filter((link) => link.name && link.url);
  const showContact = settingOn(settings, 'gly_menu_show_contact');
  const chat = showContact ? whatsappGeneral : '';
  const instagram = showContact
    ? settingText(settings, 'gly_instagram') || store?.social?.instagram
    : '';

  return (
    <>
      {/* The dimmed page beside the panel on a wide screen; a click on it closes the menu. */}
      <div className={`gly-mscrim${open ? ' open' : ''}`} aria-hidden="true" onClick={onClose} />
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
            {showLatest && (
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
            {extraLinks.map((link) => (
              <li key={`${link.name}|${link.url}`}>
                <Link to={link.url} onClick={onClose}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {(chat || instagram) && (
          <div className="gly-mmenu__foot">
            {chat && (
              <a className="gly-btn gly-btn-wa" href={chat} target="_blank" rel="noopener">
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
    </>
  );
}
