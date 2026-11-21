import { describe, it, expect } from 'vitest';
import {
  budgetBands,
  categoryNumericId,
  childrenOf,
  hasProducts,
  inStock,
  isCategory,
  offered,
  priceOf,
  sameCategory,
  suggestionRound,
  suggestions,
} from '../../app/lib/giftFinder';
import type { CategoryNode } from '../../app/lib/giftFinder';

const node = (extra: Partial<CategoryNode>): CategoryNode => ({
  id: 'x',
  name: 'Category',
  url: 'https://shop.test/ar/category/c1',
  ...extra,
});

describe('categories', () => {
  it('reads children under either name the API uses', () => {
    const child = node({ id: 'c' });
    expect(childrenOf(node({ sub_categories: [child] }))).toEqual([child]);
    expect(childrenOf(node({ items: [child] }))).toEqual([child]);
    expect(childrenOf(node({ items: null }))).toEqual([]);
    expect(childrenOf(null)).toEqual([]);
  });

  it('finds the numeric id the products API takes', () => {
    // The list sends a hashed id next to the raw one.
    expect(categoryNumericId({ id: 'xzjvNQ', id_: 868669273 })).toBe(868669273);
    expect(categoryNumericId({ id: 77 })).toBe(77);
    expect(categoryNumericId({ id: '77' })).toBe(77);
    // A category picked in the editor may only carry its page URL.
    expect(categoryNumericId({ id: 'xzjvNQ', url: 'https://shop.test/ar/newborn/c1234?sort=x' })).toBe(1234);
    expect(categoryNumericId({ id: 'xzjvNQ', url: 'https://shop.test/ar/cards' })).toBeNull();
    expect(categoryNumericId(null)).toBeNull();
  });

  it('matches the same category however each record names it', () => {
    expect(sameCategory({ id: 90 }, { id: 'hash', id_: 90 })).toBe(true);
    expect(sameCategory({ url: 'https://shop.test/en/cards/c90' }, { id: 'hash', id_: 90 })).toBe(true);
    expect(sameCategory({ id: 'hash' }, { id: 'hash' })).toBe(true);
    expect(sameCategory({ id: 90 }, { id: 91 })).toBe(false);
    expect(sameCategory({}, {})).toBe(false);
  });

  it('offers a category that holds products, itself or through a child', () => {
    expect(hasProducts(node({ products_count: 3 }))).toBe(true);
    expect(hasProducts(node({ products_count: 0 }))).toBe(false);
    // The API does not always send a count: offer it.
    expect(hasProducts(node({}))).toBe(true);
    expect(hasProducts(node({ products_count: 0, sub_categories: [node({ products_count: 2 })] }))).toBe(true);
  });

  it("tells a real category from the menu links Salla's category list also carries", () => {
    expect(isCategory({ id: 'mgjZqj', id_: 708738657, name: 'Electronics', url: 'https://shop.test/ar/x/c708738657' })).toBe(true);
    expect(isCategory({ id: 'offers', name: 'blocks.header.offers', url: 'https://shop.test/ar/offers' })).toBe(false);
    expect(isCategory({ id: 'blog', name: 'Blog', url: 'https://shop.test/ar/blog' })).toBe(false);
    expect(offered([node({ id: 'brands', url: 'https://shop.test/ar/brands' }), node({ id: 'a', id_: 5 })])).toHaveLength(1);
  });

  it('leaves out empty categories and the ones the merchant excluded', () => {
    const tree = [
      node({ id: 'a', id_: 1, name: 'Newborn' }),
      node({ id: 'b', id_: 2, name: 'Cards', products_count: 0 }),
      node({ id: 'c', id_: 3, name: 'Men' }),
    ];
    expect(offered(tree, [{ id: 3 }]).map((item) => item.name)).toEqual(['Newborn']);
    expect(offered(undefined)).toEqual([]);
  });
});

describe('products', () => {
  it('reads what the customer pays as a number', () => {
    expect(priceOf({ id: 1, price: 120 })).toBe(120);
    expect(priceOf({ id: 1, price: '1,250.50' })).toBe(1250.5);
    expect(priceOf({ id: 1, price: '99', price_as_float: 89.5 })).toBe(89.5);
    expect(priceOf({ id: 1, price: 0 })).toBeNull();
    expect(priceOf({ id: 1, price: 'ask us' })).toBeNull();
    expect(priceOf({ id: 1 })).toBeNull();
    // Sold with options: the "starts from" price, as the store shows it.
    expect(priceOf({ id: 1, price: 228.85, starting_price: 115 })).toBe(115);
    expect(priceOf({ id: 1, price: 228.85, starting_price: null })).toBe(228.85);
  });

  it('counts only what can be bought now as in stock', () => {
    expect(inStock({ id: 1, status: 'sale' })).toBe(true);
    expect(inStock({ id: 1 })).toBe(true);
    expect(inStock({ id: 1, status: 'out' })).toBe(false);
    expect(inStock({ id: 1, status: 'out-and-notify' })).toBe(false);
    expect(inStock({ id: 1, status: 'sale', is_out_of_stock: true })).toBe(false);
    expect(inStock({ id: 1, status: 'sale', is_available: false })).toBe(false);
  });
});

describe('budgetBands', () => {
  const describeBands = (prices: number[]) => budgetBands(prices).map((band) => [band.id, band.min, band.max]);

  it('cuts three ranges at round numbers near the thirds', () => {
    expect(describeBands([50, 60, 100, 120, 300, 320])).toEqual([
      ['low', null, 100],
      ['mid', 100, 300],
      ['high', 300, null],
    ]);
    expect(describeBands([35, 45, 49, 75, 89, 95, 140, 150, 180])).toEqual([
      ['low', null, 75],
      ['mid', 75, 150],
      ['high', 150, null],
    ]);
  });

  it('gives every range at least one product', () => {
    for (const prices of [
      [10, 12, 15, 18, 22, 30, 45, 200],
      [99, 99, 99, 149, 149, 499],
      [20, 25, 30, 1000],
      [5, 5, 5, 5, 6],
    ]) {
      for (const band of budgetBands(prices)) {
        const inside = prices.filter(
          (price) => (band.min === null || price > band.min) && (band.max === null || price <= band.max)
        );
        expect(inside.length, `${JSON.stringify(prices)} ${band.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to two ranges when the prices are too close for three', () => {
    expect(describeBands([20, 20, 20, 60, 60, 60])).toEqual([
      ['low', null, 20],
      ['high', 20, null],
    ]);
  });

  it('asks nothing when there are too few products or one price', () => {
    expect(budgetBands([50, 100, 150])).toEqual([]);
    expect(budgetBands([75, 75, 75, 75, 75])).toEqual([]);
    expect(budgetBands([])).toEqual([]);
  });
});

describe('suggestions', () => {
  const products = [
    { id: 1, price: 50, status: 'sale' },
    { id: 2, price: 120, status: 'out' },
    { id: 3, price: 150, status: 'sale' },
    { id: 4, price: 300, status: 'sale' },
    { id: 5, price: 320, status: 'sale' },
  ];

  it('keeps the in-stock products inside the budget, in the order given', () => {
    const mid = { id: 'mid' as const, min: 100, max: 300 };
    expect(suggestions(products, mid).map((item) => item.id)).toEqual([3, 4]);
    expect(suggestions(products, { id: 'high', min: 300, max: null }).map((item) => item.id)).toEqual([5]);
    expect(suggestions(products, null).map((item) => item.id)).toEqual([1, 3, 4, 5]);
  });

  it('shows the next few on each round, starting again when the list runs out', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(suggestionRound(items, 0)).toEqual(['a', 'b', 'c']);
    expect(suggestionRound(items, 1)).toEqual(['d', 'e', 'a']);
    expect(suggestionRound(['a', 'b'], 4)).toEqual(['a', 'b']);
  });
});
