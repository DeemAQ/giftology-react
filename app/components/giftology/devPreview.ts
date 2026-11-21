import { useMemo, useSyncExternalStore } from 'react';
import devSchema from 'virtual:twilight/schema';

/** The blocks of a home page: what Salla sent, or what the local editor holds. */
export type PlacedBlocks = readonly { path?: unknown }[] | null | undefined;

interface PreviewState {
  enabled?: unknown;
  layout?: unknown;
}
interface PreviewStore {
  state?: PreviewState;
  listeners?: unknown;
}

/**
 * Where the engine's dev server keeps the local editor's state: the saved
 * `twilight.preview.json` as of this page load, and the live copy the editor
 * updates. Neither exists in a production build.
 */
const scope = globalThis as {
  __twilightDevPreview__?: PreviewState;
  __twilightDevSettingsStore__?: PreviewStore;
};

const saved = () => scope.__twilightDevPreview__;
const live = () => scope.__twilightDevSettingsStore__?.state ?? saved();

function subscribe(listener: () => void): () => void {
  const listeners = scope.__twilightDevSettingsStore__?.listeners;
  if (!(listeners instanceof Set)) return () => {};
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The blocks the home page really shows.
 *
 * On Salla that is the list the page was given. On the local dev server the engine
 * swaps that list, inside its own home component, for the layout built in the local
 * editor (`/__twilight/editor`) whenever the preview is switched on. The Giftology
 * page has to decide from the same list, or a block added in the local editor would
 * show next to the built-in section it replaces.
 *
 * Reads the engine's dev-only globals, which are not a public API: if they change
 * shape, this simply returns the list it was given.
 */
export function usePlacedBlocks(components: PlacedBlocks): PlacedBlocks {
  // A build-time constant, so the hook below is either always or never called.
  if (!import.meta.env.DEV) return components;
  const preview = useSyncExternalStore(subscribe, live, saved);
  return preview?.enabled === true && Array.isArray(preview.layout)
    ? (preview.layout as PlacedBlocks)
    : components;
}

type HomeBlock = { path?: unknown };

/**
 * The built-in sections' blocks, in their built-in order (`SECTION_BLOCKS` in
 * `homeSections.tsx`, which imports this file).
 */
export const BUILT_IN_BLOCKS = [
  'gly-hero',
  'gly-latest',
  'gly-circles',
  'gly-custom',
  'gly-finder',
  'gly-how',
  'gly-testimonials',
];

/**
 * The home page's blocks, with the built-in sections as real blocks: local dev server only.
 *
 * Until a Giftology block is placed, the page draws its seven built-in sections itself,
 * so the local editor's home tab (`/__twilight/editor`) had nothing to list for them:
 * it lists the blocks the home page reports. On the dev server this hands the engine
 * the seven as blocks, each filled with its `twilight.json` defaults, in the built-in
 * order, with the store's own blocks after them (the demo store has ten; Deem does not
 * use Salla's blocks, so they go last rather than under the hero). The engine
 * draws them, reports them, and the editor lists them; its "customize" button turns
 * them into a layout to reorder, edit or remove. The page looks the same.
 *
 * Production, and a store that already has a Giftology block, get the list unchanged:
 * Salla has no way for a theme to place blocks on a real store.
 */
export function useDevBuiltInBlocks<T extends HomeBlock>(
  components: T[] | undefined
): T[] | undefined {
  return useMemo(() => {
    if (!import.meta.env.DEV) return components;
    const schema = devSchema as Partial<typeof devSchema> | undefined;
    const known = new Map(
      (schema?.components ?? []).map((component) => [component.path, component])
    );
    const paths = BUILT_IN_BLOCKS.map((name) => `home.${name}`);
    if (!paths.every((path) => known.has(path))) return components;
    const isGly = (block: HomeBlock) =>
      typeof block.path === 'string' && /^(home\.)?gly-/.test(block.path);
    if ((components ?? []).some(isGly)) return components;

    // The home loader's spelling of a path drops `home.`, as Salla's blocks arrive.
    const blocks = paths.map((path) => ({
      ...(known.get(path)?.key ? { key: known.get(path)?.key } : {}),
      ...(schema?.blockDefaults?.[path] ?? schema?.componentDefaults?.[path] ?? {}),
      path: path.replace(/^home\./, ''),
    })) as unknown as T[];
    return [...blocks, ...(components ?? [])];
  }, [components]);
}
