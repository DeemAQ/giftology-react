# Giftology (React)

React version of the Giftology storefront theme for [Salla](https://salla.sa), rebuilt from
the Twig theme ([DeemAQ/giftology](https://github.com/DeemAQ/giftology)) on the official React
starter: TanStack Start and Vite, rendered server-side through `@salla.sa/twilight-theme-engine`.

## Run it

You need pnpm 10 and Node.js 22.22.2 or later (or 24.15.0+, or 26+).

```bash
pnpm install
salla theme dev            # http://localhost:5173/ar and /en, against the demo store
salla theme dev --store    # pick your own store instead
```

`salla` is the Salla CLI: `npm install -g @salla.sa/cli`.

## Scripts

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `pnpm dev`            | Start the Vite dev server (workerd) |
| `pnpm build`          | Production build                    |
| `pnpm typecheck`      | TypeScript type checking            |
| `pnpm test`           | Run the test suite (Vitest)         |
| `pnpm check:manifest` | Validate `twilight.json`            |

## What came over from the Twig theme

| Twig | React |
| --- | --- |
| `pages/index.twig` and the `gly-*` home partials | `app/routes/index.tsx` and `app/components/giftology/` (`Hero`, `LatestProducts`, `Categories`, `CustomGift`, `GiftFinder`, `HowItWorks`, `Testimonials`) |
| `header.twig`, the mobile drawer in `master.twig` | `GlyHeader.tsx`, `GlyMobileMenu.tsx` |
| `footer.twig` | `GlyFooter.tsx` |
| `gly-promo.twig`, `gly-whatsapp-float.twig` | `PromoBar.tsx`, `WhatsAppFloat.tsx` |
| `gly-cat-url.twig`, `gly-cat-links.twig` | `app/lib/giftology.ts` (`resolveCategoryUrl`, `categoryTiles`) |
| `giftology.js` (gift finder, category menu, subcategory pills, reveal, sticky header) | React state in the components above, `SubcategoryPills.tsx`, `app/hooks/useReveal.ts` |
| `_giftology*.scss` | `app/styles/giftology/` |
| `gly_*` settings in `twilight.json` | Same ids, same defaults |
| `blocks.gly.*` in `src/locales` | Same keys, flat, in `locales/ar.json` and `locales/en.json` |

Cart, product page, account pages, checkout hand-off, SEO and analytics come from the engine
and the starter.

## Differences from the Twig theme

- **Phones keep the starter's bottom nav and page-title bar.** The starter's product, cart and
  account pages are laid out around them. The Menu tab opens the Giftology menu.
- **The gift finder is translated.** Its questions and results were Arabic-only in
  `giftology.js`; they are now `blocks.gly.finder.*` keys in both locale files.
- **The category page uses the starter's toolbar** (count, grid/list, sort, filters) in place of
  the Twig `gly-ptoolbar`. Subcategory pills and the brand card frame are kept.
- **The language button** is the shared icon button and opens Salla's language/currency modal.
- **One `<h1>` on the home page**: the hero headline. The Twig theme also had a hidden one
  in the header.
- Three label rows in the settings panel got ASCII ids (`gly-label-store`, `gly-label-sections`,
  `gly-label-finder`). They hold no merchant values.

## Publishing

Salla builds and publishes the theme from its repository. Create the React theme in the
[Partners Portal](https://portal.salla.partners), link it to the Twig Giftology theme, connect
this repository, then run `salla theme preview` and `salla theme publish`. On first publish the
React version takes over the Twig theme's name, ratings and reviews. It needs its own preview
store.
