import type { ReactNode } from "react";
import { Suspense } from "react";

import { BagCount } from "@/components/site/bag-count";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader, SiteHeaderView } from "@/components/site/site-header";
import { footerGroups, nav } from "@/lib/catalog";

/** Storefront shell: header, page content, footer. */
export default function StoreLayout({ children }: { children: ReactNode }) {
  // The count reads a cookie, so it streams in; the rest of the header stays static.
  const bagCount = (
    <Suspense fallback={null}>
      <BagCount />
    </Suspense>
  );

  return (
    <>
      {/*
       * SiteHeader reads the URL. On routes with params unknown at build time
       * (e.g. /account/orders/[number]) that must sit inside Suspense; the
       * fallback is the same header without a path (solid, not over a hero).
       */}
      <Suspense fallback={<SiteHeaderView nav={nav} bagCount={bagCount} pathname={null} />}>
        <SiteHeader nav={nav} bagCount={bagCount} />
      </Suspense>
      <main id="main">{children}</main>
      <SiteFooter groups={footerGroups} />
    </>
  );
}
