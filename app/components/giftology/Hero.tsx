import bow from '../../assets/images/white_logo.webp';
import { settingOn, settingText } from '../../lib/giftology';
import { BrandIcon } from './BrandIcon';
import { ArrowDownIcon, ArrowIcon, SparkIcon, StarIcon, TruckIcon } from './icons';
import { useGly } from './useGly';

/**
 * The four figures under the hero text: `[setting, label key]`. The merchant types
 * each figure in the theme editor; an empty field shows the built-in one
 * (`blocks.gly.hero.<label key>_value`). `gly_show_hero_stats` hides the row.
 */
const STATS = [
  ['gly_hero_stat_gifts', 'stat_gifts'],
  ['gly_hero_stat_occasions', 'stat_occasions'],
  ['gly_hero_stat_rating', 'stat_rating'],
  ['gly_hero_stat_since', 'stat_since'],
] as const;

/**
 * Home hero: headline, the calls to action (jump to the categories, the custom
 * gift and the latest products sections), the four stats, and the decorative art.
 * First screen, so it is visible in the server HTML with no reveal animation, and
 * its headline is the home page's `<h1>`.
 */
export function Hero() {
  const { settings, t } = useGly();
  const h = (key: string) => t(`blocks.gly.hero.${key}`);

  return (
    <section className="gly-section gly-hero">
      <div className="gly-wrap gly-hero__grid">
        <div className="gly-reveal in">
          <span className="gly-eyebrow">{h('eyebrow')}</span>
          <h1>
            {h('title_pre')} <span className="gly-accent">{h('title_em')}</span> {h('title_post')}
          </h1>
          <p className="gly-lede">{h('lede')}</p>
          <div className="gly-cta-row">
            <a href="#gly-cats" className="gly-btn gly-btn-primary">
              {h('cta_shop')}
              <ArrowIcon className="gly-arr" />
            </a>
            <a href="#gly-custom" className="gly-btn gly-btn-ghost">
              <SparkIcon />
              {h('cta_custom')}
            </a>
            {settingOn(settings, 'gly_show_latest') && (
              <a href="#gly-latest" className="gly-btn gly-btn-ghost">
                {h('cta_latest')}
                <ArrowDownIcon />
              </a>
            )}
          </div>
          {settingOn(settings, 'gly_show_hero_stats') && (
            <div className="gly-hero-stats">
              {STATS.map(([setting, key]) => (
                <div key={setting}>
                  <b>{settingText(settings, setting) || h(`${key}_value`)}</b>
                  <span>{h(key)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gly-hero__art gly-reveal in" aria-hidden="true">
          <div className="gly-blob teal" />
          <div className="gly-hero__pattern" />
          <div className="gly-blob peach" />
          {/* Lazy: phones hide the bow (`_home.scss`), and a hidden lazy image is never fetched. */}
          <img className="gly-bow" src={bow} alt="" width={240} height={240} loading="lazy" decoding="async" />
          <StarIcon
            className="gly-sparkle"
            style={{ top: 30, insetInlineStart: 60, width: 26 }}
          />
          <StarIcon
            className="gly-sparkle"
            style={{ bottom: 90, insetInlineEnd: 30, width: 18, animationDelay: '1s' }}
          />
          <div className="gly-fcard fc1">
            <div className="gly-fcard__ph" style={{ background: 'var(--gly-gold)' }}>
              <BrandIcon name="gift" />
            </div>
            <div>
              <b>{h('mini_wrap_t')}</b>
              <small>{h('mini_wrap_d')}</small>
            </div>
          </div>
          <div className="gly-fcard fc2">
            <div className="gly-fcard__ph" style={{ background: 'var(--gly-teal-deep)' }}>
              <TruckIcon />
            </div>
            <div>
              <b>{h('mini_fast_t')}</b>
              <small>{h('mini_fast_d')}</small>
            </div>
          </div>
          <div className="gly-fcard fc3">
            <div className="gly-fcard__ph" style={{ background: '#e2715f' }}>
              <BrandIcon name="envelope" />
            </div>
            <div>
              <b>{h('mini_card_t')}</b>
              <small>{h('mini_card_d')}</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
