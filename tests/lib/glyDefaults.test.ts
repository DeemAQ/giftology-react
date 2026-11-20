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

  it('ships each list in twilight.json filled with exactly those rows, in Arabic and English', () => {
    for (const [name, rows] of Object.entries(DEFAULT_ROWS)) {
      const id = name.split('.')[1];
      const shipped = (list(name)?.value ?? []) as Record<string, unknown>[];
      expect(shipped, name).toHaveLength(rows.length);
      rows.forEach((row, index) => {
        for (const [field, key] of Object.entries(row)) {
          expect(shipped[index][`${id}.${field}`], `${name} ${field}`).toBe(DEFAULT_TEXTS_AR[key]);
          expect(shipped[index][`${id}.${field}_en`], `${name} ${field}_en`).toBe((en as Record<string, string>)[key]);
        }
      });
    }
  });

  it('gives every text box of a Giftology block an English box', () => {
    const isText = (field: Field & { format?: string }) => field.type === 'string' && ['text', 'textarea'].includes(field.format ?? '');
    for (const block of blocks.filter((item) => item.path.startsWith('home.gly-'))) {
      const all = block.fields.flatMap((field) => [field, ...(((field as { fields?: Field[] }).fields ?? []) as Field[])]);
      const ids = new Set(all.map((field) => field.id));
      for (const field of all.filter(isText)) {
        if (field.id.endsWith('_en')) continue;
        expect(ids.has(`${field.id}_en`), `${block.path} ${field.id}`).toBe(true);
        // One value per box: Salla's own per-language input would fight the English box.
        expect((field as { multilanguage?: boolean }).multilanguage, `${block.path} ${field.id}`).toBe(false);
      }
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
    // The English box wins on an English page; the Arabic page never reads it.
    expect(rowText({ title: 'نكتشف', title_en: 'We listen' }, 'title', 'en', t)).toBe('We listen');
    expect(rowText({ title: 'نستمع', title_en: 'We listen' }, 'title', 'ar', t)).toBe('نستمع');
  });
});
