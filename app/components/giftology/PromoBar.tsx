import { settingOn, settingText } from '../../lib/giftology';
import { useGly } from './useGly';

const PROMO_SETTINGS = ['gly_promo_1', 'gly_promo_2', 'gly_promo_3'] as const;
const PROMO_DEFAULTS = [
  'blocks.gly.promo.wrap',
  'blocks.gly.promo.fast',
  'blocks.gly.promo.shipping',
] as const;

/**
 * Top promo bar. Shows the phrases the merchant filled in (`gly_promo_1..3`), or
 * the three curated ones when all are empty; the last of several is emphasised.
 * A phone shows only that last phrase, so the bar stays one line.
 * `gly_show_promo` turns it off.
 */
export function PromoBar() {
  const { settings, t } = useGly();
  if (!settingOn(settings, 'gly_show_promo')) return null;

  const filled = PROMO_SETTINGS.map((id) => settingText(settings, id)).filter(Boolean);
  const phrases = filled.length ? filled : PROMO_DEFAULTS.map((key) => t(key));

  return (
    <aside className="gly-topbar" aria-label={t('blocks.gly.promo.label')}>
      <span aria-hidden="true">✦&nbsp;</span>
      {phrases.map((phrase, index) => {
        const last = index === phrases.length - 1;
        return (
          <span
            key={phrase}
            className={`gly-topbar__phrase${last ? ' gly-topbar__phrase--main' : ''}`}
          >
            {index > 0 && (
              <span className="gly-topbar__sep" aria-hidden="true">
                {' '}
                &nbsp;·&nbsp;{' '}
              </span>
            )}
            {phrases.length > 1 && last ? <b>{phrase}</b> : phrase}
          </span>
        );
      })}
      <span aria-hidden="true">&nbsp;✦</span>
    </aside>
  );
}
