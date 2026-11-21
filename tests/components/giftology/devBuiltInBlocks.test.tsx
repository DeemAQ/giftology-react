import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const NAMES = [
  'gly-hero',
  'gly-latest',
  'gly-circles',
  'gly-custom',
  'gly-finder',
  'gly-how',
  'gly-testimonials',
];

vi.mock('virtual:twilight/schema', () => ({
  default: {
    settings: [],
    settingsDefaults: {},
    components: NAMES.map((name) => ({
      path: `home.${name}`,
      key: `key-${name}`,
      title: name,
      fields: [],
    })),
    componentDefaults: Object.fromEntries(
      NAMES.map((name) => [`home.${name}`, { title: `default ${name}` }])
    ),
    blockDefaults: { 'home.gly-how': { steps: [{ title: 'one' }] } },
  },
}));

const { BUILT_IN_BLOCKS, useDevBuiltInBlocks } =
  await import('../../../app/components/giftology/devPreview');
const { SECTION_BLOCKS, SECTION_KINDS } =
  await import('../../../app/components/giftology/homeSections');

const run = (components: { path?: unknown }[] | undefined) =>
  renderHook(() => useDevBuiltInBlocks(components)).result.current;

describe('useDevBuiltInBlocks (local dev server only)', () => {
  it('lists the same blocks, in the same order, as the built-in sections', () => {
    expect(BUILT_IN_BLOCKS).toEqual(SECTION_KINDS.map((kind) => SECTION_BLOCKS[kind]));
  });

  it('hands over the seven sections as blocks, filled with their defaults', () => {
    const blocks = run([]) as Record<string, unknown>[];
    // Spelled as the home loader spells Salla's blocks: without `home.`.
    expect(blocks.map((block) => block.path)).toEqual(NAMES);
    expect(blocks[0]).toMatchObject({ key: 'key-gly-hero', title: 'default gly-hero' });
    // A block's own defaults (its filled lists) win over the component's.
    expect(blocks[5]).toEqual({
      key: 'key-gly-how',
      steps: [{ title: 'one' }],
      path: 'gly-how',
    });
  });

  it('puts the store blocks after the seven', () => {
    const blocks = run([{ path: 'slider' }]) as { path?: unknown }[];
    expect(blocks.map((block) => block.path)).toEqual([...NAMES, 'slider']);
  });

  it('leaves the list alone once a Giftology block is placed', () => {
    const placed = [{ path: 'gly-finder' }];
    expect(run(placed)).toBe(placed);
  });

  it('copes with no list at all', () => {
    expect(run(undefined)).toHaveLength(7);
  });
});
