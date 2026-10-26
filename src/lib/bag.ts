"use client";

import { useSyncExternalStore } from "react";

/*
 * Shopping bag kept in the browser (localStorage), shared by every component
 * through useSyncExternalStore. Changes in another tab sync via the
 * "storage" event. Replace with a server cart once checkout exists.
 */

export type BagItem = { slug: string; size: string; quantity: number };

const STORAGE_KEY = "atelier-bag";
const EMPTY: BagItem[] = [];

let items: BagItem[] | null = null;
const listeners = new Set<() => void>();

function isBagItem(value: unknown): value is BagItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.size === "string" &&
    typeof v.quantity === "number" &&
    Number.isInteger(v.quantity) &&
    v.quantity > 0
  );
}

function load(): BagItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isBagItem) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot() {
  items ??= load();
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function save(next: BagItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): the bag still works for this visit.
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      items = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBag() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useBagCount() {
  return useBag().reduce((sum, item) => sum + item.quantity, 0);
}

/** Units of one product size already in the bag. */
export function quantityInBag(bag: BagItem[], slug: string, size: string) {
  return bag.find((i) => i.slug === slug && i.size === size)?.quantity ?? 0;
}

/** Adds units to the bag, merging with an existing line for the same size. */
export function addToBag(slug: string, size: string, quantity: number) {
  const current = getSnapshot();
  const existing = current.find((i) => i.slug === slug && i.size === size);
  const next = existing
    ? current.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
    : [...current, { slug, size, quantity }];
  save(next);
}
