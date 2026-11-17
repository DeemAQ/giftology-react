// @vitest-environment node
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule } from 'postcss';

const stylesDir = new URL('../../app/styles/giftology/', import.meta.url);
const css = sass.compile(fileURLToPath(new URL('_fonts.scss', stylesDir))).css;

interface Face {
  family: string;
  weight: string;
  display?: string;
  file: string;
  range: string;
}

const faces: Face[] = [];
postcss.parse(css).walkAtRules('font-face', (rule: AtRule) => {
  const value = (prop: string) => {
    let found = '';
    rule.walkDecls(prop, (d) => {
      found = d.value;
    });
    return found;
  };
  faces.push({
    family: value('font-family').replace(/['"]/g, ''),
    weight: value('font-weight'),
    display: value('font-display'),
    file: /url\(['"]?([^'")]+)/.exec(value('src'))?.[1] ?? '',
    range: value('unicode-range'),
  });
});

/** "Family weight", once per Arabic/Latin pair. */
const declared = [...new Set(faces.map((f) => `${f.family} ${f.weight}`))].sort();

describe('brand fonts', () => {
  it('declares the weights the theme uses, and no others', () => {
    expect(declared).toEqual([
      'Amiri 700',
      'Aref Ruqaa 700',
      'Tajawal 400',
      'Tajawal 500',
      'Tajawal 700',
      'Tajawal 800',
    ]);
  });

  it('has an Arabic and a Latin file for each, limited to its own characters', () => {
    for (const name of declared) {
      const pair = faces.filter((f) => `${f.family} ${f.weight}` === name);
      expect(pair.map((f) => /-(arabic|latin)-/.exec(f.file)?.[1]).sort(), name).toEqual(['arabic', 'latin']);
      for (const face of pair) {
        expect(face.range, face.file).toContain(face.file.includes('-arabic-') ? 'U+0600-06FF' : 'U+0000-00FF');
      }
    }
  });

  it('points every rule at a file that exists', () => {
    for (const face of faces) {
      expect(existsSync(fileURLToPath(new URL(face.file, stylesDir))), face.file).toBe(true);
    }
  });

  it('shows text in a fallback font while a file loads', () => {
    expect(faces.every((f) => f.display === 'swap')).toBe(true);
  });

  it('is part of the tokens every stylesheet starts from', () => {
    const tokens = sass.compile(fileURLToPath(new URL('_tokens.scss', stylesDir))).css;
    expect(tokens).toMatch(/@font-face\s*\{\s*font-family:\s*["']Tajawal/);
    expect(tokens).not.toContain('fonts.googleapis.com');
  });
});
