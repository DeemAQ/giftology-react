/**
 * The rows the Giftology home blocks arrive with in the theme editor, so the merchant
 * sees the ready-made figures and steps and edits them instead of starting from an
 * empty list. `twilight.json` carries the same rows as each list's default `value`,
 * written in Arabic (the editor's language).
 *
 * A row text that still equals its Arabic default counts as untouched: the page shows
 * the theme's own wording for the visitor's language (`locales/*.json`), so the
 * English page is not left with Arabic text. `tests/lib/glyDefaults.test.ts` keeps
 * this file, `twilight.json` and `locales/ar.json` in step.
 */

/** One ready-made row: field id to the locale key of its text. */
export type DefaultRow = Record<string, string>;

/** The ready-made rows of each list, by `<block>.<list>`. */
export const DEFAULT_ROWS: Record<string, DefaultRow[]> = {
  'hero.stats': [
    { value: 'blocks.gly.hero.stat_gifts_value', label: 'blocks.gly.hero.stat_gifts' },
    { value: 'blocks.gly.hero.stat_occasions_value', label: 'blocks.gly.hero.stat_occasions' },
    { value: 'blocks.gly.hero.stat_rating_value', label: 'blocks.gly.hero.stat_rating' },
    { value: 'blocks.gly.hero.stat_since_value', label: 'blocks.gly.hero.stat_since' },
  ],
  'custom.steps': [
    { title: 'blocks.gly.custom.step1_t', text: 'blocks.gly.custom.step1_d' },
    { title: 'blocks.gly.custom.step2_t', text: 'blocks.gly.custom.step2_d' },
    { title: 'blocks.gly.custom.step3_t', text: 'blocks.gly.custom.step3_d' },
  ],
  'how.steps': [
    { title: 'blocks.gly.how.discover_t', text: 'blocks.gly.how.discover_d' },
    { title: 'blocks.gly.how.pick_t', text: 'blocks.gly.how.pick_d' },
    { title: 'blocks.gly.how.wrap_t', text: 'blocks.gly.how.wrap_d' },
    { title: 'blocks.gly.how.deliver_t', text: 'blocks.gly.how.deliver_d' },
  ],
};

/** The Arabic wording of every ready-made row text, by locale key. */
export const DEFAULT_TEXTS_AR: Record<string, string> = {
  'blocks.gly.hero.stat_gifts_value': '+12 ألف',
  'blocks.gly.hero.stat_gifts': 'هدية تم توصيلها',
  'blocks.gly.hero.stat_occasions_value': '+40',
  'blocks.gly.hero.stat_occasions': 'مناسبة مختلفة',
  'blocks.gly.hero.stat_rating_value': '4.9★',
  'blocks.gly.hero.stat_rating': 'تقييم العملاء',
  'blocks.gly.hero.stat_since_value': '2018',
  'blocks.gly.hero.stat_since': 'نخدمكم منذ',
  'blocks.gly.custom.step1_t': 'تواصل معنا بفكرتك',
  'blocks.gly.custom.step1_d': 'أخبرنا عن المناسبة، الميزانية، وما يحبّه الشخص.',
  'blocks.gly.custom.step2_t': 'نرسل لك عرض السعر',
  'blocks.gly.custom.step2_d': 'تفاصيل واضحة قبل تأكيد الطلب.',
  'blocks.gly.custom.step3_t': 'نصنع ونغلّف ونوصّل',
  'blocks.gly.custom.step3_d': 'هدية مخصّصة بالكامل تصل إلى بابهم.',
  'blocks.gly.how.discover_t': 'نكتشف',
  'blocks.gly.how.discover_d': 'أخبرنا عن المناسبة، الشخص، والميزانية.',
  'blocks.gly.how.pick_t': 'ننتقي',
  'blocks.gly.how.pick_d': 'نختار قطعاً يحبّونها فعلاً ويتذكّرونها.',
  'blocks.gly.how.wrap_t': 'نغلّف',
  'blocks.gly.how.wrap_d': 'بشريطة مميزة وبطاقة شخصية بلمسة فاخرة.',
  'blocks.gly.how.deliver_t': 'نوصّل',
  'blocks.gly.how.deliver_d': 'تصل إلى بابهم في الوقت المناسب تماماً.',
};

const KEY_BY_TEXT = new Map(Object.entries(DEFAULT_TEXTS_AR).map(([key, text]) => [text, key]));

/**
 * The locale key of a ready-made row text the merchant left as it came, or
 * `undefined` for a text they wrote themselves.
 */
export function defaultTextKey(text: string): string | undefined {
  return KEY_BY_TEXT.get(text.trim());
}
