import { WhatsAppBubbleIcon } from './icons';
import { useGly } from './useGly';

/**
 * Floating "contact us" WhatsApp button, on every page. Uses `gly_whatsapp`, or a
 * placeholder number until the merchant sets one.
 */
export function WhatsAppFloat() {
  const { t, whatsappGeneral } = useGly();
  return (
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
  );
}
