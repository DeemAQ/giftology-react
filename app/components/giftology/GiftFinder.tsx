import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { useReveal } from '../../hooks/useReveal';
import { allProductsUrl, categoryIdFromUrl, resolveCategoryUrl } from '../../lib/giftology';
import { ProductCard } from '../product';
import { useGly } from './useGly';

/** A quiz outcome: six store categories, or a custom gift ordered over WhatsApp. */
type Outcome = 'newborn' | 'kids' | 'men' | 'occasion' | 'favors' | 'cards' | 'custom';
type Category = Exclude<Outcome, 'custom'>;

/** Each answer scores one outcome. Label keys live under `blocks.gly.finder.`. */
const QUESTIONS: { q: string; options: [label: string, outcome: Outcome][] }[] = [
  {
    q: 'q1',
    options: [
      ['q1_newborn', 'newborn'],
      ['q1_kids', 'kids'],
      ['q1_men', 'men'],
      ['q1_anyone', 'occasion'],
    ],
  },
  {
    q: 'q2',
    options: [
      ['q2_birth', 'newborn'],
      ['q2_kids', 'kids'],
      ['q2_general', 'occasion'],
      ['q2_favors', 'favors'],
    ],
  },
  {
    q: 'q3',
    options: [
      ['q3_ready', 'occasion'],
      ['q3_custom', 'custom'],
      ['q3_card', 'cards'],
      ['q3_favors', 'favors'],
    ],
  },
];

/** Result card per category: emoji, title key, and the tile whose link it falls back to. */
const RESULTS: Record<Category, { emoji: string; title: string; setting: string; tile: number }> = {
  newborn: { emoji: '🧸', title: 'blocks.gly.cats.newborn', setting: 'gly_cat_newborn', tile: 1 },
  kids: { emoji: '🎈', title: 'blocks.gly.cats.kids', setting: 'gly_cat_kids', tile: 3 },
  men: { emoji: '🤵', title: 'blocks.gly.cats.men', setting: 'gly_cat_men', tile: 4 },
  occasion: { emoji: '🎁', title: 'blocks.gly.cats.occasion', setting: 'gly_cat_occasion', tile: 2 },
  favors: { emoji: '🎀', title: 'blocks.gly.cats.favors', setting: 'gly_cat_favors', tile: 5 },
  cards: { emoji: '💌', title: 'blocks.gly.cats.cards', setting: 'gly_cat_cards', tile: 6 },
};

/** Breaks scoring ties: the earlier outcome wins. */
const ORDER: Category[] = ['newborn', 'kids', 'men', 'occasion', 'favors', 'cards'];

/** How many of the category's products the random pick is drawn from. */
const POOL = 24;

/** The winning category's result: one random product from it, or a link to the category. */
function CategoryResult({ outcome, seed }: { outcome: Category; seed: number }) {
  const { settings, t, homeUrl, locale } = useGly();
  const result = RESULTS[outcome];
  // The finder's own link setting, else the matching category tile's, else the all-products page.
  const url = resolveCategoryUrl(
    settings?.[result.setting] || settings?.[`gly_tile${result.tile}_link`],
    allProductsUrl(homeUrl),
    locale
  );
  const categoryId = categoryIdFromUrl(url);
  const { data, isLoading } = useQuery({
    ...product.queries.list({
      source: 'categories',
      sourceValue: categoryId ? [categoryId] : null,
      perPage: POOL,
    }),
    enabled: categoryId !== null,
  });
  const items = data?.items ?? [];
  const pick = items.length ? items[Math.floor(seed * items.length)] : null;

  return (
    <>
      <div className="em" aria-hidden="true">
        {result.emoji}
      </div>
      <b>{t(result.title)}</b>
      {categoryId !== null && isLoading ? (
        <p className="gly-qloading" role="status">
          {t('blocks.gly.finder.loading')}
        </p>
      ) : pick ? (
        <div className="gly-qpwrap">
          <ProductCard product={pick} layout="vertical" />
        </div>
      ) : (
        <>
          <p>{t(`blocks.gly.finder.r_${outcome}`)}</p>
          <Link className="gly-btn gly-btn-primary gly-btn-block" to={url}>
            {t('blocks.gly.finder.shop')}
          </Link>
        </>
      )}
    </>
  );
}

/**
 * Gift finder: three questions, each answer scoring a category. The result is a
 * random product from the winning category (read from the `/c{id}` in its link),
 * or a link to that category when no product can be shown. Choosing "custom gift"
 * at any point ends the quiz with the WhatsApp custom-order result.
 */
export function GiftFinder() {
  const { t, whatsappCustom } = useGly();
  const reveal = useReveal();
  const [answers, setAnswers] = useState<Outcome[]>([]);
  // Drawn when the quiz ends, so the pick doesn't change between renders.
  const [seed, setSeed] = useState(0);
  const f = (key: string) => t(`blocks.gly.finder.${key}`);

  const custom = answers.includes('custom');
  const finished = custom || answers.length >= QUESTIONS.length;
  const winner = useMemo<Category>(() => {
    let best = ORDER[0];
    let bestScore = -1;
    for (const outcome of ORDER) {
      const score = answers.filter((answer) => answer === outcome).length;
      if (score > bestScore) {
        best = outcome;
        bestScore = score;
      }
    }
    return best;
  }, [answers]);

  const answer = (outcome: Outcome) => {
    setSeed(Math.random());
    setAnswers((previous) => [...previous, outcome]);
  };
  const step = Math.min(answers.length, QUESTIONS.length - 1);
  const question = QUESTIONS[step];

  return (
    <section id="gly-finder" className="gly-section gly-quiz">
      <div className="gly-wrap">
        <div ref={reveal.ref} className={`gly-quiz-box ${reveal.className}`}>
          <svg
            className="gly-quiz__mag"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            aria-hidden="true"
          >
            <path d="M21,21L21,21c1.105-1.105,2.895-1.105,4,0l5.172,5.172c0.53,0.53,0.828,1.25,0.828,2v0C31,29.734,29.734,31,28.172,31h0c-0.75,0-1.47-0.298-2-0.828L21,25C19.895,23.895,19.895,22.105,21,21z" />
            <circle cx="11" cy="11" r="10" />
            <path d="M11,5c-3.314,0-6,2.686-6,6" />
            <line x1="18" x2="21" y1="18" y2="21" />
          </svg>
          <div>
            <span className="gly-eyebrow">{f('eyebrow')}</span>
            <h2>
              {f('title_pre')} <em>{f('title_em')}</em>
            </h2>
            <p className="gly-qlede">{f('lede')}</p>
          </div>

          <div className="gly-qcard" aria-live="polite">
            {finished ? (
              <div className="gly-qresult">
                {custom ? (
                  <>
                    <div className="em" aria-hidden="true">
                      ✨
                    </div>
                    <b>{f('custom_title')}</b>
                    <p>{f('r_custom')}</p>
                    {whatsappCustom && (
                      <a
                        className="gly-btn gly-btn-wa gly-btn-block"
                        href={whatsappCustom}
                        target="_blank"
                        rel="noopener"
                      >
                        {t('blocks.gly.custom.card_btn')}
                      </a>
                    )}
                  </>
                ) : (
                  <CategoryResult outcome={winner} seed={seed} />
                )}
                <button type="button" className="gly-restart" onClick={() => setAnswers([])}>
                  ↺ {f('restart')}
                </button>
              </div>
            ) : (
              <>
                <div className="gly-qprog" aria-hidden="true">
                  {QUESTIONS.map((item, index) => (
                    <i key={item.q} className={index <= step ? 'on' : ''} />
                  ))}
                </div>
                <span className="sr-only">
                  {f('progress')
                    .replace('{current}', String(step + 1))
                    .replace('{total}', String(QUESTIONS.length))}
                </span>
                <div className="gly-qq">{f(question.q)}</div>
                <div className="gly-qopts">
                  {question.options.map(([label, outcome]) => (
                    <button
                      key={label}
                      type="button"
                      className="gly-qopt"
                      onClick={() => answer(outcome)}
                    >
                      {f(label)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
