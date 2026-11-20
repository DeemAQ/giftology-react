import type { SectionKind } from './homeSections';

/** Home sections the header and the full-screen menu link to, while each is on the home page. */
export const SECTION_LINKS: readonly { kind: SectionKind; id: string; label: string }[] = [
  { kind: 'categories', id: 'gly-cats', label: 'blocks.gly.nav.sections' },
  { kind: 'custom', id: 'gly-custom', label: 'blocks.gly.nav.custom' },
  { kind: 'finder', id: 'gly-finder', label: 'blocks.gly.nav.finder' },
  { kind: 'how', id: 'gly-how', label: 'blocks.gly.nav.how' },
  { kind: 'testimonials', id: 'gly-testi', label: 'blocks.gly.nav.testimonials' },
];

/** The links to the sections that are on the home page. */
export function sectionLinks(shown: ReadonlySet<SectionKind>) {
  return SECTION_LINKS.filter((link) => shown.has(link.kind));
}
