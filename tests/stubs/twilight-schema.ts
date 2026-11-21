/**
 * Stand-in for `virtual:twilight/schema` (aliased in `vitest.config.ts`). Only the engine's
 * Vite plugin serves the real one. Empty: a test that needs components passes its own.
 */
const schema = {
  settings: [],
  components: [],
  settingsDefaults: {},
  componentDefaults: {},
};

export default schema;
