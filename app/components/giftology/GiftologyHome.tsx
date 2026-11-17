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
import { LatestProducts } from './LatestProducts';
import { Testimonials } from './Testimonials';
import { useGly } from './useGly';

/** The home page's sections in order, each behind its merchant switch. */
const SECTIONS: [setting: string, Section: ComponentType][] = [
  ['gly_show_hero', Hero],
  ['gly_show_latest', LatestProducts],
  ['gly_show_categories', Categories],
  ['gly_show_custom', CustomGift],
  ['gly_show_finder', GiftFinder],
  ['gly_show_how', HowItWorks],
  ['gly_show_testimonials', Testimonials],
];

/** How many sections come before the merchant's blocks, per `gly_blocks_position`. */
const SECTIONS_BEFORE_BLOCKS: Record<BlocksPosition, number> = {
  top: 0,
  after_hero: 1,
  after_latest: 2,
  bottom: SECTIONS.length,
};

/**
 * Giftology home page: the curated sections in a fixed order, with the blocks the
 * merchant adds in the theme editor shown together at one place among them
 * (`gly_blocks_position`).
 *
 * The blocks are drawn by the engine's own home page, so the editor's live preview,
 * the `home:start` / `home:content` / `home:end` slots (above and below the blocks)
 * and the "order again" row all work as in any Salla theme. With no blocks it draws
 * nothing: its latest-products fallback is switched off in `app/router.tsx`, because
 * Giftology has its own latest-products section.
 */
export function GiftologyHome({ components }: Pick<HomePageProps, 'components'>) {
  const { settings } = useGly();
  const before = SECTIONS_BEFORE_BLOCKS[blocksPosition(settings)];
  const sections = (list: typeof SECTIONS) =>
    list.map(([setting, Section]) => settingOn(settings, setting) && <Section key={setting} />);

  return (
    <>
      {sections(SECTIONS.slice(0, before))}
      <Home.Component components={components} />
      {sections(SECTIONS.slice(before))}
    </>
  );
}
