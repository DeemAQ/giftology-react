import { useQuery } from '@tanstack/react-query';
import { menu } from '@salla.sa/twilight-theme-engine/api/menu';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import logo from '../../assets/images/white_logo_trim.png';
import { menuLabel, settingOn, settingText } from '../../lib/giftology';
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
 * Giftology footer: logo and about text, the store's "important links", one contact
 * column (email, WhatsApp, Instagram), then the copyright line, the store's
 * registration numbers and the payment badges.
 *
 * Important links are the store's footer menu, which the merchant fills in Salla
 * with the policy and information pages. The column appears once it has entries.
 * The commercial registration and tax numbers come from the store's settings and
 * show when the store has them.
 *
 * About text: `gly_footer_about`, else the store description, else the locale
 * default. Email: `gly_email`, else the store's. Instagram: the store's, else
 * `gly_instagram`. The `footer:start` / `footer:end` slots are kept for apps.
 */
export function GlyFooter() {
  const { store, settings, t, locale, whatsappGeneral } = useGly();
  // The same cache entry the starter's own footer reads (`layout/Footer.tsx`).
  const { data: links = [] } = useQuery({
    queryKey: ['menus', 'footer', locale],
    queryFn: () => menu.footer(),
    staleTime: 5 * 60 * 1000,
  });
  const commercialNumber = store?.settings?.commercial_number;
  const taxNumber = store?.settings?.tax?.number;
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
        <div className={`gly-fgrid${links.length ? ' gly-fgrid--links' : ''}`}>
          <div className="gly-fbrand">
            <img src={logo} alt={store?.name || 'Giftology'} width={77} height={46} loading="lazy" />
            <p>{about}</p>
          </div>

          {links.length > 0 && (
            <nav aria-labelledby="gly-flinks-head">
              <h2 className="gly-fhead" id="gly-flinks-head">
                {t('blocks.footer.important_links')}
              </h2>
              <ul className="gly-flinks">
                {/* Salla's own entries (the blog link) come without an id. */}
                {links.map((item) => (
                  <li key={item.id ?? item.url}>
                    <Link to={item.url} target={item.target === '_blank' ? '_blank' : undefined}>
                      {menuLabel(item.title, t)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

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
          <div className="gly-flegal">
            <span>
              © {new Date().getFullYear()} {store?.name} · {t('blocks.gly.footer.rights')}
            </span>
            {(commercialNumber || taxNumber) && (
              <span className="gly-flegal__ids">
                {commercialNumber && (
                  <span>
                    {t('blocks.gly.footer.commercial_number')}: <bdi dir="ltr">{commercialNumber}</bdi>
                  </span>
                )}
                {taxNumber && (
                  <span>
                    {t('blocks.gly.footer.tax_number')}: <bdi dir="ltr">{taxNumber}</bdi>
                  </span>
                )}
              </span>
            )}
          </div>
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
