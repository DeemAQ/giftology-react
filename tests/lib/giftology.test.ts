import { describe, it, expect } from 'vitest';
import {
  allProductsUrl,
  categoryTiles,
  fillStoreDetails,
  homeAnchor,
  resolveCategoryUrl,
  settingChoice,
  settingOn,
  settingText,
  storePage,
  WA_PLACEHOLDER,
  whatsappLink,
  whatsappNumber,
} from '../../app/lib/giftology';

const t = (key: string) => `t:${key}`;
const ICONS = { baby: 'baby.svg', gift: 'gift.svg', cake: 'cake.svg' };

describe('setting readers', () => {
  it('treats an unsaved switch as its default and a saved one as itself', () => {
    expect(settingOn(undefined, 'x')).toBe(true);
    expect(settingOn({}, 'x', false)).toBe(false);
    expect(settingOn({ x: false }, 'x')).toBe(false);
  });

  it('trims text and ignores non-strings', () => {
    expect(settingText({ x: '  hi ' }, 'x')).toBe('hi');
    expect(settingText({ x: null }, 'x')).toBe('');
  });

  it('reads a dropdown sent as a string or as [{ value }]', () => {
    expect(settingChoice({ x: 'cake' }, 'x')).toBe('cake');
    expect(settingChoice({ x: [{ value: 'baby', label: 'Baby' }] }, 'x')).toBe('baby');
    expect(settingChoice({}, 'x')).toBe('');
  });
});

describe('resolveCategoryUrl', () => {
  const home = 'https://shop.test/ar';

  it('swaps the language segment for the visitor language', () => {
    expect(resolveCategoryUrl('https://shop.test/ar/newborn/c12', home, 'en')).toBe(
      'https://shop.test/en/newborn/c12'
    );
  });

  it('leaves a URL without a two-letter language segment alone', () => {
    expect(resolveCategoryUrl('https://shop.test/newborn/c12', home, 'en')).toBe(
      'https://shop.test/newborn/c12'
    );
  });

  it('accepts a category object or a list of them', () => {
    expect(resolveCategoryUrl({ url: 'https://shop.test/ar/a/c1' }, home, 'ar')).toBe(
      'https://shop.test/ar/a/c1'
    );
    expect(resolveCategoryUrl([{ url: 'https://shop.test/ar/b/c2' }], home, 'ar')).toBe(
      'https://shop.test/ar/b/c2'
    );
  });

  it('falls back when the value is empty or not a link', () => {
    expect(resolveCategoryUrl('', home)).toBe(home);
    expect(resolveCategoryUrl('newborn', home)).toBe(home);
    expect(resolveCategoryUrl(undefined, home)).toBe(home);
  });
});

describe('link helpers', () => {
  it('builds a WhatsApp link, and none without a number', () => {
    expect(whatsappLink('966551234567', 'hi there')).toBe(
      'https://wa.me/966551234567?text=hi%20there'
    );
    expect(whatsappLink('', 'x')).toBe('');
  });

  it('takes the first real number: the setting, then the store contacts', () => {
    expect(whatsappNumber('966551234567', '966500000001')).toBe('966551234567');
    // A link or a formatted number is reduced to its digits.
    expect(whatsappNumber('', 'https://wa.me/966551112222')).toBe('966551112222');
    expect(whatsappNumber(undefined, null, '+966 55 111 2222')).toBe('966551112222');
  });

  it("treats the setting's default number as unset, so it never reaches a stranger", () => {
    expect(whatsappNumber(WA_PLACEHOLDER)).toBe('');
    expect(whatsappNumber(WA_PLACEHOLDER, '966551112222')).toBe('966551112222');
    expect(whatsappNumber('', undefined, 'n/a')).toBe('');
  });

  it('builds a store page URL under the home URL', () => {
    expect(storePage('https://shop.test/ar/', 'latest-products')).toBe(
      'https://shop.test/ar/latest-products'
    );
    expect(allProductsUrl('https://shop.test/ar')).toBe('https://shop.test/ar/products');
  });

  it('anchors a section on the home page', () => {
    expect(homeAnchor('https://shop.test/ar/', 'gly-cats')).toBe('https://shop.test/ar/#gly-cats');
    expect(homeAnchor('https://shop.test/ar', 'gly-cats')).toBe('https://shop.test/ar/#gly-cats');
  });
});

describe('fillStoreDetails', () => {
  const details = {
    storeName: 'Giftology',
    commercialNumber: '1010123456',
    email: 'hello@giftology.test',
    whatsapp: '966551112222',
  };

  it('fills each placeholder, linking the email and the WhatsApp number', () => {
    expect(fillStoreDetails('<p>{store_name} ({commercial_number})</p>', details)).toBe(
      '<p>Giftology (<span dir="ltr">1010123456</span>)</p>'
    );
    expect(fillStoreDetails('{email}', details)).toBe(
      '<a href="mailto:hello@giftology.test" dir="ltr">hello@giftology.test</a>'
    );
    expect(fillStoreDetails('{whatsapp}', details)).toBe(
      '<a href="https://wa.me/966551112222" dir="ltr" target="_blank" rel="noopener">+966551112222</a>'
    );
  });

  it('accepts spaces inside the braces and fills every occurrence', () => {
    expect(fillStoreDetails('{ store_name } and {store_name}', details)).toBe(
      'Giftology and Giftology'
    );
  });

  it('empties a placeholder the store has no value for, and leaves other braces alone', () => {
    expect(fillStoreDetails('CR: {commercial_number}.', { storeName: 'Giftology' })).toBe('CR: .');
    expect(fillStoreDetails('{constructor} {Store_Name} {not_a_detail} {}', details)).toBe(
      '{constructor} {Store_Name} {not_a_detail} {}'
    );
  });

  it("escapes a store name so it can't inject markup", () => {
    expect(fillStoreDetails('{store_name}', { storeName: 'Gifts <b>&</b> "Co"' })).toBe(
      'Gifts &lt;b&gt;&amp;&lt;/b&gt; &quot;Co&quot;'
    );
  });
});

describe('categoryTiles', () => {
  const home = 'https://shop.test/ar';

  it('shows the six curated tiles by default, 7 and 8 off', () => {
    const tiles = categoryTiles({}, t, home, 'ar', ICONS);
    expect(tiles).toHaveLength(6);
    // No link set yet: the tile opens all products, not the page it is already on.
    expect(tiles[0]).toEqual({
      name: 't:blocks.gly.cats.newborn',
      url: 'https://shop.test/ar/products',
      image: '',
      icon: 'baby',
    });
  });

  it('keeps an unlinked tile in the visitor language', () => {
    const [tile] = categoryTiles({}, t, home, 'en', ICONS);
    expect(tile.url).toBe('https://shop.test/en/products');
  });

  it('applies the merchant name, icon, image and link, and hides a disabled tile', () => {
    const tiles = categoryTiles(
      {
        gly_tile1_enabled: false,
        gly_tile2_name: 'Eid',
        gly_tile2_icon: [{ value: 'cake' }],
        gly_tile2_image: 'https://cdn.test/eid.png',
        gly_tile2_link: 'https://shop.test/ar/eid/c9',
        gly_tile7_enabled: true,
        gly_tile7_name: 'Flowers',
      },
      t,
      home,
      'en',
      ICONS
    );
    expect(tiles).toHaveLength(6);
    expect(tiles[0]).toEqual({
      name: 'Eid',
      url: 'https://shop.test/en/eid/c9',
      image: 'https://cdn.test/eid.png',
      icon: 'cake',
    });
    expect(tiles.at(-1)).toMatchObject({ name: 'Flowers', icon: 'gift' });
  });

  it('skips an enabled extra tile that has nothing to show', () => {
    expect(categoryTiles({ gly_tile7_enabled: true }, t, home, 'ar', ICONS)).toHaveLength(6);
  });
});
