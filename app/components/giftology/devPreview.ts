import { useSyncExternalStore } from 'react';

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
