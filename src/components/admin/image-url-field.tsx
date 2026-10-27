"use client";

import { useState } from "react";

import { UnsplashImage } from "@/components/ui/unsplash-image";

import { TextField } from "./form-parts";

const UNSPLASH = /^https:\/\/images\.unsplash\.com\/[^\s]+$/;

/**
 * Photo URL input with a live preview. Only Unsplash URLs render (the CSP
 * and UnsplashImage allow nothing else); the server checks the same rule.
 */
export function ImageUrlField({
  name,
  label,
  defaultValue = "",
  error,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  const [url, setUrl] = useState(defaultValue);
  const valid = UNSPLASH.test(url.trim());

  return (
    <div className="flex items-end gap-4">
      <div className="min-w-0 flex-1">
        <TextField
          name={name}
          label={label}
          type="url"
          inputMode="url"
          defaultValue={defaultValue}
          required={required}
          placeholder="https://images.unsplash.com/photo-…"
          hint="An images.unsplash.com photo URL."
          error={error}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="media-cover w-16 shrink-0 self-start bg-subtle" aria-hidden="true">
        {valid && <UnsplashImage src={url.trim()} alt="" fill sizes="64px" />}
      </div>
    </div>
  );
}
