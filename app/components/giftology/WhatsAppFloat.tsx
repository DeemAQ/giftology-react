import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { WhatsAppBubbleIcon } from './icons';
import { useGly } from './useGly';

/** Every WhatsApp link of the page: the custom-gift button, the gift finder's, the footer's. */
const WHATSAPP_LINKS = 'a[href^="https://wa.me/"]';

/**
 * Whether another WhatsApp link of the page is on screen right now.
 *
 * The links come and go (the gift finder's shows with its answer), so the page is
 * scanned again, at most once a frame, whenever something is added or removed.
 */
function useOtherWhatsAppInView(own: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
    const watched = new Set<Element>();
    const onScreen = new Set<Element>();
    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setInView(onScreen.size > 0);
    });
    const scan = () => {
      const found = new Set(
        [...document.querySelectorAll(WHATSAPP_LINKS)].filter((link) => !own.current?.contains(link))
      );
      for (const link of watched) {
        if (found.has(link)) continue;
        visibility.unobserve(link);
        watched.delete(link);
        onScreen.delete(link);
      }
      for (const link of found) {
        if (watched.has(link)) continue;
        visibility.observe(link);
        watched.add(link);
      }
      setInView(onScreen.size > 0);
    };
    let frame = 0;
    const changes = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    changes.observe(document.body, { childList: true, subtree: true });
    scan();
    return () => {
      cancelAnimationFrame(frame);
      changes.disconnect();
      visibility.disconnect();
    };
  }, [own]);

  return inView;
}

/**
 * Floating "contact us" WhatsApp button, on every page. Uses `gly_whatsapp`, else
 * the store's own number (see `useGly`); renders nothing when there is none.
 * It sits outside the page's header, main and footer, so it is its own landmark.
 *
 * It steps aside while another WhatsApp button is on screen (the custom-gift
 * section's, the gift finder's, the footer's): two of them side by side said the
 * same thing, and on a phone the floating one sat on top of the other.
 */
export function WhatsAppFloat() {
  const { t, whatsappGeneral } = useGly();
  const own = useRef<HTMLElement>(null);
  const away = useOtherWhatsAppInView(own);
  if (!whatsappGeneral) return null;
  return (
    // `inert` while it is away: not something to tab to or tap through to.
    <aside ref={own} aria-label={t('blocks.gly.footer.contact')} inert={away}>
      <a
        className={`gly-wa${away ? ' gly-wa--away' : ''}`}
        href={whatsappGeneral}
        target="_blank"
        rel="noopener"
        aria-label={t('blocks.gly.wa.float_aria')}
      >
        <span className="gly-ring" aria-hidden="true" />
        <WhatsAppBubbleIcon />
        <span className="gly-label">{t('blocks.gly.wa.float_label')}</span>
      </a>
    </aside>
  );
}
