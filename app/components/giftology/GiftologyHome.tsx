import type { ComponentType } from 'react';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { settingOn } from '../../lib/giftology';
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

/**
 * Giftology home page: a fixed, curated sequence of sections instead of the
 * merchant's home-block builder (as in the Twig theme, where a seeded products
 * block duplicated "Latest products"). The engine's `home:*` slots are kept so
 * installed apps can still add content.
 */
export function GiftologyHome() {
  const { settings } = useGly();
  return (
    <>
      <HookSlot name="home:start" />
      <HookSlot name="home:content" />
      {SECTIONS.map(
        ([setting, Section]) => settingOn(settings, setting) && <Section key={setting} />
      )}
      <HookSlot name="home:end" />
    </>
  );
}
