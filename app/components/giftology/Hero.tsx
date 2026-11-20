import bow from '../../assets/images/white_logo.webp';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { blockLink, blockRows, blockText, rowText, settingOn, settingText } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { BrandIcon } from './BrandIcon';
import { ArrowDownIcon, ArrowIcon, SparkIcon, StarIcon, TruckIcon } from './icons';
import { useHomeSections } from './homeSections';
import { useGly } from './useGly';

/**
 * The four figures under the hero text: `[setting, label key]`. The merchant edits
 * them in the hero block, which arrives with these four as its list. The built-in
 * hero shows the theme's own figures (`blocks.gly.hero.<label key>_value`), or the
 * ones a store saved in the earlier `gly_hero_stat_*` settings.
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
export function Hero({ data }: { data?: BlockData }) {
  const { settings, t, locale } = useGly();
  const shown = useHomeSections();
  const h = (key: string) => t(`blocks.gly.hero.${key}`);
  // A block field the merchant filled, else the theme's own text.
  const own = (key: string) => blockText(data, key, locale) || h(key);

  // The headline is three parts; a merchant who writes any of them replaces all three.
  const written = ['title_pre', 'title_em', 'title_post'].map((key) => blockText(data, key, locale));
  const [titlePre, titleEm, titlePost] = written.some(Boolean)
    ? written
    : [h('title_pre'), h('title_em'), h('title_post')];

  const shopUrl = blockLink(data?.cta_shop_url);
  const customUrl = blockLink(data?.cta_custom_url);

  const showStats =
    typeof data?.show_stats === 'boolean' ? data.show_stats : settingOn(settings, 'gly_show_hero_stats');
  const ownStats = blockRows(data, 'stats')
    .map((row) => ({ value: rowText(row, 'value', locale, t), label: rowText(row, 'label', locale, t) }))
    .filter((stat) => stat.value);
  const stats = ownStats.length
    ? ownStats
    : STATS.map(([setting, key]) => ({
        value: settingText(settings, setting) || h(`${key}_value`),
        label: h(key),
      }));

  return (
    <section className="gly-section gly-hero">
      <div className="gly-wrap gly-hero__grid">
        <div className="gly-reveal in">
          <span className="gly-eyebrow">{own('eyebrow')}</span>
          <h1>
            {titlePre} {titleEm && <span className="gly-accent">{titleEm}</span>} {titlePost}
          </h1>
          <p className="gly-lede">{own('lede')}</p>
          <div className="gly-cta-row">
            {/* Each button goes to the link the merchant picked, else to its section while that section is on the page. */}
            {shopUrl ? (
              <Link to={shopUrl} className="gly-btn gly-btn-primary">
                {own('cta_shop')}
                <ArrowIcon className="gly-arr" />
              </Link>
            ) : (
              shown.has('categories') && (
                <a href="#gly-cats" className="gly-btn gly-btn-primary">
                  {own('cta_shop')}
                  <ArrowIcon className="gly-arr" />
                </a>
              )
            )}
            {customUrl ? (
              <Link to={customUrl} className="gly-btn gly-btn-ghost">
                <SparkIcon />
                {own('cta_custom')}
              </Link>
            ) : (
              shown.has('custom') && (
                <a href="#gly-custom" className="gly-btn gly-btn-ghost">
                  <SparkIcon />
                  {own('cta_custom')}
                </a>
              )
            )}
            {shown.has('latest') && (
              <a href="#gly-latest" className="gly-btn gly-btn-ghost">
                {h('cta_latest')}
                <ArrowDownIcon />
              </a>
            )}
          </div>
          {showStats && (
            <div className="gly-hero-stats">
              {stats.map((stat, index) => (
                // A short fixed list with no id of its own; the slot is its identity.
                <div key={index}>
                  <b>{stat.value}</b>
                  <span>{stat.label}</span>
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
