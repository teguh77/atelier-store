import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPageHeader, LOADING } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { TextLink } from "@/components/ui/text-link";
import { listCategories } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <TextLink href="/admin/products" variant="reveal" className="type-small self-start text-muted">
          ← Products
        </TextLink>
        <AdminPageHeader title="New product" />
      </div>
      <Suspense fallback={LOADING}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  const categories = await listCategories();
  return <ProductForm categories={categories.map((c) => ({ id: c.id, label: c.label }))} />;
}
