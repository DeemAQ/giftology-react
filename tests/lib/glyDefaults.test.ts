import { describe, it, expect } from 'vitest';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import manifest from '../../twilight.json';
import { DEFAULT_ROWS, DEFAULT_TEXTS_AR, defaultTextKey } from '../../app/lib/glyDefaults';
import { rowText } from '../../app/lib/giftology';

interface Field {
  id: string;
  type: string;
  value?: unknown;
}
const blocks = manifest.components as unknown as { path: string; fields: Field[] }[];
const list = (name: string) => {
  const [block, id] = name.split('.');
  return blocks.find((item) => item.path === `home.gly-${block}`)?.fields.find((field) => field.id === id);
};

describe('ready-made rows of the Giftology blocks', () => {
  it('holds the same Arabic wording as the locale file', () => {
    for (const [key, text] of Object.entries(DEFAULT_TEXTS_AR)) {
      expect((ar as Record<string, string>)[key], key).toBe(text);
      expect((en as Record<string, string>)[key], key).toBeTruthy();
    }
  });

  it('ships each list in twilight.json filled with exactly those rows', () => {
    for (const [name, rows] of Object.entries(DEFAULT_ROWS)) {
      const id = name.split('.')[1];
      const expected = rows.map((row) =>
        Object.fromEntries(Object.entries(row).map(([field, key]) => [`${id}.${field}`, DEFAULT_TEXTS_AR[key]]))
      );
      expect(list(name)?.value, name).toEqual(expected);
    }
  });

  it('never ships a Giftology list the editor would open empty, except the extra circles', () => {
    const empty = blocks
      .filter((block) => block.path.startsWith('home.gly-'))
      .flatMap((block) => block.fields.filter((field) => field.type === 'collection').map((field) => [block.path, field]))
      .filter(([, field]) => !((field as Field).value as unknown[] | undefined)?.length)
      .map(([path, field]) => `${path}.${(field as Field).id}`);
    expect(empty).toEqual(['home.gly-circles.circles']);
  });

  it('tells an untouched ready-made text from one the merchant wrote', () => {
    expect(defaultTextKey(' نكتشف ')).toBe('blocks.gly.how.discover_t');
    expect(defaultTextKey('نكتشف معك')).toBeUndefined();
    // No two ready-made texts are the same, so each maps back to one key.
    expect(new Set(Object.values(DEFAULT_TEXTS_AR)).size).toBe(Object.keys(DEFAULT_TEXTS_AR).length);
  });

  it("shows an untouched row in the visitor's language and a rewritten one as written", () => {
    const t = (key: string) => (en as Record<string, string>)[key];
    expect(rowText({ title: 'نكتشف' }, 'title', 'en', t)).toBe('Discover');
    expect(rowText({ title: 'Find' }, 'title', 'en', t)).toBe('Find');
    expect(rowText({ title: { ar: 'نكتشف', en: 'We explore' } }, 'title', 'en', t)).toBe('We explore');
    expect(rowText({}, 'title', 'en', t)).toBe('');
  });
});
