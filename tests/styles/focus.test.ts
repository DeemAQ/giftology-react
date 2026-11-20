// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as sass from 'sass';
import postcss, { type Rule } from 'postcss';

const styles = new URL('../../app/styles/', import.meta.url);
const css = sass.compile(fileURLToPath(new URL('giftology/_focus.scss', styles))).css;

const rules: Rule[] = [];
postcss.parse(css).walkRules((rule) => {
  rules.push(rule);
});

/** The value of `prop` in the rule that lists `selector`. */
function declared(selector: string, prop: string): string | undefined {
  let value: string | undefined;
  rules
    .filter((rule) => rule.selectors.includes(selector))
    .forEach((rule) => rule.walkDecls(prop, (d) => void (value = d.value)));
  return value;
}

describe('keyboard focus ring', () => {
  it.each(['a:focus-visible', 'button:focus-visible'])('draws a ring on %s', (selector) => {
    expect(declared(selector, 'outline')).toBe('2px solid var(--gly-focus, var(--gly-teal-ink))');
    expect(declared(selector, 'outline-offset')).toBe('3px');
  });

  it('shows only for keyboard focus, never on a click', () => {
    const focusSelectors = rules.flatMap((rule) => rule.selectors).filter((s) => s.includes(':focus'));
    expect(focusSelectors.length).toBeGreaterThan(0);
    expect(focusSelectors.every((s) => s.endsWith(':focus-visible'))).toBe(true);
  });

  it.each(['.gly-topbar', '.gly-custom', '.gly-footer'])('turns white on the dark %s', (section) => {
    expect(declared(section, '--gly-focus')).toBe('#fff');
  });

  it('is part of the Giftology stylesheet', () => {
    const index = readFileSync(fileURLToPath(new URL('giftology/index.scss', styles)), 'utf8');
    expect(index).toContain("@import './focus'");
  });

  it('is not cancelled by the reset, which is also inlined as critical CSS', () => {
    const reset = sass.compile(fileURLToPath(new URL('02-generic/reset.scss', styles))).css;
    const removers: string[] = [];
    postcss.parse(reset).walkRules((rule) => {
      rule.walkDecls('outline', (d) => {
        if (/^(none|0)$/.test(d.value)) removers.push(...rule.selectors);
      });
    });
    // Links lose their outline on a click only, never on keyboard focus.
    expect(removers).toEqual(['a:focus:not(:focus-visible)']);
  });
});
