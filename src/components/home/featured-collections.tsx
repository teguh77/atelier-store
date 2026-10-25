import { UnsplashImage } from "@/components/ui/unsplash-image";
import Link from "next/link";

import type { Collection } from "@/lib/catalog";

/** Two large editorial tiles side by side (stacked on phones), edge to edge. */
export function FeaturedCollections({ collections }: { collections: Collection[] }) {
  return (
    <section aria-label="Featured collections" className="grid md:grid-cols-2">
      {collections.map((c) => (
        <Link
          key={c.slug}
          href={`/collections/${c.slug}`}
          className="group media-cover theme-on-media block aspect-4/5 lg:aspect-3/4"
        >
          <UnsplashImage
            src={c.image.src}
            alt={c.image.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="transition-transform duration-[var(--duration-slow)] ease-luxe group-hover:scale-[1.03]"
            style={{ objectPosition: c.image.position }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-gutter pb-8 lg:pb-12">
            <p className="type-caption">{c.eyebrow}</p>
            <h2 className="type-title-xl">{c.title}</h2>
            <p className="type-small">{c.description}</p>
            <span className="link-cta mt-1">{c.cta}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
