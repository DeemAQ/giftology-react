import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useReveal } from '../../app/hooks/useReveal';

function Block({ initiallyShown = false }: { initiallyShown?: boolean }) {
  const reveal = useReveal(initiallyShown);
  return <div ref={reveal.ref} data-testid="block" className={reveal.className} />;
}

let observed: Map<Element, IntersectionObserverCallback>;

/** Places every element `top` px from the top of an 800px-tall screen. */
function placeAt(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
}

function scrollIntoView(el: Element) {
  act(() => {
    observed.get(el)?.([{ target: el, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

beforeEach(() => {
  observed = new Map();
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(el: Element) {
        observed.set(el, this.callback);
      }
      disconnect() {}
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useReveal', () => {
  it('sends every block visible in the server HTML', () => {
    expect(renderToString(<Block />)).toContain('class="gly-reveal in"');
  });

  it('hides a block below the screen, then reveals it when it scrolls into view', () => {
    placeAt(1400);
    const { getByTestId } = render(<Block />);
    const block = getByTestId('block');
    expect(block.className).toBe('gly-reveal');

    scrollIntoView(block);
    expect(block.className).toBe('gly-reveal in');
  });

  it('leaves a block that is already on screen alone', () => {
    placeAt(300);
    const { getByTestId } = render(<Block />);
    expect(getByTestId('block').className).toBe('gly-reveal in');
    expect(observed.size).toBe(0);
  });

  it('never hides a block that opted out', () => {
    placeAt(1400);
    const { getByTestId } = render(<Block initiallyShown />);
    expect(getByTestId('block').className).toBe('gly-reveal in');
    expect(observed.size).toBe(0);
  });

  it('keeps blocks visible in a browser without IntersectionObserver', () => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'IntersectionObserver');
    placeAt(1400);
    const { getByTestId } = render(<Block />);
    expect(getByTestId('block').className).toBe('gly-reveal in');
  });
});
