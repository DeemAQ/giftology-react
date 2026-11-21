import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { home } from '@salla.sa/twilight-theme-engine/api/home';
import { settingOn } from '../../lib/giftology';
import type { GlySettings } from '../../lib/giftology';
import { usePlacedBlocks } from './devPreview';
import type { PlacedBlocks } from './devPreview';
import { useGly } from './useGly';

/** The Giftology home sections, in their built-in order. */
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


/** The sections the merchant placed as home blocks (`home.gly-*`). */
export function sectionsAsBlocks(components: PlacedBlocks): Set<SectionKind> {
  const names = new Set((components ?? []).map((block) => String(block.path).replace(/^home\./, '')));
  return new Set(SECTION_KINDS.filter((kind) => names.has(SECTION_BLOCKS[kind])));
}

/**
 * The sections the home page shows.
 *
 * The home tab of the theme editor is where the page is built. Once it holds any
 * Giftology block, the page is exactly the blocks placed there. Until then the page
 * is the seven built-in sections, so a store that has set nothing up still has a
 * full home page. (A `gly_show_<kind>` switch saved by the earlier Twig theme still
 * hides its built-in section; the switches are no longer offered in the editor.)
 */
export function shownSections(components: PlacedBlocks, settings: GlySettings): Set<SectionKind> {
  const placed = sectionsAsBlocks(components);
  if (placed.size) return placed;
  return new Set(SECTION_KINDS.filter((kind) => settingOn(settings, `gly_show_${kind}`)));
}

const HomeSections = createContext<ReadonlySet<SectionKind> | null>(null);

/** Set by the home page to the sections it shows. */
export const HomeSectionsProvider = HomeSections.Provider;

/**
 * Which sections are on the home page, so a link to one shows only when it is there:
 * the hero's buttons, the header's links, the full-screen menu.
 *
 * Inside the home page this is what the page itself worked out. Elsewhere (the
 * header, an inner page) it is read from the home blocks the visitor's browser
 * already holds; without them, the built-in sections are assumed.
 */
export function useHomeSections(): ReadonlySet<SectionKind> {
  const onHome = useContext(HomeSections);
  const { settings } = useGly();
  // Never fetches: the home route's loader fills this query; other pages only read it.
  const { data: cached } = useQuery({ ...home.queries.components(), enabled: false });
  const placed = usePlacedBlocks(cached);
  return onHome ?? shownSections(placed, settings);
}
