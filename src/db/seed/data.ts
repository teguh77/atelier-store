/*
 * Sample catalog used to seed the database. Moved out of the dummy
 * storefront data so it stays available as seed input.
 * Prices are in cents. Stock is per size; one-size items use "One size".
 */

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const ONE_SIZE = "One size";

export type SeedCategory = {
  slug: string;
  label: string;
  showOnHome: boolean;
  image?: { src: string; alt: string; position?: string };
};

export const categories: SeedCategory[] = [
  {
    slug: "bags",
    label: "Bags",
    showOnHome: true,
    image: {
      src: unsplash("1566150905458-1bf1fc113f0d"),
      alt: "Pink leather chain bag on a white block",
    },
  },
  {
    slug: "shoes",
    label: "Shoes",
    showOnHome: true,
    image: {
      src: unsplash("1560343090-f0409e92791a"),
      alt: "Green suede brogue on a pastel set",
    },
  },
  {
    slug: "ready-to-wear",
    label: "Ready-to-wear",
    showOnHome: true,
    image: {
      src: unsplash("1558769132-cb1aea458c5e"),
      alt: "Rail of neutral knitwear beside dried pampas grass",
    },
  },
  {
    slug: "jewelry-watches",
    label: "Jewelry & watches",
    showOnHome: true,
    image: {
      src: unsplash("1611591437281-460bfbe1220a"),
      alt: "Gold bracelet set with small clear stones",
    },
  },
  {
    slug: "accessories",
    label: "Accessories",
    showOnHome: false,
  },
];

export type SeedProduct = {
  slug: string;
  sku: string;
  name: string;
  price: number;
  badge?: string;
  category: string;
  color: { name: string; hex: string };
  sizes: { label: string; stock: number }[];
  description: string;
  details: string[];
  image: { src: string; alt: string; position?: string };
};

export const products: SeedProduct[] = [
  {
    slug: "leather-satchel",
    sku: "AT-BG-1042",
    name: "Leather satchel",
    price: 285000,
    badge: "New in",
    category: "bags",
    color: { name: "Dove grey", hex: "#8c8a88" },
    sizes: [{ label: ONE_SIZE, stock: 6 }],
    description:
      "A compact satchel cut from smooth calf leather, with two buckled straps and a top handle. Carry it by hand or wear it cross-body on the adjustable strap.",
    details: [
      "Smooth calf leather",
      "Cotton-linen lining",
      "Antique silver-tone hardware",
      "Adjustable, detachable shoulder strap",
      "W 26 × H 19 × D 9 cm",
      "Made in Italy",
    ],
    image: {
      src: unsplash("1605733513597-a8f8341084e6"),
      alt: "Grey leather satchel with two buckled straps",
    },
  },
  {
    slug: "croc-effect-mini-bag",
    sku: "AT-BG-1077",
    name: "Croc-effect mini bag",
    price: 225000,
    badge: "New in",
    category: "bags",
    color: { name: "Bordeaux", hex: "#5a1a22" },
    sizes: [{ label: ONE_SIZE, stock: 2 }],
    description:
      "A small structured bag in croc-embossed leather with a sculpted metal clasp. Sized for the essentials: phone, cards and keys.",
    details: [
      "Croc-embossed calf leather",
      "Suede lining",
      "Gold-tone clasp",
      "Top handle",
      "W 15 × H 19 × D 6 cm",
      "Made in Italy",
    ],
    image: {
      src: unsplash("1575032617751-6ddec2089882"),
      alt: "Burgundy croc-effect leather bag held up by its handle",
    },
  },
  {
    slug: "printed-satin-pump",
    sku: "AT-SH-2210",
    name: "Printed satin pump",
    price: 89000,
    category: "shoes",
    color: { name: "Blue floral", hex: "#2f6fb5" },
    sizes: [
      { label: "36", stock: 4 },
      { label: "37", stock: 2 },
      { label: "38", stock: 0 },
      { label: "39", stock: 5 },
      { label: "40", stock: 1 },
      { label: "41", stock: 0 },
    ],
    description:
      "A pointed pump in printed silk satin on a slender 100 mm heel. The floral print is engineered so every pair is slightly different.",
    details: [
      "Printed silk satin upper",
      "Leather lining and sole",
      "100 mm heel",
      "Fits true to size",
      "Made in Italy",
    ],
    image: {
      src: unsplash("1543163521-1bf539c55dd2"),
      alt: "Pair of floral satin high-heel pumps",
    },
  },
  {
    slug: "leather-strap-watch",
    sku: "AT-JW-3105",
    name: "Leather strap watch",
    price: 420000,
    category: "jewelry-watches",
    color: { name: "Rose gold / taupe", hex: "#b88a6a" },
    sizes: [{ label: ONE_SIZE, stock: 9 }],
    description:
      "A slim 36 mm watch with a white lacquered dial, rose gold-tone case and a soft taupe leather strap. Swiss quartz movement.",
    details: [
      "36 mm stainless steel case, rose gold-tone PVD",
      "White lacquered dial",
      "Swiss quartz movement",
      "Water resistant to 30 m",
      "Interchangeable leather strap",
    ],
    image: {
      src: unsplash("1524592094714-0f0654e20314"),
      alt: "Hand holding a watch with a white dial and taupe leather strap",
    },
  },
  {
    slug: "round-metal-sunglasses",
    sku: "AT-AC-4012",
    name: "Round metal sunglasses",
    price: 46000,
    badge: "New in",
    category: "accessories",
    color: { name: "Gold / green", hex: "#c9a35b" },
    sizes: [{ label: ONE_SIZE, stock: 0 }],
    description:
      "Round sunglasses with a fine gold-tone metal frame and green mineral-glass lenses. Comes with a leather case.",
    details: [
      "Gold-tone metal frame",
      "Green mineral-glass lenses",
      "100% UV protection",
      "Adjustable nose pads",
      "Leather case included",
    ],
    image: {
      src: unsplash("1511499767150-a48a237f0083"),
      alt: "Round gold-frame sunglasses with green lenses",
    },
  },
  {
    slug: "layered-pendant-necklace",
    sku: "AT-JW-3150",
    name: "Layered pendant necklace",
    price: 135000,
    category: "jewelry-watches",
    color: { name: "Gold", hex: "#c6a15b" },
    sizes: [{ label: ONE_SIZE, stock: 3 }],
    description:
      "Two fine chains worn together: one with a faceted blue stone, one with a crescent set with small crystals.",
    details: [
      "18k gold-plated sterling silver",
      "Faceted blue glass stone",
      "Lengths 42 cm and 50 cm",
      "Lobster clasp",
    ],
    image: {
      src: unsplash("1599643478518-a784e5dc4c8f"),
      alt: "Layered gold necklaces with a blue stone and a crescent pendant",
    },
  },
  {
    slug: "satin-bomber-jacket",
    sku: "AT-RW-5320",
    name: "Satin bomber jacket",
    price: 310000,
    category: "ready-to-wear",
    color: { name: "Copper", hex: "#b4704e" },
    sizes: [
      { label: "XS", stock: 1 },
      { label: "S", stock: 4 },
      { label: "M", stock: 6 },
      { label: "L", stock: 0 },
      { label: "XL", stock: 2 },
    ],
    description:
      "A lightweight bomber in washed satin with a ribbed collar, cuffs and hem, and a utility pocket on the sleeve.",
    details: [
      "100% polyamide satin",
      "Ribbed knit trims",
      "Two-way front zip",
      "Regular fit; true to size",
      "Dry clean only",
    ],
    image: {
      src: unsplash("1591047139829-d91aecb6caea"),
      alt: "Copper satin bomber jacket on a hanger",
    },
  },
  {
    slug: "leather-lace-up-boot",
    sku: "AT-SH-2290",
    name: "Leather lace-up boot",
    price: 98000,
    category: "shoes",
    color: { name: "Cognac", hex: "#8a4b22" },
    sizes: [
      { label: "40", stock: 3 },
      { label: "41", stock: 7 },
      { label: "42", stock: 0 },
      { label: "43", stock: 5 },
      { label: "44", stock: 2 },
      { label: "45", stock: 0 },
    ],
    description:
      "A Goodyear-welted boot in waxed cognac leather with a lug rubber sole. Built to be resoled.",
    details: [
      "Waxed full-grain leather",
      "Goodyear-welted construction",
      "Rubber lug sole",
      "Leather lining",
      "Fits true to size",
    ],
    image: {
      src: unsplash("1520639888713-7851133b1ed0"),
      alt: "Pair of brown leather lace-up boots",
      position: "50% 65%",
    },
  },
];

/*
 * Extra gallery photos per product, shown after the product's own image.
 * Photos from Unsplash (Unsplash License).
 */
export const galleries: Record<string, { src: string; alt: string }[]> = {
  "leather-satchel": [
    {
      src: unsplash("1473188588951-666fce8e7c68"),
      alt: "Brown leather satchel with a buckled flap, resting on a stone",
    },
    {
      src: unsplash("1510783891783-80cda42ebfd2"),
      alt: "Tan leather satchel with buckle straps, carried over a shoulder",
    },
    {
      src: unsplash("1517612228538-cefdbc2c01e7"),
      alt: "Worn brown leather satchel with a shoulder strap on a desk",
    },
  ],
  "croc-effect-mini-bag": [
    {
      src: unsplash("1575295912464-fcfd1186d11d"),
      alt: "Croc-embossed bag with yellow trim and a gold charm",
    },
    {
      src: unsplash("1713425886143-6ea8c776bf2d"),
      alt: "Taupe croc-embossed bag with a long strap on a pedestal",
    },
  ],
  "printed-satin-pump": [
    {
      src: unsplash("1574791418059-2e8d961ab4fb"),
      alt: "Ivory satin pumps with a crystal bow on a wooden floor",
    },
    {
      src: unsplash("1698265026614-a49b250850bf"),
      alt: "Satin pointed pumps with crystal straps",
    },
    {
      src: unsplash("1678924722426-d10bb7f61526"),
      alt: "Pale satin pumps with crystal detail in soft shadow",
    },
  ],
  "leather-strap-watch": [
    {
      src: unsplash("1612817159623-0399784fd0ce"),
      alt: "Watch with a black dial and tan leather strap",
    },
    {
      src: unsplash("1451859757691-f318d641ab4d"),
      alt: "Rose-gold watch with a cream dial and black leather strap",
    },
    {
      src: unsplash("1651735060117-db464f215a6c"),
      alt: "Gold-tone watch with a brown leather strap on a dark surface",
    },
  ],
  "round-metal-sunglasses": [
    {
      src: unsplash("1511499602539-b3f6b9b79014"),
      alt: "Round gold-frame sunglasses with green lenses on a marble surface",
    },
    {
      src: unsplash("1456421385613-d0666bb96b78"),
      alt: "Woman holding round gold-frame sunglasses",
    },
    {
      src: unsplash("1649119161997-00ffc8c24e11"),
      alt: "Round silver-frame sunglasses with brown gradient lenses",
    },
  ],
  "layered-pendant-necklace": [
    {
      src: unsplash("1601821765780-754fa98637c1"),
      alt: "Woman wearing layered gold necklaces with a moon charm",
    },
    {
      src: unsplash("1635767798638-3e25273a8236"),
      alt: "Layered gold chains with a coin pendant on a grey backdrop",
    },
    {
      src: unsplash("1610694955371-d4a3e0ce4b52"),
      alt: "Layered rose-gold necklaces with a bar pendant",
    },
  ],
  "satin-bomber-jacket": [
    {
      src: unsplash("1774413768903-057eb084133b"),
      alt: "Man in a cream bomber jacket beside a shop fridge",
    },
    {
      src: unsplash("1760126070359-5b82710274fe"),
      alt: "Woman in an olive bomber jacket crouching against a white backdrop",
    },
    {
      src: unsplash("1774413769417-29fde33e368b"),
      alt: "Man in a cream bomber jacket standing in a shop",
    },
  ],
  "leather-lace-up-boot": [
    {
      src: unsplash("1608256246200-53e635b5b65f"),
      alt: "Pair of dark brown leather lace-up boots on a dark backdrop",
    },
    {
      src: unsplash("1511283402428-355853756676"),
      alt: "Pair of worn brown leather lace-up boots on pavement",
    },
    {
      src: unsplash("1606036525923-525fa3b35465"),
      alt: "Pair of brown lace-up boots on a wooden surface",
    },
  ],
};
