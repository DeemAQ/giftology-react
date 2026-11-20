import { useQuery } from '@tanstack/react-query';
import { ProductCardSkeleton } from '@salla.sa/twilight-components-react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { useReveal } from '../../hooks/useReveal';
import { blockCopy, blockLink, choiceValue, settingText, storePage } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { ProductCard } from '../product';
import { ArrowIcon } from './icons';
import { SectionHead } from './SectionHead';
import { useGly } from './useGly';

/** How many products the section shows unless the block says otherwise. */
const LIMIT = 8;
/** The counts the block offers. */
const LIMITS = [4, 8, 12];
const PLACEHOLDERS = Array.from({ length: 4 }, (_, index) => index);

/**
 * The section's query. The home route's loader fetches the same one first
 * (`app/routes/index.tsx`), so the products are already there when this renders.
 * A block that asks for more than the usual eight fetches its own, larger page.
 */
export const latestProductsQuery = (count = LIMIT) =>
  product.queries.list({ source: 'latest', perPage: Math.max(count, LIMIT) });

/**
 * Latest products: the store's newest (8, or the count picked in the block), under a
 * brand heading, with a "view all" button to the link picked in the block (the
 * store's latest-products page when unset). `id="gly-latest"` is the
 * target of the hero button and the menu link.
 */
export function LatestProducts({ data: block }: { data?: BlockData }) {
  const { settings, t, homeUrl, locale } = useGly();
  const title =
    blockCopy(block, 'title', locale) ||
    settingText(settings, 'gly_latest_title') ||
    t('blocks.gly.latest.title');
  const viewAll =
    blockLink(block?.url) ||
    settingText(settings, 'gly_latest_url') ||
    storePage(homeUrl, 'latest-products');
  const reveal = useReveal();
  const chosen = Number(choiceValue(block?.limit));
  const limit = LIMITS.includes(chosen) ? chosen : LIMIT;
  const { data, isLoading } = useQuery(latestProductsQuery(limit));
  const products = (data?.items ?? []).slice(0, limit);

  return (
    <section id="gly-latest" className="gly-section gly-latest">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={blockCopy(block, 'eyebrow', locale) || t('blocks.gly.latest.eyebrow')}
          title={title}
        />

        <div
          className="gly-latest-grid s-products-list-wrapper s-products-list-vertical-cards"
          aria-busy={isLoading}
          data-count={limit}
        >
          {isLoading
            ? PLACEHOLDERS.map((index) => <ProductCardSkeleton key={index} />)
            : products.map((item) => <ProductCard key={item.id} product={item} layout="vertical" />)}
        </div>

        <div ref={reveal.ref} className={`gly-latest-more ${reveal.className}`}>
          <Link className="gly-btn gly-btn-primary" to={viewAll}>
            {blockCopy(block, 'view_all', locale) || t('blocks.gly.latest.view_all')}
            <ArrowIcon className="gly-arr" />
          </Link>
        </div>
      </div>
    </section>
  );
}
