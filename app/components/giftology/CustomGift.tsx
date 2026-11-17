import { useReveal } from '../../hooks/useReveal';
import { WhatsAppIcon } from './icons';
import { useGly } from './useGly';

const STEPS = [1, 2, 3] as const;

/**
 * Custom gift section. A custom gift is ordered by talking to the store first, so
 * the card opens a WhatsApp chat and shows no price or add-to-cart button.
 */
export function CustomGift() {
  const { t, whatsappCustom } = useGly();
  const copy = useReveal();
  const card = useReveal();
  const c = (key: string) => t(`blocks.gly.custom.${key}`);

  return (
    <section id="gly-custom" className="gly-section gly-custom">
      <div className="gly-custom__deco" aria-hidden="true" />
      <div className="gly-wrap gly-custom__grid">
        <div ref={copy.ref} className={copy.className}>
          <span className="gly-eyebrow">{c('eyebrow')}</span>
          <h2>
            {c('title_pre')} <em>{c('title_em')}</em>
          </h2>
          <p className="gly-custom__lede">{c('lede')}</p>
          <ol className="gly-csteps">
            {STEPS.map((step) => (
              <li key={step} className="gly-cstep">
                <div className="gly-cstep__n" aria-hidden="true">
                  {step}
                </div>
                <div>
                  <b>{c(`step${step}_t`)}</b>
                  <small>{c(`step${step}_d`)}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div ref={card.ref} className={`gly-qcard-c ${card.className}`}>
          <span className="gly-badge-soft">{c('card_badge')}</span>
          <h3>{c('card_title')}</h3>
          <p>{c('card_desc')}</p>
          {whatsappCustom && (
            <a className="gly-btn gly-btn-wa" href={whatsappCustom} target="_blank" rel="noopener">
              <WhatsAppIcon />
              {c('card_btn')}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
