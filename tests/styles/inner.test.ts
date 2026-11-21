// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule, type Rule } from 'postcss';

/** Every declaration of `prop` for `selector` in a compiled giftology stylesheet, with its media query. */
function find(file: string, selector: string, prop: string): { media: string; value: string }[] {
  const path = fileURLToPath(new URL(`../../app/styles/giftology/${file}`, import.meta.url));
  const found: { media: string; value: string }[] = [];
  postcss.parse(sass.compile(path).css).walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return;
    const parent = rule.parent as AtRule | undefined;
    const media = parent?.type === 'atrule' && parent.name === 'media' ? parent.params : '';
    rule.walkDecls(prop, (decl) => {
      found.push({ media, value: decl.value });
    });
  });
  return found;
}

describe('inner pages', () => {
  it("give a page's title the display face of the home page", () => {
    expect(find('_inner.scss', '.gly-page-title', 'font-family')).toEqual([
      { media: '', value: 'var(--gly-font-display)' },
    ]);
  });

  it('show three cards beside the filter column on a small laptop, so a card button keeps its text', () => {
    const selector = '.s-products-list-wrapper.s-products-list-vertical-cards.s-products-list-with-filters';
    expect(find('_inner.scss', selector, 'grid-template-columns')).toEqual([
      { media: '(min-width: 1024px) and (max-width: 1279px)', value: 'repeat(3, minmax(0, 1fr))' },
    ]);
  });

  it('keep the checkout bar for phones, clear of the bottom bar and the WhatsApp button', () => {
    expect(find('_inner.scss', '.gly-cartbar', 'display')).toEqual([
      { media: '', value: 'none' },
      { media: '(max-width: 767px)', value: 'flex' },
    ]);
    expect(find('_inner.scss', '.gly-cartbar', 'bottom')[0].value).toContain('80px');
    expect(find('_inner.scss', 'body:has(.gly-cartbar:not(.gly-cartbar--away))', '--gly-wa-bottom')).toHaveLength(1);
  });

  it("hide a store page's second title on a phone without removing the heading", () => {
    const [clip] = find('_inner.scss', '.content--single-page > .gly-page-title', 'clip-path');
    expect(clip).toEqual({ media: '(max-width: 767px)', value: 'inset(50%)' });
  });
});

describe('home page on a phone', () => {
  it('leaves the top bar to the home page', () => {
    expect(find('_home.scss', '.gly-topbar--inner', 'display')).toEqual([{ media: '(max-width: 767px)', value: 'none' }]);
  });

  it('stops a section link with the title clear of the sticky header', () => {
    expect(find('_home.scss', '.gly-section[id]', 'scroll-margin-top')).toEqual([{ media: '', value: '84px' }]);
  });

  it('sets the steps as rows and the footer links two to a row', () => {
    expect(find('_home.scss', '.gly-steps', 'grid-template-columns')).toContainEqual({
      media: '(max-width: 560px)',
      value: '1fr',
    });
    // Under `.gly-footer`: the footer's own list rule would otherwise win.
    expect(find('_home.scss', '.gly-footer .gly-flinks', 'grid-template-columns')).toEqual([
      { media: '(max-width: 560px)', value: '1fr 1fr' },
    ]);
  });
});

describe('inner-page surfaces', () => {
  it('leave a section on the page: no white strip behind the price and buttons, the gift line or a store page', () => {
    expect(find('_inner.scss', '.sticky-product-bar.bg-white', 'background-color')).toEqual([
      { media: '', value: 'transparent' },
    ]);
    const gift = 'body.product-single .s-gifting-widget .s-list-tile-item';
    expect(find('_inner.scss', gift, 'background')).toEqual([{ media: '', value: 'transparent' }]);
    const sheet = '#main-content > .container > .flex.justify-center > .bg-white';
    expect(find('_inner.scss', sheet, 'background')).toEqual([{ media: '', value: 'transparent' }]);
    expect(find('_inner.scss', 'body .cart .cart-options', 'background')).toEqual([
      { media: '', value: 'transparent' },
    ]);
  });

  it("keep the phone's floating add-to-cart block white, like the bottom bar under it", () => {
    const floating = '.is-sticky-product-bar .sticky-product-bar.bg-white';
    expect(find('_inner.scss', floating, 'background-color')).toEqual([
      { media: '(max-width: 640px)', value: '#fff' },
    ]);
  });

  it('outline the offers instead of filling them pink, and tint what was grey', () => {
    expect(find('_inner.scss', 'body .s-offer-wrapper', 'background')).toEqual([
      { media: '', value: 'transparent' },
    ]);
    for (const selector of ['body .options-panel__more', 'body #cart-gifting', 'body .cart #free-shipping']) {
      expect(find('_inner.scss', selector, 'background')).toEqual([{ media: '', value: 'var(--gly-tint)' }]);
    }
  });

  it('make the bars that stay on screen cream, with the title in the display face', () => {
    expect(find('_inner.scss', 'body .mobile-page-title', 'background')).toEqual([
      { media: '', value: 'var(--gly-cream)' },
    ]);
    expect(find('_inner.scss', 'body .mobile-page-title__text', 'font-family')).toEqual([
      { media: '', value: 'var(--gly-font-display)' },
    ]);
    expect(find('_inner.scss', 'body .s-catalog-toolbar-sticky', 'background')).toEqual([
      { media: '(max-width: 767px)', value: 'var(--gly-cream)' },
    ]);
  });

  it("are in the product page's first-paint CSS, so the page does not flash white panels", () => {
    const critical = readFileSync(
      fileURLToPath(new URL('../../app/styles/critical-product.scss', import.meta.url)),
      'utf8'
    );
    expect(critical).toContain("@import './giftology/inner';");
  });
});

describe("the phone's add-to-cart block", () => {
  it('waits close enough to the screen for its own button to start loading', () => {
    // The button loads within 200px of the screen (HydrationBoundary's rootMargin).
    const waiting = 'html:not(.hydrated) .is-sticky-product-bar .sticky-product-bar';
    expect(find('_inner.scss', waiting, '--tw-translate-y')).toEqual([
      { media: '(max-width: 640px)', value: '1.5rem' },
    ]);
  });
});

describe('product page controls', () => {
  it('put the options (date, colours, pictures, lists) on the page, not on a white strip', () => {
    const options = 'body salla-product-options.s-product-options-wrapper';
    expect(find('_inner.scss', options, 'background')).toEqual([{ media: '', value: 'transparent' }]);
  });

  it('ring a picked colour and name it in bold, without the pale dot', () => {
    const picked = 'body .s-product-options-colors-item input:checked + label > span';
    expect(find('_inner.scss', picked, 'box-shadow')[0].value).toContain('var(--gly-teal-deep)');
    const dot = 'body .s-product-options-colors-item label > span::after';
    expect(find('_inner.scss', dot, 'display')).toEqual([{ media: '', value: 'none' }]);
  });

  it('draw the minus in teal ink, and keep it readable at quantity 1', () => {
    const minus = 'body .s-quantity-input .s-quantity-input-decrease-button';
    expect(find('_inner.scss', minus, 'color')).toEqual([{ media: '', value: 'var(--gly-teal-ink)' }]);
    const off = 'body .s-quantity-input .s-quantity-input-button:disabled';
    expect(find('_inner.scss', off, 'opacity')).toEqual([{ media: '', value: '0.6' }]);
  });

  it('fill the outlined buttons white with bold labels, leaving their hover alone', () => {
    const gift = 'body .s-gifting-widget-action.s-button-primary-outline:not(:hover):not(:disabled)';
    expect(find('_inner.scss', gift, 'background')).toEqual([{ media: '', value: '#fff' }]);
    expect(find('_inner.scss', 'body .s-add-product-button-mini-checkout', 'background')).toEqual([
      { media: '', value: '#fff' },
    ]);
    const label = 'body .s-add-product-button-mini-checkout-content';
    expect(find('_inner.scss', label, 'font-family')).toEqual([
      { media: '', value: 'var(--gly-font-body)' },
    ]);
  });

  it('say "sold out" once on a laptop', () => {
    expect(find('_inner.scss', '.sticky-product-bar--sold-out .out-of-stock', 'display')).toEqual([
      { media: '(min-width: 641px)', value: 'none' },
    ]);
  });
});

describe('category filters', () => {
  it('show the options of a group marked open, whatever height the widget measured', () => {
    const open =
      'salla-filters .s-filters-widget-container:has(.s-filters-widget-plusminus-active) .s-filters-widget-content';
    expect(find('_plist.scss', open, 'height')).toEqual([{ media: '', value: 'auto' }]);
    const closed =
      'salla-filters .s-filters-widget-container:not(:has(.s-filters-widget-plusminus-active)) .s-filters-widget-content';
    expect(find('_plist.scss', closed, 'height')).toEqual([{ media: '', value: '0' }]);
  });

  it("draw an open group's sign as a dash, not turned on its side", () => {
    const sign = 'salla-filters .s-filters-widget-plusminus-active';
    expect(find('_plist.scss', sign, 'transform')).toEqual([{ media: '', value: 'none' }]);
  });

  it('let a filter column taller than the screen scroll on its own on a laptop', () => {
    expect(find('_plist.scss', '#filters-menu', 'overflow-y')).toEqual([
      { media: '(min-width: 1024px)', value: 'auto' },
    ]);
    // 5rem for the header above it, 6.5rem below for the floating WhatsApp button
    expect(find('_plist.scss', '#filters-menu', 'max-height')).toEqual([
      { media: '(min-width: 1024px)', value: 'calc(100vh - 11.5rem)' },
    ]);
  });
});

describe('this round: price once, filter spacing, the price group, the sheet button', () => {
  it('shows the price once on a laptop for a product without options', () => {
    expect(find('_inner.scss', '.sticky-product-bar--no-options .price-wrapper', 'display')).toEqual([
      { media: '(min-width: 641px)', value: 'none' },
    ]);
  });

  it('puts air between the filter groups on a laptop', () => {
    const next = '#filters-menu .s-filters-widget-container + .s-filters-widget-container';
    expect(find('_plist.scss', next, 'margin-top')).toEqual([
      { media: '(min-width: 768px)', value: '0.85rem' },
    ]);
  });

  it("fits the price group's boxes and button inside the group", () => {
    expect(find('_plist.scss', 'salla-filters .s-price-range-relative', 'min-width')).toEqual([
      { media: '', value: '0' },
    ]);
    expect(find('_plist.scss', 'salla-filters .s-price-range-number-input', 'width')).toEqual([
      { media: '', value: '100%' },
    ]);
  });

  it('keeps "show results" above the bottom bar in the phone sheet', () => {
    expect(find('_plist.scss', '.gly-filter-done', 'position')).toEqual([{ media: '', value: 'sticky' }]);
    expect(find('_plist.scss', '.gly-filter-done', 'bottom')).toEqual([{ media: '', value: '0' }]);
  });
});
