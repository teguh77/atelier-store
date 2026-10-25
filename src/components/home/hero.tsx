import { UnsplashImage } from "@/components/ui/unsplash-image";

import { ButtonLink } from "@/components/ui/button";
import type { NavItem, Photo } from "@/lib/catalog";

type HeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primary: NavItem;
  secondary: NavItem;
  image: Photo;
};

/** Full-viewport campaign image with the headline anchored bottom-left. */
export function Hero({ eyebrow, title, description, primary, secondary, image }: HeroProps) {
  return (
    <section className="hero-bleed theme-on-media media-settle" aria-labelledby="hero-title">
      <UnsplashImage
        src={image.src}
        alt={image.alt}
        fill
        preload
        sizes="100vw"
        style={{ objectPosition: image.position }}
      />
      {/* Darkens the lower part so white text stays readable on any photo. */}
      <div
        className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/60 via-black/20 to-transparent"
        aria-hidden="true"
      />

      <div className="page-container absolute inset-x-0 bottom-0 flex flex-col gap-8 pb-10 lg:flex-row lg:items-end lg:justify-between lg:pb-16">
        <div className="flex flex-col gap-4">
          <p className="type-caption">{eyebrow}</p>
          <h1 id="hero-title" className="type-display-l">
            {title}
          </h1>
        </div>
        <div className="flex max-w-panel flex-col gap-6">
          <p className="type-small">{description}</p>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href={primary.href} variant="glass" className="sm:flex-1">
              {primary.label}
            </ButtonLink>
            <ButtonLink href={secondary.href} variant="glass" className="sm:flex-1">
              {secondary.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
