import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import en from '../../../locales/en.json';
import { GiftFinder } from '../../../app/components/giftology/GiftFinder';
import { GiftologyHome } from '../../../app/components/giftology/GiftologyHome';
import { GlyFooter } from '../../../app/components/giftology/GlyFooter';
import { WhatsAppFloat } from '../../../app/components/giftology/WhatsAppFloat';
import { PromoBar } from '../../../app/components/giftology/PromoBar';
import { SubcategoryPills } from '../../../app/components/giftology/SubcategoryPills';

const state = {
  store: {} as Record<string, unknown>,
  settings: {} as Record<string, unknown>,
  products: [] as { id: number; name: string }[],
  listCalls: [] as Record<string, unknown>[],
};

vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ store: state.store, theme: { settings: state.settings } }),
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({
    locale: 'en',
    t: (key: string, fallback?: string) => (en as Record<string, string>)[key] ?? fallback ?? key,
  }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks', () => ({ HookSlot: () => null }));
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
vi.mock('@salla.sa/twilight-theme-engine/api/category', () => ({
  category: {
    queries: {
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
  state.settings = {};
  state.products = [];
  state.listCalls = [];
});

describe('PromoBar', () => {
  it('shows the three curated phrases when the merchant set none', () => {
    render(<PromoBar />);
    expect(screen.getByRole('note')?.textContent).toContain(en['blocks.gly.promo.shipping']);
  });

  it('shows only the filled phrases, the last one emphasised', () => {
    state.settings = { gly_promo_1: 'Free wrap', gly_promo_3: 'Ships today' };
    const { container } = render(<PromoBar />);
    expect(screen.getByRole('note')?.textContent).toContain('Free wrap');
    expect(screen.getByRole('note').textContent).not.toContain(en['blocks.gly.promo.fast']);
    expect(container.querySelector('b')?.textContent).toContain('Ships today');
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
    render(<GlyFooter />);
    expect(screen.getByText('hello@giftology.test').closest('a')?.getAttribute('href')).toBe('mailto:hello@giftology.test');
    expect(screen.getByText('Store description')).toBeTruthy();
    expect(screen.getByText('Mastercard')).toBeTruthy();
    expect(screen.queryByText('VISA')).toBeNull();
    // Tamara is off until the merchant turns it on.
    expect(screen.queryByText('تمارا')).toBeNull();
    expect(screen.getByText(en['blocks.gly.footer.instagram']).closest('a')?.getAttribute('href')).toBe('https://instagram.com/giftology');
  });
});

describe('WhatsApp buttons', () => {
  it("uses the store's own number when the setting still holds its default", () => {
    state.store = { ...state.store, contacts: { mobile: '+966 55 111 2222' } };
    state.settings = { gly_whatsapp: '966500000000' };
    render(<WhatsAppFloat />);
    expect(screen.getByRole('link').getAttribute('href')).toContain('https://wa.me/966551112222?text=');
  });

  it('hides them when there is no number to chat with', () => {
    state.settings = { gly_whatsapp: '966500000000' };
    const float = render(<WhatsAppFloat />);
    expect(float.container.querySelector('a')).toBeNull();
    float.unmount();

    render(<GlyFooter />);
    expect(screen.queryByText(en['blocks.gly.footer.whatsapp'])).toBeNull();
  });
});

describe('GiftFinder', () => {
  const pick = (label: keyof typeof en) => fireEvent.click(screen.getByText(en[label]));

  it('ends on the WhatsApp result as soon as "custom gift" is chosen', () => {
    state.settings = { gly_whatsapp: '966551234567' };
    renderWithQuery(<GiftFinder />);
    pick('blocks.gly.finder.q1_men');
    pick('blocks.gly.finder.q2_general');
    pick('blocks.gly.finder.q3_custom');
    expect(screen.getByText(en['blocks.gly.custom.card_btn']).closest('a')?.getAttribute('href')).toContain('https://wa.me/966551234567?text=');
  });

  it('shows a product from the winning category, read from its /c{id} link', async () => {
    state.settings = { gly_tile1_link: 'https://shop.test/ar/newborn/c77' };
    state.products = [{ id: 1, name: 'Baby box' }];
    renderWithQuery(<GiftFinder />);
    pick('blocks.gly.finder.q1_newborn');
    pick('blocks.gly.finder.q2_birth');
    pick('blocks.gly.finder.q3_ready');
    await waitFor(() => expect(screen.getByTestId('product-card')?.textContent).toContain('Baby box'));
    expect(state.listCalls[0]).toMatchObject({ source: 'categories', sourceValue: [77] });
  });

  it('links to the category when it has no product to show, and can restart', async () => {
    state.settings = { gly_cat_men: 'https://shop.test/ar/men/c5' };
    renderWithQuery(<GiftFinder />);
    pick('blocks.gly.finder.q1_men');
    pick('blocks.gly.finder.q2_general');
    pick('blocks.gly.finder.q3_card');
    const shop = await screen.findByText(en['blocks.gly.finder.shop']);
    // men 1, occasion 1, cards 1: the tie goes to the earliest in the order.
    expect(shop.closest('a')?.getAttribute('href')).toBe('https://shop.test/en/men/c5');
    fireEvent.click(screen.getByText(new RegExp(en['blocks.gly.finder.restart'])));
    expect(screen.getByText(en['blocks.gly.finder.q1'])).toBeTruthy();
  });

  it('skips the product lookup when the category link has no id', async () => {
    renderWithQuery(<GiftFinder />);
    pick('blocks.gly.finder.q1_anyone');
    pick('blocks.gly.finder.q2_general');
    pick('blocks.gly.finder.q3_ready');
    const shop = await screen.findByText(en['blocks.gly.finder.shop']);
    expect(state.listCalls).toHaveLength(0);
    // No category link set: all products, not the home page the visitor is already on.
    expect(shop.closest('a')?.getAttribute('href')).toBe('https://shop.test/en/products');
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

  it('drops a section the merchant switched off, and its hero button', () => {
    state.settings = { gly_show_latest: false, gly_show_finder: false };
    const { container } = renderWithQuery(<GiftologyHome />);
    expect(container.querySelector('#gly-latest')).toBeNull();
    expect(container.querySelector('#gly-finder')).toBeNull();
    expect(container.querySelector('a[href="#gly-latest"]')).toBeNull();
    expect(container.querySelector('#gly-cats')).not.toBeNull();
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
});
