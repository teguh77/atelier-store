"use client";

import { startTransition, useActionState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/account/form-status";
import { createCategory, deleteCategory, updateCategory } from "@/lib/admin/actions/categories";
import type { AdminCategoryRow } from "@/lib/admin/queries";
import { IDLE } from "@/lib/admin/schemas";

import { Checkbox, FormSection, SubmitRow, TextField } from "./form-parts";
import { ImageUrlField } from "./image-url-field";

type Category = Omit<AdminCategoryRow, "productCount">;

/** Create (no `category`) or edit a category. */
export function CategoryForm({ category }: { category?: Category }) {
  const [result, dispatch, pending] = useActionState(category ? updateCategory : createCategory, IDLE);
  const errors = result.fieldErrors ?? {};

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <form
      // A new category clears the form once it's created.
      key={!category && result.ok ? result.message : undefined}
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-3xl flex-col gap-8"
      aria-busy={pending}
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormSection title={category ? "Details" : "New category"}>
        <div className="grid gap-6 md:grid-cols-3">
          <TextField name="label" label="Name" defaultValue={category?.label} error={errors.label} required />
          <TextField
            name="slug"
            label="URL slug"
            defaultValue={category?.slug}
            error={errors.slug}
            hint={category ? "Changing it changes /collections/… links." : "/collections/your-slug"}
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <TextField
            name="sortOrder"
            label="Order"
            type="number"
            min={0}
            max={999}
            defaultValue={category?.sortOrder ?? 0}
            error={errors.sortOrder}
            hint="Lower comes first"
          />
        </div>
        <Checkbox
          name="showOnHome"
          label="Show on the homepage"
          hint="Adds a tile to the homepage category grid. Needs a photo."
          defaultChecked={category?.showOnHome}
        />
        <ImageUrlField name="imageSrc" label="Photo" defaultValue={category?.imageSrc ?? ""} error={errors.imageSrc} />
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            name="imageAlt"
            label="Photo description"
            defaultValue={category?.imageAlt ?? ""}
            error={errors.imageAlt}
          />
          <TextField
            name="imagePosition"
            label="Crop focus"
            defaultValue={category?.imagePosition ?? ""}
            error={errors.imagePosition}
            hint="Optional, e.g. center 30%"
          />
        </div>
      </FormSection>
      <SubmitRow
        label={category ? "Save category" : "Add category"}
        pendingLabel={category ? "Saving" : "Adding"}
        pending={pending}
        result={result}
      />
    </form>
  );
}

/** Delete an empty category. The server refuses if it still has products. */
export function DeleteCategoryForm({ id, label, productCount }: { id: number; label: string; productCount: number }) {
  const [result, dispatch, pending] = useActionState(deleteCategory, IDLE);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t pt-6">
      <input type="hidden" name="id" value={id} />
      <h2 className="type-title-xs">Delete category</h2>
      {productCount > 0 ? (
        <p className="type-small text-muted">
          {label} has {productCount} {productCount === 1 ? "product" : "products"}. Move them to another category
          before deleting it.
        </p>
      ) : (
        <>
          <p className="type-small text-muted">{label} has no products. Deleting it can&apos;t be undone.</p>
          <div>
            <Button type="submit" variant="secondary" block="mobile" aria-busy={pending || undefined}>
              {pending ? "Deleting" : `Delete ${label}`}
            </Button>
          </div>
        </>
      )}
      <FormStatus
        status={result.message ? { kind: "error", message: result.message } : { kind: "idle" }}
      />
    </form>
  );
}
