import type { CSSProperties } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useReveal } from '../../hooks/useReveal';
import { blockText, blockTiles, categoryTiles } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { SectionHead } from './SectionHead';
import { TILE_ICONS } from './tileIcons';
import { useGly } from './useGly';

/**
 * Category circles: up to 8 tiles the merchant edits in the dashboard
 * (`gly_tileN_enabled` / `_name` / `_icon` / `_image` / `_link`). An uploaded image
 * replaces the brand icon, which is drawn as a teal silhouette through a CSS mask.
 */
export function Categories({ data }: { data?: BlockData }) {
  const { settings, t, homeUrl, locale } = useGly();
  const reveal = useReveal();
  const own = (key: string) => blockText(data, key, locale) || t(`blocks.gly.cats.${key}`);
  // The circles listed in the block, else the built-in six (`gly_tileN_*`).
  const listed = blockTiles(data, t, homeUrl, locale, TILE_ICONS);
  const tiles = listed.length ? listed : categoryTiles(settings, t, homeUrl, locale, TILE_ICONS);

  return (
    <section id="gly-cats" className="gly-section gly-cats">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={own('eyebrow')}
          title={own('title_pre')}
          emphasis={own('title_em')}
        >
          <p>{own('sub')}</p>
        </SectionHead>

        <div ref={reveal.ref} className={`gly-cat-grid ${reveal.className}`}>
          {tiles.map((tile, index) => (
            // A fixed settings list with no id of its own; the slot number is its identity.
            <Link key={index} className="gly-cat" to={tile.url}>
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
