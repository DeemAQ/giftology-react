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

  it("shows the store's categories as circles, with a link to all products that is there before they load", async () => {
    state.categories = [
      {
        id: 1,
        name: 'Newborn',
        url: '/newborn/c1',
        image: 'https://cdn.test/newborn.png',
        sub_categories: [{ id: 2, name: 'Baby Girl', url: '/baby-girl/c2' }],
      },
      { id: 3, name: 'Cards', url: '/cards/c3' },
      // Holds nothing: not offered.
      { id: 4, name: 'Empty', url: '/empty/c4', products_count: 0 },
    ];
    const { container } = renderMenu(true);
    expect(screen.getByText('All').getAttribute('href')).toBe('https://shop.test/en/products');
    expect(container.querySelector('.gly-mcats')).toBeNull();

    const newborn = (await screen.findByText('Newborn')).closest('a');
    expect(newborn?.getAttribute('href')).toBe('/newborn/c1');
    // Its image from Salla; a category without one gets the brand icon.
    expect(newborn?.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/newborn.png');
    const cards = screen.getByText('Cards').closest('a');
    expect(cards?.querySelector('img')).toBeNull();
    expect(cards?.querySelector('.gly-ico')).toBeTruthy();
    // Top-level categories only: a subcategory is on its parent's page.
    expect(screen.queryByText('Baby Girl')).toBeNull();
    expect(screen.queryByText('Empty')).toBeNull();
    expect(container.querySelectorAll('.gly-mcat')).toHaveLength(2);
  });

  it('fills a circle with its picture when the store says its category images are photos', async () => {
    state.categories = [{ id: 1, name: 'Newborn', url: '/newborn/c1', image: 'https://cdn.test/newborn.jpg' }];
    state.settings = { gly_subcats_style: 'cover' };
    const { container } = renderMenu(true);
    await screen.findByText('Newborn');
    expect(container.querySelector('.gly-mcats')?.classList.contains('gly-mcats--photos')).toBe(true);
  });

  it('gives the custom gift and the gift finder a card each, and links the other sections plainly', () => {
    state.settings = { gly_show_how: false };
    let closed = 0;
    const { container } = renderMenu(true, () => {
      closed += 1;
    });
    expect([...container.querySelectorAll('.gly-mfeat a')].map((link) => link.textContent)).toEqual([
      en['blocks.gly.nav.custom'],
      en['blocks.gly.nav.finder'],
    ]);
    expect([...container.querySelectorAll('.gly-mlinks a')].map((link) => link.textContent)).toEqual([
      en['blocks.gly.nav.latest'],
      en['blocks.gly.nav.testimonials'],
    ]);
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
    expect(screen.getByRole('heading', { name: en['blocks.gly.nav.sections'] })).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
  });

  it("lists the store's own menu entries after the sections, translating one named by a translation key", async () => {
    state.categories = [
      // As Salla sends a menu link: a word for an id, no category page.
      { id: 'offers', name: 'blocks.gly.nav.latest', url: '/offers' },
      { id: 2, name: 'Cards', url: '/cards/c3' },
    ];
    const { container } = renderMenu(true);
    await screen.findByText('Cards');
    const entry = [...container.querySelectorAll('.gly-mlinks a')].pop();
    expect(entry?.textContent).toBe(en['blocks.gly.nav.latest']);
    expect(entry?.getAttribute('href')).toBe('/offers');
    expect(screen.queryByText('blocks.gly.nav.latest')).toBeNull();
    // It is not a category, so it gets no circle.
    expect(container.querySelectorAll('.gly-mcat')).toHaveLength(1);
  });

  it('shows the categories picked in the settings, in that order, and only those', async () => {
    state.categories = [
      { id: 1, name: 'Newborn', url: '/newborn/c1' },
      { id: 2, name: 'Cards', url: '/cards/c2' },
      { id: 3, name: 'Flowers', url: '/flowers/c3' },
    ];
    state.settings = { gly_menu_categories: [{ id: 3 }, { id: 1 }] };
    const { container } = renderMenu(true);
    await screen.findByText('Flowers');
    expect([...container.querySelectorAll('.gly-mcat')].map((circle) => circle.textContent)).toEqual([
      'Flowers',
      'Newborn',
    ]);
  });

  it('leaves out what the settings switch off, and adds the links typed by hand', async () => {
    state.categories = [
      { id: 'offers', name: 'Offers', url: '/offers' },
      { id: 2, name: 'Cards', url: '/cards/c2' },
    ];
    state.settings = {
      gly_whatsapp: '966551234567',
      gly_menu_show_sections: false,
      gly_menu_show_store_links: false,
      gly_menu_show_contact: false,
      gly_menu_links: [
        { 'gly_menu_links.name': 'بطاقات', 'gly_menu_links.name_en': 'Gift cards', 'gly_menu_links.url': '/gift-cards' },
        // No destination: not a link.
        { 'gly_menu_links.name': 'ناقص' },
      ],
    };
    const { container } = renderMenu(true);
    await screen.findByText('Cards');
    expect(container.querySelector('.gly-mfeat')).toBeNull();
    expect(container.querySelector('.gly-mmenu__foot')).toBeNull();
    const links = [...container.querySelectorAll('.gly-mlinks a')];
    expect(links.map((link) => link.textContent)).toEqual(['Gift cards']);
    expect(links[0].getAttribute('href')).toBe('/gift-cards');
  });

  it('closes when the dimmed page beside it is clicked', () => {
    let closed = 0;
    const { container } = renderMenu(true, () => {
      closed += 1;
    });
    const scrim = container.querySelector('.gly-mscrim') as HTMLElement;
    expect(scrim.classList.contains('open')).toBe(true);
    fireEvent.click(scrim);
    expect(closed).toBe(1);
  });

  it('ends on the WhatsApp button and Instagram when the store has them', () => {
    const bare = renderMenu(true);
    expect(bare.container.querySelector('.gly-mmenu__foot')).toBeNull();
    bare.unmount();

    state.settings = { gly_whatsapp: '966551234567', gly_instagram: 'https://instagram.com/giftology' };
    const { container } = renderMenu(true);
    expect(container.querySelector('.gly-mmenu__foot .gly-btn-wa')?.getAttribute('href')).toContain(
      'https://wa.me/966551234567'
    );
    expect(container.querySelector('.gly-mmenu__social')?.getAttribute('href')).toBe('https://instagram.com/giftology');
    expect(container.querySelector('.gly-mmenu__social')?.getAttribute('aria-label')).toBe(en['blocks.gly.footer.instagram']);
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
