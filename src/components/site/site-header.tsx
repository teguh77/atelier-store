"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/catalog";

import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";

type SiteHeaderProps = {
  nav: NavItem[];
  /** Badge + screen-reader count, rendered on the server from the cart cookie. */
  bagCount?: ReactNode;
};

/** Pages that open with a full-bleed image under the header. */
const PAGES_WITH_HERO = new Set(["/"]);

/**
 * Fixed header.
 * - Transparent over the hero (on pages that have one) until the page scrolls.
 * - Slides away while scrolling down, comes back when scrolling up.
 * - Below 1024px the nav moves into a full-screen menu.
 */
export function SiteHeader(props: SiteHeaderProps) {
  return <SiteHeaderView {...props} pathname={usePathname()} />;
}

/**
 * The header itself. `pathname` is null while a dynamic route prerenders
 * (the URL isn't known yet): the header is then solid, never over a hero.
 * Used as the Suspense fallback around SiteHeader in the store layout.
 */
export function SiteHeaderView({ nav, bagCount, pathname }: SiteHeaderProps & { pathname: string | null }) {
  const overMedia = pathname !== null && PAGES_WITH_HERO.has(pathname);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setAtTop(y < 16);
        // Only hide once past the header, and ignore tiny jitters.
        if (Math.abs(y - lastY.current) > 6) {
          setHidden(y > lastY.current && y > 160);
          lastY.current = y;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock page scroll and close on Escape while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const transparent = overMedia && atTop && !menuOpen;

  return (
    <>
      <a href="#main" className="skip-link type-small">
        Skip to main content
      </a>
      <header
        className={cn(
          "site-header border-b",
          transparent && "border-transparent",
        )}
        data-transparent={transparent}
        data-hidden={hidden && !menuOpen}
      >
        <Container bleed className="h-full">
          <div className="header-bar">
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex gap-6">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-reveal type-title-xs">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Link
              href="/"
              className="type-title-m tracking-[0.3em]"
              aria-label="Atelier, home"
            >
              Atelier
            </Link>

            <ul className="flex items-center gap-5 md:gap-6">
              <li>
                <Link href="/search" className="btn-icon" aria-label="Search">
                  <SearchIcon />
                </Link>
              </li>
              <li className="hidden md:block">
                <Link href="/account" className="btn-icon" aria-label="Account">
                  <UserIcon />
                </Link>
              </li>
              <li>
                <Link href="/bag" className="btn-icon relative">
                  <BagIcon />
                  <span className="sr-only">Shopping bag</span>
                  {bagCount}
                </Link>
              </li>
              <li className="lg:hidden">
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  {menuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </li>
            </ul>
          </div>
        </Container>
      </header>

      {/* Mobile menu: full screen under the header. */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 bottom-0 top-header z-30 overflow-y-auto bg-background transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none invisible opacity-0",
        )}
      >
        <Container as="nav" aria-label="Mobile" className="py-8">
          <ul className="flex flex-col divide-y">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="type-title-l block py-5"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-4">
            <Link href="/account" className="link-cta" onClick={() => setMenuOpen(false)}>
              My account
            </Link>
            <Link href="/stores" className="link-cta" onClick={() => setMenuOpen(false)}>
              Store locator
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
