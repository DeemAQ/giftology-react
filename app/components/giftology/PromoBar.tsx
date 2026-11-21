import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { settingCopy, settingOn } from '../../lib/giftology';
import { HOME_ROUTE_ID } from '../../lib/routeIds';
import { useGly } from './useGly';

const PROMO_SETTINGS = ['gly_promo_1', 'gly_promo_2', 'gly_promo_3'] as const;
const PROMO_DEFAULTS = [
  'blocks.gly.promo.wrap',
  'blocks.gly.promo.fast',
  'blocks.gly.promo.shipping',
] as const;

/** How far the phrases travel each second when they move, in pixels. */
const SPEED = 45;
/** The gap between the end of the phrases and their next pass, in pixels (2.5rem in the stylesheet). */
const GAP = 40;
/** Room the closing ✦ needs when the phrases stand still, in pixels. */
const END_MARK = 24;

/**
 * Top promo bar. Shows the phrases the merchant filled in for the page's language
 * (`gly_promo_1..3`, and `gly_promo_1_en..3_en` for English), or the three curated
 * ones when all are empty; the last of several is emphasised.
 *
 * Every phrase shows on every screen. Where they fit on one line they stand still,
 * centred. Where they do not (a phone, mostly) they travel across the bar in a loop,
 * so the bar stays one line and nothing is left out; a second copy follows the first
 * to close the loop, hidden from screen readers. The bar measures itself to tell the
 * two cases apart. Before it has, the stylesheet assumes a phone needs them to move.
 * The loop pauses under a pointer or a held finger, and a visitor who asked for less
 * motion gets the phrases wrapped onto lines instead.
 * `gly_show_promo` turns the bar off. On a phone it shows on the home page only:
 * every other page already opens with the logo bar and its own title bar, and a third
 * bar above them left a fifth of the screen gone before any content.
 */
export function PromoBar() {
  const { settings, t, locale } = useGly();
  const bar = useRef<HTMLElement>(null);
  const run = useRef<HTMLSpanElement>(null);
  // `null` until measured in the browser.
  const [fits, setFits] = useState<boolean | null>(null);
  const [seconds, setSeconds] = useState(0);
  // The route match, which the server and the client agree on.
  const isHome = useRouterState({
    select: (state) => state.matches.some((match) => match.routeId === HOME_ROUTE_ID),
  });

  const on = settingOn(settings, 'gly_show_promo');
  // The phrases typed for this language (`gly_promo_N`, or `gly_promo_N_en` in English).
  const filled = PROMO_SETTINGS.map((id) => settingCopy(settings, id, locale)).filter(Boolean);
  const phrases = filled.length ? filled : PROMO_DEFAULTS.map((key) => t(key));
  const text = phrases.join('\n');

  useEffect(() => {
    const frame = bar.current;
    const words = run.current;
    if (!frame || !words) return;
    const measure = () => {
      const style = getComputedStyle(frame);
      const room = frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const width = words.getBoundingClientRect().width;
      // Nothing is laid out (a hidden bar): leave the stylesheet's guess in place.
      if (!(room > 0) || !(width > 0)) return;
      setFits(width + END_MARK <= room);
      setSeconds(Math.round((width + GAP) / SPEED));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(words);
    return () => observer.disconnect();
  }, [text]);

  if (!on) return null;

  const group = (copy: boolean) => (
    <div className="gly-topbar__group" aria-hidden={copy || undefined}>
      <span className="gly-topbar__run" ref={copy ? undefined : run}>
        <span aria-hidden="true">✦&nbsp;</span>
        {phrases.map((phrase, index) => (
          <span key={phrase} className="gly-topbar__phrase">
            {index > 0 && <span aria-hidden="true"> &nbsp;·&nbsp; </span>}
            {phrases.length > 1 && index === phrases.length - 1 ? <b>{phrase}</b> : phrase}
          </span>
        ))}
      </span>
      {/* Closes the line when the phrases stand still; a moving line needs no end. */}
      <span className="gly-topbar__end" aria-hidden="true">
        &nbsp;✦
      </span>
    </div>
  );

  const state = fits === null ? '' : fits ? ' gly-topbar--still' : ' gly-topbar--moving';
  return (
    <aside
      ref={bar}
      className={`gly-topbar${isHome ? '' : ' gly-topbar--inner'}${phrases.length > 1 ? ' gly-topbar--many' : ''}${state}`}
      aria-label={t('blocks.gly.promo.label')}
      style={seconds ? ({ '--gly-ticker': `${seconds}s` } as CSSProperties) : undefined}
    >
      <div className="gly-topbar__track">
        {group(false)}
        {group(true)}
      </div>
    </aside>
  );
}
