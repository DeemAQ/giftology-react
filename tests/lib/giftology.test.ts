import { describe, it, expect } from 'vitest';
import {
  categoryIdFromUrl,
  categoryTiles,
  homeAnchor,
  resolveCategoryUrl,
  settingChoice,
  settingOn,
  settingText,
  whatsappLink,
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
  it('reads the category id from a /c{id} URL', () => {
    expect(categoryIdFromUrl('https://shop.test/ar/newborn/c1234')).toBe(1234);
    expect(categoryIdFromUrl('https://shop.test/ar/newborn/c1234?sort=x')).toBe(1234);
    expect(categoryIdFromUrl('https://shop.test/ar/cards')).toBeNull();
    expect(categoryIdFromUrl(undefined)).toBeNull();
  });

  it('builds a WhatsApp link, with the placeholder number when unset', () => {
    expect(whatsappLink('966551234567', 'hi there')).toBe(
      'https://wa.me/966551234567?text=hi%20there'
    );
    expect(whatsappLink('', 'x')).toBe('https://wa.me/966500000000?text=x');
  });

  it('anchors a section on the home page', () => {
    expect(homeAnchor('https://shop.test/ar/', 'gly-cats')).toBe('https://shop.test/ar/#gly-cats');
    expect(homeAnchor('https://shop.test/ar', 'gly-cats')).toBe('https://shop.test/ar/#gly-cats');
  });
});

describe('categoryTiles', () => {
  const home = 'https://shop.test/ar';

  it('shows the six curated tiles by default, 7 and 8 off', () => {
    const tiles = categoryTiles({}, t, home, 'ar', ICONS);
    expect(tiles).toHaveLength(6);
    expect(tiles[0]).toEqual({
      name: 't:blocks.gly.cats.newborn',
      url: home,
      image: '',
      icon: 'baby',
    });
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
