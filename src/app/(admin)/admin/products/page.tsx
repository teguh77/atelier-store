import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader, AdminTable, Dot, FilterLinks, LOADING } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";
import { UnsplashImage } from "@/components/ui/unsplash-image";
import { listCategories, listProducts, parseId } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <AdminPageHeader
        title="Products"
        action={
          <ButtonLink href="/admin/products/new" block="mobile">
            New product
          </ButtonLink>
        }
      />
      <Suspense fallback={LOADING}>
        <Products searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const { category, status } = await searchParams;
  const categoryId = typeof category === "string" ? parseId(category) : null;
  const listed = status === "listed" ? true : status === "hidden" ? false : undefined;
  const [products, categories] = await Promise.all([
    listProducts({ categoryId: categoryId ?? undefined, listed }),
    listCategories(),
  ]);

  /** Keeps the other filter when one changes. */
  const href = (next: { category?: number | null; status?: string | null }) => {
    const params = new URLSearchParams();
    const c = next.category === undefined ? categoryId : next.category;
    const s = next.status === undefined ? (typeof status === "string" ? status : null) : next.status;
    if (c) params.set("category", String(c));
    if (s === "listed" || s === "hidden") params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <FilterLinks
          label="Filter by category"
          items={[
            { href: href({ category: null }), label: "All categories", current: categoryId === null },
            ...categories.map((c) => ({
              href: href({ category: c.id }),
              label: `${c.label} (${c.productCount})`,
              current: c.id === categoryId,
            })),
          ]}
        />
        <FilterLinks
          label="Filter by availability"
          items={[
            { href: href({ status: null }), label: "Listed and hidden", current: listed === undefined },
            { href: href({ status: "listed" }), label: "Listed", current: listed === true },
            { href: href({ status: "hidden" }), label: "Hidden", current: listed === false },
          ]}
        />
      </div>

      {products.length === 0 ? (
        <p className="type-body border-t pt-6 text-muted">No products here yet.</p>
      ) : (
        <AdminTable label="Products">
          <thead>
            <tr>
              <th scope="col" className="w-16">
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col">Product</th>
              <th scope="col">SKU</th>
              <th scope="col">Category</th>
              <th scope="col" className="text-right">
                Price
              </th>
              <th scope="col">Stock</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className={p.isActive ? "media-cover w-12 bg-subtle" : "media-cover w-12 bg-subtle opacity-50"}>
                    <UnsplashImage
                      src={p.imageSrc}
                      alt=""
                      fill
                      sizes="48px"
                      style={p.imagePosition ? { objectPosition: p.imagePosition } : undefined}
                    />
                  </div>
                </td>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="type-small-medium link-reveal">
                    {p.name}
                  </Link>
                  <p className="text-muted">/{p.slug}</p>
                  {!p.isActive && (
                    <p className="mt-1">
                      <Dot tone="bg-muted">Hidden from store</Dot>
                    </p>
                  )}
                </td>
                <td className="text-muted">{p.sku}</td>
                <td>{p.category.label}</td>
                <td className="text-right tabular-nums">{formatPrice(p.priceCents)}</td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className="tabular-nums">
                      {p.totalStock} {p.sizeCount > 1 && <span className="text-muted">across {p.sizeCount} sizes</span>}
                    </span>
                    {p.soldOutSizes > 0 && (
                      <Dot tone="bg-error">
                        {p.sizeCount === 1 ? "Sold out" : `${p.soldOutSizes} sold out`}
                      </Dot>
                    )}
                    {p.lowSizes > 0 && <Dot tone="bg-warning">{p.sizeCount === 1 ? "Low" : `${p.lowSizes} low`}</Dot>}
                  </div>
                </td>
                <td className="text-right">
                  <Link href={`/admin/products/${p.id}`} className="link-underline">
                    Edit<span className="sr-only"> {p.name}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
