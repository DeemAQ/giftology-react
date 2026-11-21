import bow from '../../assets/images/white_logo.webp';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { blockCopy, blockLink, blockRows, choiceValue, rowText, settingOn, settingText } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import { BrandIcon } from './BrandIcon';
import { ArrowIcon, SparkIcon, StarIcon, TruckIcon } from './icons';
import { useHomeSections } from './homeSections';
import { TILE_ICONS } from './tileIcons';
import type { BrandIconName } from './tileIcons';
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
 * The three small cards floating over the hero art: `[title key, text key, icon]`.
 * The hero block arrives with these as its list; the merchant rewrites, removes or
 * reorders them. Each keeps its place and colour by position.
 */
const CARDS = [
  ['mini_wrap_t', 'mini_wrap_d', 'gift'],
  ['mini_fast_t', 'mini_fast_d', 'truck'],
  ['mini_card_t', 'mini_card_d', 'envelope'],
] as const;

const CARD_COLOURS = ['var(--gly-gold)', 'var(--gly-teal-deep)', '#e2715f'];

/** A card's icon: the delivery truck, or one of the brand icons. */
function CardIcon({ name }: { name: string }) {
  if (name === 'truck') return <TruckIcon />;
  return <BrandIcon name={(name in TILE_ICONS ? name : 'gift') as BrandIconName} />;
}

/**
 * Home hero: headline, two calls to action (to the categories and to the custom
 * gift), the four stats, and the decorative art. There is no button to the latest
 * products: that section sits right under the hero.
 * First screen, so it is visible in the server HTML with no reveal animation, and
 * its headline is the home page's `<h1>`.
 */
export function Hero({ data }: { data?: BlockData }) {
  const { settings, t, locale } = useGly();
  const shown = useHomeSections();
  const h = (key: string) => t(`blocks.gly.hero.${key}`);
  // A block field the merchant filled, else the theme's own text.
  const own = (key: string) => blockCopy(data, key, locale) || h(key);

  // The headline is three parts; a merchant who writes any of them replaces all three.
  const written = ['title_pre', 'title_em', 'title_post'].map((key) => blockCopy(data, key, locale));
  const [titlePre, titleEm, titlePost] = written.some(Boolean)
    ? written
    : [h('title_pre'), h('title_em'), h('title_post')];

  const shopUrl = blockLink(data?.cta_shop_url);
  const customUrl = blockLink(data?.cta_custom_url);

  // The picture in the art: the merchant's upload, else the brand bow.
  const art = blockLink(data?.art_image) || bow;
  const ownCards = blockRows(data, 'cards')
    .map((row) => ({
      title: rowText(row, 'title', locale, t),
      text: rowText(row, 'text', locale, t),
      icon: choiceValue(row.icon),
    }))
    .filter((card) => card.title)
    .slice(0, CARDS.length);
  const cards = ownCards.length
    ? ownCards
    : CARDS.map(([title, text, icon]) => ({ title: h(title), text: h(text), icon: icon as string }));

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
          {/* Lazy: phones hide the picture (`_home.scss`), and a hidden lazy image is never fetched. */}
          <img className="gly-bow" src={art} alt="" width={240} height={240} loading="lazy" decoding="async" />
          <StarIcon
            className="gly-sparkle"
            style={{ top: 30, insetInlineStart: 60, width: 26 }}
          />
          <StarIcon
            className="gly-sparkle"
            style={{ bottom: 90, insetInlineEnd: 30, width: 18, animationDelay: '1s' }}
          />
          {cards.map((card, index) => (
            // Up to three, each with a fixed place and colour: the slot is its identity.
            <div key={index} className={`gly-fcard fc${index + 1}`}>
              <div className="gly-fcard__ph" style={{ background: CARD_COLOURS[index] }}>
                <CardIcon name={card.icon} />
              </div>
              <div>
                <b>{card.title}</b>
                {card.text && <small>{card.text}</small>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
