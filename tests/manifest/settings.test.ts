import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../../twilight.json';

interface Entry {
  id: string;
  type: string;
  format?: string;
  label?: string;
  value?: unknown;
  conditions?: { id: string; operation: string; value: unknown }[];
}

const entries = manifest.settings as Entry[];
const settings = entries.filter((entry) => entry.type !== 'static');
const byId = new Map(entries.map((entry) => [entry.id, entry]));

/** Every source file of the theme, as one string. */
function themeSource(dir = join(__dirname, '../../app')): string {
  return readdirSync(dir)
    .map((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return themeSource(path);
      return /\.(tsx?|scss)$/.test(name) ? readFileSync(path, 'utf8') : '';
    })
    .join('\n');
}

describe('theme editor settings (twilight.json)', () => {
  it('offers no setting that nothing reads', () => {
    // Starter settings for the header, top bar and footer Giftology replaced.
    for (const id of [
      'header_layout',
      'enable_more_menu',
      'header_show_store_info',
      'header_store_info_home_only',
      'header_is_sticky',
      'topnav_is_dark',
      'important_links',
      'footer_is_dark',
      'imageZoom',
    ]) {
      expect(byId.has(id), id).toBe(false);
    }
  });

  it('reads every Giftology setting somewhere in the theme', () => {
    const source = themeSource();
    // An English box (`<id>_en`) is read through `settingCopy`, by its Arabic twin's id.
    const read = (id: string) =>
      source.includes(id) || (id.endsWith('_en') && source.includes('settingCopy') && source.includes(id.slice(0, -3)));
    const unread = settings
      .map((entry) => entry.id)
      .filter((id) => id.startsWith('gly_'))
      .filter((id) => !read(id));
    expect(unread).toEqual([]);
  });

  it('shows a dependent field only under a switch that comes before it', () => {
    entries.forEach((entry, index) => {
      for (const condition of entry.conditions ?? []) {
        const owner = byId.get(condition.id);
        expect(owner?.type, `${entry.id} depends on ${condition.id}`).toBe('boolean');
        expect(entries.indexOf(owner as Entry), `${condition.id} comes before ${entry.id}`).toBeLessThan(index);
        expect(condition).toMatchObject({ operation: '=', value: true });
      }
    });
  });

  it("hides the top bar's phrases while the bar is off", () => {
    const under = (id: string) => (byId.get(id)?.conditions ?? []).map((condition) => condition.id);
    expect(under('gly_promo_1')).toEqual(['gly_show_promo']);
    expect(under('gly_promo_3')).toEqual(['gly_show_promo']);
  });

  it('gives every text the visitor reads an English box beside its Arabic one', () => {
    for (const id of ['gly_promo_1', 'gly_promo_2', 'gly_promo_3', 'gly_footer_about', 'gly_whatsapp_msg', 'gly_whatsapp_custom_msg']) {
      const index = entries.indexOf(byId.get(id) as Entry);
      expect(index, id).toBeGreaterThanOrEqual(0);
      expect(entries[index + 1]?.id, id).toBe(`${id}_en`);
    }
  });

  it('opens with the "start here" note', () => {
    expect(entries[0]).toMatchObject({ id: 'gly-start', type: 'static' });
    expect(String(entries[0].value)).toContain('ابدأ من هنا');
  });

  it('leaves the home page to the home tab: no section switch, section field or block position', () => {
    const homeSettings = settings
      .map((entry) => entry.id)
      .filter((id) => /^gly_(show_(?!promo)|hero_|latest_|cat_|tile|blocks_)/.test(id));
    expect(homeSettings).toEqual([]);
  });

  const blocks = manifest.components as unknown as {
    path: string;
    fields: (Entry & { source?: string; multichoice?: boolean })[];
  }[];
  const blockField = (path: string, id: string) =>
    blocks.find((block) => block.path === path)?.fields.find((field) => field.id === id);

  it("builds the circles from the store's categories, with a hand list only for extras", () => {
    expect(blockField('home.gly-circles', 'categories')).toMatchObject({
      type: 'items',
      format: 'dropdown-list',
      source: 'categories',
      multichoice: true,
    });
    expect(blockField('home.gly-circles', 'circles')).toMatchObject({ type: 'collection', value: [] });
  });

  it('asks for no category links in the gift finder: it follows the category tree', () => {
    const finder = blocks.find((block) => block.path === 'home.gly-finder');
    expect(finder?.fields.filter((field) => field.id.startsWith('cat_'))).toEqual([]);
    expect(blockField('home.gly-finder', 'exclude')).toMatchObject({ source: 'categories', multichoice: true });
    for (const id of ['q_category', 'q_kind', 'q_budget']) {
      expect(blockField('home.gly-finder', id)?.type, id).toBe('string');
    }
  });

  it('labels every setting in plain Arabic', () => {
    for (const entry of settings) {
      expect(entry.label?.trim(), entry.id).toBeTruthy();
      expect(entry.label, entry.id).not.toMatch(/hero|البطل/i);
    }
  });

  it('ships no made-up WhatsApp number', () => {
    expect(byId.get('gly_whatsapp')?.value ?? null).toBeNull();
  });
});
