import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll for the `.gly-reveal` blocks: returns a ref and the class to
 * put on the element. The block fades in the first time 12% of it is on screen.
 *
 * `initiallyShown` skips the animation, for first-screen content that must be
 * visible in the server HTML (the hero).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(initiallyShown = false) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(initiallyShown);

  useEffect(() => {
    const el = ref.current;
    if (shown || !el) return;
    if (!('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return { ref, className: shown ? 'gly-reveal in' : 'gly-reveal' };
}
