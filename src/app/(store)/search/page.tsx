import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import { getAllProducts } from "@/lib/product-queries";
import { MAX_QUERY_LENGTH, searchProducts } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Atelier collection by name, category, color or material.",
};

/*
 * The query comes from the URL, so it is read inside Suspense, as on the
 * product page. The form is a plain GET form, so searching works without JS.
 */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense fallback={<div className="pt-header min-h-[70vh]" aria-busy="true" />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").slice(0, MAX_QUERY_LENGTH);
  const hasQuery = query.trim() !== "";

  const products = await getAllProducts();
  const results = hasQuery ? searchProducts(products, query) : [];

  return (
    <div className="pt-header">
      <Container className="flex flex-col gap-8 pb-10 pt-8 md:pb-12">
        <h1 className="type-title-l">Search</h1>

        <form
          role="search"
          action="/search"
          method="get"
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-2">
            <span className="type-caption text-muted">Search the collection</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Bags, leather, gold…"
              autoComplete="off"
              maxLength={MAX_QUERY_LENGTH}
              className="field-input"
            />
          </label>
          <button type="submit" className="btn btn-block sm:w-auto">
            Search
          </button>
        </form>

        {hasQuery && (
          <p className="type-small text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        {!hasQuery && (
          <p className="type-body text-muted">
            Search by name, category, color or material, or{" "}
            <Link href="/collections/new-in" className="link-underline text-foreground">
              browse new arrivals
            </Link>
            .
          </p>
        )}

        {hasQuery && results.length === 0 && (
          <div className="flex flex-col items-start gap-4">
            <p className="type-body">No pieces match your search. Try a different word.</p>
            <Link href="/collections/new-in" className="link-cta">
              View new arrivals
            </Link>
          </div>
        )}
      </Container>

      {results.length > 0 && (
        <ul className="product-grid border-t">
          {results.map((product) => (
            <li key={product.slug}>
              <ProductCard
                product={product}
                sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
