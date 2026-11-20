// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(
  fileURLToPath(new URL('../../app/styles/giftology/_tokens.scss', import.meta.url)),
  'utf8'
);

/** A colour token's hex value, e.g. `token('gly-teal-deep')`. */
function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokens);
  if (!match) throw new Error(`no colour token --${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Normal-size text needs 4.5:1 (WCAG AA). */
const AA = 4.5;

describe('brand colour contrast', () => {
  it('keeps white text readable on the primary button', () => {
    expect(contrast('#ffffff', token('gly-teal-deep'))).toBeGreaterThanOrEqual(AA);
    expect(token('color-primary')).toBe(token('gly-teal-deep'));
  });

  it.each(['gly-teal-deep', 'gly-teal-ink', 'gly-gold-ink', 'gly-ink', 'gly-soft'])(
    'keeps %s text readable on the cream page and on white cards',
    (name) => {
      expect(contrast(token(name), token('gly-cream'))).toBeGreaterThanOrEqual(AA);
      expect(contrast(token(name), token('gly-paper'))).toBeGreaterThanOrEqual(AA);
    }
  );

  it('does not use the decorative gold or the light Tiffany for text', () => {
    const css = ['_home.scss', '_plist.scss', '_cards.scss']
      .map((file) =>
        readFileSync(fileURLToPath(new URL(`../../app/styles/giftology/${file}`, import.meta.url)), 'utf8')
      )
      .join('\n');
    // Text set in these two on a light background reads at about 2:1.
    const textRules = [...css.matchAll(/([^{}]+)\{[^{}]*[;{]color:var\(--gly-(gold|teal)\)[^{}]*\}/g)].map((m) =>
      m[1].trim()
    );
    // Decoration only, not words: twinkles, star glyphs, the gift finder's magnifier drawing.
    const decorative = /sparkle|stars|__mag/;
    expect(textRules.filter((selector) => !decorative.test(selector))).toEqual([]);
  });
});

describe('footer contrast', () => {
  const home = readFileSync(
    fileURLToPath(new URL('../../app/styles/giftology/_home.scss', import.meta.url)),
    'utf8'
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  /** The declarations of every rule whose selector is exactly `selector`. */
  const declarations = (selector: string) =>
    [...home.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].trim().split(',').some((part) => part.trim() === selector))
      .map((m) => m[2])
      .join(';');

  it('keeps the pattern faint behind the footer text', () => {
    const opacity = Number(/opacity:([\d.]+)/.exec(declarations('.gly-footer__deco'))?.[1]);
    expect(opacity).toBeGreaterThan(0);
    // At .22 the text reads at about 6.4:1; at the old .5 it was 3.5:1.
    expect(opacity).toBeLessThanOrEqual(0.25);
  });

  it.each(['.gly-fbrand p', '.gly-footer ul a', '.gly-fbottom'])('does not dim %s with opacity', (selector) => {
    expect(declarations(selector)).not.toBe('');
    expect(declarations(selector)).not.toMatch(/opacity/);
  });
});

