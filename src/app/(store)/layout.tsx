import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { footerGroups, nav } from "@/lib/catalog";

/** Storefront shell: header, page content, footer. */
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader nav={nav} />
      <main id="main">{children}</main>
      <SiteFooter groups={footerGroups} />
    </>
  );
}
