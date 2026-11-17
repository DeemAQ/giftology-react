import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

/** Centered section heading: eyebrow, title with an emphasised tail, optional lead. */
export function SectionHead({
  eyebrow,
  title,
  emphasis,
  children,
}: {
  eyebrow: string;
  title: string;
  emphasis?: string;
  children?: ReactNode;
}) {
  const reveal = useReveal();
  return (
    <div ref={reveal.ref} className={`gly-shead ${reveal.className}`}>
      <span className="gly-eyebrow">{eyebrow}</span>
      <h2>
        {title}
        {emphasis && (
          <>
            {' '}
            <em>{emphasis}</em>
          </>
        )}
      </h2>
      {children}
    </div>
  );
}
