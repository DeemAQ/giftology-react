// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule } from 'postcss';

const styles = new URL('../../app/styles/giftology/', import.meta.url);
const compile = (file: string) => postcss.parse(sass.compile(fileURLToPath(new URL(file, styles))).css);

interface Found {
  /** The media query the rule sits in, or '' at the top level. */
  media: string;
  value: string;
}

/** Every declaration of `prop` on a rule that lists `selector`, with its media query. */
function find(root: postcss.Root, selector: string, prop: string): Found[] {
  const found: Found[] = [];
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    const parent = rule.parent as AtRule | undefined;
    const media = parent?.type === 'atrule' && parent.name === 'media' ? parent.params.replace(/\s+/g, '') : '';
    rule.walkDecls(prop, (d) => void found.push({ media, value: d.value.replace(/\s+/g, '') }));
  });
  return found;
}

const home = compile('_home.scss');

describe('header links', () => {
  it('stay on inner pages on wide screens, give way below 1024px, and the menu button is always there', () => {
    expect(find(home, '.gly-header--inner .gly-menu', 'display')).toEqual([
      { media: '(max-width:1023px)', value: 'none' },
    ]);
    // The menu button is there on every page and every screen: the menu holds the categories.
    expect(find(home, '.gly-burger', 'display')).toEqual([{ media: '', value: 'grid' }]);
    // Wider than a phone the menu is a side panel over a dimmed page.
    expect(find(home, '.gly-mmenu', 'width')).toEqual([{ media: '(min-width:768px)', value: 'min(430px,100vw)' }]);
    expect(find(home, '.gly-mscrim', 'display')).toEqual([
      { media: '', value: 'none' },
      { media: '(min-width:768px)', value: 'block' },
    ]);
    expect(find(home, '.gly-menu a', 'white-space')).toContainEqual({ media: '', value: 'nowrap' });
  });
});

describe('phone header', () => {
  it('keeps only the language button; the bottom nav has the rest', () => {
    expect(find(home, '.gly-icons > :not(.gly-loc)', 'display')).toEqual([
      { media: '(max-width:767px)', value: 'none' },
    ]);
  });

  it('gives that button a 44px tap target', () => {
    expect(find(home, '.gly-ibtn', 'width')).toContainEqual({ media: '(max-width:767px)', value: '44px' });
    expect(find(home, '.gly-ibtn', 'height')).toContainEqual({ media: '(max-width:767px)', value: '44px' });
  });
});

describe('latest products grid', () => {
  const grid = '.gly-latest-grid.s-products-list-wrapper';

  it('lays eight cards out in full rows: 2, 3 or 4 across', () => {
    expect(find(home, grid, 'grid-template-columns')).toEqual([
      { media: '', value: 'repeat(2,minmax(0,1fr))' },
      { media: '(min-width:640px)and(max-width:959px)', value: 'repeat(3,minmax(0,1fr))' },
      { media: '(min-width:960px)', value: 'repeat(4,minmax(0,1fr))' },
    ]);
  });

  it('leaves the last two out where three fit, so no row is short', () => {
    // Twelve products fill four rows of three, so only the eight-product grid drops its last two.
    const lastTwo = '.gly-latest-grid:not([data-count="12"]) > :nth-child(n+7)';
    expect(find(home, lastTwo, 'display')).toEqual([
      { media: '(min-width:640px)and(max-width:959px)', value: 'none' },
    ]);
    // Each card's wrapper carries an inline `display: contents`, which only !important beats.
    let important = false;
    home.walkRules((rule) => {
      if (rule.selectors.includes(lastTwo)) rule.walkDecls('display', (d) => void (important = d.important));
    });
    expect(important).toBe(true);
  });
});

describe('header cart link', () => {
  it('has the 42px tap area of the other header buttons, without growing the 24px icon', () => {
    const link = '.gly-icons salla-cart-summary .s-cart-summary-wrapper';
    // The tap area is measured from the link itself.
    expect(find(home, link, 'position')).toEqual([{ media: '', value: 'relative' }]);
    // 24px + 9px on every side
    expect(find(home, `${link}::after`, 'inset')).toEqual([{ media: '', value: '-9px' }]);
    expect(find(home, link, 'width')).toEqual([]);
  });
});

describe('tap targets on phones', () => {
  it('stretches the wishlist heart to 42px without redrawing it', () => {
    const cards = compile('_cards.scss');
    // Four classes: it has to beat product-list.scss, which sets the heart to
    // `position: static` with three. If it lost, the tap area would cover the whole card.
    const heart =
      '.s-product-card.s-product-card-vertical .s-product-card-content-footer .s-product-card-wishlist-btn';
    expect(find(cards, heart, 'position')).toEqual([{ media: '(max-width:767px)', value: 'relative' }]);
    // Measured from inside the 1px border: 3px past the 36px button on every side.
    // The gap to the add-to-cart button is 6px.
    expect(find(cards, `${heart}::after`, 'inset')).toEqual([{ media: '(max-width:767px)', value: '-4px' }]);
  });

  it('stretches each bottom-nav tab to 44px', () => {
    // This file uses Tailwind's @apply, which Sass passes through untouched.
    const bar = compile('../04-components/mobile-bottom-bar.scss');
    // 40×36 tab: 2px on each side, 4px above and below
    expect(find(bar, '.mobile-bottom-bar__item::after', 'inset')).toEqual([{ media: '', value: '-4px-2px' }]);
  });
});
