import { useEffect, useRef, useState } from 'react';

type Stage = 'visible' | 'waiting' | 'revealed';

/**
 * Reveal-on-scroll for the `.gly-reveal` blocks: returns a ref and the class to
 * put on the element.
 *
 * Every block is visible in the server HTML, so the page reads in full before
 * (or without) JavaScript. Once the page is interactive, a block still below the
 * screen is hidden and fades in the first time 12% of it scrolls into view. A
 * block already on screen is left alone, so nothing blinks.
 *
 * `initiallyShown` opts a block out of the animation (the hero).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(initiallyShown = false) {
  const ref = useRef<T>(null);
  const [stage, setStage] = useState<Stage>('visible');

  useEffect(() => {
    const el = ref.current;
    if (initiallyShown || !el || !('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setStage('waiting');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStage('revealed');
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [initiallyShown]);

  return { ref, className: stage === 'waiting' ? 'gly-reveal' : 'gly-reveal in' };
}
