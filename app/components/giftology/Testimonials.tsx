import { SallaReviews } from '@salla.sa/twilight-components-react/reviews';
import { useReveal } from '../../hooks/useReveal';
import { SectionHead } from './SectionHead';
import { useGly } from './useGly';

/**
 * Customer reviews: the store's real testimonials, loaded by `<salla-reviews>`.
 * The merchant manages them in the Salla dashboard; the block is empty until
 * there are some.
 */
export function Testimonials() {
  const { t } = useGly();
  const reveal = useReveal();

  return (
    <section id="gly-testi" className="gly-section gly-testi">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={t('blocks.gly.testi.eyebrow')}
          title={t('blocks.gly.testi.title_pre')}
          emphasis={t('blocks.gly.testi.title_em')}
        />
        <div ref={reveal.ref} className={`gly-reviews ${reveal.className}`}>
          <SallaReviews type="store" limit={9} sort="latest" />
        </div>
      </div>
    </section>
  );
}
