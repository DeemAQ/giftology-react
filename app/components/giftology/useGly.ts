import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { settingText, whatsappLink, type GlySettings } from '../../lib/giftology';

/**
 * What every Giftology section reads: the theme settings, the store's home URL,
 * the current language, the translator and the two WhatsApp links.
 */
export function useGly() {
  const { store, theme } = useTwilight();
  const { t, locale } = useTranslation();
  const settings = theme?.settings as GlySettings;
  const translate = (key: string, fallback?: string) => String(t(key, fallback ?? key));
  const number = settingText(settings, 'gly_whatsapp');

  return {
    store,
    settings,
    locale,
    t: translate,
    homeUrl: store?.url || '/',
    whatsappGeneral: whatsappLink(number, translate('blocks.gly.wa.general_msg')),
    whatsappCustom: whatsappLink(number, translate('blocks.gly.wa.custom_msg')),
  };
}
