import Link from "next/link";

import { CampaignSplit } from "@/components/home/campaign-split";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { ServicesStrip } from "@/components/home/services-strip";
import { Container } from "@/components/ui/container";
import {
  campaign,
  categories,
  featuredCollections,
  hero,
  newArrivals,
  services,
} from "@/lib/catalog";

export default function Home() {
  return (
    <>
      <Hero {...hero} />

      {/* Short brand statement between the hero and the collections. */}
      <section className="py-section" aria-label="Introduction">
        <Container className="flex flex-col items-center gap-6 text-center">
          <p className="type-lead max-w-3xl">
            Pieces made to be kept: cut from fine materials, finished by hand,
            and designed to outlast the season they arrive in.
          </p>
          <Link href="/stories/house" className="link-cta">
            Discover the house
          </Link>
        </Container>
      </section>

      <FeaturedCollections collections={featuredCollections} />

      <ProductRail
        eyebrow="Just arrived"
        title="New arrivals"
        action={{ label: "View all", href: "/collections/new-in" }}
        products={newArrivals}
      />

      <CampaignSplit {...campaign} />

      <CategoryGrid categories={categories} />

      <ServicesStrip services={services} />
    </>
  );
}
