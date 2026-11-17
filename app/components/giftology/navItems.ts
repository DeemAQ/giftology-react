import { settingOn, type GlySettings } from '../../lib/giftology';

/** Home sections the header and the mobile menu link to, each behind its toggle. */
export const SECTION_LINKS = [
  { setting: 'gly_show_categories', id: 'gly-cats', label: 'blocks.gly.nav.sections' },
  { setting: 'gly_show_custom', id: 'gly-custom', label: 'blocks.gly.nav.custom' },
  { setting: 'gly_show_finder', id: 'gly-finder', label: 'blocks.gly.nav.finder' },
  { setting: 'gly_show_how', id: 'gly-how', label: 'blocks.gly.nav.how' },
  { setting: 'gly_show_testimonials', id: 'gly-testi', label: 'blocks.gly.nav.testimonials' },
] as const;

export function enabledSections(settings: GlySettings) {
  return SECTION_LINKS.filter((link) => settingOn(settings, link.setting));
}
