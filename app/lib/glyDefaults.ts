/**
 * The rows the Giftology home blocks arrive with in the theme editor, so the merchant
 * sees the ready-made figures, cards and steps and edits them instead of starting
 * from an empty list. `twilight.json` carries the same rows as each list's default
 * `value`: every text in Arabic (`field`) and in English (`field_en`).
 *
 * A row whose English box is empty but whose Arabic is still the ready-made text is
 * shown from the locale files on an English page, so it is never left with Arabic
 * (`rowText` in `giftology.ts`). `tests/lib/glyDefaults.test.ts` keeps this file,
 * `twilight.json` and the locale files in step.
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
  'hero.cards': [
    { title: 'blocks.gly.hero.mini_wrap_t', text: 'blocks.gly.hero.mini_wrap_d' },
    { title: 'blocks.gly.hero.mini_fast_t', text: 'blocks.gly.hero.mini_fast_d' },
    { title: 'blocks.gly.hero.mini_card_t', text: 'blocks.gly.hero.mini_card_d' },
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
  'blocks.gly.hero.mini_wrap_t': 'تغليف يدوي',
  'blocks.gly.hero.mini_wrap_d': 'بأيدي فنانينا',
  'blocks.gly.hero.mini_fast_t': 'توصيل سريع',
  'blocks.gly.hero.mini_fast_d': 'داخل الرياض',
  'blocks.gly.hero.mini_card_t': 'بطاقة مجانية',
  'blocks.gly.hero.mini_card_d': 'رسالة شخصية',
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
