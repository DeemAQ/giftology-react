import { useQuery } from '@tanstack/react-query';
import { ProductCardSkeleton } from '@salla.sa/twilight-components-react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { useReveal } from '../../hooks/useReveal';
import { settingText } from '../../lib/giftology';
import { ProductCard } from '../product';
import { ArrowIcon } from './icons';
import { SectionHead } from './SectionHead';
import { useGly } from './useGly';

const LIMIT = 8;
const PLACEHOLDERS = Array.from({ length: 4 }, (_, index) => index);

/**
 * Latest products: the store's 8 newest, under a brand heading, with a "view all"
 * button to `gly_latest_url` (the home page when unset). `id="gly-latest"` is the
 * target of the hero button and the menu link.
 */
export function LatestProducts() {
  const { settings, t, homeUrl } = useGly();
  const reveal = useReveal();
  const { data, isLoading } = useQuery(product.queries.list({ source: 'latest', perPage: LIMIT }));
  const products = (data?.items ?? []).slice(0, LIMIT);

  return (
    <section id="gly-latest" className="gly-section gly-latest">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={t('blocks.gly.latest.eyebrow')}
          title={settingText(settings, 'gly_latest_title') || t('blocks.gly.latest.title')}
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
          <Link className="gly-btn gly-btn-primary" to={settingText(settings, 'gly_latest_url') || homeUrl}>
            {t('blocks.gly.latest.view_all')}
            <ArrowIcon className="gly-arr" />
          </Link>
        </div>
      </div>
    </section>
  );
}
