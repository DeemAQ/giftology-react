import { useReveal } from '../../hooks/useReveal';
import { blockRows, blockText, rowText } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { WhatsAppIcon } from './icons';
import { useGly } from './useGly';

const STEPS = [1, 2, 3] as const;

/**
 * Custom gift section. A custom gift is ordered by talking to the store first, so
 * the card opens a WhatsApp chat and shows no price or add-to-cart button.
 */
export function CustomGift({ data }: { data?: BlockData }) {
  const { t, whatsappCustom, locale } = useGly();
  const copy = useReveal();
  const card = useReveal();
  // A block field the merchant filled, else the theme's own text.
  const c = (key: string) => blockText(data, key, locale) || t(`blocks.gly.custom.${key}`);
  const ownSteps = blockRows(data, 'steps')
    .map((row) => ({ title: rowText(row, 'title', locale, t), text: rowText(row, 'text', locale, t) }))
    .filter((step) => step.title);
  const steps = ownSteps.length
    ? ownSteps
    : STEPS.map((step) => ({ title: c(`step${step}_t`), text: c(`step${step}_d`) }));

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
            {steps.map((step, index) => (
              // An ordered list with no ids; a step's place is its identity.
              <li key={index} className="gly-cstep">
                <div className="gly-cstep__n" aria-hidden="true">
                  {index + 1}
                </div>
                <div>
                  <b>{step.title}</b>
                  {step.text && <small>{step.text}</small>}
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
