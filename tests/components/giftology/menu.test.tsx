import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import en from '../../../locales/en.json';
import { GlyMobileMenu } from '../../../app/components/giftology/GlyMobileMenu';

const state = {
  settings: {} as Record<string, unknown>,
  categories: [] as unknown[],
};

vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({
    store: { name: 'Giftology', url: 'https://shop.test/en' },
    theme: { settings: state.settings },
  }),
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({
    locale: 'en',
    t: (key: string, fallback?: string) => (en as Record<string, string>)[key] ?? fallback ?? key,
  }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...props }: { to?: string; children?: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@salla.sa/twilight-theme-engine/api/category', () => ({
  category: {
    queries: {
      list: () => ({ queryKey: ['categories'], queryFn: async () => state.categories }),
    },
  },
}));

function renderMenu(open: boolean, onClose = () => {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GlyMobileMenu open={open} onClose={onClose} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  state.settings = {};
  state.categories = [];
});

describe('GlyMobileMenu', () => {
  it('is inert while closed', () => {
    const { container } = renderMenu(false);
    const menu = container.querySelector('#gly-mmenu');
    expect(menu?.hasAttribute('inert')).toBe(true);
    expect(menu?.classList.contains('open')).toBe(false);
  });

  it('lists the curated tiles until the category tree loads, then the tree', async () => {
    state.categories = [
      {
        id: 1,
        name: 'Newborn',
        url: '/newborn/c1',
        sub_categories: [{ id: 2, name: 'Baby Girl', url: '/baby-girl/c2' }],
      },
      { id: 3, name: 'Cards', url: '/cards/c3' },
    ];
    renderMenu(true);
    expect(screen.getByText(en['blocks.gly.cats.men'])).toBeTruthy();

    const parent = await screen.findByRole('button', { name: 'Newborn' });
    expect(parent.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(parent);
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Baby Girl').getAttribute('href')).toBe('/baby-girl/c2');
    expect(screen.getByText('Cards').getAttribute('href')).toBe('/cards/c3');
  });

  it('links the home sections that are on, and closes on a link or Escape', () => {
    state.settings = { gly_show_how: false };
    let closed = 0;
    renderMenu(true, () => {
      closed += 1;
    });
    expect(screen.queryByText(en['blocks.gly.nav.how'])).toBeNull();
    const finder = screen.getByText(en['blocks.gly.nav.finder']);
    expect(finder.getAttribute('href')).toBe('https://shop.test/en/#gly-finder');
    fireEvent.click(finder);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closed).toBe(2);
  });
});
