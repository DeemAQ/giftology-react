import { useQuery } from '@tanstack/react-query';
import { ProductCardSkeleton } from '@salla.sa/twilight-components-react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { useReveal } from '../../hooks/useReveal';
import { blockLink, blockText, settingText, storePage } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { ProductCard } from '../product';
import { ArrowIcon } from './icons';
import { SectionHead } from './SectionHead';
import { useGly } from './useGly';

const LIMIT = 8;
const PLACEHOLDERS = Array.from({ length: 4 }, (_, index) => index);

/**
 * The section's query. The home route's loader fetches the same one first
 * (`app/routes/index.tsx`), so the products are already there when this renders.
 */
export const latestProductsQuery = () => product.queries.list({ source: 'latest', perPage: LIMIT });

/**
 * Latest products: the store's 8 newest, under a brand heading, with a "view all"
 * button to `gly_latest_url` (the store's latest-products page when unset). `id="gly-latest"` is the
 * target of the hero button and the menu link.
 */
export function LatestProducts({ data: block }: { data?: BlockData }) {
  const { settings, t, homeUrl, locale } = useGly();
  const title =
    blockText(block, 'title', locale) ||
    settingText(settings, 'gly_latest_title') ||
    t('blocks.gly.latest.title');
  const viewAll =
    blockLink(block?.url) ||
    settingText(settings, 'gly_latest_url') ||
    storePage(homeUrl, 'latest-products');
  const reveal = useReveal();
  const { data, isLoading } = useQuery(latestProductsQuery());
  const products = (data?.items ?? []).slice(0, LIMIT);

  return (
    <section id="gly-latest" className="gly-section gly-latest">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={blockText(block, 'eyebrow', locale) || t('blocks.gly.latest.eyebrow')}
          title={title}
        />

        <div
          className="gly-latest-grid s-products-list-wrapper s-products-list-vertical-cards"
          aria-busy={isLoading}
        >
          {isLoading
            ? PLACEHOLDERS.map((index) => <ProductCardSkeleton key={index} />)
            : products.map((item) => <ProductCard key={item.id} product={item} layout="vertical" />)}
        </div>

        <div ref={reveal.ref} className={`gly-latest-more ${reveal.className}`}>
          <Link className="gly-btn gly-btn-primary" to={viewAll}>
            {t('blocks.gly.latest.view_all')}
            <ArrowIcon className="gly-arr" />
          </Link>
        </div>
      </div>
    </section>
  );
}
