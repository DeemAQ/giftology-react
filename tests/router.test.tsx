import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentType } from 'react';

const registered = vi.hoisted(() => ({
  components: {} as Record<string, ComponentType<{ data: unknown }>>,
  config: {} as Record<string, { className?: unknown; height?: string }>,
}));

vi.mock('@salla.sa/twilight-theme-engine/tanstack', () => ({ createRouter: () => ({}) }));
vi.mock('@salla.sa/twilight-theme-engine', () => ({ registry: { register: vi.fn() } }));
vi.mock('@salla.sa/twilight-theme-engine/routes/home', () => ({
  DefaultHomeComponents: { 'latest-products': () => 'engine latest products', youtube: () => null },
  registerHomeComponents: (components: typeof registered.components) => {
    Object.assign(registered.components, components);
  },
  registerHomeComponentConfig: (config: typeof registered.config) => {
    Object.assign(registered.config, config);
  },
}));
vi.mock('@salla.sa/twilight-components-react', () => ({ SliderSkeleton: () => null }));
vi.mock('../app/routeTree.gen', () => ({ routeTree: {} }));
vi.mock('../app/hooks', () => ({ registerThemeHooks: vi.fn() }));
// The Giftology blocks are tested with their sections (`components/giftology/blocks.test.tsx`).
vi.mock('../app/components/giftology/blocks', () => {
  const names = ['gly-hero', 'gly-latest', 'gly-circles', 'gly-custom', 'gly-finder', 'gly-how', 'gly-testimonials'];
  return {
    glyHomeBlocks: Object.fromEntries(names.map((name) => [name, () => null])),
    glyHomeBlockConfig: Object.fromEntries(names.map((name) => [name, { className: 'gly-block', height: '0px', renderOnMount: true }])),
  };
});
vi.mock('../app/components/product/ProductListSkeleton', () => ({ ProductListSkeleton: () => null }));
vi.mock('../app/components/home', () => {
  const block = () => null;
  return {
    Brands: block,
    CustomTestimonials: block,
    EnhancedSlider: block,
    FeaturedProducts: block,
    featuredProductsConfig: {},
    FixedProducts: block,
    MainLinks: block,
    PhotosSlider: block,
    ProductsSlider: block,
    SliderProductsWithHeader: block,
    EnhancedSquareBanners: block,
  };
});
vi.mock('../app/components/home/Blog', () => ({ Blog: () => null }));
vi.mock('../app/components/home/FeaturedProducts', () => ({
  FeaturedProductsSpecialOffer: () => null,
  FeaturedProductsWithSpecialProduct: () => null,
}));
vi.mock('../app/components/home/PhotosSliderWithText', () => ({ PhotosSliderWithText: () => null }));

await import('../app/router');

describe('home block registration', () => {
  it('registers a component for every block the theme editor offers', async () => {
    const { default: manifest } = await import('../twilight.json');
    const offered = (manifest.components as { path: string }[]).map((c) => c.path.replace(/^home\./, ''));
    expect(offered.length).toBeGreaterThan(0);
    for (const path of offered) {
      expect(registered.components[path], path).toBeTypeOf('function');
    }
  });

  it("keeps the engine's built-in blocks", () => {
    expect(registered.components.youtube).toBeTypeOf('function');
  });

  it('draws nothing for the no-blocks fallback: Giftology has its own latest products', () => {
    const Fallback = registered.components['latest-products'];
    expect(renderToStaticMarkup(<Fallback data={{ path: 'latest-products' }} />)).toBe('');
    // Its wrapper section takes no room either.
    expect(registered.config['latest-products']).toEqual({ className: 'hidden', height: '0px' });
  });

  it('registers the Giftology blocks and their wrapper settings', () => {
    expect(registered.components['gly-circles']).toBeTypeOf('function');
    expect(registered.config['gly-how']).toMatchObject({ className: 'gly-block' });
  });
});
