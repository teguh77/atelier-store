"use client";

import { startTransition, useActionState, type FormEvent } from "react";

import { createProduct, updateProduct } from "@/lib/admin/actions/products";
import { IDLE } from "@/lib/admin/schemas";
import type { AdminProduct } from "@/lib/admin/queries";

import { Checkbox, FormSection, SelectField, SubmitRow, TextAreaField, TextField } from "./form-parts";
import { ImageUrlField } from "./image-url-field";
import { SizeListEditor } from "./size-list-editor";

type Props = {
  categories: { id: number; label: string }[];
  /** Edit an existing product; omit to create one. */
  product?: AdminProduct;
};

/** Create or edit a product. All checks run again on the server. */
export function ProductForm({ categories, product }: Props) {
  const [result, dispatch, pending] = useActionState(product ? updateProduct : createProduct, IDLE);
  const errors = result.fieldErrors ?? {};

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  }

  const gallery = product?.images.map((i) => `${i.src} | ${i.alt}`).join("\n") ?? "";

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-3xl flex-col gap-10" aria-busy={pending}>
      {product && <input type="hidden" name="id" value={product.id} />}

      <FormSection title="Availability">
        <Checkbox
          name="isActive"
          label="Listed in the store"
          hint="Untick to hide it: its page returns 404, it leaves listings and search, and shoppers can't buy it. Stock and past orders are kept."
          defaultChecked={product?.isActive ?? true}
        />
      </FormSection>

      <FormSection title="Basics">
        <TextField name="name" label="Name" defaultValue={product?.name} error={errors.name} required />
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            name="slug"
            label="URL slug"
            defaultValue={product?.slug}
            error={errors.slug}
            hint={
              product
                ? "Changing it changes the product's URL. Old links stop working and it leaves customers' bags."
                : "Used in the URL: /products/your-slug."
            }
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <TextField name="sku" label="SKU" defaultValue={product?.sku} error={errors.sku} spellCheck={false} required />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <SelectField
            name="categoryId"
            label="Category"
            defaultValue={product?.categoryId ?? ""}
            error={errors.categoryId}
            required
          >
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </SelectField>
          <TextField
            name="price"
            label="Price (USD)"
            inputMode="decimal"
            defaultValue={product ? String(product.priceCents / 100) : ""}
            error={errors.price}
            hint="In dollars, e.g. 2850"
            required
          />
          <TextField
            name="badge"
            label="Badge"
            defaultValue={product?.badge ?? ""}
            error={errors.badge}
            hint="Optional, e.g. New"
          />
        </div>
      </FormSection>

      <FormSection title="Color">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            name="colorName"
            label="Color name"
            defaultValue={product?.colorName}
            error={errors.colorName}
            required
          />
          <TextField
            name="colorHex"
            label="Swatch"
            type="color"
            defaultValue={product?.colorHex ?? "#1a1a1a"}
            error={errors.colorHex}
            className="h-12 cursor-pointer"
          />
        </div>
      </FormSection>

      <FormSection title="Description">
        <TextAreaField
          name="description"
          label="Description"
          defaultValue={product?.description}
          error={errors.description}
          rows={4}
          required
        />
        <TextAreaField
          name="details"
          label="Details"
          defaultValue={product?.details.join("\n")}
          error={errors.details}
          hint="One per line, e.g. Calf leather. Shown as a list on the product page."
          rows={4}
        />
      </FormSection>

      <FormSection title="Photos">
        <ImageUrlField
          name="imageSrc"
          label="Main photo"
          defaultValue={product?.imageSrc}
          error={errors.imageSrc}
          required
        />
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            name="imageAlt"
            label="Main photo description"
            defaultValue={product?.imageAlt}
            error={errors.imageAlt}
            hint="For screen readers, e.g. Grey leather satchel, front."
            required
          />
          <TextField
            name="imagePosition"
            label="Crop focus"
            defaultValue={product?.imagePosition ?? ""}
            error={errors.imagePosition}
            hint="Optional CSS position, e.g. center 30%"
          />
        </div>
        <TextAreaField
          name="gallery"
          label="More photos"
          defaultValue={gallery}
          error={errors.gallery}
          hint="One Unsplash URL per line. Add a description after a |, e.g. https://images.unsplash.com/photo-… | Side view"
          rows={3}
          spellCheck={false}
        />
      </FormSection>

      <FormSection title="Sizes">
        {/* Remounts after a save changes the sizes, so new rows don't linger. */}
        <SizeListEditor
          key={product?.stock.map((s) => s.id).join("-")}
          existing={product?.stock}
          error={errors.sizes}
        />
      </FormSection>

      <SubmitRow
        label={product ? "Save product" : "Create product"}
        pendingLabel={product ? "Saving" : "Creating"}
        pending={pending}
        result={result}
      />
    </form>
  );
}
