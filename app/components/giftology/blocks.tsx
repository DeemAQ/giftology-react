import type { ComponentType } from 'react';
import type { BlockData } from '../../lib/giftology';
import { Categories } from './Categories';
import { CustomGift } from './CustomGift';
import { GiftFinder } from './GiftFinder';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { LatestProducts } from './LatestProducts';
import { Testimonials } from './Testimonials';

type Section = ComponentType<{ data?: BlockData }>;

/** A home block that draws a Giftology section with the fields filled in the editor. */
function asBlock(Section: Section) {
  return function GlyBlock({ data }: { data: Record<string, unknown> }) {
    return <Section data={data} />;
  };
}

/**
 * The Giftology sections as home blocks, keyed by block name (`home.<name>` in
 * `twilight.json`, `SECTION_BLOCKS` in `homeSections.tsx`). Registered in `app/router.tsx`.
 */
export const glyHomeBlocks = {
  'gly-hero': asBlock(Hero),
  'gly-latest': asBlock(LatestProducts),
  'gly-circles': asBlock(Categories),
  'gly-custom': asBlock(CustomGift),
  'gly-finder': asBlock(GiftFinder),
  'gly-how': asBlock(HowItWorks),
  'gly-testimonials': asBlock(Testimonials),
};

/**
 * The wrapper the engine puts around each block: no starter spacing (the sections
 * bring their own), no reserved height (the engine's default 400px would be held
 * until the page becomes interactive, then let go), and drawn with the page instead
 * of on scroll, so the in-page links (`#gly-cats`, `#gly-how`) always have a target.
 */
export const glyHomeBlockConfig = Object.fromEntries(
  Object.keys(glyHomeBlocks).map((name) => [
    name,
    { className: 'gly-block', height: '0px', renderOnMount: true },
  ])
);
