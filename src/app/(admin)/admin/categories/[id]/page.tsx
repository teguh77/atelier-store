import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader, LOADING } from "@/components/admin/admin-ui";
import { CategoryForm, DeleteCategoryForm } from "@/components/admin/category-form";
import { TextLink } from "@/components/ui/text-link";
import { listCategories, parseId } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit category" };

export default function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  return (
    <Suspense fallback={LOADING}>
      <EditCategory params={params} />
    </Suspense>
  );
}

async function EditCategory({ params }: Pick<PageProps<"/admin/categories/[id]">, "params">) {
  const id = parseId((await params).id);
  // listCategories includes the product count the delete form needs.
  const category = id ? (await listCategories()).find((c) => c.id === id) : undefined;
  if (!category) notFound();
  const { productCount, ...fields } = category;

  return (
    <>
      <div className="flex flex-col gap-4">
        <TextLink href="/admin/categories" variant="reveal" className="type-small self-start text-muted">
          ← Categories
        </TextLink>
        <AdminPageHeader
          title={category.label}
          action={
            <TextLink href={`/collections/${category.slug}`} className="type-small" target="_blank">
              View in store<span className="sr-only"> (opens in a new tab)</span>
            </TextLink>
          }
        />
      </div>
      <div className="flex max-w-3xl flex-col gap-12">
        <CategoryForm category={fields} />
        <DeleteCategoryForm id={category.id} label={category.label} productCount={productCount} />
      </div>
    </>
  );
}
