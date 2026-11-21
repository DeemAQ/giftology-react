// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';

const file = fileURLToPath(new URL('../../app/styles/giftology/_home.scss', import.meta.url));
const root: Root = postcss.parse(sass.compile(file).css);

/** Every rule for `selector`, each with the media query it sits in ('' at the top level). */
function rulesFor(selector: string): { media: string; rule: Rule }[] {
  const found: { media: string; rule: Rule }[] = [];
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    const parent = rule.parent as AtRule | Root;
    const media = parent.type === 'atrule' ? parent.params.replace(/\s/g, '') : '';
    found.push({ media, rule });
  });
  return found;
}

function decl(rule: Rule, prop: string): string | undefined {
  let value: string | undefined;
  rule.walkDecls(prop, (d) => {
    value = d.value;
  });
  return value;
}

describe('floating WhatsApp button', () => {
  it('rises above the sticky add-to-cart bar on a phone product page, once the bar shows', () => {
    // `.hydrated` is what reveals the bar (product.scss), so the two move together.
    // The button and its × both sit at `--gly-wa-bottom`; the page raises that.
    const [raised] = rulesFor('.hydrated .is-sticky-product-bar.product-single');
    expect(raised?.media).toBe('(max-width:640px)');
    expect(decl(raised.rule, '--gly-wa-bottom')).toContain('200px');
    const [button] = rulesFor('.gly-wa');
    expect(decl(button.rule, 'bottom')).toBe('var(--gly-wa-bottom, 22px)');
    const [dismiss] = rulesFor('.gly-wa-x');
    expect(decl(dismiss.rule, 'bottom')).toContain('var(--gly-wa-bottom, 22px)');
  });

  it("leaves room for itself beside the footer's last row", () => {
    const rows = rulesFor('.gly-fbottom').filter(({ rule }) => decl(rule, 'padding-right'));
    expect(rows.map(({ media }) => media)).toEqual(['', '(max-width:560px)']);
  });
});

describe('reviews section', () => {
  it("hides the component's own heading, so the page keeps one <h1>", () => {
    const [header] = rulesFor('.gly-reviews .s-reviews-header-wrapper');
    expect(decl(header.rule, 'display')).toBe('none');
  });

  it('stacks the open review card on phones so its text stays inside the card', () => {
    const [inner] = rulesFor(
      '.gly-reviews .s-reviews-container .swiper-slide-active .s-reviews-testimonial__inner'
    );
    expect(inner?.media).toBe('(max-width:640px)');
    expect(decl(inner.rule, 'flex-direction')).toBe('column');
  });
});

describe('reveal on scroll', () => {
  it('animates only the reveal, so hiding a block below the screen is instant', () => {
    const [hidden] = rulesFor('.gly-reveal');
    const [shown] = rulesFor('.gly-reveal.in');
    expect(decl(hidden.rule, 'opacity')).toBe('0');
    expect(decl(hidden.rule, 'transition')).toBeUndefined();
    expect(decl(shown.rule, 'opacity')).toBe('1');
    expect(decl(shown.rule, 'transition')).toBeDefined();
  });
});
