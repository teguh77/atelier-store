import { UnsplashImage } from "@/components/ui/unsplash-image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import type { Category } from "@/lib/catalog";

import { SectionHeader } from "./section-header";

/** Four category tiles: 2 columns on phones and tablets, 4 on desktop. */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="py-section" aria-labelledby="categories-title">
      <Container>
        <SectionHeader id="categories-title" title="Shop by category" />
      </Container>
      <ul className="grid grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <div className="media-cover">
                <UnsplashImage
                  src={c.image.src}
                  alt={c.image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="transition-transform duration-[var(--duration-slow)] ease-luxe group-hover:scale-[1.04]"
                  style={{ objectPosition: c.image.position }}
                />
              </div>
              <div className="product-info">
                <span className="type-title-xs">
                  <span className="link-reveal">{c.label}</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
