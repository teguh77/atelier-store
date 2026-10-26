import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { footerGroups, nav } from "@/lib/catalog";

export default function NotFound() {
  return (
    <>
      <SiteHeader nav={nav} />
      <main id="main" className="pt-header">
        <Container className="flex min-h-[70svh] flex-col items-start justify-center gap-6 py-section">
          <p className="type-caption text-muted">Error 404</p>
          <h1 className="type-title-xl">Page not found</h1>
          <p className="type-body max-w-prose-narrow">
            The page you&apos;re looking for has moved or no longer exists.
          </p>
          <ButtonLink href="/" variant="secondary" block="mobile">
            Back to home
          </ButtonLink>
        </Container>
      </main>
      <SiteFooter groups={footerGroups} />
    </>
  );
}
