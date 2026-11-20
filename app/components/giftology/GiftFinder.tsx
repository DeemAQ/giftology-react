import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useReveal } from '../../hooks/useReveal';
import { blockCopy, choiceValue, whatsappLink } from '../../lib/giftology';
import type { BlockData } from '../../lib/giftology';
import {
  SUGGESTIONS_SHOWN,
  budgetBands,
  categoryNumericId,
  childrenOf,
  offered,
  priceOf,
  inStock,
  suggestionRound,
  suggestions,
} from '../../lib/giftFinder';
import type { BudgetBand, CategoryNode } from '../../lib/giftFinder';
import { ProductCard } from '../product';
import { categoryTreeQuery } from './categoryTree';
import { SparkIcon } from './icons';
import { useGly } from './useGly';

/** How many of a category's best sellers the budget ranges and the suggestions are drawn from. */
const POOL = 24;

/** The orders the block can suggest products in; the first is used unless it picks another. */
const SORTS = ['bestSell', 'ourSuggest', 'topRated'];

/** One category's products in the chosen order: what the budget question and the answer are built from. */
export const finderProductsQuery = (categoryId: number, sort = SORTS[0]) =>
  product.queries.list({
    source: 'categories',
    sourceValue: [categoryId],
    sort,
    perPage: POOL,
  });

/** A sentence with `{name}` slots, each filled with text or a formatted price. */
function fill(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{[a-z_]+\})/).map((piece, index) => {
    const name = piece.match(/^\{([a-z_]+)\}$/)?.[1];
    // The pieces of one sentence, always in the same order.
    return <Fragment key={index}>{name && name in parts ? parts[name] : piece}</Fragment>;
  });
}

type Step = 'category' | 'kind' | 'budget' | 'result';

/**
 * Gift finder. It asks up to three questions and suggests gifts that fit:
 *
 * 1. what the visitor is looking for: the store's top-level categories, plus
 *    "a custom gift", which always ends on the custom-order answer with its
 *    WhatsApp button (the block can switch it off; it needs a number to chat with).
 *    The same offer sits beside the suggestions, where it opens the chat directly;
 * 2. which kind: the chosen category's subcategories (skipped when it has none);
 * 3. the budget: ranges worked out from that category's real prices (skipped when
 *    its products are too few or cost the same).
 *
 * The answer is up to three in-stock products that fit, best sellers first unless
 * the block picks another order, with "show others" and a link to the whole
 * category. Nothing is set up by hand: the questions follow the category tree, so
 * they change when the merchant changes the categories. The finder block can leave
 * categories out (`exclude`) and reword every text: a field named like a text's
 * locale key (`q_budget`, `others`, `back`) replaces it.
 */
export function GiftFinder({ data }: { data?: BlockData }) {
  const { t, whatsappCustom, whatsappNumber, locale } = useGly();
  const { format } = useMoney();
  const reveal = useReveal();
  // A block field the merchant filled, else the theme's own text.
  const own = (key: string) => blockCopy(data, key, locale) || t(`blocks.gly.finder.${key}`);
  const f = own;
  // "A custom gift": on unless the block switches it off, and only with a number to chat with.
  const message = blockCopy(data, 'wa_message', locale);
  const chat = message ? whatsappLink(whatsappNumber, message) : whatsappCustom;
  const offerCustom = data?.show_custom !== false && !!chat;
  const chosenSort = choiceValue(data?.sort);
  const sort = SORTS.includes(chosenSort) ? chosenSort : SORTS[0];

  const [top, setTop] = useState<CategoryNode | null>(null);
  // The subcategory picked in question 2; `'all'` keeps the whole category.
  const [kind, setKind] = useState<CategoryNode | 'all' | null>(null);
  const [budget, setBudget] = useState<BudgetBand | 'any' | null>(null);
  const [custom, setCustom] = useState(false);
  const [round, setRound] = useState(0);

  const { data: tree, isLoading: treeLoading } = useQuery(categoryTreeQuery());
  // The categories the merchant left out in the finder block.
  const excluded = Array.isArray(data?.exclude) ? (data.exclude as Partial<CategoryNode>[]) : [];
  const categories = offered(tree as CategoryNode[] | undefined, excluded);
  const kinds = offered(childrenOf(top), excluded);

  // The category the suggestions come from, once the visitor has narrowed it down.
  const target = top && (kinds.length === 0 || kind === 'all') ? top : kind !== 'all' ? kind : null;
  const targetId = categoryNumericId(target);
  const { data: listing, isLoading } = useQuery({
    ...finderProductsQuery(targetId ?? 0, sort),
    enabled: targetId !== null,
  });
  const available = useMemo(() => (listing?.items ?? []).filter(inStock), [listing]);
  const bands = useMemo(
    () => budgetBands(available.map(priceOf).filter((price): price is number => price !== null)),
    [available]
  );

  const loading = target !== null && targetId !== null && isLoading;
  const step: Step = custom
    ? 'result'
    : !top
      ? 'category'
      : !target
        ? 'kind'
        : !loading && bands.length > 0 && budget === null
          ? 'budget'
          : 'result';

  // Move focus to the new question or the answer, so a keyboard or screen-reader
  // user is not left on a button that has just gone. Not on the first render.
  const heading = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step, loading]);
  const move = (change: () => void) => {
    moved.current = true;
    change();
  };

  const restart = () =>
    move(() => {
      setTop(null);
      setKind(null);
      setBudget(null);
      setCustom(false);
      setRound(0);
    });
  const back = () =>
    move(() => {
      setRound(0);
      if (custom) return setCustom(false);
      if (step === 'result' && budget !== null) return setBudget(null);
      if (kind !== null) {
        setBudget(null);
        return setKind(null);
      }
      setBudget(null);
      setTop(null);
    });

  // Nothing to ask about: a store with no categories yet and no custom orders.
  if (!treeLoading && !categories.length && !offerCustom) return null;

  const band = budget && budget !== 'any' ? budget : null;
  const matches = suggestions(available, band);
  const picks = suggestionRound(matches, round);
  const money = (amount: number | null) => (amount === null ? '' : format(amount));
  const bandLabel = (item: BudgetBand) =>
    fill(f(`budget_${item.id}`), { min: money(item.min), max: money(item.max) });

  // Questions asked so far and still to come; the budget question counts until the prices say otherwise.
  const willAskKind = top ? kinds.length > 0 : categories.some((node) => childrenOf(node).length > 0);
  const total = 1 + (willAskKind ? 1 : 0) + 1;
  const current = step === 'category' ? 1 : step === 'kind' ? 2 : total;

  const question =
    step === 'category'
      ? own('q_category')
      : step === 'kind'
        ? own('q_kind').replace('{category}', top?.name ?? '')
        : own('q_budget');

  return (
    <section id="gly-finder" className="gly-section gly-quiz">
      <div className="gly-wrap">
        <div
          ref={reveal.ref}
          className={`gly-quiz-box${step === 'result' && !custom ? ' gly-quiz-box--answer' : ''} ${reveal.className}`}
        >
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
            <span className="gly-eyebrow">{own('eyebrow')}</span>
            <h2>
              {own('title_pre')} <em>{own('title_em')}</em>
            </h2>
            <p className="gly-qlede">{own('lede')}</p>
          </div>

          <div className="gly-qcard">
            {step === 'result' ? (
              <div className="gly-qresult">
                {custom ? (
                  <>
                    <div className="em" aria-hidden="true">
                      <SparkIcon />
                    </div>
                    <div ref={heading} tabIndex={-1} className="gly-qhead">
                      <b>{f('custom_title')}</b>
                    </div>
                    <p>{f('r_custom')}</p>
                    {chat && (
                      <a className="gly-btn gly-btn-wa gly-btn-block" href={chat} target="_blank" rel="noopener">
                        {f('custom_btn')}
                      </a>
                    )}
                  </>
                ) : loading ? (
                  <p ref={heading} tabIndex={-1} className="gly-qloading" role="status">
                    {f('loading')}
                  </p>
                ) : (
                  <>
                    <div ref={heading} tabIndex={-1} className="gly-qhead">
                      <b>{f('result_title').replace('{category}', target?.name ?? '')}</b>
                    </div>
                    {picks.length > 0 ? (
                      <div className="gly-qpicks">
                        {picks.map((item) => (
                          <ProductCard key={item.id} product={item} layout="vertical" />
                        ))}
                      </div>
                    ) : (
                      <p>{f('empty')}</p>
                    )}
                    <div className="gly-qactions">
                      {matches.length > SUGGESTIONS_SHOWN && (
                        <button
                          type="button"
                          className="gly-btn gly-btn-ghost"
                          onClick={() => setRound((value) => value + 1)}
                        >
                          {f('others')}
                        </button>
                      )}
                      {target && (
                        <Link className="gly-btn gly-btn-primary" to={target.url}>
                          {f('see_all').replace('{category}', target.name)}
                        </Link>
                      )}
                      {/* Beside the suggestions the visitor has already seen what there is: straight to the chat. */}
                      {offerCustom && (
                        <a className="gly-btn gly-btn-ghost" href={chat} target="_blank" rel="noopener">
                          <SparkIcon />
                          {f('or_custom')}
                        </a>
                      )}
                    </div>
                  </>
                )}
                <div className="gly-qnav">
                  <button type="button" className="gly-restart" onClick={back}>
                    {f('back')}
                  </button>
                  <button type="button" className="gly-restart" onClick={restart}>
                    ↺ {f('restart')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="gly-qprog" aria-hidden="true">
                  {Array.from({ length: total }, (_, index) => (
                    <i key={index} className={index < current ? 'on' : ''} />
                  ))}
                </div>
                <span className="sr-only">
                  {f('progress')
                    .replace('{current}', String(current))
                    .replace('{total}', String(total))}
                </span>
                <div ref={heading} tabIndex={-1} className="gly-qq">
                  {question}
                </div>
                <div className="gly-qopts">
                  {step === 'category' && treeLoading && (
                    <p className="gly-qloading" role="status">
                      {f('loading')}
                    </p>
                  )}
                  {step === 'category' && !treeLoading && (
                    <>
                      {categories.map((node) => (
                        <button
                          key={String(node.id)}
                          type="button"
                          className="gly-qopt"
                          onClick={() => move(() => setTop(node))}
                        >
                          {node.name}
                        </button>
                      ))}
                      {offerCustom && (
                        <button
                          type="button"
                          className="gly-qopt gly-qopt--custom"
                          onClick={() => move(() => setCustom(true))}
                        >
                          <SparkIcon />
                          {f('opt_custom')}
                        </button>
                      )}
                    </>
                  )}
                  {step === 'kind' && (
                    <>
                      {kinds.map((node) => (
                        <button
                          key={String(node.id)}
                          type="button"
                          className="gly-qopt"
                          onClick={() => move(() => setKind(node))}
                        >
                          {node.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="gly-qopt"
                        onClick={() => move(() => setKind('all'))}
                      >
                        {f('kind_all').replace('{category}', top?.name ?? '')}
                      </button>
                    </>
                  )}
                  {step === 'budget' && (
                    <>
                      {bands.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="gly-qopt"
                          onClick={() => move(() => setBudget(item))}
                        >
                          {bandLabel(item)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="gly-qopt"
                        onClick={() => move(() => setBudget('any'))}
                      >
                        {f('budget_any')}
                      </button>
                    </>
                  )}
                </div>
                {step !== 'category' && (
                  <div className="gly-qnav">
                    <button type="button" className="gly-restart" onClick={back}>
                      {f('back')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
