import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { blockCopy, blockLink, blockRows, choiceValue, rowText } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { BrandIcon } from './BrandIcon';
import { SectionHead } from './SectionHead';
import { TILE_ICONS } from './tileIcons';
import type { BrandIconName } from './tileIcons';
import { useGly } from './useGly';

/** The four ready-made steps, in order: locale key and drawing. */
const STEPS: { key: string; icon: ReactNode }[] = [
  {
    key: 'discover',
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  { key: 'pick', icon: <path d="M4 9h16v11H4zM4 9l2-5h12l2 5M12 4v16" /> },
  {
    key: 'wrap',
    icon: (
      <path d="M5 7h14v13H5zM5 7l-1-3h16l-1 3M12 7v13M9 4c0-2 6-2 6 1 0 2-3 2-3 2M15 4c0-2-6-2-6 1 0 2 3 2 3 2" />
    ),
  },
  {
    key: 'deliver',
    icon: (
      <>
        <path d="M3 13l2-7h11l3 4h2v5M3 13h16M3 13v4h2M7 17h8" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </>
    ),
  },
];

const DRAWINGS: Record<string, ReactNode> = Object.fromEntries(STEPS.map((step) => [step.key, step.icon]));

/**
 * A step's picture: the image the merchant uploaded, else the icon picked for the
 * step (one of the four step drawings or a brand icon), else the drawing that goes
 * with the step's place in the list.
 */
function StepIcon({ icon, image, index }: { icon: string; image: string; index: number }) {
  if (image) return <img src={image} alt="" width={35} height={35} loading="lazy" />;
  if (icon in TILE_ICONS) return <BrandIcon name={icon as BrandIconName} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {DRAWINGS[icon] ?? STEPS[index % STEPS.length].icon}
    </svg>
  );
}

/** "How it works": the steps, numbered from 01, each with its picture. */
export function HowItWorks({ data }: { data?: BlockData }) {
  const { t, locale } = useGly();
  const reveal = useReveal();
  // A block field the merchant filled, else the theme's own text.
  const own = (key: string) => blockCopy(data, key, locale) || t(`blocks.gly.how.${key}`);
  const ownSteps = blockRows(data, 'steps')
    .map((row) => ({
      title: rowText(row, 'title', locale, t),
      text: rowText(row, 'text', locale, t),
      icon: choiceValue(row.icon),
      image: blockLink(row.image),
    }))
    .filter((step) => step.title);
  const steps = ownSteps.length
    ? ownSteps
    : STEPS.map((step) => ({ title: own(`${step.key}_t`), text: own(`${step.key}_d`), icon: step.key, image: '' }));

  return (
    <section id="gly-how" className="gly-section gly-how">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={own('eyebrow')}
          title={own('title_pre')}
          emphasis={own('title_em')}
        >
          <p>{own('sub')}</p>
        </SectionHead>

        <div ref={reveal.ref} className={`gly-steps ${reveal.className}`}>
          {steps.map((step, index) => (
            // An ordered list with no ids; a step's place is its identity.
            <div key={index} className="gly-step">
              <div className="gly-step__num" aria-hidden="true">
                0{index + 1}
              </div>
              <div className="gly-step__ic">
                <StepIcon icon={step.icon} image={step.image} index={index} />
              </div>
              <h3>{step.title}</h3>
              {step.text && <p>{step.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
