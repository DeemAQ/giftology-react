import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { blockRows, blockText } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { SectionHead } from './SectionHead';
import { useGly } from './useGly';

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

/** "How it works": the four steps, numbered 01 to 04. */
export function HowItWorks({ data }: { data?: BlockData }) {
  const { t, locale } = useGly();
  const reveal = useReveal();
  // A block field the merchant filled, else the theme's own text.
  const own = (key: string) => blockText(data, key, locale) || t(`blocks.gly.how.${key}`);
  const ownSteps = blockRows(data, 'steps')
    .map((row) => ({ title: blockText(row, 'title', locale), text: blockText(row, 'text', locale) }))
    .filter((step) => step.title);
  // The four drawings stay in order; a longer list starts them again.
  const steps = (
    ownSteps.length
      ? ownSteps
      : STEPS.map((step) => ({ title: own(`${step.key}_t`), text: own(`${step.key}_d`) }))
  ).map((step, index) => ({ ...step, icon: STEPS[index % STEPS.length].icon }));

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
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  {step.icon}
                </svg>
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
