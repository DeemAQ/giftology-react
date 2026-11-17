import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';
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
export function HowItWorks() {
  const { t } = useGly();
  const reveal = useReveal();

  return (
    <section id="gly-how" className="gly-section gly-how">
      <div className="gly-wrap">
        <SectionHead
          eyebrow={t('blocks.gly.how.eyebrow')}
          title={t('blocks.gly.how.title_pre')}
          emphasis={t('blocks.gly.how.title_em')}
        >
          <p>{t('blocks.gly.how.sub')}</p>
        </SectionHead>

        <div ref={reveal.ref} className={`gly-steps ${reveal.className}`}>
          {STEPS.map((step, index) => (
            <div key={step.key} className="gly-step">
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
              <h3>{t(`blocks.gly.how.${step.key}_t`)}</h3>
              <p>{t(`blocks.gly.how.${step.key}_d`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
