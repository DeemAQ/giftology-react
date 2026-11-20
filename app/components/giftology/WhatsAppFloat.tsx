import { WhatsAppBubbleIcon } from './icons';
import { useGly } from './useGly';

/**
 * Floating "contact us" WhatsApp button, on every page. Uses `gly_whatsapp`, else
 * the store's own number (see `useGly`); renders nothing when there is none.
 * It sits outside the page's header, main and footer, so it is its own landmark.
 */
export function WhatsAppFloat() {
  const { t, whatsappGeneral } = useGly();
  if (!whatsappGeneral) return null;
  return (
    <aside aria-label={t('blocks.gly.footer.contact')}>
      <a
        className="gly-wa"
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
