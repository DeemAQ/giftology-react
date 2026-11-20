/**
 * Giftology helpers: reading the `gly_*` theme settings and building the links the
 * bespoke sections share (category pages, WhatsApp). No React in here.
 */

import { defaultTextKey } from './glyDefaults';
import { offered, sameCategory } from './giftFinder';
import type { CategoryNode } from './giftFinder';

export type GlySettings = Record<string, unknown> | undefined | null;

/**
 * The `gly_whatsapp` setting's former default in `twilight.json`. A store that saved its
 * settings back then still holds it; it is nobody's number, so it counts as unset.
 */
export const WA_PLACEHOLDER = '966500000000';

/** A boolean setting; an unsaved one (`undefined`) takes `fallback`. */
export function settingOn(settings: GlySettings, id: string, fallback = true): boolean {
  const value = settings?.[id];
  return typeof value === 'boolean' ? value : fallback;
}

/** A text setting, trimmed; empty when unset. */
export function settingText(settings: GlySettings, id: string): string {
  const value = settings?.[id];
  return typeof value === 'string' ? value.trim() : '';
}

/** A dropdown's chosen value: the API sends a plain string or `[{ value }]`. */
export function choiceValue(raw: unknown): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === 'string') return first;
  const value = (first as { value?: unknown } | null | undefined)?.value;
  return typeof value === 'string' ? value : '';
}

/** A dropdown setting. */
export function settingChoice(settings: GlySettings, id: string): string {
  return choiceValue(settings?.[id]);
}

/**
 * What a Giftology home block receives: the fields the merchant filled for it in the
 * theme editor's home tab (`components` in `twilight.json`), keyed by field id. The
 * built-in sections get none.
 */
export type BlockData = Record<string, unknown> | null | undefined;

/**
 * A text field of a home block, trimmed; empty when unset. Salla sends the text in
 * the visitor's language; a `{ ar, en }` object is read by `lang` in case it doesn't.
 */
export function blockText(data: BlockData, id: string, lang?: string): string {
  const value = data?.[id];
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const byLang = value as Record<string, unknown>;
    const text = (lang && byLang[lang]) || byLang.ar || byLang.en;
    return typeof text === 'string' ? text.trim() : '';
  }
  return '';
}

/**
 * The rows of a block's repeatable list (a `collection` field). A row's fields are
 * declared as `list.field` in `twilight.json` and arrive as `field`; both spellings
 * are read, and rows the merchant left empty are dropped.
 */
export function blockRows(data: BlockData, id: string): Record<string, unknown>[] {
  const rows = data?.[id];
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key.startsWith(`${id}.`) ? key.slice(id.length + 1) : key,
          value,
        ])
      )
    )
    .filter((row) => Object.values(row).some((value) => value !== null && value !== '' && value !== false));
}

/**
 * A text of a list row. The lists arrive filled with the theme's ready-made rows in
 * Arabic (`glyDefaults.ts`); a text the merchant left as it came is shown in the
 * visitor's language from the locale files, and one they rewrote is shown as written.
 */
export function rowText(
  row: BlockData,
  id: string,
  lang: string | undefined,
  t: (key: string) => string
): string {
  const text = blockText(row, id, lang);
  const key = text ? defaultTextKey(text) : undefined;
  return key ? t(key) : text;
}

/** A block's link field (the editor's link picker): a URL, `{ url }` or a list of them; empty when unset. */
export function blockLink(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first === 'string') return first.trim();
  const url = (first as { url?: unknown } | null | undefined)?.url;
  return typeof url === 'string' ? url.trim() : '';
}

/**
 * Resolve a category-link setting to a URL in the visitor's language.
 *
 * Accepts a pasted URL, a category object (`{ url }`) or a list of them; anything
 * else gives `fallback`. A store URL shaped `https://domain/{xx}/...` has its
 * two-letter language segment swapped for `lang`, so one pasted link serves every
 * language.
 */
export function resolveCategoryUrl(value: unknown, fallback: string, lang?: string): string {
  let url = '';
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first === 'string') {
    const text = first.trim();
    if (text.startsWith('http') || text.startsWith('/')) url = text;
  } else if (first && typeof (first as { url?: unknown }).url === 'string') {
    url = (first as { url: string }).url;
  }
  if (!url) url = fallback;

  const parts = url.split('/');
  if (lang && parts.length > 4 && parts[3].length === 2) {
    return `${parts.slice(0, 3).join('/')}/${lang}/${parts.slice(4).join('/')}`;
  }
  return url;
}

/**
 * The extra circles a merchant listed by hand in the "category circles" home block,
 * for things that are not categories (the offers page, a store page). A row needs a
 * link, a name or an image; one that only has an icon is skipped. An unknown icon
 * falls back to the gift, and a circle left without a name takes its icon's own name.
 */
export function blockTiles(
  data: BlockData,
  t: (key: string, fallback?: string) => string,
  homeUrl: string,
  lang: string | undefined,
  icons: Record<string, string>
): CategoryTile[] {
  return blockRows(data, 'circles')
    .filter((row) => blockLink(row.url) || blockText(row, 'name', lang) || blockLink(row.image))
    .map((row) => {
      const chosen = choiceValue(row.icon);
      const icon = icons[chosen] ? chosen : 'gift';
      const preset = TILE_DEFAULTS.find((tile) => tile.icon === icon);
      return {
        name: blockText(row, 'name', lang) || (preset ? t(preset.nameKey) : ''),
        url: resolveCategoryUrl(row.url, allProductsUrl(homeUrl), lang),
        image: blockLink(row.image),
        icon,
      };
    });
}

/** The most circles drawn from the store's categories when the merchant picked none. */
export const AUTO_CIRCLES = 12;

/** Every category of a tree, parents before their children. */
function flatten(nodes: readonly CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.sub_categories ?? node.items ?? [])]);
}

/**
 * Circles for the store's own categories: each takes its category's name, page and
 * image from Salla, so nothing is typed in the theme. A category without an image
 * shows one of the brand icons: the one whose ready-made name it carries, else the gift.
 *
 * `picked` is what the merchant chose in the circles block, in their order; each is
 * looked up in the store's tree for its current name and image. With nothing picked
 * the circles are the top-level categories that hold products.
 */
export function categoryCircles(
  tree: readonly CategoryNode[] | null | undefined,
  picked: readonly Partial<CategoryNode>[],
  t: (key: string, fallback?: string) => string
): CategoryTile[] {
  const all = flatten(tree ?? []);
  const chosen = picked.length
    ? picked
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const current = all.find(
            (node) => sameCategory(item, node) || (!!item.url && node.url === item.url)
          );
          return { ...item, ...current };
        })
        .filter((item): item is CategoryNode => !!item.name && !!item.url)
    : offered(tree).slice(0, AUTO_CIRCLES);

  return chosen.map((node) => {
    const preset = TILE_DEFAULTS.find((tile) => t(tile.nameKey) === node.name.trim());
    return {
      name: node.name,
      url: node.url,
      image: typeof node.image === 'string' ? node.image : '',
      icon: preset?.icon ?? 'gift',
    };
  });
}

/**
 * The first candidate that holds a real phone number, as digits; empty when none does.
 * Pass the `gly_whatsapp` setting first, then the store's own contact numbers.
 */
export function whatsappNumber(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const digits = typeof candidate === 'string' ? candidate.replace(/\D/g, '') : '';
    if (digits.length >= 8 && digits !== WA_PLACEHOLDER) return digits;
  }
  return '';
}

/** A `wa.me` chat link with a prefilled message; empty without a number, so the button can hide. */
export function whatsappLink(number: string, message: string): string {
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '';
}

/** A page of the store under its home URL: `storePage('https://store/ar', 'latest-products')`. */
export function storePage(homeUrl: string | undefined, path: string): string {
  return `${(homeUrl || '').replace(/\/+$/, '')}/${path}`;
}

/**
 * The store's all-products page. A category link the merchant hasn't set yet leads
 * here, so it still opens something to shop instead of looping back to the home page.
 */
export function allProductsUrl(homeUrl: string | undefined): string {
  return storePage(homeUrl, 'products');
}

const TRANSLATION_KEY = /^[a-z_]+(\.[a-z_]+)+$/;

/**
 * The label of a store menu entry. Salla names a few built-in entries by translation
 * key (`blocks.header.offers`) instead of by a title; those are translated.
 */
export function menuLabel(name: string, t: (key: string) => string): string {
  return TRANSLATION_KEY.test(name) ? t(name) : name;
}

/** Store details a merchant can drop into a page's text as `{placeholder}`s. */
export interface StoreDetails {
  storeName?: string | null;
  commercialNumber?: string | null;
  email?: string | null;
  /** Digits only, as `whatsappNumber` returns them. */
  whatsapp?: string | null;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

/**
 * Fill the store-detail placeholders in merchant-written page HTML, so a policy
 * page never carries a number typed by hand:
 *
 *   {store_name}  {commercial_number}  {email}  {whatsapp}
 *
 * The email and the WhatsApp number become links. A placeholder whose detail the
 * store hasn't set becomes empty; any other text in braces is left as it is.
 */
export function fillStoreDetails(html: string, details: StoreDetails): string {
  const { storeName, commercialNumber, email, whatsapp } = details;
  const values = new Map<string, string>([
    ['store_name', storeName ? escapeHtml(storeName) : ''],
    [
      'commercial_number',
      commercialNumber ? `<span dir="ltr">${escapeHtml(String(commercialNumber))}</span>` : '',
    ],
    [
      'email',
      email ? `<a href="mailto:${escapeHtml(email)}" dir="ltr">${escapeHtml(email)}</a>` : '',
    ],
    [
      'whatsapp',
      whatsapp
        ? `<a href="https://wa.me/${escapeHtml(whatsapp)}" dir="ltr" target="_blank" rel="noopener">+${escapeHtml(whatsapp)}</a>`
        : '',
    ],
  ]);
  return html.replace(/\{\s*([a-z_]+)\s*\}/g, (match, key: string) => values.get(key) ?? match);
}

/** The home page URL plus a section anchor, e.g. `https://store/ar/#gly-cats`. */
export function homeAnchor(homeUrl: string | undefined, id: string): string {
  return `${(homeUrl || '').replace(/\/+$/, '')}/#${id}`;
}

/** The six curated category tiles, in settings order (`gly_tile1..6`). */
export const TILE_DEFAULTS = [
  { icon: 'baby', nameKey: 'blocks.gly.cats.newborn' },
  { icon: 'gift', nameKey: 'blocks.gly.cats.occasion' },
  { icon: 'cake', nameKey: 'blocks.gly.cats.kids' },
  { icon: 'tie', nameKey: 'blocks.gly.cats.men' },
  { icon: 'tag', nameKey: 'blocks.gly.cats.favors' },
  { icon: 'envelope', nameKey: 'blocks.gly.cats.cards' },
] as const;

export const TILE_COUNT = 8;

export interface CategoryTile {
  name: string;
  url: string;
  image: string;
  icon: string;
}

/**
 * The enabled category tiles (`gly_tileN_*`). Tiles 1-6 default on with a curated
 * name and icon; 7-8 are off until the merchant enables them.
 */
export function categoryTiles(
  settings: GlySettings,
  t: (key: string, fallback?: string) => string,
  homeUrl: string,
  lang: string | undefined,
  icons: Record<string, string>
): CategoryTile[] {
  const tiles: CategoryTile[] = [];
  for (let i = 1; i <= TILE_COUNT; i++) {
    const preset = i <= TILE_DEFAULTS.length ? TILE_DEFAULTS[i - 1] : null;
    if (!settingOn(settings, `gly_tile${i}_enabled`, i <= TILE_DEFAULTS.length)) continue;
    const name = settingText(settings, `gly_tile${i}_name`) || (preset ? t(preset.nameKey) : '');
    const link = settings?.[`gly_tile${i}_link`];
    const image = settingText(settings, `gly_tile${i}_image`);
    const chosen = settingChoice(settings, `gly_tile${i}_icon`);
    const icon = icons[chosen] ? chosen : (preset?.icon ?? 'gift');
    if (!name && !link && !image) continue;
    tiles.push({ name, url: resolveCategoryUrl(link, allProductsUrl(homeUrl), lang), image, icon });
  }
  return tiles;
}
