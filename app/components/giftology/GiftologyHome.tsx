import type { ComponentType } from 'react';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import type { HomePageProps } from '@salla.sa/twilight-theme-engine/routes/home';
import { Categories } from './Categories';
import { CustomGift } from './CustomGift';
import { GiftFinder } from './GiftFinder';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { HomeSectionsProvider, SECTION_KINDS, sectionsAsBlocks, shownSections } from './homeSections';
import type { SectionKind } from './homeSections';
import { LatestProducts } from './LatestProducts';
import { Testimonials } from './Testimonials';
import { useGly } from './useGly';

/** The home page's built-in sections. */
const SECTIONS: Record<SectionKind, ComponentType> = {
  hero: Hero,
  latest: LatestProducts,
  categories: Categories,
  custom: CustomGift,
  finder: GiftFinder,
  how: HowItWorks,
  testimonials: Testimonials,
};

/** Salla's own blocks sit under the hero while the built-in page shows. */
const SECTIONS_BEFORE_BLOCKS = 1;

/**
 * Giftology home page.
 *
 * The home tab of the theme editor is the one place the page is built. Each
 * Giftology section is a home block there (`home.gly-*`, `blocks.tsx`), with its own
 * texts and lists. Once the merchant has placed any of them, the page is exactly the
 * blocks in the home tab, in the merchant's order: a section that is not placed is
 * not shown.
 *
 * Until then the page is the seven built-in sections in a fixed order, so a store
 * that has set nothing up still opens on a full home page. Blocks that are not
 * Giftology's (a Salla slider, a banner) show under the hero in that case.
 *
 * The blocks are drawn by the engine's own home page, so the editor's live preview,
 * the `home:start` / `home:content` / `home:end` slots (above and below the blocks)
 * and the "order again" row all work as in any Salla theme. With no blocks it draws
 * nothing: its latest-products fallback is switched off in `app/router.tsx`, because
 * Giftology has its own latest-products section.
 */
export function GiftologyHome({ components }: Pick<HomePageProps, 'components'>) {
  const { settings } = useGly();
  const shown = shownSections(components, settings);
  const builtIn = sectionsAsBlocks(components).size
    ? []
    : SECTION_KINDS.filter((kind) => shown.has(kind));
  const sections = (kinds: readonly SectionKind[]) =>
    kinds.map((kind) => {
      const Section = SECTIONS[kind];
      return <Section key={kind} />;
    });
  // The hero opens the page; everything else follows the merchant's blocks.
  const before = builtIn.filter((kind) => SECTION_KINDS.indexOf(kind) < SECTIONS_BEFORE_BLOCKS);
  const after = builtIn.filter((kind) => SECTION_KINDS.indexOf(kind) >= SECTIONS_BEFORE_BLOCKS);

  return (
    <HomeSectionsProvider value={shown}>
      {sections(before)}
      <Home.Component components={components} />
      {sections(after)}
    </HomeSectionsProvider>
  );
}
