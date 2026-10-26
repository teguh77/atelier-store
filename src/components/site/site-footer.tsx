import Link from "next/link";

import { Container } from "@/components/ui/container";
import type { FooterGroup } from "@/lib/catalog";

import { NewsletterForm } from "./newsletter-form";

type SiteFooterProps = {
  groups: FooterGroup[];
};

/** Inverse footer: newsletter, link columns, legal line. */
export function SiteFooter({ groups }: SiteFooterProps) {
  return (
    <footer className="theme-inverse">
      <Container className="flex flex-col gap-16 py-section">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className="type-title-s">Sign up for news</h2>
            <p className="type-small max-w-prose-narrow text-muted">
              New collections, private events and stories from the workshop,
              a few times a season.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-6 gap-y-10 border-t pt-10 md:grid-cols-4"
        >
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h2 className="type-title-xs">{group.title}</h2>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="link-reveal type-small">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-6 border-t pt-8 md:flex-row md:items-end md:justify-between">
          <p
            className="type-display-m leading-none select-none"
            aria-hidden="true"
          >
            Atelier
          </p>
          <p className="type-small text-muted">
            © Atelier Store. Sample storefront.
          </p>
        </div>
      </Container>
    </footer>
  );
}
