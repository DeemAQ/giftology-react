// @vitest-environment node
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
