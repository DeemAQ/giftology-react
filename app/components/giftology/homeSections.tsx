import { createContext, useContext } from 'react';
import { settingOn } from '../../lib/giftology';
import { useGly } from './useGly';

/** The Giftology home sections, in their built-in order. Each has a `gly_show_<kind>` switch. */
export const SECTION_KINDS = [
  'hero',
  'latest',
  'categories',
  'custom',
  'finder',
  'how',
  'testimonials',
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

/** The home block (`home.<name>` in `twilight.json`) that carries each section. */
export const SECTION_BLOCKS: Record<SectionKind, string> = {
  hero: 'gly-hero',
  latest: 'gly-latest',
  categories: 'gly-circles',
  custom: 'gly-custom',
  finder: 'gly-finder',
  how: 'gly-how',
  testimonials: 'gly-testimonials',
};

const HomeSections = createContext<ReadonlySet<SectionKind> | null>(null);

/** Set by the home page to the sections it shows, built in or added as a block. */
export const HomeSectionsProvider = HomeSections.Provider;

/**
 * Which sections are on the home page, so one section links to another only when
 * it is there. Outside the home page, the sections switched on in the settings.
 */
export function useHomeSections(): ReadonlySet<SectionKind> {
  const onHome = useContext(HomeSections);
  const { settings } = useGly();
  return onHome ?? new Set(SECTION_KINDS.filter((kind) => settingOn(settings, `gly_show_${kind}`)));
}
