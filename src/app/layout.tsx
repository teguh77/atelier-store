import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Inter_Tight } from "next/font/google";
import "./globals.css";

// Text and UI: a tight neo-grotesk.
const sans = Inter_Tight({
  variable: "--font-atelier-sans",
  subsets: ["latin"],
});

// Display headlines only: a high-contrast serif. The optical size axis
// keeps it sharp at very large sizes.
const display = Bodoni_Moda({
  variable: "--font-atelier-display",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: "Atelier Store", template: "%s · Atelier Store" },
  description: "Luxury fashion, leather goods and jewelry.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
