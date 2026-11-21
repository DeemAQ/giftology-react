# AGENTS.md

Salla React storefront theme: TanStack Start (server-rendered at the edge) on
`@salla.sa/twilight-theme-engine`. You customize the engine; you do not fork it.

## Read the docs before writing code

Do not write an engine API from memory. Look it up first:

- Salla Partners MCP tool `salla_themes_docs` (`search`, `read`, `list`), or
- `https://docs.salla.dev/twilight/react/llms.txt` (index), then add `.md` to any page URL.

| I want to…                                             | Read                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Add a page                                             | `/recipes/add-a-page`                                                                |
| Change a built-in page                                 | `/recipes/fork-a-built-in-route`                                                     |
| Add a home block                                       | `/recipes/add-a-home-block`                                                          |
| Replace the product card                               | `/recipes/replace-the-product-card`                                                  |
| Put content in an existing spot                        | `/recipes/add-content-to-a-slot`                                                     |
| Add translations                                       | `/recipes/add-translation-keys`                                                      |
| React to cart events                                   | `/recipes/react-to-cart-events`                                                      |
| Add a merchant setting                                 | `/guide/settings`, and `/guide/twilight-json` for every key and format               |
| Load data in a page                                    | `/guide/loading-data`                                                                |
| Style something                                        | `/guide/styling`                                                                     |
| Navigate, detect the page, redirect or 404 in a loader | `/hooks/navigation`                                                                  |
| Set classes on `<html>`/`<body>`                       | `/hooks/use-document-class`                                                          |
| Loading placeholders                                   | `/components/skeleton`                                                               |
| Keep it fast, or lint it                               | `/guide/performance`, `/guide/lint-your-theme`                                       |
| Use a `<salla-*>` web component                        | `/web-components` (index), then `/web-components/<tag>` for its props, events, slots |

## Giftology

This theme is the React version of the Giftology Twig theme. Its custom layer:

```text
app/components/giftology/   header, full-screen menu, footer, promo bar, WhatsApp button,
                            the home sections, gift finder, subcategory pills
app/lib/giftology.ts        gly_* setting and home-block field readers, category circles, WhatsApp helpers
app/lib/giftFinder.ts       the gift finder's rules: categories offered, budget ranges, suggestions
app/lib/glyDefaults.ts      the ready-made rows the home blocks' lists arrive with
app/styles/giftology/       brand tokens, section styles, category-page styles, product-card styles
app/assets/images/          logos, watermark pattern, category icons
```

- The home tab of the theme editor is the one place the home page is built. Each Giftology
  section is a home block (`home.gly-*` in `twilight.json`, `giftology/blocks.tsx`, names in
  `giftology/homeSections.tsx`). Once the merchant has placed any of them, the page is exactly
  the blocks in the home tab, in their order (`GiftologyHome.tsx`, `shownSections`). Until then
  the page is the seven built-in sections, with any Salla block under the hero, so an untouched
  store still has a full home page. The engine's no-blocks fallback is registered as an empty
  component in `app/router.tsx`: Giftology has its own latest-products section.
- There are no section switches or section fields in the settings list. `gly_show_*`,
  `gly_hero_stat_*`, `gly_latest_*` and `gly_tile*` are still read for the built-in page if a
  store saved them under the Twig theme, but none is offered; do not add them back.
- A block hands its section the fields as `data`. Nothing a visitor reads is fixed in code:
  every text of a section has a field, and so do its counts, icons, pictures and switches. When
  you add a text to a section, add its field (and the English one) to the block in
  `twilight.json`; do not leave it reachable only through the locale files.
- Every text has two boxes in the editor: `id` for Arabic and `id_en` for English, each a plain
  single-value field (`"multilanguage": false`). Read them with `blockCopy(data, id, locale)`,
  or `rowText` inside a list row, and fall back to the locale text: an empty box shows the
  theme's own wording in that language. Theme settings follow the same rule through
  `settingCopy` (`gly_promo_1` / `gly_promo_1_en`). Block-level English boxes carry a
  `conditions` entry on the block's `edit_en` switch, so they stay out of the way until asked for.
  The local editor has no per-language input, and Salla's has not been seen to offer one for
  theme fields; that is why the English box is its own field.
- A few texts are optional: they show only when the merchant typed them, and nothing stands in
  for an empty box. They are the small line above a section's title (every section but the hero
  and the custom gift) and the custom gift's paragraph, badge and card line. Read them with
  `blockCopy` alone, with no locale fallback, and say "optional" in the field's label. The
  script word in a title is kept for the hero and the custom gift; elsewhere a title is one
  plain line (`SectionHead`).
- A block's list (hero figures, hero cards, custom-gift steps, how-it-works steps) ships filled
  with the ready-made rows in both languages, so the merchant edits them instead of facing an
  empty list. Change a ready-made text in the locale files, `lib/glyDefaults.ts` and the list's
  `value` in `twilight.json` together; `tests/lib/glyDefaults.test.ts` fails if they drift.
- Categories are never typed into the theme. The circles, the gift finder and the full-screen
  menu all read the store's category tree (`giftology/categoryTree.ts`; the home loader
  prefetches it). That list also carries the store's menu links (offers, brands, blog), which
  have no numeric id: `isCategory` in `lib/giftFinder.ts` tells them apart. Circles: the
  categories picked in the block, else the top-level ones, each with its Salla name and image,
  then any hand-listed extras (`useCircles` in `Categories.tsx`). Subcategories on a category
  page are that category's children, as circles when any has an image (`SubcategoryPills.tsx`,
  `gly_subcats_style`).
- The gift finder's rules are in `lib/giftFinder.ts` (no React): questions from the category
  tree, budget ranges from the chosen category's real prices, up to three in-stock products in
  the order the block picks (best sellers by default). "A custom gift" always ends on the
  custom-order answer with its WhatsApp button. Nothing has to be set up; the block rewords
  every text, leaves categories out and can switch the custom answer off.
- The six brand icons (`app/assets/images/{baby,gift,cake,tie,tag,envelope}.svg`) share one
  line weight (the baby's) and one optical size. They are drawn through a CSS mask, so only
  their shape matters, not their colour.
- Every merchant setting starts with `gly_`. Their ids match the Twig theme; do not rename them.
- The theme editor's list (`settings` in `twilight.json`) opens with a "start here" note, then
  contact, top bar, menu, a pointer to the home tab, product card, product page, footer. A field that
  depends on a switch carries `conditions` on it. Write each label so it makes sense without its
  heading: the local editor (`/__twilight/editor`) does not draw the `static` headings, and it
  has one box per text (no per-language input). A setting nothing reads does not belong in the
  list; `tests/manifest/settings.test.ts` checks these rules.
- Brand colours and the body font are locked in `app/styles/giftology/_tokens.scss`.
- Phones keep the starter's bottom nav and page-title bar. Its Menu tab opens `GlyMobileMenu`:
  the store's top-level categories as circles, the custom gift and the gift finder as two cards,
  the other home sections and the store's own menu entries as plain links, WhatsApp and
  Instagram at the foot. A subcategory is reached from its parent's page, not from the menu.
  Wider than a phone the same menu opens as a side panel from the header's menu button, which
  shows on every screen. The `gly_menu_*` settings say what appears in it: the categories
  picked, switches for the section links, the store's menu entries and the foot, and links
  added by hand.
- The floating WhatsApp button steps aside while another WhatsApp link is on screen
  (`WhatsAppFloat.tsx` watches every `wa.me` link of the page).
- Store pages (policies, about) can use `{store_name}`, `{commercial_number}`, `{email}` and
  `{whatsapp}` in their text; `page/PageSingle.tsx` fills them from the store's details.
- The footer's "important links" are the store's footer menu (the pages the merchant adds in
  Salla), and its registration numbers come from the store's settings. Neither is a theme setting.

## Layout

```text
app/start.ts          request middleware. Rarely edited.
app/router.tsx        createRouter(), registerHomeComponents(), registerThemeHooks()
app/routes.ts         EDIT: manifest of custom or overriding routes
app/routes/__root.tsx EDIT: the only hand-maintained route file
app/routes/*          your route files (declared in routes.ts); the rest are generated
app/routeTree.gen.ts  GENERATED. Never edit.
app/components/       EDIT: your components and overrides
app/hooks/            EDIT: React hooks (useX.ts) + hook-slot registrations (index.tsx)
app/lib/              EDIT: non-React helpers and constants
app/styles/           Tailwind + SCSS
FORKS.md              EDIT: engine components copied into this theme; update on engine upgrades
locales/{ar,en}.json  EDIT: theme translations
twilight.json         EDIT: merchant settings, home blocks, features
```

## Rules that prevent the usual mistakes

**Routes**

- A new or overriding page needs both: a `route('/path', 'file.tsx')` entry in `app/routes.ts` and the file in `app/routes/`.
- Every storefront route path starts with `{-$locale}`: `createFileRoute('/{-$locale}/about')`.
- Never put `// @auto-generated` at the top of a route file you own. The next build deletes it.
- Never edit `routeTree.gen.ts`. It is regenerated.
- Test pages at `/ar` or `/en`, never `/`.

**Components and registry**

- Only three registry keys are resolved: `product:card`, the `home:*` blocks, `account:layout-pending`. Overriding any other name does nothing. For anything else use a hook slot or fork the route.
- To replace the product card call `registry.register('product:card', X)` and then `registry.override('product:card', X)`. `override()` alone is silently ignored.
- Home blocks are bound by key in `registerHomeComponents({ ...DefaultHomeComponents, key: MyComponent })`. Keep the spread, or you lose the defaults.
- A block with a `view_style` is looked up as `key:styleN` before `key`. Register both when you replace it.

**Imports**

- Import from the narrowest public subpath: `@salla.sa/twilight-theme-engine/hooks/useStore`, `/common`, `/cart`, `/product`, `/layout`.
- Never import from `dist/` or `src/` of the engine. Those paths are not public.
- Use the engine `Link` (`/common`) for internal navigation, not `<a>`.

**Data and settings**

- Theme settings are a plain object: `const { settings } = useTheme(); settings?.my_id ?? default`. There is no `settings.get()`.
- `useMoney().format()` returns a React node, not a string.
- Merchant settings and home blocks are declared in `twilight.json`; reading them in code is not enough.
- The SDK is `window.salla`. Subscribe and unsubscribe with the same API and the same function reference, in a `useEffect` cleanup. Use the dotted event name (`auth::logged.in`).
- No `window.location.reload()` and no manual DOM edits. Use state, refs and `key`.

**Translations**

- Add keys to both `locales/ar.json` and `locales/en.json`. Arabic and RTL come first: use logical CSS (`ms-*`, `ps-*`, `text-start`) not left/right.

## Web components (`<salla-*>`)

The engine renders many Salla widgets as web components. In React, prefer, in this order:

1. A native engine component (`Link`, `ProductCard`, `Breadcrumb`, product lists and sliders) when one exists.
2. A wrapper from `@salla.sa/twilight-components-react` (granular import: `.../slider`, `.../rating-stars`).
3. A raw `<salla-*>` tag only if there is no wrapper.

Before using one, `read` `/web-components/<tag>` (for example `/web-components/salla-modal`) for its exact props, events, methods and slots. Do not invent attributes.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm check:manifest   # after editing twilight.json: duplicate ids, missing options, bad values
```

Do not start `pnpm dev` yourself; ask the user to run it. Typecheck needs `app/routeTree.gen.ts`, which `pnpm build` or `pnpm dev` generates.
