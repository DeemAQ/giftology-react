/**
 * Giftology helpers: reading the `gly_*` theme settings and building the links the
 * bespoke sections share (category pages, WhatsApp). No React in here.
 */

export type GlySettings = Record<string, unknown> | undefined | null;

/** The `gly_whatsapp` setting's default in `twilight.json`: nobody's number, so it counts as unset. */
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

/** A dropdown setting: the API sends a plain string or `[{ value }]`. */
export function settingChoice(settings: GlySettings, id: string): string {
  const raw = settings?.[id];
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === 'string') return first;
  const value = (first as { value?: unknown } | null | undefined)?.value;
  return typeof value === 'string' ? value : '';
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

/** Salla category pages end in `/c{id}`; the id, or `null`. */
export function categoryIdFromUrl(url: string | null | undefined): number | null {
  const match = String(url ?? '').match(/\/c(\d+)(?:[/?#]|$)/);
  return match ? Number(match[1]) : null;
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
