// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';

const file = fileURLToPath(new URL('../../app/styles/giftology/_cards.scss', import.meta.url));
const root: Root = postcss.parse(sass.compile(file).css);

function topLevelRule(pattern: RegExp): Rule | undefined {
  return root.nodes.find((node): node is Rule => node.type === 'rule' && pattern.test(node.selector));
}

function decl(rule: Rule | undefined, prop: string): string | undefined {
  let value: string | undefined;
  rule?.walkDecls(prop, (d) => {
    value = d.value;
  });
  return value;
}

const isContainer = (node: { type: string; name?: string }): node is AtRule =>
  node.type === 'atrule' && node.name === 'container';

/** Any screen: the narrow-card rule that only trims the button's padding. */
const narrowAnywhere = root.nodes.find(isContainer);
/** Phones: the narrow-card rules that swap the label for an icon. */
const phone = root.nodes.find(
  (node): node is AtRule => node.type === 'atrule' && node.name === 'media'
);
const narrow = phone?.nodes?.find(isContainer);

function narrowRule(pattern: RegExp): Rule | undefined {
  let found: Rule | undefined;
  narrow?.walkRules((rule) => {
    if (!found && pattern.test(rule.selector)) found = rule;
  });
  return found;
}

describe('grid product card on the cream page', () => {
  it('pads the text and buttons away from the card edge', () => {
    const content = topLevelRule(/\.s-product-card-vertical \.s-product-card-content$/);
    expect(decl(content, 'padding')).toBe('1rem 0.75rem 0.75rem');
  });

  it('measures the footer to decide when the button is too narrow', () => {
    const footer = topLevelRule(/\.s-product-card-content-footer$/);
    expect(decl(footer, 'container-type')).toBe('inline-size');
    expect(narrow?.params.replace(/\s/g, '')).toBe('(max-width:199px)');
  });

  it('shows the icon on phones only: tablets and desktops keep the label', () => {
    expect(phone?.params.replace(/\s/g, '')).toBe('(max-width:767px)');
    // Outside the phone query a narrow card only loses button padding, never its label.
    const selectors: string[] = [];
    narrowAnywhere?.walkRules((rule) => {
      selectors.push(rule.selector);
    });
    expect(selectors).toEqual(['salla-add-product-button .s-button-btn']);
    let hidesLabel = false;
    narrowAnywhere?.walkDecls('clip-path', () => {
      hidesLabel = true;
    });
    expect(hidesLabel).toBe(false);
  });

  it('swaps the label for an icon on a narrow phone card, keeping the label for screen readers', () => {
    const label = narrowRule(/\.s-button-text$/);
    // Clipped, not `display: none`, so the button keeps its accessible name.
    expect(decl(label, 'clip-path')).toBe('inset(50%)');
    expect(decl(label, 'display')).toBeUndefined();
    expect(decl(narrowRule(/\.s-button-btn::before$/), 'mask')).toContain('--gly-card-ico');
  });

  it('gives "add to cart" and "notify me" each an icon', () => {
    expect(decl(narrowRule(/^salla-add-product-button\[product-status=sale\]$/), '--gly-card-ico')).toContain('svg');
    expect(
      decl(narrowRule(/^salla-add-product-button\[product-status=out-and-notify\]$/), '--gly-card-ico')
    ).toContain('svg');
  });

  it('leaves buttons with another label (book now, donate) as text', () => {
    const label = narrowRule(/\.s-button-text$/);
    expect(label?.selector).toContain(':not([product-type=booking])');
    expect(label?.selector).toContain(':not([product-type=donating])');
    expect(label?.selector).not.toMatch(/product-status=out\]/);
  });
});

describe('product card price', () => {
  it('keeps red for a reduced price: a "starts from" price is the ordinary ink', () => {
    const from = topLevelRule(/^\.s-product-card \.s-product-card-starting-price h4$/);
    expect(decl(from, 'color')).toBe('var(--gly-ink)');
  });
});
