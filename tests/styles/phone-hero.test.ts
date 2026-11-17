// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';

const file = fileURLToPath(new URL('../../app/styles/giftology/_home.scss', import.meta.url));
const root: Root = postcss.parse(sass.compile(file).css);

/** The rule for `selector` inside the phone media query (`max-width: 767px`). */
function phoneRule(selector: string): Rule | undefined {
  let found: Rule | undefined;
  root.walkAtRules('media', (media: AtRule) => {
    if (media.params.replace(/\s/g, '') !== '(max-width:767px)') return;
    media.walkRules((rule) => {
      if (rule.selectors.includes(selector)) found = rule;
    });
  });
  return found;
}

function decl(rule: Rule | undefined, prop: string): string | undefined {
  let value: string | undefined;
  rule?.walkDecls(prop, (d) => {
    value = d.value;
  });
  return value;
}

describe('home hero on a phone', () => {
  it('lays the artwork behind the text as a faint backdrop, not above it', () => {
    const art = phoneRule('.gly-hero__grid .gly-hero__art.gly-reveal');
    expect(decl(art, 'position')).toBe('absolute');
    // The tablet rule puts the art first (`order: -1`); a phone must undo that.
    expect(decl(art, 'order')).toBe('0');
    expect(Number(decl(art, 'opacity'))).toBeLessThan(0.3);
    expect(decl(phoneRule('.gly-hero__grid > :first-child'), 'z-index')).toBe('1');
  });

  it('keeps only the teal shape and its pattern in the backdrop', () => {
    const rest = phoneRule('.gly-hero__art > :not(.gly-blob.teal):not(.gly-hero__pattern)');
    expect(decl(rest, 'display')).toBe('none');
  });

  it('shows one promo phrase so the bar stays one line', () => {
    const others = phoneRule('.gly-topbar__phrase:not(.gly-topbar__phrase--main)');
    expect(decl(others, 'display')).toBe('none');
  });
});
