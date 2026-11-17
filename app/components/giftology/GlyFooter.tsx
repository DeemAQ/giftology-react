import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import logo from '../../assets/images/white_logo_trim.png';
import { settingOn, settingText } from '../../lib/giftology';
import { InstagramIcon, MailIcon, WhatsAppIcon } from './icons';
import { useGly } from './useGly';

/** Payment badges, each behind its own switch (`[setting, label, on by default]`). */
const PAYMENTS = [
  ['gly_pay_mada', 'مدى', true],
  ['gly_pay_applepay', 'Apple Pay', true],
  ['gly_pay_visa', 'VISA', true],
  ['gly_pay_mastercard', 'Mastercard', true],
  ['gly_pay_tabby', 'tabby', true],
  ['gly_pay_tamara', 'تمارا', false],
  ['gly_pay_stcpay', 'STC Pay', true],
] as const;

/** The store description arrives as HTML; the footer prints it as plain text. */
const plainText = (html: string | undefined) => (html ?? '').replace(/<[^>]*>/g, ' ').trim();

/**
 * Giftology footer: logo and about text, one contact column (email, WhatsApp,
 * Instagram), then the copyright line and the payment badges.
 *
 * About text: `gly_footer_about`, else the store description, else the locale
 * default. Email: `gly_email`, else the store's. Instagram: the store's, else
 * `gly_instagram`. The `footer:start` / `footer:end` slots are kept for apps.
 */
export function GlyFooter() {
  const { store, settings, t, whatsappGeneral } = useGly();
  const about =
    settingText(settings, 'gly_footer_about') ||
    plainText(store?.description) ||
    t('blocks.gly.footer.about');
  const email = settingText(settings, 'gly_email') || store?.contacts?.email;
  const instagram = store?.social?.instagram || settingText(settings, 'gly_instagram');
  const payments = PAYMENTS.filter(([id, , fallback]) => settingOn(settings, id, fallback));

  return (
    <footer className="gly-footer">
      <HookSlot name="footer:start" />
      <div className="gly-footer__deco" aria-hidden="true" />
      <div className="gly-wrap">
        <div className="gly-fgrid">
          <div className="gly-fbrand">
            <img src={logo} alt={store?.name || 'Giftology'} width={77} height={46} loading="lazy" />
            <p>{about}</p>
          </div>

          <div>
            <h2 className="gly-fhead">{t('blocks.gly.footer.contact')}</h2>
            <ul className="gly-fcontact">
              {email && (
                <li>
                  <a href={`mailto:${email}`}>
                    <MailIcon />
                    <span>{email}</span>
                  </a>
                </li>
              )}
              {whatsappGeneral && (
                <li>
                  <a href={whatsappGeneral} target="_blank" rel="noopener">
                    <WhatsAppIcon />
                    <span>{t('blocks.gly.footer.whatsapp')}</span>
                  </a>
                </li>
              )}
              {instagram && (
                <li>
                  <a href={instagram} target="_blank" rel="noopener">
                    <InstagramIcon />
                    <span>{t('blocks.gly.footer.instagram')}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="gly-fbottom">
          <span>
            © {new Date().getFullYear()} {store?.name} · {t('blocks.gly.footer.rights')}
          </span>
          {payments.length > 0 && (
            <div className="gly-pays">
              {payments.map(([id, label]) => (
                <span key={id}>{label}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <HookSlot name="footer:end" />
    </footer>
  );
}
