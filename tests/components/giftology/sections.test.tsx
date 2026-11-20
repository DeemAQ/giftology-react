import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import en from '../../../locales/en.json';
import { GiftFinder } from '../../../app/components/giftology/GiftFinder';
import { GiftologyHome } from '../../../app/components/giftology/GiftologyHome';
import { glyHomeBlockConfig, glyHomeBlocks } from '../../../app/components/giftology/blocks';
import { SECTION_BLOCKS, shownSections } from '../../../app/components/giftology/homeSections';
import { GlyFooter } from '../../../app/components/giftology/GlyFooter';
import { WhatsAppFloat } from '../../../app/components/giftology/WhatsAppFloat';
import { PromoBar } from '../../../app/components/giftology/PromoBar';
import { SubcategoryPills } from '../../../app/components/giftology/SubcategoryPills';

const state = {
  store: {} as Record<string, unknown>,
  settings: {} as Record<string, unknown>,
  locale: 'en',
  products: [] as { id: number; name: string; price?: number; status?: string }[],
  categories: [] as Record<string, unknown>[],
  listCalls: [] as Record<string, unknown>[],
  footerMenu: [] as { id?: number | string; title: string; url: string; target?: string }[],
};

vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ store: state.store, theme: { settings: state.settings } }),
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({
    locale: state.locale,
    t: (key: string, fallback?: string) => (en as Record<string, string>)[key] ?? fallback ?? key,
  }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks', () => ({ HookSlot: () => null }));
// The engine's home page: the merchant's blocks, with its own slots around them.
vi.mock('@salla.sa/twilight-theme-engine/routes/home', () => ({
  Home: {
    Component: ({ components = [] }: { components?: { path: string }[] }) => (
      <div id="merchant-blocks">{components.map((block) => block.path).join(',')}</div>
    ),
  },
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...props }: { to?: string; children?: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: {
    queries: {
      list: (params: Record<string, unknown>) => ({
        queryKey: ['products', params],
        queryFn: async () => {
          state.listCalls.push(params);
          return { items: state.products, next: null };
        },
      }),
    },
  },
}));
vi.mock('@salla.sa/twilight-theme-engine/api/menu', () => ({
  menu: { footer: async () => state.footerMenu },
}));
vi.mock('@salla.sa/twilight-theme-engine/api/home', () => ({
  home: { queries: { components: () => ({ queryKey: ['home', 'components'], queryFn: async () => [] }) } },
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (amount: number) => `${amount} SAR` }),
}));
vi.mock('@salla.sa/twilight-theme-engine/api/category', () => ({
  category: {
    queries: {
      list: () => ({ queryKey: ['categories', 'list'], queryFn: async () => state.categories }),
      detail: (id: string) => ({
        queryKey: ['category', id],
        queryFn: async () => ({
          id,
          name: 'Newborn',
          url: '/newborn',
          sub_categories: [{ id: 2, name: 'Baby Girl', url: '/baby-girl/c2' }],
        }),
      }),
    },
  },
}));
vi.mock('@salla.sa/twilight-components-react', () => ({ ProductCardSkeleton: () => null }));
vi.mock('@salla.sa/twilight-components-react/reviews', () => ({
  SallaReviews: () => <div data-testid="store-reviews" />,
}));
vi.mock('../../../app/components/product', () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <article data-testid="product-card">{product.name}</article>
  ),
}));

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  state.store = { name: 'Giftology', url: 'https://shop.test/en' };
  state.locale = 'en';
  state.footerMenu = [];
  state.settings = {};
  state.products = [];
  state.categories = [];
  state.listCalls = [];
});

/** A small store: one category with two kinds, one without, one that is empty. */
const NEWBORN = {
  id: 'xa1',
  id_: 77,
  name: 'Newborn',
  url: 'https://shop.test/en/newborn/c77',
  image: 'https://cdn.test/newborn.png',
  products_count: 9,
  sub_categories: [
    { id: 'xb1', id_: 78, name: 'Baby girl', url: 'https://shop.test/en/baby-girl/c78', products_count: 4 },
    { id: 'xb2', id_: 79, name: 'Baby boy', url: 'https://shop.test/en/baby-boy/c79', products_count: 5 },
  ],
};
const CARDS = { id: 'xa2', id_: 90, name: 'Cards', url: 'https://shop.test/en/cards/c90', products_count: 3 };
const EMPTY = { id: 'xa3', id_: 91, name: 'Coming soon', url: 'https://shop.test/en/soon/c91', products_count: 0 };
const priced = (...prices: number[]) =>
  prices.map((price, index) => ({ id: index + 1, name: `Gift ${price}`, price, status: 'sale' }));

describe('PromoBar', () => {
  it('shows the three curated phrases when the merchant set none', () => {
    render(<PromoBar />);
    // A landmark of its own: it sits outside the header, main and footer.
    const bar = screen.getByRole('complementary', { name: en['blocks.gly.promo.label'] });
    expect(bar.textContent).toContain(en['blocks.gly.promo.shipping']);
  });

  it('shows only the filled phrases, the last one emphasised', () => {
    state.settings = { gly_promo_1: 'Free wrap', gly_promo_3: 'Ships today' };
    const { container } = render(<PromoBar />);
    expect(screen.getByRole('complementary')?.textContent).toContain('Free wrap');
    expect(screen.getByRole('complementary').textContent).not.toContain(en['blocks.gly.promo.fast']);
    expect(container.querySelector('b')?.textContent).toContain('Ships today');
  });

  it('marks the last phrase as the one a phone keeps', () => {
    state.settings = { gly_promo_1: 'Free wrap', gly_promo_3: 'Ships today' };
    const { container } = render(<PromoBar />);
    const phrases = [...container.querySelectorAll('.gly-topbar__phrase')];
    expect(phrases).toHaveLength(2);
    expect(container.querySelector('.gly-topbar__phrase--main')?.textContent).toContain('Ships today');
    expect(phrases[0].classList.contains('gly-topbar__phrase--main')).toBe(false);
  });

  it('keeps a single phrase visible on a phone', () => {
    state.settings = { gly_promo_2: 'Only one' };
    const { container } = render(<PromoBar />);
    expect(container.querySelector('.gly-topbar__phrase--main')?.textContent).toBe('Only one');
  });

  it('is off when gly_show_promo is off', () => {
    state.settings = { gly_show_promo: false };
    const { container } = render(<PromoBar />);
    expect(container.innerHTML).toBe('');
  });
});

describe('GlyFooter', () => {
  it('prefers the merchant email and about text, and lists the enabled payments', () => {
    state.store = {
      ...state.store,
      description: '<p>Store <b>description</b></p>',
      contacts: { email: 'store@shop.test' },
      social: { instagram: 'https://instagram.com/giftology' },
    };
    state.settings = { gly_email: 'hello@giftology.test', gly_pay_visa: false };
    renderWithQuery(<GlyFooter />);
    expect(screen.getByText('hello@giftology.test').closest('a')?.getAttribute('href')).toBe('mailto:hello@giftology.test');
    expect(screen.getByText('Store description')).toBeTruthy();
    expect(screen.getByText('Mastercard')).toBeTruthy();
    expect(screen.queryByText('VISA')).toBeNull();
    // Tamara is off until the merchant turns it on.
    expect(screen.queryByText('Tamara')).toBeNull();
    expect(screen.getByText(en['blocks.gly.footer.instagram']).closest('a')?.getAttribute('href')).toBe('https://instagram.com/giftology');
  });

  it('uses the Instagram link typed in the editor before the one saved in the store', () => {
    state.store = { ...state.store, social: { instagram: 'https://instagram.com/store' } };
    state.settings = { gly_instagram: 'https://instagram.com/typed' };
    renderWithQuery(<GlyFooter />);
    expect(screen.getByText(en['blocks.gly.footer.instagram']).closest('a')?.getAttribute('href')).toBe('https://instagram.com/typed');
  });

  it("names the payment methods in the page's language", () => {
    state.settings = { gly_pay_tamara: true };
    const english = renderWithQuery(<GlyFooter />);
    const names = (root: HTMLElement) => [...root.querySelectorAll('.gly-pays span')].map((s) => s.textContent);
    expect(names(english.container)).toEqual(['mada', 'Apple Pay', 'VISA', 'Mastercard', 'tabby', 'Tamara', 'STC Pay']);
    english.unmount();

    state.locale = 'ar';
    const arabic = renderWithQuery(<GlyFooter />);
    expect(names(arabic.container)).toEqual(['مدى', 'Apple Pay', 'VISA', 'Mastercard', 'tabby', 'تمارا', 'STC Pay']);
  });

  it("lists the store's footer menu as important links, translating key-named entries", async () => {
    state.footerMenu = [
      { id: 1, title: 'Return policy', url: 'https://shop.test/en/returns/page-1' },
      // Salla's built-in entries have no id.
      { title: 'blocks.gly.nav.latest', url: 'https://shop.test/en/blog', target: '_blank' },
      { title: 'Brands', url: 'https://shop.test/en/brands' },
    ];
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithQuery(<GlyFooter />);
    const policy = await screen.findByText('Return policy');
    expect(policy.getAttribute('href')).toBe('https://shop.test/en/returns/page-1');
    expect(policy.closest('nav')?.querySelector('h2')?.textContent).toBe(en['blocks.footer.important_links']);
    const keyed = screen.getByText(en['blocks.gly.nav.latest'], { selector: '.gly-flinks a' });
    expect(keyed.getAttribute('target')).toBe('_blank');
    expect(errors.mock.calls.filter(([message]) => String(message).includes('unique "key"'))).toEqual([]);
    errors.mockRestore();
  });

  it('shows no links column while the footer menu is empty', async () => {
    const { container } = renderWithQuery(<GlyFooter />);
    await waitFor(() => expect(container.querySelector('.gly-fcontact')).toBeTruthy());
    expect(container.querySelector('.gly-flinks')).toBeNull();
    expect(container.querySelector('.gly-fgrid--links')).toBeNull();
  });

  it("shows the store's registration numbers when it has them", () => {
    state.store = {
      ...state.store,
      settings: { commercial_number: '1010123456', tax: { number: '300000000000003' } },
    };
    const { container } = renderWithQuery(<GlyFooter />);
    const ids = container.querySelector('.gly-flegal__ids');
    expect(ids?.textContent).toContain(`${en['blocks.gly.footer.commercial_number']}: 1010123456`);
    expect(ids?.textContent).toContain(`${en['blocks.gly.footer.tax_number']}: 300000000000003`);
  });

  it('shows no registration line for a store without the numbers', () => {
    const { container } = renderWithQuery(<GlyFooter />);
    expect(container.querySelector('.gly-flegal__ids')).toBeNull();
  });
});

describe('WhatsApp buttons', () => {
  it("uses the store's own number when the setting still holds its default", () => {
    state.store = { ...state.store, contacts: { mobile: '+966 55 111 2222' } };
    state.settings = { gly_whatsapp: '966500000000' };
    render(<WhatsAppFloat />);
    expect(screen.getByRole('link').getAttribute('href')).toContain('https://wa.me/966551112222?text=');
  });

  it('is a landmark of its own, outside the header, main and footer', () => {
    state.settings = { gly_whatsapp: '966551112222' };
    render(<WhatsAppFloat />);
    const landmark = screen.getByRole('complementary', { name: en['blocks.gly.footer.contact'] });
    expect(landmark.querySelector('a.gly-wa')).not.toBeNull();
  });

  it('hides them when there is no number to chat with', () => {
    state.settings = { gly_whatsapp: '966500000000' };
    const float = render(<WhatsAppFloat />);
    expect(float.container.querySelector('a')).toBeNull();
    float.unmount();

    renderWithQuery(<GlyFooter />);
    expect(screen.queryByText(en['blocks.gly.footer.whatsapp'])).toBeNull();
  });
});

describe('GiftFinder', () => {
  const pick = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }));
  const options = (container: HTMLElement) =>
    [...container.querySelectorAll('.gly-qopt')].map((option) => option.textContent);

  it("asks about the store's own categories, leaving out the ones with no products", async () => {
    state.categories = [NEWBORN, CARDS, EMPTY];
    const { container } = renderWithQuery(<GiftFinder />);
    await screen.findByRole('button', { name: 'Newborn' });
    expect(container.querySelector('.gly-qq')?.textContent).toBe(en['blocks.gly.finder.q_category']);
    // No WhatsApp number, so no custom-gift answer either.
    expect(options(container)).toEqual(['Newborn', 'Cards']);
  });

  it('asks which kind, then the budget, then suggests the in-stock products that fit', async () => {
    state.categories = [NEWBORN, CARDS];
    state.products = [...priced(50, 60, 100, 120, 300, 320), { id: 9, name: 'Sold out', price: 110, status: 'out' }];
    const { container } = renderWithQuery(<GiftFinder />);
    pick((await screen.findByRole('button', { name: 'Newborn' })).textContent as string);

    expect(container.querySelector('.gly-qq')?.textContent).toBe('Which kind of Newborn?');
    expect(options(container)).toEqual(['Baby girl', 'Baby boy', 'All Newborn']);
    pick('Baby boy');

    // Ranges cut at round numbers near the thirds of the real prices.
    await screen.findByText(en['blocks.gly.finder.q_budget']);
    expect(state.listCalls[0]).toMatchObject({ source: 'categories', sourceValue: [79], sort: 'bestSell' });
    expect(options(container)).toEqual(['Up to 100 SAR', '100 SAR to 300 SAR', 'Over 300 SAR', en['blocks.gly.finder.budget_any']]);
    pick('100 SAR to 300 SAR');

    expect(screen.getAllByTestId('product-card').map((card) => card.textContent)).toEqual(['Gift 120', 'Gift 300']);
    expect(screen.getByText('Our picks from Baby boy')).toBeTruthy();
    expect(screen.getByText('See all Baby boy').getAttribute('href')).toBe('https://shop.test/en/baby-boy/c79');
    // Two fit, so there are no others to show.
    expect(screen.queryByText(en['blocks.gly.finder.others'])).toBeNull();
  });

  it('skips the questions that have nothing to ask', async () => {
    // No subcategories, and every product costs the same.
    state.categories = [CARDS];
    state.products = priced(25, 25, 25, 25);
    renderWithQuery(<GiftFinder />);
    pick((await screen.findByRole('button', { name: 'Cards' })).textContent as string);
    await waitFor(() => expect(screen.getAllByTestId('product-card')).toHaveLength(3));
    expect(state.listCalls[0]).toMatchObject({ sourceValue: [90] });
    expect(screen.queryByText(en['blocks.gly.finder.q_budget'])).toBeNull();
  });

  it('shows three at a time and moves on with "show others"', async () => {
    state.categories = [CARDS];
    state.products = priced(25, 25, 25, 25, 25).map((item) => ({ ...item, name: `Gift ${item.id}` }));
    renderWithQuery(<GiftFinder />);
    pick((await screen.findByRole('button', { name: 'Cards' })).textContent as string);
    const shown = () => screen.getAllByTestId('product-card').map((card) => card.textContent);
    await waitFor(() => expect(shown()).toEqual(['Gift 1', 'Gift 2', 'Gift 3']));
    pick(en['blocks.gly.finder.others']);
    // The next ones, starting again from the best seller once the list runs out.
    expect(shown()).toEqual(['Gift 4', 'Gift 5', 'Gift 1']);
  });

  it('links to the category when nothing in it is in stock', async () => {
    state.categories = [CARDS];
    state.products = [{ id: 1, name: 'Gone', price: 20, status: 'out' }];
    renderWithQuery(<GiftFinder />);
    pick((await screen.findByRole('button', { name: 'Cards' })).textContent as string);
    await screen.findByText(en['blocks.gly.finder.empty']);
    expect(screen.queryByTestId('product-card')).toBeNull();
    expect(screen.getByText('See all Cards').getAttribute('href')).toBe('https://shop.test/en/cards/c90');
  });

  it('offers a custom gift while there is a number to chat with, and ends on the chat link', async () => {
    state.categories = [CARDS];
    state.settings = { gly_whatsapp: '966551234567' };
    renderWithQuery(<GiftFinder />);
    pick((await screen.findByRole('button', { name: en['blocks.gly.finder.opt_custom'] })).textContent as string);
    expect(screen.getByText(en['blocks.gly.custom.card_btn']).closest('a')?.getAttribute('href')).toContain('https://wa.me/966551234567?text=');
    expect(state.listCalls).toHaveLength(0);
  });

  it('goes back one question at a time, and can start over', async () => {
    state.categories = [NEWBORN];
    state.products = priced(50, 60, 100, 120, 300, 320);
    const { container } = renderWithQuery(<GiftFinder />);
    pick((await screen.findByRole('button', { name: 'Newborn' })).textContent as string);
    pick('All Newborn');
    await screen.findByText(en['blocks.gly.finder.q_budget']);
    pick(en['blocks.gly.finder.budget_any']);
    expect(screen.getAllByTestId('product-card')).toHaveLength(3);

    pick(en['blocks.gly.finder.back']);
    expect(container.querySelector('.gly-qq')?.textContent).toBe(en['blocks.gly.finder.q_budget']);
    pick(en['blocks.gly.finder.back']);
    expect(container.querySelector('.gly-qq')?.textContent).toBe('Which kind of Newborn?');
    pick(en['blocks.gly.finder.back']);
    expect(container.querySelector('.gly-qq')?.textContent).toBe(en['blocks.gly.finder.q_category']);

    pick('Newborn');
    pick('Baby girl');
    await screen.findByText(en['blocks.gly.finder.q_budget']);
    pick(en['blocks.gly.finder.budget_any']);
    fireEvent.click(screen.getByText(new RegExp(en['blocks.gly.finder.restart'])));
    expect(container.querySelector('.gly-qq')?.textContent).toBe(en['blocks.gly.finder.q_category']);
  });

  it('moves focus to each new question, so it is not left on a button that is gone', async () => {
    state.categories = [NEWBORN];
    const { container } = renderWithQuery(<GiftFinder />);
    const first = await screen.findByRole('button', { name: 'Newborn' });
    // Nothing is focused until the visitor answers.
    expect(document.activeElement).toBe(document.body);
    fireEvent.click(first);
    expect(document.activeElement).toBe(container.querySelector('.gly-qq'));
  });

  it('is left out of the page when there is nothing to ask', async () => {
    const { container } = renderWithQuery(<GiftFinder />);
    await waitFor(() => expect(container.querySelector('#gly-finder')).toBeNull());
  });
});

describe('GiftologyHome', () => {
  it('sends "view all" to the latest-products page until the merchant sets a link', () => {
    renderWithQuery(<GiftologyHome />);
    const viewAll = () => screen.getByText(en['blocks.gly.latest.view_all']).closest('a');
    expect(viewAll()?.getAttribute('href')).toBe('https://shop.test/en/latest-products');
  });

  it('renders every section by default, the hero headline as the h1', () => {
    const { container } = renderWithQuery(<GiftologyHome />);
    expect(screen.getByRole('heading', { level: 1 })?.textContent).toContain(en['blocks.gly.hero.title_em']);
    for (const id of ['gly-latest', 'gly-cats', 'gly-custom', 'gly-finder', 'gly-how', 'gly-testi']) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(container.querySelectorAll('.gly-cat')).toHaveLength(6);
  });

  it('still hides a section switched off in settings saved by the earlier theme', () => {
    state.settings = { gly_show_latest: false, gly_show_finder: false };
    const { container } = renderWithQuery(<GiftologyHome />);
    expect(container.querySelector('#gly-latest')).toBeNull();
    expect(container.querySelector('#gly-finder')).toBeNull();
    expect(container.querySelector('a[href="#gly-latest"]')).toBeNull();
    expect(container.querySelector('#gly-cats')).not.toBeNull();
  });

  const heroStats = (container: HTMLElement) =>
    [...container.querySelectorAll('.gly-hero-stats > div')].map((stat) => [
      stat.querySelector('b')?.textContent,
      stat.querySelector('span')?.textContent,
    ]);

  it('shows the four built-in hero figures until the merchant types their own', () => {
    const { container } = renderWithQuery(<GiftologyHome />);
    expect(heroStats(container)).toEqual([
      ['+12K', en['blocks.gly.hero.stat_gifts']],
      ['+40', en['blocks.gly.hero.stat_occasions']],
      ['4.9★', en['blocks.gly.hero.stat_rating']],
      ['2018', en['blocks.gly.hero.stat_since']],
    ]);
  });

  it("shows the merchant's own figures, and none when the row is switched off", () => {
    state.settings = { gly_hero_stat_gifts: '+3K', gly_hero_stat_since: ' 2021 ' };
    const filled = renderWithQuery(<GiftologyHome />);
    expect(heroStats(filled.container).map(([figure]) => figure)).toEqual(['+3K', '+40', '4.9★', '2021']);
    filled.unmount();

    state.settings = { gly_show_hero_stats: false };
    const hidden = renderWithQuery(<GiftologyHome />);
    expect(hidden.container.querySelector('.gly-hero-stats')).toBeNull();
  });

  it('draws its icons instead of using emoji, which every device renders differently', () => {
    const { container } = renderWithQuery(<GiftologyHome />);
    expect(container.querySelectorAll('.gly-fcard__ph .gly-ico, .gly-fcard__ph svg')).toHaveLength(3);
    // Pictographs outside the basic symbols; ★ and ✦ are plain text glyphs.
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}(?<![★✦✓])/u);
  });

  /** The page's top-level blocks in order, by id (the hero has none: "hero"). */
  const pageOrder = (container: HTMLElement) =>
    Array.from(container.children, (el) => el.id || (el.querySelector('h1') ? 'hero' : el.tagName));

  it("shows the merchant's blocks under the hero by default", () => {
    const { container } = renderWithQuery(
      <GiftologyHome components={[{ path: 'brands' }, { path: 'blog' }]} />
    );
    expect(container.querySelector('#merchant-blocks')?.textContent).toBe('brands,blog');
    expect(pageOrder(container).slice(0, 3)).toEqual(['hero', 'merchant-blocks', 'gly-latest']);
  });

  it('is exactly the blocks in the home tab once a Giftology block is placed there', () => {
    const { container } = renderWithQuery(
      <GiftologyHome components={[{ path: 'home.gly-hero' }, { path: 'brands' }, { path: 'gly-how' }]} />
    );
    // The engine draws the blocks (mocked here); no built-in section joins them.
    expect(pageOrder(container)).toEqual(['merchant-blocks']);
    expect(container.querySelector('#merchant-blocks')?.textContent).toBe('home.gly-hero,brands,gly-how');
  });

  it("follows the local editor's layout on the dev server, where the engine swaps the blocks itself", () => {
    const scope = globalThis as { __twilightDevPreview__?: unknown };
    try {
      // The page is handed the store's own blocks; the editor's saved layout holds a Giftology one.
      scope.__twilightDevPreview__ = { enabled: true, settings: {}, layout: [{ id: 'b-1', path: 'gly-how', fields: {} }] };
      const placed = renderWithQuery(<GiftologyHome components={[{ path: 'brands' }]} />);
      expect(pageOrder(placed.container)).toEqual(['merchant-blocks']);
      placed.unmount();

      // Preview switched off: the layout is ignored, as the engine ignores it.
      scope.__twilightDevPreview__ = { enabled: false, settings: {}, layout: [{ id: 'b-1', path: 'gly-how', fields: {} }] };
      const off = renderWithQuery(<GiftologyHome components={[{ path: 'brands' }]} />);
      expect(pageOrder(off.container)).toContain('gly-how');
    } finally {
      delete scope.__twilightDevPreview__;
    }
  });

  it('keeps their place when the section before them is switched off', () => {
    state.settings = { gly_show_hero: false };
    const { container } = renderWithQuery(<GiftologyHome components={[{ path: 'brands' }]} />);
    expect(pageOrder(container).slice(0, 2)).toEqual(['merchant-blocks', 'gly-latest']);
  });
});

describe('SubcategoryPills', () => {
  it('uses the children the page already has', () => {
    renderWithQuery(
      <SubcategoryPills id="1" known={[{ id: 3, name: 'Baby Boy', url: '/baby-boy/c3' }]} />
    );
    expect(screen.getByText('Baby Boy')?.getAttribute('href')).toBe('/baby-boy/c3');
  });

  it('fetches the category when the page has none', async () => {
    renderWithQuery(<SubcategoryPills id="1" />);
    expect((await screen.findByText('Baby Girl')).getAttribute('href')).toBe('/baby-girl/c2');
  });

  it('shows text pills while no subcategory has an image', () => {
    const { container } = renderWithQuery(
      <SubcategoryPills id="1" known={[{ id: 3, name: 'Baby Boy', url: '/baby-boy/c3', image: null }]} />
    );
    expect(container.querySelector('.gly-subcat')).not.toBeNull();
    expect(container.querySelector('.gly-subcirc')).toBeNull();
  });

  it('shows circles with their images once any subcategory has one in Salla', () => {
    const { container } = renderWithQuery(
      <SubcategoryPills
        id="1"
        known={[
          { id: 3, name: 'Baby Boy', url: '/baby-boy/c3', image: 'https://cdn.test/boy.png' },
          { id: 4, name: 'Baby Girl', url: '/baby-girl/c4' },
        ]}
      />
    );
    const circles = [...container.querySelectorAll('.gly-subcirc')];
    expect(circles.map((circle) => circle.textContent)).toEqual(['Baby Boy', 'Baby Girl']);
    expect(circles[0].querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/boy.png');
    // The one without an image gets the gift icon, so the row stays even.
    expect(circles[1].querySelector('.gly-ico')).not.toBeNull();
    expect(container.querySelector('.gly-subcat')).toBeNull();
  });
});

describe('Giftology sections as home blocks', () => {
  const block = (name: keyof typeof glyHomeBlocks, data: Record<string, unknown>) => {
    const Block = glyHomeBlocks[name];
    return renderWithQuery(<Block data={{ path: name, ...data }} />);
  };

  it('offers a block for every section, under the name the editor uses', async () => {
    const { default: manifest } = await import('../../../twilight.json');
    const offered = (manifest.components as { path: string }[])
      .map((component) => component.path)
      .filter((path) => path.startsWith('home.gly-'))
      .map((path) => path.replace('home.', ''))
      .sort();
    expect(offered).toHaveLength(7);
    expect(Object.keys(glyHomeBlocks).sort()).toEqual(offered);
    expect(Object.values(SECTION_BLOCKS).sort()).toEqual(offered);
  });

  it('wraps each block with no starter spacing or reserved height, drawn with the page', () => {
    // On scroll, an in-page link such as #gly-how would have no target yet.
    for (const name of Object.keys(glyHomeBlocks)) {
      expect(glyHomeBlockConfig[name]).toEqual({ className: 'gly-block', height: '0px', renderOnMount: true });
    }
  });

  it('counts as shown exactly the sections placed as blocks, once any is placed', () => {
    const placed = shownSections([{ path: 'gly-circles' }, { path: 'home.gly-how' }, { path: 'brands' }], {});
    expect([...placed].sort()).toEqual(['categories', 'how']);
    // A switch saved by the earlier theme does not hide a block the merchant placed.
    expect(shownSections([{ path: 'gly-circles' }], { gly_show_categories: false }).has('categories')).toBe(true);
  });

  it('counts the built-in sections as shown while no Giftology block is placed', () => {
    expect(shownSections([{ path: 'brands' }], {}).size).toBe(7);
    expect(shownSections([], { gly_show_finder: false }).has('finder')).toBe(false);
  });

  it('hero: the texts, button links and figures typed in the block', () => {
    const { container } = block('gly-hero', {
      eyebrow: ' Hello ',
      title_pre: 'Every gift',
      title_em: '',
      title_post: null,
      cta_shop: 'Shop now',
      cta_shop_url: 'https://shop.test/en/all/c9',
      show_stats: true,
      stats: [
        { 'stats.value': '+5K', 'stats.label': 'gifts sent' },
        { 'stats.value': '', 'stats.label': 'no figure, so not shown' },
      ],
    });
    expect(container.querySelector('.gly-eyebrow')?.textContent).toBe('Hello');
    // A headline the merchant wrote replaces all three parts.
    expect(screen.getByRole('heading', { level: 1 }).textContent?.trim()).toBe('Every gift');
    expect(screen.getByText('Shop now').closest('a')?.getAttribute('href')).toBe('https://shop.test/en/all/c9');
    // An empty field keeps the theme's own text.
    expect(container.querySelector('.gly-lede')?.textContent).toBe(en['blocks.gly.hero.lede']);
    expect(screen.getByText(en['blocks.gly.hero.cta_custom']).closest('a')?.getAttribute('href')).toBe('#gly-custom');
    expect([...container.querySelectorAll('.gly-hero-stats b')].map((b) => b.textContent)).toEqual(['+5K']);
  });

  it('hero: the block can hide the figures the settings would show', () => {
    const { container } = block('gly-hero', { show_stats: false });
    expect(container.querySelector('.gly-hero-stats')).toBeNull();
  });

  it("circles: the store's top-level categories, with nothing to set up", async () => {
    state.categories = [NEWBORN, CARDS, EMPTY];
    const { container } = block('gly-circles', { title_pre: 'Shop by' });
    await waitFor(() => expect(container.querySelectorAll('.gly-cat')).toHaveLength(2));
    const circles = [...container.querySelectorAll('.gly-cat')];
    expect(circles.map((circle) => circle.textContent)).toEqual(['Newborn', 'Cards']);
    expect(circles.map((circle) => circle.getAttribute('href'))).toEqual([NEWBORN.url, CARDS.url]);
    // The category's image from Salla; a brand icon for a category without one.
    expect(circles[0].querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/newborn.png');
    expect(circles[1].querySelector('.gly-cat-ico')).not.toBeNull();
    expect(container.querySelector('.gly-shead h2')?.textContent).toContain('Shop by');
  });

  it("circles: the categories the merchant picked, in their order, with the store's current details", async () => {
    state.categories = [NEWBORN, CARDS];
    const { container } = block('gly-circles', {
      // As the editor saved them: a subcategory first, under an old name.
      categories: [
        { id: 79, name: 'Boys (old name)', url: 'https://shop.test/en/baby-boy/c79' },
        { id: 77, name: 'Newborn', url: 'https://shop.test/en/newborn/c77' },
      ],
    });
    await waitFor(() => expect(container.querySelector('.gly-cat img')).not.toBeNull());
    const circles = [...container.querySelectorAll('.gly-cat')];
    expect(circles.map((circle) => circle.textContent)).toEqual(['Baby boy', 'Newborn']);
  });

  it('circles: extra hand-listed circles follow the categories', async () => {
    state.categories = [CARDS];
    const { container } = block('gly-circles', {
      circles: [
        { 'circles.icon': 'tag', 'circles.name': 'Offers', 'circles.url': 'https://shop.test/ar/offers' },
        { icon: [{ value: 'tie' }], name: { ar: 'عربي', en: 'About us' }, image: 'https://cdn.test/about.png' },
        // Only an icon: nothing to open and nothing to call it, so it is skipped.
        { 'circles.icon': 'baby' },
      ],
    });
    await waitFor(() => expect(container.querySelectorAll('.gly-cat')).toHaveLength(3));
    const circles = [...container.querySelectorAll('.gly-cat')];
    expect(circles.map((circle) => circle.textContent)).toEqual(['Cards', 'Offers', 'About us']);
    // The picked link opens in the visitor's language; no link opens all products.
    expect(circles.map((circle) => circle.getAttribute('href'))).toEqual([
      CARDS.url,
      'https://shop.test/en/offers',
      'https://shop.test/en/products',
    ]);
    expect(circles[2].querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/about.png');
  });

  it('circles: a store with no categories yet shows the six ready circles', async () => {
    const { container } = block('gly-circles', { circles: [] });
    expect(container.querySelectorAll('.gly-cat')).toHaveLength(6);
    await waitFor(() => expect(state.categories).toEqual([]));
    expect(container.querySelectorAll('.gly-cat')).toHaveLength(6);
  });

  it('circles: a store with links saved in the old settings keeps them until the block is added', () => {
    state.categories = [CARDS];
    state.settings = { gly_tile1_link: 'https://shop.test/ar/newborn/c5' };
    const { container } = renderWithQuery(<GiftologyHome />);
    const circles = [...container.querySelectorAll('.gly-cat')];
    expect(circles).toHaveLength(6);
    expect(circles[0].getAttribute('href')).toBe('https://shop.test/en/newborn/c5');
  });

  it('lists arrive filled in Arabic: an untouched row shows the page language, a rewritten one as written', () => {
    const how = block('gly-how', {
      steps: [
        { 'steps.title': 'نكتشف', 'steps.text': 'أخبرنا عن المناسبة، الشخص، والميزانية.' },
        { 'steps.title': 'نختار معك', 'steps.text': 'ننتقي' },
      ],
    });
    expect([...how.container.querySelectorAll('.gly-step h3')].map((h) => h.textContent)).toEqual([
      en['blocks.gly.how.discover_t'],
      'نختار معك',
    ]);
    expect([...how.container.querySelectorAll('.gly-step p')].map((p) => p.textContent)).toEqual([
      en['blocks.gly.how.discover_d'],
      en['blocks.gly.how.pick_t'],
    ]);
    how.unmount();

    const hero = block('gly-hero', {
      show_stats: true,
      stats: [{ 'stats.value': '+12 ألف', 'stats.label': 'هدية تم توصيلها' }],
    });
    expect(hero.container.querySelector('.gly-hero-stats b')?.textContent).toBe('+12K');
    expect(hero.container.querySelector('.gly-hero-stats span')?.textContent).toBe(en['blocks.gly.hero.stat_gifts']);
  });

  it("custom gift and how it works: the merchant's steps replace the ready ones", () => {
    const custom = block('gly-custom', {
      card_btn: 'Chat with us',
      steps: [{ title: 'Tell us' }, { title: 'We make it', text: 'In three days.' }],
    });
    expect([...custom.container.querySelectorAll('.gly-cstep b')].map((b) => b.textContent)).toEqual(['Tell us', 'We make it']);
    expect([...custom.container.querySelectorAll('.gly-cstep__n')].map((n) => n.textContent)).toEqual(['1', '2']);
    expect(custom.container.querySelector('.gly-qcard-c h3')?.textContent).toBe(en['blocks.gly.custom.card_title']);
    custom.unmount();

    const how = block('gly-how', { steps: [{ 'steps.title': 'Pick', 'steps.text': 'Choose a box.' }] });
    expect([...how.container.querySelectorAll('.gly-step h3')].map((h) => h.textContent)).toEqual(['Pick']);
    how.unmount();

    const ready = block('gly-how', {});
    expect(ready.container.querySelectorAll('.gly-step')).toHaveLength(4);
  });

  it('latest products and reviews: their heading, and the "view all" link', () => {
    const latest = block('gly-latest', { title: 'Just in', url: [{ url: 'https://shop.test/en/new' }] });
    expect(latest.container.querySelector('.gly-shead h2')?.textContent).toBe('Just in');
    expect(screen.getByText(en['blocks.gly.latest.view_all']).closest('a')?.getAttribute('href')).toBe('https://shop.test/en/new');
    latest.unmount();

    const reviews = block('gly-testimonials', { title_pre: 'Loved by', title_em: 'many' });
    expect(reviews.container.querySelector('.gly-shead h2')?.textContent).toBe('Loved by many');
  });

  it('gift finder: the questions and heading typed in the block, minus the categories left out', async () => {
    state.categories = [NEWBORN, CARDS];
    const { container } = block('gly-finder', {
      title_pre: 'Stuck?',
      q_category: 'Who is it for?',
      q_kind: 'What kind of {category} gift?',
      exclude: [{ id: 90, name: 'Cards', url: 'https://shop.test/en/cards/c90' }],
    });
    const newborn = await screen.findByRole('button', { name: 'Newborn' });
    expect(container.querySelector('h2')?.textContent).toContain('Stuck?');
    expect(container.querySelector('.gly-qq')?.textContent).toBe('Who is it for?');
    expect(screen.queryByRole('button', { name: 'Cards' })).toBeNull();
    fireEvent.click(newborn);
    expect(container.querySelector('.gly-qq')?.textContent).toBe('What kind of Newborn gift?');
  });
});
