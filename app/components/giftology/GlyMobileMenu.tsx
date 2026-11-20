import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import type { Category } from '@salla.sa/twilight-theme-engine/types';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useScrollLock } from '../../hooks/useScrollLock';
import { allProductsUrl, homeAnchor, menuLabel, settingText } from '../../lib/giftology';
import { categoryTreeQuery } from './categoryTree';
import { useHomeSections } from './homeSections';
import { ChevronDownIcon, CloseIcon } from './icons';
import { sectionLinks } from './navItems';
import { useGly } from './useGly';

interface GlyMobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** One category in the drawer; a parent expands to "All" plus its children. */
function CategoryNode({
  node,
  allLabel,
  onNavigate,
}: {
  node: Category;
  allLabel: string;
  onNavigate: () => void;
}) {
  const { t } = useGly();
  const [open, setOpen] = useState(false);
  const children = node.sub_categories ?? node.items ?? [];
  const name = menuLabel(node.name, t);

  if (!children.length) {
    return (
      <li className="gly-catitem">
        <Link to={node.url} onClick={onNavigate}>
          {name}
        </Link>
      </li>
    );
  }

  return (
    <li className={`gly-catitem gly-has-sub${open ? ' open' : ''}`}>
      <button
        type="button"
        className="gly-catrow"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{name}</span>
        <ChevronDownIcon className="gly-catchev" />
      </button>
      <ul className="gly-subcatlist">
        <li>
          <Link to={node.url} onClick={onNavigate}>
            {allLabel}
          </Link>
        </li>
        {children.map((child) => (
          <CategoryNode key={child.id} node={child} allLabel={allLabel} onNavigate={onNavigate} />
        ))}
      </ul>
    </li>
  );
}

/**
 * Full-screen menu behind the header's menu button: Home, Latest products, the
 * "Sections" accordion, then the remaining home sections.
 *
 * The accordion lists the store's real category tree, fetched the first time the
 * menu opens (the home page already holds it). Until it arrives, or if it fails, a
 * single link to all products stands in.
 *
 * While open it behaves as a modal dialog: the page behind doesn't scroll, Tab stays
 * inside it, Escape closes it, and focus returns to the button that opened it.
 */
export function GlyMobileMenu({ open, onClose }: GlyMobileMenuProps) {
  const { settings, t, homeUrl } = useGly();
  const shown = useHomeSections();
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Once opened, the tree stays loaded for later openings.
  const [wanted, setWanted] = useState(false);
  const { data: categories } = useQuery({ ...categoryTreeQuery(), enabled: wanted });

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

  const sections = sectionLinks(shown);
  const latestUrl = settingText(settings, 'gly_latest_url') || homeAnchor(homeUrl, 'gly-latest');
  const allLabel = t('blocks.home.display_all', 'All');

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
      <button
        type="button"
        className="gly-mclose"
        id="gly-mclose"
        aria-label={t('blocks.gly.nav.close')}
        onClick={onClose}
      >
        <CloseIcon width={22} height={22} />
      </button>

      <Link to="/" onClick={onClose}>
        {t('blocks.gly.nav.home')}
      </Link>

      {shown.has('latest') && (
        <a href={latestUrl} onClick={onClose}>
          {t('blocks.gly.nav.latest')}
        </a>
      )}

      {/* The store's categories are worth a menu entry whether or not the home page shows circles. */}
      <div className={`gly-msub${sectionsOpen ? ' open' : ''}`}>
        <button
          type="button"
          className="gly-msub-toggle"
          aria-expanded={sectionsOpen}
          onClick={() => setSectionsOpen((value) => !value)}
        >
          {t('blocks.gly.nav.sections')}
          <ChevronDownIcon className="gly-msub-chev" />
        </button>
        <div className="gly-msub-panel">
          <div className="gly-catmenu" id="gly-catmenu">
            {categories?.length ? (
              <ul className="gly-catlist">
                {categories.map((node) => (
                  <CategoryNode key={node.id} node={node} allLabel={allLabel} onNavigate={onClose} />
                ))}
              </ul>
            ) : (
              <Link to={allProductsUrl(homeUrl)} onClick={onClose}>
                {allLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      {sections
        .filter((section) => section.id !== 'gly-cats')
        .map((section) => (
          <a key={section.id} href={homeAnchor(homeUrl, section.id)} onClick={onClose}>
            {t(section.label)}
          </a>
        ))}
    </div>
  );
}
