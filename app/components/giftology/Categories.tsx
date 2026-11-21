import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useReveal } from '../../hooks/useReveal';
import {
  TILE_COUNT,
  blockCopy,
  choiceValue,
  blockTiles,
  categoryCircles,
  categoryTiles,
  settingText,
} from '../../lib/giftology';
import type { BlockData, CategoryTile, GlySettings } from '../../lib/giftology';
import type { CategoryNode } from '../../lib/giftFinder';
import { categoryTreeQuery } from './categoryTree';
import { SectionHead } from './SectionHead';
import { TILE_ICONS } from './tileIcons';
import { useGly } from './useGly';

/** Whether a store still holds circle links saved in the old `gly_tileN_link` settings. */
function hasSavedTiles(settings: GlySettings): boolean {
  return Array.from({ length: TILE_COUNT }, (_, index) => index + 1).some(
    (slot) => settingText(settings, `gly_tile${slot}_link`) !== ''
  );
}

/**
 * The circles of the home page, and of the full-screen menu while the category tree
 * is on its way:
 *
 * 1. the categories the merchant picked in the circles block, in their order;
 * 2. with none picked, the store's top-level categories that hold products;
 * 3. then the extra circles listed by hand in the block (offers, a page).
 *
 * A store that still has links saved in the old `gly_tileN_*` settings keeps those
 * circles until the block is added. With nothing to go on at all (no categories yet)
 * the six ready-made circles show, each opening the all-products page.
 */
export function useCircles(data?: BlockData): CategoryTile[] {
  const { settings, t, homeUrl, locale } = useGly();
  const { data: tree } = useQuery(categoryTreeQuery());
  const saved = () => categoryTiles(settings, t, homeUrl, locale, TILE_ICONS);
  if (!data && hasSavedTiles(settings)) return saved();

  const picked = Array.isArray(data?.categories) ? (data.categories as Partial<CategoryNode>[]) : [];
  const circles = [
    ...categoryCircles(tree as CategoryNode[] | undefined, picked, t),
    ...blockTiles(data, t, homeUrl, locale, TILE_ICONS),
  ];
  return circles.length ? circles : saved();
}

/**
 * Category circles. Each shows its category's image from Salla; a category without
 * one shows a brand icon, drawn as a teal silhouette through a CSS mask. The block
 * says how an image sits in its circle (`image_fit`): inside it like an icon, or
 * filling it like a photo.
 */
export function Categories({ data }: { data?: BlockData }) {
  const { t, locale } = useGly();
  const reveal = useReveal();
  const own = (key: string) => blockCopy(data, key, locale) || t(`blocks.gly.cats.${key}`);
  const tiles = useCircles(data);
  // A photo fills the circle; an icon-like image sits inside it with room around.
  const photos = choiceValue(data?.image_fit) === 'cover';

  return (
    <section id="gly-cats" className="gly-section gly-cats">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={blockCopy(data, 'eyebrow', locale)}
          title={own('title_pre')}
          tail={own('title_em')}
        >
          <p>{own('sub')}</p>
        </SectionHead>

        <div ref={reveal.ref} className={`gly-cat-grid ${reveal.className}`}>
          {tiles.map((tile, index) => (
            // Two circles may share a link (two that are not set yet); the place tells them apart.
            <Link
              key={`${index}-${tile.url}`}
              className={`gly-cat${photos && tile.image ? ' gly-cat--photo' : ''}`}
              to={tile.url}
            >
              <span className="gly-cat-ic">
                {tile.image ? (
                  <img
                    className="gly-cat-img"
                    src={tile.image}
                    alt=""
                    width={58}
                    height={58}
                    loading="lazy"
                  />
                ) : (
                  <i
                    className="gly-cat-ico"
                    // Double quotes: Vite inlines small SVGs as data URIs that contain single quotes.
                    style={{ '--gly-ico': `url("${TILE_ICONS[tile.icon]}")` } as CSSProperties}
                  />
                )}
              </span>
              <span>{tile.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
