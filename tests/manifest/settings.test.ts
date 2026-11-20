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
    const unread = settings
      .map((entry) => entry.id)
      .filter((id) => id.startsWith('gly_'))
      .filter((id) => !source.includes(id));
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

  it("hides a section's own fields while the section is off", () => {
    const under = (id: string) => (byId.get(id)?.conditions ?? []).map((condition) => condition.id);
    expect(under('gly_promo_1')).toEqual(['gly_show_promo']);
    expect(under('gly_hero_stat_gifts')).toEqual(['gly_show_hero', 'gly_show_hero_stats']);
    expect(under('gly_latest_title')).toEqual(['gly_show_latest']);
    expect(under('gly_cat_newborn')).toEqual(['gly_show_finder']);
  });

  it('leaves the circles to their home block', () => {
    expect(settings.filter((entry) => entry.id.startsWith('gly_tile'))).toEqual([]);
    const circles = (manifest.components as { path: string; fields: Entry[] }[]).find(
      (block) => block.path === 'home.gly-circles'
    );
    expect(circles?.fields.find((field) => field.id === 'circles')?.type).toBe('collection');
  });

  it('lists the home sections in the order the page shows them', () => {
    const order = [
      'gly_show_hero',
      'gly_show_latest',
      'gly_show_categories',
      'gly_show_custom',
      'gly_show_finder',
      'gly_show_how',
      'gly_show_testimonials',
    ].map((id) => entries.indexOf(byId.get(id) as Entry));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
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
