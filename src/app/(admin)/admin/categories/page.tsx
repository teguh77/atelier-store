import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader, AdminTable, LOADING, Notice } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-form";
import { listCategories } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  return (
    <>
      <AdminPageHeader title="Categories" />
      <Suspense fallback={LOADING}>
        <Categories searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Categories({ searchParams }: Pick<PageProps<"/admin/categories">, "searchParams">) {
  const { deleted } = await searchParams;
  const categories = await listCategories();

  return (
    <div className="flex flex-col gap-12">
      {deleted && <Notice>Category deleted.</Notice>}
      <AdminTable label="Categories" minWidth="min-w-[36rem]">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">URL</th>
            <th scope="col" className="text-right">
              Products
            </th>
            <th scope="col">Homepage</th>
            <th scope="col" className="text-right">
              Order
            </th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/admin/categories/${c.id}`} className="type-small-medium link-reveal">
                  {c.label}
                </Link>
              </td>
              <td className="text-muted">/collections/{c.slug}</td>
              <td className="text-right tabular-nums">
                <Link href={`/admin/products?category=${c.id}`} className="link-reveal">
                  {c.productCount}
                </Link>
              </td>
              <td className={c.showOnHome ? undefined : "text-muted"}>{c.showOnHome ? "Shown" : "Hidden"}</td>
              <td className="text-right tabular-nums text-muted">{c.sortOrder}</td>
              <td className="text-right">
                <Link href={`/admin/categories/${c.id}`} className="link-underline">
                  Edit<span className="sr-only"> {c.label}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>

      <CategoryForm />
    </div>
  );
}
