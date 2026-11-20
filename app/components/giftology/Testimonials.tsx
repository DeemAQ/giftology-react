import { SallaReviews } from '@salla.sa/twilight-components-react/reviews';
import { useReveal } from '../../hooks/useReveal';
import { blockCopy, choiceValue } from '../../lib/giftology';
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
  const own = (key: string) => blockCopy(data, key, locale) || t(`blocks.gly.testi.${key}`);
  const chosen = Number(choiceValue(data?.limit));
  const limit = [3, 6, 9, 12].includes(chosen) ? chosen : 9;

  return (
    <section id="gly-testi" className="gly-section gly-testi">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={blockCopy(data, 'eyebrow', locale)}
          title={own('title_pre')}
          tail={own('title_em')}
        />
        <div ref={reveal.ref} className={`gly-reviews ${reveal.className}`}>
          <SallaReviews type="store" limit={limit} sort="latest" />
        </div>
      </div>
    </section>
  );
}
