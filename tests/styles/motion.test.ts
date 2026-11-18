// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as sass from 'sass';
import postcss, { type AtRule, type Rule } from 'postcss';

const styles = new URL('../../app/styles/', import.meta.url);
const compile = (file: string) => postcss.parse(sass.compile(fileURLToPath(new URL(file, styles))).css);

const home = compile('giftology/_home.scss');

/** Rules inside `@media (prefers-reduced-motion: reduce)`. */
function reducedMotionRules(root: postcss.Root): Rule[] {
  const rules: Rule[] = [];
  root.walkAtRules('media', (media: AtRule) => {
    if (media.params.includes('prefers-reduced-motion: reduce')) media.walkRules((rule) => void rules.push(rule));
  });
  return rules;
}

const reduced = reducedMotionRules(home);

/** What the reduced-motion block sets `prop` to for `selector`. */
function whenReduced(selector: string, prop: string): string | undefined {
  let value: string | undefined;
  reduced
    .filter((rule) => rule.selectors.includes(selector))
    .forEach((rule) => rule.walkDecls(prop, (d) => void (value = d.value)));
  return value;
}

describe('reduce motion', () => {
  it('stops every animation that loops forever, except the loading spinner', () => {
    const looping: string[] = [];
    home.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && (rule.parent as AtRule).name === 'keyframes') return;
      rule.walkDecls('animation', (d) => {
        if (d.value.includes('infinite')) looping.push(...rule.selectors);
      });
    });
    expect(looping.length).toBeGreaterThan(5);

    const stopped = reduced
      .filter((rule) =>
        rule.some((node) => node.type === 'decl' && ((node.prop === 'animation' && node.value === 'none') || (node.prop === 'display' && node.value === 'none')))
      )
      .flatMap((rule) => rule.selectors);
    // `.gly-blob` covers `.gly-blob.teal`: the stopped class is one of the selector's classes.
    const isStopped = (selector: string) =>
      stopped.some((s) => selector.split(/(?=[.:])/).includes(s));

    const stillLooping = looping.filter((selector) => !isStopped(selector));
    // It tells the visitor the gift finder is working.
    expect(stillLooping).toEqual(['.gly-qloading::before']);
  });

  it('shows the sections without fading or sliding them in', () => {
    for (const selector of ['.gly-reveal', '.gly-reveal.in']) {
      expect(whenReduced(selector, 'opacity')).toBe('1');
      expect(whenReduced(selector, 'transform')).toBe('none');
      expect(whenReduced(selector, 'transition')).toBe('none');
    }
  });

  it('opens the full-screen menu without sliding it across', () => {
    expect(whenReduced('.gly-mmenu', 'transition')).toBe('none');
    expect(whenReduced('.gly-mmenu.open', 'transition')).toBe('none');
  });

  it('jumps to an in-page link instead of scrolling smoothly', () => {
    const common = compile('02-generic/common.scss');
    const html = reducedMotionRules(common).find((rule) => rule.selector === 'html');
    let behaviour: string | undefined;
    html?.walkDecls('scroll-behavior', (d) => void (behaviour = d.value));
    expect(behaviour).toBe('auto');
  });
});
