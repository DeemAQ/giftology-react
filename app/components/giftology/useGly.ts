import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { settingCopy, settingText, whatsappLink, whatsappNumber, type GlySettings } from '../../lib/giftology';

/**
 * What every Giftology section reads: the theme settings, the store's home URL,
 * the current language, the translator and the two WhatsApp links.
 *
 * The WhatsApp number is `gly_whatsapp`, else the store's own WhatsApp or mobile
 * number. With none, both links are empty and the WhatsApp buttons don't render.
 * `whatsappNumber` is that number as digits, for showing it in text.
 */
export function useGly() {
  const { store, theme } = useTwilight();
  const { t, locale } = useTranslation();
  const settings = theme?.settings as GlySettings;
  const translate = (key: string, fallback?: string) => String(t(key, fallback ?? key));
  const number = whatsappNumber(
    settingText(settings, 'gly_whatsapp'),
    store?.contacts?.whatsapp,
    store?.contacts?.mobile
  );

  return {
    store,
    settings,
    locale,
    t: translate,
    homeUrl: store?.url || '/',
    whatsappNumber: number,
    // The message a chat opens with: the one typed in the settings, else the theme's own.
    whatsappGeneral: whatsappLink(
      number,
      settingCopy(settings, 'gly_whatsapp_msg', locale) || translate('blocks.gly.wa.general_msg')
    ),
    // The custom-gift message set in the theme settings; a block's own message still wins.
    whatsappCustom: whatsappLink(
      number,
      settingCopy(settings, 'gly_whatsapp_custom_msg', locale) || translate('blocks.gly.wa.custom_msg')
    ),
  };
}
