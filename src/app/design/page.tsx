import type { Metadata } from "next";
import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";

export const metadata: Metadata = {
  title: "Design system",
};

const colors = [
  { name: "background", className: "bg-background" },
  { name: "foreground", className: "bg-foreground" },
  { name: "canvas", className: "bg-canvas" },
  { name: "subtle", className: "bg-subtle" },
  { name: "muted", className: "bg-muted" },
  { name: "line", className: "bg-line" },
  { name: "focus", className: "bg-focus" },
  { name: "error", className: "bg-error" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
];

const typeRoles = [
  { role: "type-display-l", sample: "Atelier" },
  { role: "type-display-m", sample: "Collection" },
  { role: "type-title-xxl", sample: "New season" },
  { role: "type-title-xl", sample: "Leather goods" },
  { role: "type-title-l", sample: "Handbags" },
  { role: "type-title-m", sample: "Shoulder bags" },
  { role: "type-title-s", sample: "Section label" },
  { role: "type-title-xs", sample: "Navigation group" },
  { role: "type-lead", sample: "A lead paragraph sets the tone of a page." },
  { role: "type-body", sample: "Body copy is light and quiet, leaving room for imagery." },
  { role: "type-body-medium", sample: "Medium body for emphasis." },
  { role: "type-small", sample: "Product name in small text" },
  { role: "type-small-medium", sample: "$1,250" },
  { role: "type-caption", sample: "New in" },
  { role: "type-label", sample: "Add to bag" },
];

const products = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  name: `Sample product ${i + 1}`,
  price: `$${(i + 1) * 250}`,
  badge: i % 3 === 0 ? "New in" : null,
}));

export default function DesignSystemPage() {
  return (
    <>
      <a href="#main" className="skip-link type-small">
        Skip to main content
      </a>

      <SiteHeaderDemo />

      <main id="main" className="pt-header">
        {/* Hero: full viewport, copy bottom-left. */}
        <section className="hero-bleed theme-on-media bg-foreground">
          <div className="hero-content">
            <p className="type-caption">Hero</p>
            <h1 className="type-display-m">Atelier</h1>
            <p className="type-small">
              Full-bleed media with copy anchored bottom-left.
            </p>
            <ButtonLink href="#products" variant="glass" block>
              Shop the collection
            </ButtonLink>
          </div>
        </section>

        <Section>
          <SectionHeading title="Color" note="Black and white first. Accent colors are for status and focus only." />
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {colors.map((c) => (
              <li key={c.name} className="flex flex-col gap-2">
                <span className={`${c.className} aspect-square border`} />
                <span className="type-small">{c.name}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="border-t">
          <SectionHeading title="Typography" note="Use a type-* role, not loose size utilities. Serif only for display." />
          <ul className="flex flex-col divide-y">
            {typeRoles.map((t) => (
              <li
                key={t.role}
                className="flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:gap-8"
              >
                <code className="type-small w-48 shrink-0 text-muted">
                  {t.role}
                </code>
                <span className={`${t.role} break-words`}>{t.sample}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="border-t">
          <SectionHeading title="Buttons" note="48px tall, uppercase label, 2px corners. Fill shrinks on hover." />
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <Button block="mobile">Primary</Button>
            <Button variant="secondary" block="mobile">
              Secondary
            </Button>
            <Button disabled block="mobile">
              Disabled
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 bg-canvas p-8 md:grid-cols-2">
            <div className="media-cover aspect-video bg-foreground">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button variant="glass">Glass over media</Button>
              </div>
            </div>
            <div className="theme-inverse flex items-center justify-center gap-4 p-8">
              <Button>Inverse primary</Button>
              <Button variant="secondary">Inverse secondary</Button>
            </div>
          </div>
        </Section>

        <Section className="border-t">
          <SectionHeading title="Links" note="Links have no color of their own. Feedback comes from the underline." />
          <div className="flex flex-col gap-6">
            <p className="type-body max-w-prose-narrow">
              Inline copy uses an{" "}
              <TextLink href="#">underlined link</TextLink> that wipes across on
              hover.
            </p>
            <nav aria-label="Example navigation" className="flex gap-6">
              <TextLink href="#" variant="reveal" className="type-title-xs">
                Women
              </TextLink>
              <TextLink href="#" variant="reveal" className="type-title-xs" aria-current="page">
                Men
              </TextLink>
              <TextLink href="#" variant="reveal" className="type-title-xs">
                Gifts
              </TextLink>
            </nav>
            <TextLink href="#" variant="cta">
              Discover more
            </TextLink>
          </div>
        </Section>

        <Section className="border-t">
          <SectionHeading title="Layout grid" note="12 columns, 8px gap. Gutters 16 / 32 / 64px. Max width 1440px." />
          <div className="layout-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-16 bg-canvas border" />
            ))}
            <div className="col-span-12 h-16 bg-subtle border md:col-span-8" />
            <div className="col-span-12 h-16 bg-subtle border md:col-span-4" />
          </div>
        </Section>

        {/* Product grid runs edge to edge, outside the page container. */}
        <section id="products" className="border-t">
          <Container className="py-section">
            <SectionHeading title="Product grid" note="2 / 3 / 4 columns, no gaps. 3:4 frames on the canvas tone." />
          </Container>
          <div className="sticky-bar">
            <Container bleed className="flex h-12 items-center justify-between">
              <span className="type-small">{products.length} items</span>
              <div className="flex gap-6">
                <button type="button" className="type-title-xs">
                  Filter
                </button>
                <button type="button" className="type-title-xs">
                  Sort
                </button>
              </div>
            </Container>
          </div>
          <ul className="product-grid">
            {products.map((p) => (
              <li key={p.id}>
                <a href="#products" className="group block h-full">
                  <div className="media-product">
                    {p.badge && (
                      <span className="type-caption absolute left-4 top-4 opacity-70">
                        {p.badge}
                      </span>
                    )}
                    <div className="aspect-square w-3/5 bg-subtle transition-transform duration-[var(--duration-slow)] group-hover:scale-105" />
                  </div>
                  <div className="product-info">
                    <span className="type-small">{p.name}</span>
                    <span className="type-small-medium">{p.price}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Section className="border-t">
          <SectionHeading title="Scroll row" note="Carousels: ~1.25 items per view on phone, 2.5 on tablet, 4 on desktop." />
          <div className="scroll-row -mx-gutter gap-2 px-gutter pb-4">
            {products.map((p) => (
              <div key={p.id} className="media-cover aspect-3/4" />
            ))}
          </div>
        </Section>

        <Section inverse>
          <SectionHeading title="Inverse band" note="Wrap any band in theme-inverse and every token flips." />
          <div className="flex flex-col gap-4 md:flex-row">
            <Button block="mobile">Subscribe</Button>
            <Button variant="secondary" block="mobile">
              Learn more
            </Button>
          </div>
        </Section>
      </main>
    </>
  );
}

function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <header className="mb-8 flex flex-col gap-2 md:mb-12">
      <h2 className="type-title-l">{title}</h2>
      <p className="type-small text-muted">{note}</p>
    </header>
  );
}

function SiteHeaderDemo() {
  return (
    <header className="site-header border-b">
      <Container bleed className="h-full">
        <div className="header-bar">
          <nav aria-label="Main" className="hidden gap-6 lg:flex">
            <TextLink href="#" variant="reveal" className="type-title-xs">
              Women
            </TextLink>
            <TextLink href="#" variant="reveal" className="type-title-xs">
              Men
            </TextLink>
            <TextLink href="#" variant="reveal" className="type-title-xs">
              Gifts
            </TextLink>
          </nav>
          <Link href="/design" className="type-title-m tracking-[0.2em]">
            Atelier
          </Link>
          <div className="flex items-center gap-6">
            <button type="button" className="btn-icon" aria-label="Search">
              <SearchIcon />
            </button>
            <button type="button" className="btn-icon" aria-label="Account">
              <UserIcon />
            </button>
            <button type="button" className="btn-icon" aria-label="Shopping bag">
              <BagIcon />
            </button>
            <button type="button" className="btn-icon lg:hidden" aria-label="Menu">
              <MenuIcon />
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  "aria-hidden": true,
} as const;

function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 8h14l-1 12.5H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}
