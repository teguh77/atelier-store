/*
 * Sample storefront content.
 *
 * Placeholder content for the homepage. Categories and products come from
 * the database. Photography is from Unsplash (free to use under the
 * Unsplash License). Prices are in cents.
 */

export type Photo = {
  src: string;
  alt: string;
  /** CSS object-position, to keep the subject in frame when cropped. */
  position?: string;
};

export type Collection = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  image: Photo;
};

export type Category = {
  slug: string;
  label: string;
  image: Photo;
};

export type NavItem = { label: string; href: string };

export type FooterGroup = { title: string; links: NavItem[] };

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const nav: NavItem[] = [
  { label: "New in", href: "/collections/new-in" },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Bags", href: "/collections/bags" },
  { label: "Jewelry", href: "/collections/jewelry" },
  { label: "Gifts", href: "/collections/gifts" },
];

export const hero = {
  eyebrow: "Autumn–Winter collection",
  title: "Quiet form",
  description:
    "Tailoring, soft leather and wool cut close to the body. The new season, made in small runs.",
  primary: { label: "Shop women", href: "/collections/women" },
  secondary: { label: "Shop men", href: "/collections/men" },
  image: {
    src: unsplash("1483985988355-763728e1935b"),
    alt: "Woman in a burgundy coat and sunglasses carrying shopping bags",
    position: "50% 35%",
  },
} satisfies {
  eyebrow: string;
  title: string;
  description: string;
  primary: NavItem;
  secondary: NavItem;
  image: Photo;
};

export const featuredCollections: Collection[] = [
  {
    slug: "leather-edit",
    eyebrow: "Collection",
    title: "The leather edit",
    description: "Bags in full-grain leather that soften with use.",
    cta: "Discover bags",
    image: {
      src: unsplash("1473188588951-666fce8e7c68"),
      alt: "Brown leather messenger bag resting on a stone wall",
    },
  },
  {
    slug: "evening",
    eyebrow: "Collection",
    title: "After dark",
    description: "Sequins, pleats and deep red for the evening.",
    cta: "Discover evening",
    image: {
      src: unsplash("1550614000-4895a10e1bfd"),
      alt: "Two models in red sequin evening outfits",
      position: "50% 25%",
    },
  },
];

export const campaign = {
  eyebrow: "In store",
  title: "Made for a closer look",
  description:
    "Visit one of our boutiques to try the collection in person, with a client advisor by your side and time to choose.",
  cta: { label: "Find a boutique", href: "/stores" },
  image: {
    src: unsplash("1445205170230-053b83016050"),
    alt: "Warmly lit boutique with rails of neutral-toned clothing",
  },
} satisfies {
  eyebrow: string;
  title: string;
  description: string;
  cta: NavItem;
  image: Photo;
};

export const services = [
  {
    title: "Complimentary delivery",
    text: "Free express shipping on every order.",
  },
  {
    title: "Returns within 30 days",
    text: "Return or exchange in store or by post.",
  },
  {
    title: "Gift wrapping",
    text: "Every order arrives in our signature box.",
  },
  {
    title: "Book an appointment",
    text: "Shop one-to-one with a client advisor.",
  },
];

export const footerGroups: FooterGroup[] = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/help/contact" },
      { label: "Shipping", href: "/help/shipping" },
      { label: "Returns", href: "/help/returns" },
      { label: "FAQ", href: "/help" },
    ],
  },
  {
    title: "Shop",
    links: [
      { label: "Women", href: "/collections/women" },
      { label: "Men", href: "/collections/men" },
      { label: "Bags", href: "/collections/bags" },
      { label: "Gifts", href: "/collections/gifts" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "Our story", href: "/stories/house" },
      { label: "The workshop", href: "/stories/workshop" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
];
