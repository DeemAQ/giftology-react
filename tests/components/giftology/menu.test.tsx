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
vi.mock('@salla.sa/twilight-theme-engine/api/home', () => ({
  home: {
    queries: {
      components: () => ({ queryKey: ['home', 'components'], queryFn: async () => [] }),
    },
  },
}));
vi.mock('@salla.sa/twilight-theme-engine/api/category', () => ({
  category: {
    queries: {
      list: () => ({ queryKey: ['categories'], queryFn: async () => state.categories }),
    },
  },
}));

// The real hook needs the engine's document-class provider; the menu only has to call it.
const scrollLock = vi.hoisted(() => vi.fn());
vi.mock('../../../app/hooks/useScrollLock', () => ({ useScrollLock: scrollLock }));

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

  it("lists the store's category tree, with a link to all products until it loads", async () => {
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
    expect(screen.getByText('All').getAttribute('href')).toBe('https://shop.test/en/products');

    const parent = await screen.findByRole('button', { name: 'Newborn' });
    expect(parent.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(parent);
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Baby Girl').getAttribute('href')).toBe('/baby-girl/c2');
    expect(screen.getByText('Cards').getAttribute('href')).toBe('/cards/c3');
  });

  it('links the home sections that are on the page, and closes on a link or Escape', () => {
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

  it('links only the sections placed in the home tab, once the home blocks are known', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // What the home route's loader leaves in the cache.
    client.setQueryData(['home', 'components'], [{ path: 'home.gly-hero' }, { path: 'home.gly-how' }]);
    render(
      <QueryClientProvider client={client}>
        <GlyMobileMenu open onClose={() => {}} />
      </QueryClientProvider>
    );
    expect(screen.getByText(en['blocks.gly.nav.how'])).toBeTruthy();
    expect(screen.queryByText(en['blocks.gly.nav.finder'])).toBeNull();
    expect(screen.queryByText(en['blocks.gly.nav.latest'])).toBeNull();
    // The store's categories stay reachable from the menu either way.
    expect(screen.getByRole('button', { name: en['blocks.gly.nav.sections'] })).toBeTruthy();
  });

  it("translates a store menu entry that is named by a translation key", async () => {
    state.categories = [
      { id: 1, name: 'blocks.gly.nav.latest', url: '/offers' },
      { id: 2, name: 'Cards', url: '/cards/c3' },
    ];
    renderMenu(true);
    const entry = await screen.findByText(en['blocks.gly.nav.latest'], { selector: '.gly-catitem a' });
    expect(entry.getAttribute('href')).toBe('/offers');
    expect(screen.queryByText('blocks.gly.nav.latest')).toBeNull();
  });

  it('moves focus into the menu when it opens and back to the opener when it closes', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (open: boolean) => (
      <QueryClientProvider client={client}>
        <GlyMobileMenu open={open} onClose={() => {}} />
      </QueryClientProvider>
    );
    const { container, rerender } = render(tree(false));
    expect(document.activeElement).toBe(opener);

    rerender(tree(true));
    expect(document.activeElement).toBe(container.querySelector('#gly-mclose'));

    rerender(tree(false));
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('locks page scroll only while it is open', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (open: boolean) => (
      <QueryClientProvider client={client}>
        <GlyMobileMenu open={open} onClose={() => {}} />
      </QueryClientProvider>
    );
    const { rerender } = render(tree(false));
    expect(scrollLock).toHaveBeenLastCalledWith(false);
    rerender(tree(true));
    expect(scrollLock).toHaveBeenLastCalledWith(true);
    rerender(tree(false));
    expect(scrollLock).toHaveBeenLastCalledWith(false);
  });
});
