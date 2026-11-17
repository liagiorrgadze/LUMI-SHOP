import { hashPassword } from './auth';
import { db } from './db';

const IMAGES = {
  womenTrench: '/src/assets/images/women_trench_coat_1794831905945.jpg',
  womenSilk: '/src/assets/images/women_silk_slip_1794831907340.jpg',
  womenCashmere: '/src/assets/images/women_cashmere_knit_1794831907914.jpg',
  menBlazer: '/src/assets/images/men_wool_blazer_1794831907584.jpg',
  menLinen: '/src/assets/images/men_linen_shirt_1794831908174.jpg',
  menTrousers: '/src/assets/images/men_trousers_pleated_1794831908261.jpg',
  shoesLoafers: '/src/assets/images/shoes_leather_loafers_1794831908189.jpg',
  shoesBoots: '/src/assets/images/shoes_suede_boots_1794831908778.jpg',
  bagTote: '/src/assets/images/bag_structured_tote_1794831908767.jpg',
  bagCrossbody: '/src/assets/images/bag_crossbody_camel_1794831909583.jpg',
  accScarf: '/src/assets/images/acc_sunglasses_scarf_1794831909890.jpg',
  heroLook: '/src/assets/images/hero_lumi_fashion_1794831905230.jpg',
};

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  category_slug: string;
  sku: string;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  images: string[];
  variants: Array<{ size: string; color: string; color_hex: string; stock: number }>;
}

const CATEGORIES = [
  {
    name: "Women's Clothing",
    slug: 'womens-clothing',
    description: 'Architectural tailoring, pure silk dresses, and Mongolian cashmere essentials.',
    image_url: IMAGES.womenTrench,
  },
  {
    name: "Men's Clothing",
    slug: 'mens-clothing',
    description: 'Refined Italian wool suiting, organic linen shirting, and pleated trousers.',
    image_url: IMAGES.menBlazer,
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    description: 'Hand-lasted calfskin loafers and Italian suede Chelsea boots.',
    image_url: IMAGES.shoesLoafers,
  },
  {
    name: 'Bags',
    slug: 'bags',
    description: 'Full-grain leather totes and artisanal saddle crossbody bags.',
    image_url: IMAGES.bagTote,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Tortoise-shell acetate eyewear, brushed cashmere scarves, and belts.',
    image_url: IMAGES.accScarf,
  },
];

const PRODUCTS: SeedProduct[] = [
  // Women's Clothing (6 products)
  {
    name: 'Atelier Gabardine Trench Coat',
    slug: 'atelier-gabardine-trench-coat',
    description:
      'Cut from water-repellent double-woven cotton gabardine with genuine horn buttons, storm welt pockets, and a fluid belted silhouette tailored for effortless layering.',
    price: 495,
    original_price: null,
    category_slug: 'womens-clothing',
    sku: 'LUMI-WC-001',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.womenTrench, IMAGES.heroLook],
    variants: [
      { size: 'XS', color: 'Sand', color_hex: '#D6C7B2', stock: 6 },
      { size: 'S', color: 'Sand', color_hex: '#D6C7B2', stock: 12 },
      { size: 'M', color: 'Sand', color_hex: '#D6C7B2', stock: 14 },
      { size: 'L', color: 'Sand', color_hex: '#D6C7B2', stock: 8 },
      { size: 'S', color: 'Obsidian', color_hex: '#18181B', stock: 5 },
      { size: 'M', color: 'Obsidian', color_hex: '#18181B', stock: 9 },
    ],
  },
  {
    name: 'Ivory Mulberry Silk Slip Dress',
    slug: 'ivory-mulberry-silk-slip-dress',
    description:
      'Bias-cut 22-momme mulberry silk charmeuse dress featuring a softly draped cowl neckline, delicate rouleau straps, and an elongated ankle-skimming hem.',
    price: 340,
    original_price: 420,
    category_slug: 'womens-clothing',
    sku: 'LUMI-WC-002',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.womenSilk, IMAGES.womenCashmere],
    variants: [
      { size: 'XS', color: 'Ivory', color_hex: '#F5F2EB', stock: 7 },
      { size: 'S', color: 'Ivory', color_hex: '#F5F2EB', stock: 11 },
      { size: 'M', color: 'Ivory', color_hex: '#F5F2EB', stock: 9 },
      { size: 'L', color: 'Ivory', color_hex: '#F5F2EB', stock: 4 },
      { size: 'M', color: 'Espresso', color_hex: '#3E2F27', stock: 6 },
    ],
  },
  {
    name: 'Oatmeal Ribbed Cashmere Turtleneck',
    slug: 'oatmeal-ribbed-cashmere-turtleneck',
    description:
      'Knitted from Grade-A Inner Mongolian cashmere in an architectural fishermen rib. Relaxed dropped shoulders with fine tubular cuffs for seasonless warmth.',
    price: 285,
    original_price: null,
    category_slug: 'womens-clothing',
    sku: 'LUMI-WC-003',
    is_new_arrival: true,
    is_best_seller: false,
    is_featured: true,
    images: [IMAGES.womenCashmere, IMAGES.womenTrench],
    variants: [
      { size: 'XS', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 8 },
      { size: 'S', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 15 },
      { size: 'M', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 12 },
      { size: 'L', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 7 },
      { size: 'S', color: 'Charcoal', color_hex: '#3F3F46', stock: 5 },
    ],
  },
  {
    name: 'Architectural Belted Wool Overcoat',
    slug: 'architectural-belted-wool-overcoat',
    description:
      'Double-faced virgin wool overcoat featuring sculpted peak lapels, deep welt pockets, and a matching waist tie for an elongated gallery silhouette.',
    price: 680,
    original_price: 790,
    category_slug: 'womens-clothing',
    sku: 'LUMI-WC-004',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.heroLook, IMAGES.womenTrench],
    variants: [
      { size: 'XS', color: 'Alabaster', color_hex: '#EFECE4', stock: 4 },
      { size: 'S', color: 'Alabaster', color_hex: '#EFECE4', stock: 9 },
      { size: 'M', color: 'Alabaster', color_hex: '#EFECE4', stock: 10 },
      { size: 'L', color: 'Alabaster', color_hex: '#EFECE4', stock: 5 },
    ],
  },
  {
    name: 'Fluid Crepe Wide-Leg Trousers',
    slug: 'fluid-crepe-wide-leg-trousers',
    description:
      'High-waisted tailored trousers crafted in Japanese triacetate crepe with crisp front pleats and an unbroken floor-grazing drape.',
    price: 225,
    original_price: null,
    category_slug: 'womens-clothing',
    sku: 'LUMI-WC-005',
    is_new_arrival: false,
    is_best_seller: true,
    is_featured: false,
    images: [IMAGES.menTrousers, IMAGES.heroLook],
    variants: [
      { size: 'XS', color: 'Espresso', color_hex: '#3E2F27', stock: 10 },
      { size: 'S', color: 'Espresso', color_hex: '#3E2F27', stock: 14 },
      { size: 'M', color: 'Espresso', color_hex: '#3E2F27', stock: 11 },
      { size: 'L', color: 'Obsidian', color_hex: '#18181B', stock: 8 },
    ],
  },
  {
    name: 'Relaxed Organic Poplin Shirt',
    slug: 'relaxed-organic-poplin-shirt',
    description:
      'Crisp long-staple organic cotton poplin shirt with mother-of-pearl buttons, curved shirttail hem, and elongated French cuffs.',
    price: 165,
    original_price: 195,
    category_slug: 'womens-clothing',
    sku: 'LUMI-WC-006',
    is_new_arrival: false,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.menLinen, IMAGES.womenSilk],
    variants: [
      { size: 'XS', color: 'Chalk', color_hex: '#F6F5F0', stock: 9 },
      { size: 'S', color: 'Chalk', color_hex: '#F6F5F0', stock: 16 },
      { size: 'M', color: 'Chalk', color_hex: '#F6F5F0', stock: 14 },
      { size: 'L', color: 'Chalk', color_hex: '#F6F5F0', stock: 6 },
    ],
  },

  // Men's Clothing (5 products)
  {
    name: 'Milanese Charcoal Wool Blazer',
    slug: 'milanese-charcoal-wool-blazer',
    description:
      'Half-canvas tailored blazer spun from Vitale Barberis Canonico super 120s merino flannel. Features natural shoulders, horn buttons, and Bemberg cupro lining.',
    price: 540,
    original_price: null,
    category_slug: 'mens-clothing',
    sku: 'LUMI-MC-001',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.menBlazer, IMAGES.menTrousers],
    variants: [
      { size: 'S', color: 'Charcoal', color_hex: '#3F3F46', stock: 7 },
      { size: 'M', color: 'Charcoal', color_hex: '#3F3F46', stock: 12 },
      { size: 'L', color: 'Charcoal', color_hex: '#3F3F46', stock: 10 },
      { size: 'XL', color: 'Charcoal', color_hex: '#3F3F46', stock: 5 },
      { size: 'M', color: 'Obsidian', color_hex: '#18181B', stock: 8 },
    ],
  },
  {
    name: 'Heavyweight Organic Linen Overshirt',
    slug: 'heavyweight-organic-linen-overshirt',
    description:
      'Structured Belgian flax linen overshirt with dual chest flap pockets, corozo nut buttons, and enzyme-washed softness for warm-weather layering.',
    price: 210,
    original_price: 250,
    category_slug: 'mens-clothing',
    sku: 'LUMI-MC-002',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.menLinen, IMAGES.menBlazer],
    variants: [
      { size: 'S', color: 'Ecru', color_hex: '#EAE5DA', stock: 11 },
      { size: 'M', color: 'Ecru', color_hex: '#EAE5DA', stock: 15 },
      { size: 'L', color: 'Ecru', color_hex: '#EAE5DA', stock: 12 },
      { size: 'XL', color: 'Ecru', color_hex: '#EAE5DA', stock: 6 },
      { size: 'M', color: 'Stone', color_hex: '#A8A29E', stock: 8 },
    ],
  },
  {
    name: 'Espresso Double-Pleated Wool Trousers',
    slug: 'espresso-double-pleated-wool-trousers',
    description:
      'Relaxed-taper tailored trousers in rich espresso virgin wool Barathea. Finished with extended waist tabs, deep double pleats, and side-seam pockets.',
    price: 275,
    original_price: null,
    category_slug: 'mens-clothing',
    sku: 'LUMI-MC-003',
    is_new_arrival: true,
    is_best_seller: false,
    is_featured: true,
    images: [IMAGES.menTrousers, IMAGES.menBlazer],
    variants: [
      { size: 'S', color: 'Espresso', color_hex: '#3E2F27', stock: 9 },
      { size: 'M', color: 'Espresso', color_hex: '#3E2F27', stock: 14 },
      { size: 'L', color: 'Espresso', color_hex: '#3E2F27', stock: 11 },
      { size: 'XL', color: 'Espresso', color_hex: '#3E2F27', stock: 5 },
    ],
  },
  {
    name: 'Merino Crewneck Atelier Knit',
    slug: 'merino-crewneck-atelier-knit',
    description:
      'Fine-gauge extra-virgin merino wool pullover engineered with seamless saddle shoulders and crisp ribbed trims for clean layering under suiting.',
    price: 190,
    original_price: null,
    category_slug: 'mens-clothing',
    sku: 'LUMI-MC-004',
    is_new_arrival: false,
    is_best_seller: true,
    is_featured: false,
    images: [IMAGES.womenCashmere, IMAGES.menLinen],
    variants: [
      { size: 'S', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 8 },
      { size: 'M', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 13 },
      { size: 'L', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 10 },
      { size: 'XL', color: 'Charcoal', color_hex: '#3F3F46', stock: 6 },
    ],
  },
  {
    name: 'Single-Breasted Storm Trench',
    slug: 'single-breasted-storm-trench',
    description:
      'Minimalist men’s raglan trench coat tailored in bonded matte cotton twill with concealed placket and breathable cupro yoke.',
    price: 520,
    original_price: 610,
    category_slug: 'mens-clothing',
    sku: 'LUMI-MC-005',
    is_new_arrival: false,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.womenTrench, IMAGES.menBlazer],
    variants: [
      { size: 'M', color: 'Sand', color_hex: '#D6C7B2', stock: 7 },
      { size: 'L', color: 'Sand', color_hex: '#D6C7B2', stock: 9 },
      { size: 'XL', color: 'Sand', color_hex: '#D6C7B2', stock: 4 },
    ],
  },

  // Shoes (4 products)
  {
    name: 'Handcrafted Calfskin Penny Loafers',
    slug: 'handcrafted-calfskin-penny-loafers',
    description:
      'Goodyear-welted penny loafers crafted in Marche, Italy from full-grain box calfskin leather with stacked leather heels and supple calf lining.',
    price: 380,
    original_price: null,
    category_slug: 'shoes',
    sku: 'LUMI-SH-001',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.shoesLoafers, IMAGES.shoesBoots],
    variants: [
      { size: '39', color: 'Obsidian', color_hex: '#18181B', stock: 6 },
      { size: '40', color: 'Obsidian', color_hex: '#18181B', stock: 10 },
      { size: '41', color: 'Obsidian', color_hex: '#18181B', stock: 12 },
      { size: '42', color: 'Obsidian', color_hex: '#18181B', stock: 9 },
      { size: '43', color: 'Obsidian', color_hex: '#18181B', stock: 5 },
    ],
  },
  {
    name: 'Tuscan Sand Suede Chelsea Boots',
    slug: 'tuscan-sand-suede-chelsea-boots',
    description:
      'Water-treated Tuscan reverse calf suede Chelsea boots built on a sleek almond last with tonal elastic gussets and crepe-rubber outsoles.',
    price: 410,
    original_price: 475,
    category_slug: 'shoes',
    sku: 'LUMI-SH-002',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.shoesBoots, IMAGES.shoesLoafers],
    variants: [
      { size: '38', color: 'Sand', color_hex: '#CBB89D', stock: 5 },
      { size: '39', color: 'Sand', color_hex: '#CBB89D', stock: 8 },
      { size: '40', color: 'Sand', color_hex: '#CBB89D', stock: 11 },
      { size: '41', color: 'Sand', color_hex: '#CBB89D', stock: 9 },
      { size: '42', color: 'Espresso', color_hex: '#3E2F27', stock: 7 },
    ],
  },
  {
    name: 'Sculpted Leather Atelier Mules',
    slug: 'sculpted-leather-atelier-mules',
    description:
      'Minimalist slip-on mules in buttery nappa leather with cushioned memory-foam footbed and architectural square toe.',
    price: 295,
    original_price: null,
    category_slug: 'shoes',
    sku: 'LUMI-SH-003',
    is_new_arrival: false,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.shoesLoafers, IMAGES.heroLook],
    variants: [
      { size: '37', color: 'Obsidian', color_hex: '#18181B', stock: 6 },
      { size: '38', color: 'Obsidian', color_hex: '#18181B', stock: 9 },
      { size: '39', color: 'Obsidian', color_hex: '#18181B', stock: 8 },
      { size: '40', color: 'Obsidian', color_hex: '#18181B', stock: 5 },
    ],
  },
  {
    name: 'Desert Suede Ankle Boots',
    slug: 'desert-suede-ankle-boots',
    description:
      'Low-cut Italian suede ankle boots finished with Blake-stitched leather soles and tonal pull tabs for effortless daily wear.',
    price: 360,
    original_price: 420,
    category_slug: 'shoes',
    sku: 'LUMI-SH-004',
    is_new_arrival: false,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.shoesBoots, IMAGES.menTrousers],
    variants: [
      { size: '40', color: 'Taupe', color_hex: '#B7A792', stock: 7 },
      { size: '41', color: 'Taupe', color_hex: '#B7A792', stock: 9 },
      { size: '42', color: 'Taupe', color_hex: '#B7A792', stock: 6 },
      { size: '43', color: 'Taupe', color_hex: '#B7A792', stock: 4 },
    ],
  },

  // Bags (4 products)
  {
    name: 'Palazzo Structured Calfskin Tote',
    slug: 'palazzo-structured-calfskin-tote',
    description:
      'Architectural top-handle tote crafted in pebbled full-grain Italian calfskin with brushed brass clasp, suede interior lining, and 15-inch laptop sleeve.',
    price: 620,
    original_price: null,
    category_slug: 'bags',
    sku: 'LUMI-BG-001',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.bagTote, IMAGES.bagCrossbody],
    variants: [
      { size: 'One Size', color: 'Obsidian', color_hex: '#18181B', stock: 12 },
      { size: 'One Size', color: 'Cognac', color_hex: '#9A5B32', stock: 7 },
    ],
  },
  {
    name: 'Siena Saddle Crossbody Bag',
    slug: 'siena-saddle-crossbody-bag',
    description:
      'Vegetable-tanned bridle leather crossbody bag with hand-painted edges, solid brass roller buckle, and adjustable shoulder strap.',
    price: 445,
    original_price: 520,
    category_slug: 'bags',
    sku: 'LUMI-BG-002',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.bagCrossbody, IMAGES.bagTote],
    variants: [
      { size: 'One Size', color: 'Cognac', color_hex: '#9A5B32', stock: 10 },
      { size: 'One Size', color: 'Obsidian', color_hex: '#18181B', stock: 6 },
    ],
  },
  {
    name: 'Atelier Leather Weekender Holdall',
    slug: 'atelier-leather-weekender-holdall',
    description:
      'Cabin-sized overnight bag constructed from supple drum-dyed calfskin with reinforced base studs and detachable cotton webbing strap.',
    price: 740,
    original_price: null,
    category_slug: 'bags',
    sku: 'LUMI-BG-003',
    is_new_arrival: false,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.bagTote, IMAGES.shoesBoots],
    variants: [
      { size: 'One Size', color: 'Obsidian', color_hex: '#18181B', stock: 5 },
      { size: 'One Size', color: 'Espresso', color_hex: '#3E2F27', stock: 4 },
    ],
  },
  {
    name: 'Mini Equestrian Shoulder Pouch',
    slug: 'mini-equestrian-shoulder-pouch',
    description:
      'Compact evening-to-day saddle pouch made from smooth vegetable-tanned leather with accordion gussets and concealed magnetic closure.',
    price: 310,
    original_price: 365,
    category_slug: 'bags',
    sku: 'LUMI-BG-004',
    is_new_arrival: false,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.bagCrossbody, IMAGES.womenSilk],
    variants: [
      { size: 'One Size', color: 'Cognac', color_hex: '#9A5B32', stock: 9 },
      { size: 'One Size', color: 'Sand', color_hex: '#D6C7B2', stock: 6 },
    ],
  },

  // Accessories (3 products -> total 22 products!)
  {
    name: 'Tortoise Acetate Frames & Cashmere Set',
    slug: 'tortoise-acetate-frames-cashmere-set',
    description:
      'Hand-finished Japanese Mazzucchelli cellulose acetate sunglasses with CR-39 polarized lenses, paired with a fringed pure cashmere travel scarf.',
    price: 260,
    original_price: 310,
    category_slug: 'accessories',
    sku: 'LUMI-AC-001',
    is_new_arrival: true,
    is_best_seller: true,
    is_featured: true,
    images: [IMAGES.accScarf, IMAGES.womenCashmere],
    variants: [
      { size: 'One Size', color: 'Tortoise / Camel', color_hex: '#6B4423', stock: 15 },
      { size: 'One Size', color: 'Obsidian / Oatmeal', color_hex: '#18181B', stock: 10 },
    ],
  },
  {
    name: 'Brushed Mongolian Cashmere Scarf',
    slug: 'brushed-mongolian-cashmere-scarf',
    description:
      'Oversized double-faced cashmere wrap finished with hand-twisted tassels and soft brushed nap for effortless cold-weather warmth.',
    price: 185,
    original_price: null,
    category_slug: 'accessories',
    sku: 'LUMI-AC-002',
    is_new_arrival: false,
    is_best_seller: true,
    is_featured: false,
    images: [IMAGES.accScarf, IMAGES.womenCashmere],
    variants: [
      { size: 'One Size', color: 'Camel', color_hex: '#C19A6B', stock: 18 },
      { size: 'One Size', color: 'Oatmeal', color_hex: '#DDD5C7', stock: 14 },
    ],
  },
  {
    name: 'Mazzucchelli Havana Sunglasses',
    slug: 'mazzucchelli-havana-sunglasses',
    description:
      'Sculpted keyhole-bridge frames milled from bio-acetate with five-barrel stainless hinges and 100% UVA/UVB mineral glass lenses.',
    price: 215,
    original_price: null,
    category_slug: 'accessories',
    sku: 'LUMI-AC-003',
    is_new_arrival: true,
    is_best_seller: false,
    is_featured: false,
    images: [IMAGES.accScarf, IMAGES.menLinen],
    variants: [
      { size: 'One Size', color: 'Havana Tortoise', color_hex: '#5C3A21', stock: 12 },
      { size: 'One Size', color: 'Obsidian', color_hex: '#18181B', stock: 9 },
    ],
  },
];

export function seedDatabase(): void {
  const categoryCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  if (categoryCount > 0) {
    return;
  }

  const runSeed = db.transaction(() => {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)'
    );
    const categoryIdBySlug = new Map<string, number>();

    for (const cat of CATEGORIES) {
      const info = insertCategory.run(cat.name, cat.slug, cat.description, cat.image_url);
      categoryIdBySlug.set(cat.slug, Number(info.lastInsertRowid));
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (
        name, slug, description, price, original_price, category_id,
        sku, is_new_arrival, is_best_seller, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertImage = db.prepare(
      'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)'
    );
    const insertVariant = db.prepare(
      'INSERT INTO product_variants (product_id, size, color, color_hex, stock_quantity) VALUES (?, ?, ?, ?, ?)'
    );

    const seededProducts: Array<{ id: number; name: string; price: number; variantId: number; size: string; color: string }> = [];

    for (const p of PRODUCTS) {
      const catId = categoryIdBySlug.get(p.category_slug)!;
      const prodInfo = insertProduct.run(
        p.name,
        p.slug,
        p.description,
        p.price,
        p.original_price,
        catId,
        p.sku,
        p.is_new_arrival ? 1 : 0,
        p.is_best_seller ? 1 : 0,
        p.is_featured ? 1 : 0
      );
      const productId = Number(prodInfo.lastInsertRowid);

      p.images.forEach((imgUrl, idx) => {
        insertImage.run(productId, imgUrl, idx === 0 ? 1 : 0, idx);
      });

      p.variants.forEach((v, idx) => {
        const varInfo = insertVariant.run(productId, v.size, v.color, v.color_hex, v.stock);
        if (idx === 0) {
          seededProducts.push({
            id: productId,
            name: p.name,
            price: p.price,
            variantId: Number(varInfo.lastInsertRowid),
            size: v.size,
            color: v.color,
          });
        }
      });
    }

    // Create sample customer and bootstrap admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lumistore.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'LumiAdmin2026!';

    const insertUser = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password_hash, role, phone, country, city, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'Elena',
      'Vance',
      adminEmail,
      hashPassword(adminPassword),
      'ADMIN',
      '+1 212 555 0100',
      'United States',
      'New York',
      '720 Madison Avenue, Suite 4'
    );

    const customerInfo = insertUser.run(
      'Claire',
      'Laurent',
      'claire@example.com',
      hashPassword('LumiPass2026!'),
      'USER',
      '+1 212 555 0148',
      'United States',
      'New York',
      '412 Mercer Street, Apt 4B'
    );
    const customerId = Number(customerInfo.lastInsertRowid);

    const customer2Info = insertUser.run(
      'Julian',
      'Mercer',
      'julian@example.com',
      hashPassword('LumiPass2026!'),
      'USER',
      '+44 20 7946 0921',
      'United Kingdom',
      'London',
      '18 Savile Row, Mayfair'
    );
    const customer2Id = Number(customer2Info.lastInsertRowid);

    // Seed authentic reviews
    const insertReview = db.prepare(
      'INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)'
    );
    insertReview.run(
      seededProducts[0].id,
      customerId,
      5,
      'Impeccable drape and weight',
      'The double-woven gabardine holds its architectural shape even in rainy weather. Worth every detail.'
    );
    insertReview.run(
      seededProducts[0].id,
      customer2Id,
      5,
      'Timeless wardrobe staple',
      'Purchased as a gift and the horn button hardware and interior finishing rival couture houses.'
    );
    insertReview.run(
      seededProducts[1].id,
      customerId,
      5,
      'Luminous silk finish',
      'The bias cut moves effortlessly without clinging. True to size.'
    );
    insertReview.run(
      seededProducts[6].id,
      customer2Id,
      5,
      'Superb shoulder structure',
      'Unbelievable Italian flannel handfeel and clean half-canvas tailoring straight off the rack.'
    );
    insertReview.run(
      seededProducts[15].id,
      customerId,
      5,
      'Structured everyday elegance',
      'Fits my laptop and daily essentials while staying completely upright on any surface.'
    );

    // Seed 3 realistic orders for dashboard metrics & customer history
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, first_name, last_name, email, phone, country, city,
        delivery_address, delivery_instructions, payment_method, payment_status, status,
        subtotal, delivery_cost, total_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, size, color, unit_price, quantity, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

    // Order 1 (Delivered)
    const p0 = seededProducts[0];
    const p15 = seededProducts[15];
    const o1Sub = p0.price + p15.price;
    const o1Info = insertOrder.run(
      'LUMI-20261108-4821',
      customerId,
      'Claire',
      'Laurent',
      'claire@example.com',
      '+1 212 555 0148',
      'United States',
      'New York',
      '412 Mercer Street, Apt 4B',
      'Leave with building concierge',
      'COD',
      'Paid',
      'Delivered',
      o1Sub,
      0,
      o1Sub,
      daysAgo(8)
    );
    insertOrderItem.run(Number(o1Info.lastInsertRowid), p0.id, p0.variantId, p0.name, p0.size, p0.color, p0.price, 1, p0.price);
    insertOrderItem.run(Number(o1Info.lastInsertRowid), p15.id, p15.variantId, p15.name, p15.size, p15.color, p15.price, 1, p15.price);

    // Order 2 (Shipped)
    const p6 = seededProducts[6];
    const p11 = seededProducts[11];
    const o2Sub = p6.price + p11.price;
    const o2Info = insertOrder.run(
      'LUMI-20261112-7194',
      customer2Id,
      'Julian',
      'Mercer',
      'julian@example.com',
      '+44 20 7946 0921',
      'United Kingdom',
      'London',
      '18 Savile Row, Mayfair',
      'Call on arrival',
      'COD',
      'Pending',
      'Shipped',
      o2Sub,
      0,
      o2Sub,
      daysAgo(3)
    );
    insertOrderItem.run(Number(o2Info.lastInsertRowid), p6.id, p6.variantId, p6.name, p6.size, p6.color, p6.price, 1, p6.price);
    insertOrderItem.run(Number(o2Info.lastInsertRowid), p11.id, p11.variantId, p11.name, p11.size, p11.color, p11.price, 1, p11.price);

    // Order 3 (Confirmed)
    const p1 = seededProducts[1];
    const o3Info = insertOrder.run(
      'LUMI-20261115-9032',
      customerId,
      'Claire',
      'Laurent',
      'claire@example.com',
      '+1 212 555 0148',
      'United States',
      'New York',
      '412 Mercer Street, Apt 4B',
      '',
      'COD',
      'Pending',
      'Confirmed',
      p1.price,
      0,
      p1.price,
      daysAgo(1)
    );
    insertOrderItem.run(Number(o3Info.lastInsertRowid), p1.id, p1.variantId, p1.name, p1.size, p1.color, p1.price, 1, p1.price);
  });

  runSeed();
}
