import { UnsplashImage } from "@/components/ui/unsplash-image";
import Link from "next/link";

import type { NavItem, Photo } from "@/lib/catalog";

type CampaignSplitProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta: NavItem;
  image: Photo;
};

/** Story band: large image on one half, text panel on the canvas tone. */
export function CampaignSplit({ eyebrow, title, description, cta, image }: CampaignSplitProps) {
  return (
    <section className="grid lg:grid-cols-2" aria-labelledby="campaign-title">
      <div className="media-cover aspect-4/5 lg:aspect-auto lg:min-h-[44rem]">
        <UnsplashImage
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          style={{ objectPosition: image.position }}
        />
      </div>
      <div className="flex items-center bg-canvas px-gutter py-section">
        <div className="flex max-w-md flex-col items-start gap-6 lg:mx-auto">
          <p className="type-caption text-muted">{eyebrow}</p>
          <h2 id="campaign-title" className="type-title-xl">
            {title}
          </h2>
          <p className="type-body">{description}</p>
          <Link href={cta.href} className="link-cta">
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
