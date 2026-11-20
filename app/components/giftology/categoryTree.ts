import { category } from '@salla.sa/twilight-theme-engine/api/category';

/**
 * The store's category tree: what the category circles, the gift finder and the
 * full-screen menu are all built from. The home route's loader fetches it first
 * (`app/routes/index.tsx`), so the circles and the finder's first question are in
 * the HTML the server sends.
 */
export const categoryTreeQuery = () => category.queries.list();
