import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { category } from '@salla.sa/twilight-theme-engine/api/category';
import type { Category } from '@salla.sa/twilight-theme-engine/types';

/**
 * A category page's direct subcategories as pills (Newborn → Baby Girl / Baby Boy).
 * Uses the children the page already has; otherwise fetches the category by id.
 * Renders nothing for a category without children.
 */
export function SubcategoryPills({ id, known }: { id: string; known?: Category[] | null }) {
  const { data } = useQuery({ ...category.queries.detail(id), enabled: !known?.length });
  const children = known?.length ? known : (data?.sub_categories ?? data?.items ?? []);
  if (!children.length) return null;

  return (
    <nav className="gly-subcats" id="gly-subcats">
      {children.map((child) => (
        <Link key={child.id} className="gly-subcat" to={child.url}>
          {child.name}
        </Link>
      ))}
    </nav>
  );
}
