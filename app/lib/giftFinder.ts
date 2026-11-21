/**
 * The gift finder's rules, with no React in them.
 *
 * The finder is built from the store's own category tree, so it follows the
 * categories as the merchant adds, renames or removes them: the first question
 * lists the top-level categories, the second the chosen category's children, the
 * third a few budget ranges worked out from that category's real prices. The
 * answer is the in-stock products that fit, in the order Salla returned them
 * (best-selling first).
 */

/** The parts of a Salla category the finder and the circles read. */
export interface CategoryNode {
  id: number | string;
  id_?: number;
  name: string;
  url: string;
  image?: string | null;
  products_count?: number;
  sub_categories?: CategoryNode[];
  items?: CategoryNode[] | null;
}

/** The parts of a Salla product the finder reads. */
export interface FinderProduct {
  id: number | string;
  price?: number | string | null;
  price_as_float?: number;
  /** The cheapest choice of a product sold with options; the store shows it as "starts from". */
  starting_price?: number | string | null;
  status?: string;
  is_available?: boolean;
  is_out_of_stock?: boolean;
}

/** A category's direct children; the API names them `sub_categories` or `items`. */
export function childrenOf(node: CategoryNode | null | undefined): CategoryNode[] {
  return node?.sub_categories ?? node?.items ?? [];
}

/**
 * The id the products API takes for a category: the raw number. The list sends it
 * as `id_` next to a hashed `id`; a category picked in the theme editor may carry
 * only its page URL, which ends in `/c{id}`.
 */
export function categoryNumericId(node: Partial<CategoryNode> | null | undefined): number | null {
  if (!node) return null;
  const candidates = [node.id_, node.id];
  for (const candidate of candidates) {
    const number = typeof candidate === 'string' && /^\d+$/.test(candidate) ? Number(candidate) : candidate;
    if (typeof number === 'number' && Number.isInteger(number) && number > 0) return number;
  }
  const match = String(node.url ?? '').match(/\/c(\d+)(?:[/?#]|$)/);
  return match ? Number(match[1]) : null;
}

/** Whether two category records are the same category, however each one names it. */
export function sameCategory(a: Partial<CategoryNode>, b: Partial<CategoryNode>): boolean {
  const first = categoryNumericId(a);
  const second = categoryNumericId(b);
  if (first !== null && second !== null) return first === second;
  return a.id !== undefined && String(a.id) === String(b.id);
}

/** A category worth offering: it holds products, or does not say how many it holds. */
export function hasProducts(node: CategoryNode): boolean {
  return node.products_count !== 0 || childrenOf(node).some(hasProducts);
}

/**
 * Whether an entry of the store's category list is a real category. Salla's list
 * also carries the store's menu links (offers, brands, blog): those have a word for
 * an id and no category page, so they are told apart by having no numeric id.
 */
export function isCategory(node: Partial<CategoryNode> | null | undefined): boolean {
  return !!node && !!node.name && !!node.url && categoryNumericId(node) !== null;
}

/**
 * The categories a question offers: the store's real categories that hold products
 * (or do not say how many), minus the ones the merchant left out in the finder block.
 */
export function offered(
  nodes: readonly CategoryNode[] | null | undefined,
  excluded: readonly Partial<CategoryNode>[] = []
): CategoryNode[] {
  return (nodes ?? [])
    .filter(isCategory)
    .filter(hasProducts)
    .filter((node) => !excluded.some((left) => sameCategory(left, node)));
}

/** A price field as a positive number, else `null`. */
function amount(raw: number | string | null | undefined): number | null {
  const value = typeof raw === 'string' ? Number(raw.replace(/,/g, '')) : raw;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** The "starts from" price of a product sold with options; `null` for any other product. */
export function startingPriceOf(product: FinderProduct): number | null {
  return amount(product.starting_price);
}

/**
 * What the customer pays for a product, as a number; `null` when it has no usable price.
 * A product with options counts at its "starts from" price, the one the store shows, so
 * the budget question and the price under a suggestion agree with the product's own page.
 */
export function priceOf(product: FinderProduct): number | null {
  return startingPriceOf(product) ?? amount(product.price_as_float) ?? amount(product.price);
}

/** A product a visitor can buy now. */
export function inStock(product: FinderProduct): boolean {
  if (product.is_out_of_stock === true || product.is_available === false) return false;
  return product.status === undefined || product.status === 'sale';
}

export type BudgetId = 'low' | 'mid' | 'high';

/** A budget range: `min` is exclusive, `max` inclusive; `null` leaves that side open. */
export interface BudgetBand {
  id: BudgetId;
  min: number | null;
  max: number | null;
}

/** Round numbers a price range can be cut at, smallest first. */
const STEPS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

/** Fewer priced products than this and a budget question would only split hairs. */
const MIN_PRODUCTS_FOR_BUDGET = 4;

/** The largest round step that still leaves the price range a few steps wide. */
function tidyStep(low: number, high: number): number {
  const range = high - low;
  let step = STEPS[0];
  for (const candidate of STEPS) {
    if (range / candidate >= 3) step = candidate;
  }
  return step;
}

/** The price a given share of the sorted prices falls under. */
function quantile(sorted: readonly number[], share: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))];
}

const within = (price: number, band: BudgetBand) =>
  (band.min === null || price > band.min) && (band.max === null || price <= band.max);

/**
 * Budget ranges for a set of prices: three ranges cut at round numbers near the
 * one-third and two-thirds marks, so each holds a fair share of the products. When
 * the prices are too close for three, two ranges cut near the middle. An empty list
 * when there are too few products, or one price, to make a question of it.
 */
export function budgetBands(prices: readonly number[]): BudgetBand[] {
  const sorted = prices.filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
  if (sorted.length < MIN_PRODUCTS_FOR_BUDGET) return [];
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  if (lowest === highest) return [];

  const step = tidyStep(lowest, highest);
  const tidy = (price: number) => Math.round(price / step) * step;
  const filled = (bands: BudgetBand[]) => bands.every((band) => sorted.some((price) => within(price, band)));

  const first = tidy(quantile(sorted, 1 / 3));
  const second = tidy(quantile(sorted, 2 / 3));
  const three: BudgetBand[] = [
    { id: 'low', min: null, max: first },
    { id: 'mid', min: first, max: second },
    { id: 'high', min: second, max: null },
  ];
  if (first > 0 && first < second && filled(three)) return three;

  for (const cut of [tidy(quantile(sorted, 1 / 2)), first, second]) {
    const two: BudgetBand[] = [
      { id: 'low', min: null, max: cut },
      { id: 'high', min: cut, max: null },
    ];
    if (cut > 0 && filled(two)) return two;
  }
  return [];
}

/**
 * The products to suggest: in stock, inside the chosen budget (any budget when
 * `band` is null), in the order they were given.
 */
export function suggestions<T extends FinderProduct>(products: readonly T[], band: BudgetBand | null): T[] {
  return products.filter(inStock).filter((product) => {
    if (!band) return true;
    const price = priceOf(product);
    return price !== null && within(price, band);
  });
}

/** How many products one answer shows. */
export const SUGGESTIONS_SHOWN = 3;

/**
 * The products shown on a given round of "show others": the next few each time,
 * starting again from the top once the list runs out.
 */
export function suggestionRound<T>(items: readonly T[], round: number, size = SUGGESTIONS_SHOWN): T[] {
  if (items.length <= size) return [...items];
  const start = (round * size) % items.length;
  return Array.from({ length: size }, (_, index) => items[(start + index) % items.length]);
}
