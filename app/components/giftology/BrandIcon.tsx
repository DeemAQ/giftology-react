import type { CSSProperties } from 'react';
import { TILE_ICONS } from './tileIcons';
import type { BrandIconName } from './tileIcons';

/**
 * One of the brand's drawn icons (the set behind the category circles), filled
 * with the current text colour through a CSS mask and sized by its class
 * (`.gly-ico`). Used where the theme once had emoji, which every device draws
 * differently. Decorative: hidden from screen readers.
 */
export function BrandIcon({ name, className = '' }: { name: BrandIconName; className?: string }) {
  return (
    <i
      className={`gly-ico ${className}`.trim()}
      aria-hidden="true"
      // Double quotes: Vite inlines small SVGs as data URIs that contain single quotes.
      style={{ '--gly-ico': `url("${TILE_ICONS[name]}")` } as CSSProperties}
    />
  );
}
