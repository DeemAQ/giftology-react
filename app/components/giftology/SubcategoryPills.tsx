import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { category } from '@salla.sa/twilight-theme-engine/api/category';
import type { Category } from '@salla.sa/twilight-theme-engine/types';
import { settingChoice } from '../../lib/giftology';
import { BrandIcon } from './BrandIcon';
import { useGly } from './useGly';

/**
 * A category page's direct subcategories (Newborn → Baby Girl / Baby Boy). Nothing
 * is set up in the theme: they are the category's children in Salla.
 *
 * When any of them has an image in Salla they show as small circles with their
 * images (one without an image gets the gift icon); otherwise as text pills. The
 * `gly_subcats_style` setting picks how an image sits in its circle (inside it like
 * an icon, or filling it like a photo), or text pills always.
 * Uses the children the page already has; otherwise fetches the category by id.
 * Renders nothing for a category without children.
 */
export function SubcategoryPills({ id, known }: { id: string; known?: Category[] | null }) {
  const { settings } = useGly();
  const style = settingChoice(settings, 'gly_subcats_style');
  const { data } = useQuery({ ...category.queries.detail(id), enabled: !known?.length });
  const children = known?.length ? known : (data?.sub_categories ?? data?.items ?? []);
  if (!children.length) return null;
  const circles = style !== 'text' && children.some((child) => child.image);
  const variant = circles ? ` gly-subcats--circles${style === 'cover' ? ' gly-subcats--photos' : ''}` : '';

  return (
    <nav className={`gly-subcats${variant}`} id="gly-subcats">
      {children.map((child) =>
        circles ? (
          <Link key={child.id} className="gly-subcirc" to={child.url}>
            <span className="gly-subcirc__ic">
              {child.image ? (
                <img src={child.image} alt="" width={40} height={40} loading="lazy" />
              ) : (
                <BrandIcon name="gift" />
              )}
            </span>
            <span>{child.name}</span>
          </Link>
        ) : (
          <Link key={child.id} className="gly-subcat" to={child.url}>
            {child.name}
          </Link>
        )
      )}
    </nav>
  );
}
