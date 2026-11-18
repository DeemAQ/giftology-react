import { SallaReviews } from '@salla.sa/twilight-components-react/reviews';
import { useReveal } from '../../hooks/useReveal';
import { blockText } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { SectionHead } from './SectionHead';
import { useGly } from './useGly';

/**
 * Customer reviews: the store's real testimonials, loaded by `<salla-reviews>`.
 * The merchant manages them in the Salla dashboard; the block is empty until
 * there are some.
 */
export function Testimonials({ data }: { data?: BlockData }) {
  const { t, locale } = useGly();
  const reveal = useReveal();
  const own = (key: string) => blockText(data, key, locale) || t(`blocks.gly.testi.${key}`);

  return (
    <section id="gly-testi" className="gly-section gly-testi">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={own('eyebrow')}
          title={own('title_pre')}
          emphasis={own('title_em')}
        />
        <div ref={reveal.ref} className={`gly-reviews ${reveal.className}`}>
          <SallaReviews type="store" limit={9} sort="latest" />
        </div>
      </div>
    </section>
  );
}
