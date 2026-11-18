import type { ComponentType } from 'react';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import type { HomePageProps } from '@salla.sa/twilight-theme-engine/routes/home';
import { blocksPosition, settingOn } from '../../lib/giftology';
import type { BlocksPosition } from '../../lib/giftology';
import { Categories } from './Categories';
import { CustomGift } from './CustomGift';
import { GiftFinder } from './GiftFinder';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { HomeSectionsProvider, SECTION_BLOCKS, SECTION_KINDS } from './homeSections';
import type { SectionKind } from './homeSections';
import { LatestProducts } from './LatestProducts';
import { Testimonials } from './Testimonials';
import { useGly } from './useGly';

/** The home page's built-in sections in order. */
const SECTIONS: Record<SectionKind, ComponentType> = {
  hero: Hero,
  latest: LatestProducts,
  categories: Categories,
  custom: CustomGift,
  finder: GiftFinder,
  how: HowItWorks,
  testimonials: Testimonials,
};

/** How many built-in sections come before the merchant's blocks, per `gly_blocks_position`. */
const SECTIONS_BEFORE_BLOCKS: Record<BlocksPosition, number> = {
  top: 0,
  after_hero: 1,
  after_latest: 2,
  bottom: SECTION_KINDS.length,
};

/** The sections the merchant added as home blocks (`home.gly-*`). */
function sectionsAsBlocks(components: HomePageProps['components']): Set<SectionKind> {
  const names = new Set((components ?? []).map((block) => String(block.path).replace(/^home\./, '')));
  return new Set(SECTION_KINDS.filter((kind) => names.has(SECTION_BLOCKS[kind])));
}

/**
 * Giftology home page.
 *
 * With nothing added in the theme editor it is the seven built-in sections in a fixed
 * order, each behind its `gly_show_*` switch. The blocks the merchant adds in the
 * editor's home tab show together at one place among them (`gly_blocks_position`).
 *
 * Each section is also a home block (`home.gly-*`, `blocks.tsx`). Adding one replaces
 * the built-in section of that kind: it shows where the merchant put it, with the
 * texts and lists typed in the block. A home made only of blocks is fully the
 * merchant's order.
 *
 * The blocks are drawn by the engine's own home page, so the editor's live preview,
 * the `home:start` / `home:content` / `home:end` slots (above and below the blocks)
 * and the "order again" row all work as in any Salla theme. With no blocks it draws
 * nothing: its latest-products fallback is switched off in `app/router.tsx`, because
 * Giftology has its own latest-products section.
 */
export function GiftologyHome({ components }: Pick<HomePageProps, 'components'>) {
  const { settings } = useGly();
  const asBlocks = sectionsAsBlocks(components);
  const builtIn = (kind: SectionKind) => !asBlocks.has(kind) && settingOn(settings, `gly_show_${kind}`);
  const shown = new Set(SECTION_KINDS.filter((kind) => asBlocks.has(kind) || builtIn(kind)));

  const before = SECTIONS_BEFORE_BLOCKS[blocksPosition(settings)];
  const sections = (kinds: readonly SectionKind[]) =>
    kinds.filter(builtIn).map((kind) => {
      const Section = SECTIONS[kind];
      return <Section key={kind} />;
    });

  return (
    <HomeSectionsProvider value={shown}>
      {sections(SECTION_KINDS.slice(0, before))}
      <Home.Component components={components} />
      {sections(SECTION_KINDS.slice(before))}
    </HomeSectionsProvider>
  );
}
