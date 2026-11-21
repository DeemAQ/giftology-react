import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

/**
 * Centered section heading: the title, then an optional lead.
 *
 * The title is one plain line. The script word and the small line above a title are
 * kept for the hero and the custom-gift section; repeated on every section they made
 * the page read as one template. A section still shows a small line above its title
 * when the merchant typed one in its block (`eyebrow`), and `tail` is the second half
 * of a title written in two boxes.
 */
export function SectionHead({
  eyebrow,
  title,
  tail,
  children,
}: {
  eyebrow?: string;
  title: string;
  tail?: string;
  children?: ReactNode;
}) {
  const reveal = useReveal();
  return (
    <div ref={reveal.ref} className={`gly-shead ${reveal.className}`}>
      {eyebrow && <span className="gly-eyebrow">{eyebrow}</span>}
      <h2>{[title, tail].filter(Boolean).join(' ')}</h2>
      {children}
    </div>
  );
}
