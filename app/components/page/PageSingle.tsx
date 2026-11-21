import { useMemo } from 'react';
import { SallaComments } from '@salla.sa/twilight-components-react/comments';
import type { StaticPage } from '@salla.sa/twilight-theme-engine/routes/page';
import { Breadcrumb } from '@salla.sa/twilight-theme-engine/common';
import { useComments } from '@salla.sa/twilight-theme-engine/hooks/useComments';
import { fillStoreDetails, settingText } from '../../lib/giftology';
import { BlockHookSlot } from '../common';
import { useGly } from '../giftology/useGly';

/** Engine `StaticPage` plus the `type` our forked loader threads through. */
export type PageWithType = StaticPage & { type?: string };

export interface PageSingleProps {
  page: PageWithType;
}

/**
 * Theme fork of the engine `PageSingle` (rendered by `app/routes/$slug.page-$id.tsx`).
 *
 * Adds the classic-storefront `information_page.information_page` app hook: on a
 * `customised` page the whole body IS the app-injected block, so we render only
 * the hook — exactly like `page-single.twig`. Every other page type keeps the
 * engine's breadcrumb + article + comments layout, keyed by the page id so
 * moving from one page to another loads the new page's comments.
 *
 * Giftology: `{store_name}`, `{commercial_number}`, `{email}` and `{whatsapp}` in
 * the page text are filled from the store's own details (`fillStoreDetails`), so
 * the policy pages never carry a number typed by hand.
 *
 * Upgrade notes: `FORKS.md`.
 */
export function PageSingle({ page }: PageSingleProps) {
  const { commentsKey } = useComments();
  const { store, settings, whatsappNumber } = useGly();
  const storeName = store?.name;
  const commercialNumber = store?.settings?.commercial_number;
  // The same email the footer shows.
  const email = settingText(settings, 'gly_email') || store?.contacts?.email;

  // Matches the engine: strip `&nbsp;` from the merchant-authored HTML.
  const cleanContent = useMemo(
    () =>
      page.content
        ? fillStoreDetails(page.content.replace(/&nbsp;/g, ' '), {
            storeName,
            commercialNumber,
            email,
            whatsapp: whatsappNumber,
          })
        : '',
    [page.content, storeName, commercialNumber, email, whatsappNumber]
  );

  if (page.type === 'customised') {
    return (
      <BlockHookSlot
        name="information_page.information_page"
        wrapper="s-information-page"
        className="!mt-0"
        scope={page.id != null ? { page_id: page.id } : undefined}
      />
    );
  }

  return (
    // Keyed by the page id: the loader gives every page the same `slug` (the route
    // id), and TanStack keeps the route mounted between two pages, so the comments
    // list would otherwise keep the page it first loaded for.
    <div key={page.id ?? page.slug} className="container">
      <Breadcrumb page={page} />

      <div className="flex justify-center">
        <div className="content content--single-page w-full lg:w-10/12 bg-white rounded p-6 lg:p-8 mt-4 lg:mt-12">
          <h1 className="gly-page-title mb-6">{page.title}</h1>
          {cleanContent && (
            <div className="content-entry" dangerouslySetInnerHTML={{ __html: cleanContent }} />
          )}
          {page.id != null && (
            <SallaComments key={commentsKey} itemId={Number(page.id)} type={'page' as never} />
          )}
        </div>
      </div>
    </div>
  );
}
