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

/** Every rule for `selector`, with the media query it sits in (`''` for none). */
function rulesFor(selector: string): { rule: Rule; media: string }[] {
  const found: { rule: Rule; media: string }[] = [];
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    const parent = rule.parent as AtRule | undefined;
    found.push({ rule, media: parent?.type === 'atrule' && parent.name === 'media' ? parent.params : '' });
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

  it('sets the figures two to a row', () => {
    const stats = phoneRule('.gly-hero-stats');
    expect(decl(stats, 'display')).toBe('grid');
    expect(decl(stats, 'grid-template-columns')).toBe('1fr 1fr');
  });

  it('shows four of the latest products, or six, as the block says', () => {
    const hidden = (selector: string) => rulesFor(selector)[0];
    expect(hidden('.gly-latest-grid[data-phone="4"] > :nth-child(n+5)').media).toContain('max-width: 639px');
    expect(decl(hidden('.gly-latest-grid[data-phone="6"] > :nth-child(n+7)').rule, 'display')).toContain('none');
    expect(rulesFor('.gly-latest-grid[data-phone="all"] > :nth-child(n+5)')).toHaveLength(0);
  });

  it('keeps the custom-gift section centred: no side padding around its 92vw column', () => {
    const narrow = rulesFor('.gly-custom').filter((found) => found.media.includes('max-width: 560px'));
    expect(narrow).toHaveLength(1);
    expect(decl(narrow[0].rule, 'padding')).toBe('2rem 0');
  });

  it("keeps the gift finder's answers two to a row", () => {
    const narrow = rulesFor('.gly-qopts').filter((found) => found.media);
    for (const found of narrow) expect(decl(found.rule, 'grid-template-columns')).toBeUndefined();
    expect(decl(rulesFor('.gly-qopts').find((found) => !found.media)?.rule, 'grid-template-columns')).toBe('1fr 1fr');
  });

  it('hides no promo phrase: on a phone they all show, moving when they do not fit', () => {
    expect(phoneRule('.gly-topbar__phrase:not(.gly-topbar__phrase--main)')).toBeUndefined();
    const moving = rulesFor('.gly-topbar--moving .gly-topbar__track');
    expect(moving).toHaveLength(1);
    expect(decl(moving[0].rule, 'animation')).toContain('gly-ticker');
    // Only for a visitor who has not asked for less motion.
    expect(moving[0].media).toContain('prefers-reduced-motion: no-preference');
    // Before the bar has measured itself, a phone with several phrases moves them from the first paint.
    const guess = rulesFor('.gly-topbar--many:not(.gly-topbar--still) .gly-topbar__track');
    expect(guess[0].media).toContain('max-width: 767px');
    expect(guess[0].media).toContain('prefers-reduced-motion: no-preference');
  });
});
