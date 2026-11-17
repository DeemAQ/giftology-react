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

const TRANSLATION_KEY = /^[a-z_]+(\.[a-z_]+)+$/;

/** Where the merchant's home blocks sit among the Giftology sections. */
export type BlocksPosition = 'top' | 'after_hero' | 'after_latest' | 'bottom';

const BLOCKS_POSITIONS: readonly BlocksPosition[] = ['top', 'after_hero', 'after_latest', 'bottom'];

/** `gly_blocks_position`; under the hero until the merchant picks another place. */
export function blocksPosition(settings: GlySettings): BlocksPosition {
  const chosen = settingChoice(settings, 'gly_blocks_position') as BlocksPosition;
  return BLOCKS_POSITIONS.includes(chosen) ? chosen : 'after_hero';
}

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
