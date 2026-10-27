import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader, AdminTable, Dot, FilterLinks, LOADING, StockBadge } from "@/components/admin/admin-ui";
import { StockRowForm } from "@/components/admin/stock-row-form";
import { UnsplashImage } from "@/components/ui/unsplash-image";
import { listStockRows, parseStockFilter, type StockFilter } from "@/lib/admin/queries";
import { LOW_STOCK_THRESHOLD, ONE_SIZE } from "@/lib/products";

export const metadata: Metadata = { title: "Stock" };

const FILTERS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All sizes" },
  { value: "low", label: `Low (${LOW_STOCK_THRESHOLD} or fewer)` },
  { value: "sold-out", label: "Sold out" },
];

export default function AdminStockPage({ searchParams }: PageProps<"/admin/stock">) {
  return (
    <>
      <AdminPageHeader title="Stock">
        <p className="type-small max-w-2xl text-muted">
          Available is what customers can buy now. Units in unpaid checkouts are already taken off it and return if
          the checkout expires. Use Set for a stock count (refused if a sale changed it meanwhile) and Adjust for
          deliveries or write-offs.
        </p>
      </AdminPageHeader>
      <Suspense fallback={LOADING}>
        <Stock searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Stock({ searchParams }: Pick<PageProps<"/admin/stock">, "searchParams">) {
  const filter = parseStockFilter((await searchParams).filter);
  const rows = await listStockRows(filter);

  return (
    <div className="flex flex-col gap-6">
      <FilterLinks
        label="Filter stock"
        items={FILTERS.map((f) => ({
          href: f.value === "all" ? "/admin/stock" : `/admin/stock?filter=${f.value}`,
          label: f.label,
          current: f.value === filter,
        }))}
      />
      {rows.length === 0 ? (
        <p className="type-body border-t pt-6 text-muted">
          {filter === "all" ? "No products yet." : "Nothing here: every size has more stock than that."}
        </p>
      ) : (
        <AdminTable label="Stock" minWidth="min-w-[52rem]">
          <thead>
            <tr>
              <th scope="col" className="w-16">
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col">Product</th>
              <th scope="col">Size</th>
              <th scope="col">Available</th>
              <th scope="col">In checkout</th>
              <th scope="col">Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className={r.isActive ? "media-cover w-12 bg-subtle" : "media-cover w-12 bg-subtle opacity-50"}>
                    <UnsplashImage
                      src={r.imageSrc}
                      alt=""
                      fill
                      sizes="48px"
                      style={r.imagePosition ? { objectPosition: r.imagePosition } : undefined}
                    />
                  </div>
                </td>
                <td>
                  <Link href={`/admin/products/${r.productId}`} className="type-small-medium link-reveal">
                    {r.productName}
                  </Link>
                  <p className="text-muted">{r.sku}</p>
                  {!r.isActive && (
                    <p className="mt-1">
                      <Dot tone="bg-muted">Hidden from store</Dot>
                    </p>
                  )}
                </td>
                <td className={r.sizeLabel === ONE_SIZE ? "text-muted" : "type-small-medium"}>{r.sizeLabel}</td>
                <td>
                  <StockBadge quantity={r.quantity} low={LOW_STOCK_THRESHOLD} />
                </td>
                <td className="tabular-nums">{r.held > 0 ? r.held : <span className="text-muted">—</span>}</td>
                <td>
                  <StockRowForm stockId={r.id} quantity={r.quantity} label={`${r.productName}, ${r.sizeLabel}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
