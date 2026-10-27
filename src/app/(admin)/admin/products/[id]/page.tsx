import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader, AdminTable, Dot, LOADING, Notice, StockBadge } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { StockRowForm } from "@/components/admin/stock-row-form";
import { TextLink } from "@/components/ui/text-link";
import { getHeldUnitsBySize, getProductForEdit, listCategories, parseId } from "@/lib/admin/queries";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={LOADING}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const id = parseId((await params).id);
  const { saved } = await searchParams;
  const [product, categories, held] = await Promise.all([
    id ? getProductForEdit(id) : undefined,
    listCategories(),
    id ? getHeldUnitsBySize(id) : new Map<string, number>(),
  ]);
  if (!product) notFound();

  return (
    <>
      <div className="flex flex-col gap-4">
        <TextLink href="/admin/products" variant="reveal" className="type-small self-start text-muted">
          ← Products
        </TextLink>
        <AdminPageHeader
          caption={product.sku}
          title={product.name}
          action={
            product.isActive ? (
              <TextLink href={`/products/${product.slug}`} className="type-small" target="_blank">
                View in store<span className="sr-only"> (opens in a new tab)</span>
              </TextLink>
            ) : undefined
          }
        >
          <p className="type-small">
            {product.isActive ? (
              <Dot tone="bg-success">Listed in the store</Dot>
            ) : (
              <Dot tone="bg-muted">Hidden from the store</Dot>
            )}
          </p>
        </AdminPageHeader>
        {saved === "created" && (
          <Notice>
            {product.isActive
              ? "Product created. It's live in the store now."
              : "Product created. It's hidden until you list it."}
          </Notice>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
        <ProductForm product={product} categories={categories.map((c) => ({ id: c.id, label: c.label }))} />

        <section aria-labelledby="stock-title" className="flex flex-col gap-6 border-t pt-6 lg:self-start">
          <div className="flex flex-col gap-1">
            <h2 id="stock-title" className="type-title-xs">
              Stock
            </h2>
            <p className="type-small text-muted">
              Saved per size, straight away. Set a count or adjust by an amount (+5 / -2). Add or remove sizes in
              the form.
            </p>
          </div>
          <AdminTable label="Stock by size" minWidth="min-w-0">
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Available</th>
                <th scope="col">In checkout</th>
                <th scope="col">Update</th>
              </tr>
            </thead>
            <tbody>
              {product.stock.map((s) => (
                <tr key={s.id}>
                  <td className="type-small-medium">{s.sizeLabel}</td>
                  <td>
                    <StockBadge quantity={s.quantity} low={LOW_STOCK_THRESHOLD} />
                  </td>
                  <td className="tabular-nums">
                    {held.get(s.sizeLabel) ? held.get(s.sizeLabel) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <StockRowForm stacked stockId={s.id} quantity={s.quantity} label={`${product.name}, ${s.sizeLabel}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </section>
      </div>
    </>
  );
}
