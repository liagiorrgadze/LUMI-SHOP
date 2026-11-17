import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {
  attachOptionalUser,
  hashPassword,
  requireAdmin,
  requireAuth,
  signAuthToken,
  verifyPassword,
  type AuthenticatedRequest,
} from '../auth';
import { db } from '../db';
import {
  calculateCartTotals,
  canAddToCart,
  roundCurrency,
  slugify,
  validateCheckoutForm,
} from '../../src/utils/commerce';
import type { OrderStatus, Product } from '../../src/types/index';

export const apiRouter = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 32);
    cb(null, `${safeBase || 'lumi'}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WEBP images up to 5MB are allowed.'));
    }
  },
});

// Helper: hydrate products with images, variants, and rating aggregates
function hydrateProducts(rows: any[]): Product[] {
  if (rows.length === 0) return [];
  const productIds = rows.map((r) => r.id);
  const placeholders = productIds.map(() => '?').join(',');

  const images = db
    .prepare(
      `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY is_primary DESC, sort_order ASC, id ASC`
    )
    .all(...productIds) as any[];

  const variants = db
    .prepare(`SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY id ASC`)
    .all(...productIds) as any[];

  const reviewAggs = db
    .prepare(
      `SELECT product_id, AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id IN (${placeholders}) GROUP BY product_id`
    )
    .all(...productIds) as any[];

  const imgMap = new Map<number, any[]>();
  for (const img of images) {
    if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, []);
    imgMap.get(img.product_id)!.push({ ...img, is_primary: Boolean(img.is_primary) });
  }

  const varMap = new Map<number, any[]>();
  for (const v of variants) {
    if (!varMap.has(v.product_id)) varMap.set(v.product_id, []);
    varMap.get(v.product_id)!.push(v);
  }

  const revMap = new Map<number, { avg: number; count: number }>();
  for (const r of reviewAggs) {
    revMap.set(r.product_id, {
      avg: Math.round((r.avg_rating || 0) * 10) / 10,
      count: r.review_count || 0,
    });
  }

  return rows.map((row) => {
    const pVars = varMap.get(row.id) || [];
    const totalStock = pVars.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
    const rev = revMap.get(row.id);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      original_price: row.original_price,
      category_id: row.category_id,
      category_name: row.category_name,
      category_slug: row.category_slug,
      sku: row.sku,
      is_new_arrival: Boolean(row.is_new_arrival),
      is_best_seller: Boolean(row.is_best_seller),
      is_featured: Boolean(row.is_featured),
      created_at: row.created_at,
      updated_at: row.updated_at,
      images: imgMap.get(row.id) || [],
      variants: pVars,
      total_stock: totalStock,
      average_rating: rev ? rev.avg : 0,
      review_count: rev ? rev.count : 0,
    };
  });
}

function hydrateOrder(orderRow: any) {
  if (!orderRow) return null;
  const items = db
    .prepare(
      `SELECT oi.*, (
         SELECT pi.image_url FROM product_images pi
         WHERE pi.product_id = oi.product_id
         ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1
       ) as image_url
       FROM order_items oi WHERE oi.order_id = ? ORDER BY oi.id ASC`
    )
    .all(orderRow.id);
  return { ...orderRow, items };
}

function getSafeUser(userId: number) {
  return db
    .prepare(
      'SELECT id, first_name, last_name, email, role, phone, country, city, address, created_at, updated_at FROM users WHERE id = ?'
    )
    .get(userId);
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  const { first_name, last_name, email, password, phone, country, city, address } = req.body || {};

  if (!first_name || String(first_name).trim().length < 2) {
    res.status(400).json({ error: 'First name must be at least 2 characters.' });
    return;
  }
  if (!last_name || String(last_name).trim().length < 2) {
    res.status(400).json({ error: 'Last name must be at least 2 characters.' });
    return;
  }
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (!password || String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, country, city, address)
       VALUES (?, ?, ?, ?, 'USER', ?, ?, ?, ?)`
    )
    .run(
      String(first_name).trim(),
      String(last_name).trim(),
      normalizedEmail,
      hashPassword(String(password)),
      phone ? String(phone).trim() : null,
      country ? String(country).trim() : null,
      city ? String(city).trim() : null,
      address ? String(address).trim() : null
    );

  const user = getSafeUser(Number(info.lastInsertRowid)) as any;
  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user });
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
  if (!row || !verifyPassword(String(password), row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = signAuthToken({ userId: row.id, email: row.email, role: row.role });
  const { password_hash: _ignored, ...safeUser } = row;
  res.json({ token, user: safeUser });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = getSafeUser(req.user!.id);
  res.json({ user });
});

apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { first_name, last_name, phone, country, city, address } = req.body || {};
  if (!first_name || String(first_name).trim().length < 2 || !last_name || String(last_name).trim().length < 2) {
    res.status(400).json({ error: 'First and last names are required.' });
    return;
  }

  db.prepare(
    `UPDATE users SET first_name = ?, last_name = ?, phone = ?, country = ?, city = ?, address = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    String(first_name).trim(),
    String(last_name).trim(),
    phone ? String(phone).trim() : null,
    country ? String(country).trim() : null,
    city ? String(city).trim() : null,
    address ? String(address).trim() : null,
    req.user!.id
  );

  res.json({ user: getSafeUser(req.user!.id) });
});

apiRouter.put('/auth/password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password || String(new_password).length < 6) {
    res.status(400).json({ error: 'Current password and a new password (min 6 chars) are required.' });
    return;
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!row || !verifyPassword(String(current_password), row.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
    hashPassword(String(new_password)),
    req.user!.id
  );
  res.json({ message: 'Password updated successfully.' });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

// ==========================================
// CATEGORIES ENDPOINTS
// ==========================================

apiRouter.get('/categories', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id ASC`
    )
    .all();
  res.json({ categories: rows });
});

apiRouter.post('/categories', requireAuth, requireAdmin, (req, res) => {
  const { name, description, image_url } = req.body || {};
  if (!name || String(name).trim().length < 2) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const cleanName = String(name).trim();
  const slug = slugify(cleanName);
  const exists = db.prepare('SELECT id FROM categories WHERE slug = ? OR lower(name) = lower(?)').get(slug, cleanName);
  if (exists) {
    res.status(409).json({ error: 'A category with this name already exists.' });
    return;
  }

  const info = db
    .prepare('INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)')
    .run(cleanName, slug, description ? String(description).trim() : null, image_url || null);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ category });
});

apiRouter.put('/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { name, description, image_url } = req.body || {};
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  const cleanName = name ? String(name).trim() : existing.name;
  const slug = slugify(cleanName);

  db.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ? WHERE id = ?').run(
    cleanName,
    slug,
    description !== undefined ? description : existing.description,
    image_url !== undefined ? image_url : existing.image_url,
    id
  );
  res.json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(id) });
});

apiRouter.delete('/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(id) as any).c;
  if (productCount > 0) {
    res.status(400).json({ error: 'Cannot delete a category that still contains products.' });
    return;
  }
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  res.json({ message: 'Category deleted.' });
});

// ==========================================
// PRODUCTS & REVIEWS ENDPOINTS
// ==========================================

apiRouter.get('/products', (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    size,
    color,
    sort = 'newest',
    featured,
    newArrival,
    onSale,
  } = req.query as Record<string, string | undefined>;

  const where: string[] = [];
  const params: any[] = [];

  if (search && search.trim()) {
    where.push('(lower(p.name) LIKE ? OR lower(p.description) LIKE ? OR lower(p.sku) LIKE ?)');
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }

  if (category && category !== 'all') {
    where.push('(c.slug = ? OR CAST(c.id AS TEXT) = ?)');
    params.push(category, category);
  }

  if (minPrice !== undefined && minPrice !== '') {
    where.push('p.price >= ?');
    params.push(Number(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    where.push('p.price <= ?');
    params.push(Number(maxPrice));
  }

  if (featured === 'true' || featured === '1') {
    where.push('p.is_featured = 1');
  }

  if (newArrival === 'true' || newArrival === '1') {
    where.push('p.is_new_arrival = 1');
  }

  if (onSale === 'true' || onSale === '1') {
    where.push('p.original_price IS NOT NULL AND p.original_price > p.price');
  }

  if (size && size !== 'all') {
    where.push(
      'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size = ? AND pv.stock_quantity > 0)'
    );
    params.push(size);
  }

  if (color && color !== 'all') {
    where.push(
      'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND lower(pv.color) = lower(?))'
    );
    params.push(color);
  }

  let orderBy = 'p.is_featured DESC, p.is_best_seller DESC, p.id ASC';
  if (sort === 'newest') orderBy = 'p.created_at DESC, p.id DESC';
  else if (sort === 'price_asc') orderBy = 'p.price ASC, p.id DESC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC, p.id DESC';
  else if (sort === 'bestseller') orderBy = 'p.is_best_seller DESC, p.id DESC';

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY ${orderBy}`
    )
    .all(...params);

  res.json({ products: hydrateProducts(rows) });
});

apiRouter.get('/products/:id', (req, res) => {
  const param = req.params.id;
  const row = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? OR p.slug = ?`
    )
    .get(Number(param) || -1, param) as any;

  if (!row) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const [product] = hydrateProducts([row]);
  const reviews = db
    .prepare(
      `SELECT r.*, (u.first_name || ' ' || u.last_name) as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC, r.id DESC`
    )
    .all(product.id) as any[];

  const relatedRows = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? AND p.id != ?
       ORDER BY p.is_best_seller DESC, p.id DESC
       LIMIT 4`
    )
    .all(product.category_id, product.id);

  res.json({
    product: {
      ...product,
      reviews,
      related_products: hydrateProducts(relatedRows),
    },
  });
});

apiRouter.post('/products/:id/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
  const productId = Number(req.params.id);
  const { rating, title, comment } = req.body || {};

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    return;
  }
  if (!comment || String(comment).trim().length < 5) {
    res.status(400).json({ error: 'Review comment must be at least 5 characters.' });
    return;
  }

  const info = db
    .prepare('INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)')
    .run(
      productId,
      req.user!.id,
      numRating,
      title ? String(title).trim() : null,
      String(comment).trim()
    );

  const review = db
    .prepare(
      `SELECT r.*, (u.first_name || ' ' || u.last_name) as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`
    )
    .get(info.lastInsertRowid);

  res.status(201).json({ review });
});

apiRouter.post('/products', requireAuth, requireAdmin, (req, res) => {
  const {
    name,
    description,
    price,
    original_price,
    category_id,
    sku,
    is_new_arrival,
    is_best_seller,
    is_featured,
    images,
    variants,
  } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    res.status(400).json({ error: 'Product name is required.' });
    return;
  }
  if (!description || String(description).trim().length < 10) {
    res.status(400).json({ error: 'Product description must be at least 10 characters.' });
    return;
  }
  if (price === undefined || Number(price) < 0 || Number.isNaN(Number(price))) {
    res.status(400).json({ error: 'Valid non-negative price is required.' });
    return;
  }
  if (!category_id) {
    res.status(400).json({ error: 'Category is required.' });
    return;
  }
  if (!sku || String(sku).trim().length < 2) {
    res.status(400).json({ error: 'SKU is required.' });
    return;
  }

  const cleanSku = String(sku).trim().toUpperCase();
  if (db.prepare('SELECT id FROM products WHERE sku = ?').get(cleanSku)) {
    res.status(409).json({ error: 'A product with this SKU already exists.' });
    return;
  }

  const baseSlug = slugify(String(name));
  let slug = baseSlug;
  if (db.prepare('SELECT id FROM products WHERE slug = ?').get(slug)) {
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  const createTx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO products (
          name, slug, description, price, original_price, category_id,
          sku, is_new_arrival, is_best_seller, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(name).trim(),
        slug,
        String(description).trim(),
        roundCurrency(Number(price)),
        original_price ? roundCurrency(Number(original_price)) : null,
        Number(category_id),
        cleanSku,
        is_new_arrival ? 1 : 0,
        is_best_seller ? 1 : 0,
        is_featured ? 1 : 0
      );

    const productId = Number(info.lastInsertRowid);

    const imgList: string[] = Array.isArray(images) && images.length > 0
      ? images.filter(Boolean)
      : ['/src/assets/images/women_trench_coat_1794831905945.jpg'];
    const insertImg = db.prepare(
      'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)'
    );
    imgList.forEach((url, idx) => insertImg.run(productId, url, idx === 0 ? 1 : 0, idx));

    const varList = Array.isArray(variants) && variants.length > 0
      ? variants
      : [{ size: 'M', color: 'Obsidian', color_hex: '#18181B', stock_quantity: 10 }];
    const insertVar = db.prepare(
      'INSERT INTO product_variants (product_id, size, color, color_hex, stock_quantity) VALUES (?, ?, ?, ?, ?)'
    );
    for (const v of varList) {
      const stock = Math.max(0, Math.floor(Number(v.stock_quantity ?? 0)));
      insertVar.run(productId, String(v.size).trim(), String(v.color).trim(), v.color_hex || '#18181B', stock);
    }

    return productId;
  });

  const newId = createTx();
  const row = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(newId);
  res.status(201).json({ product: hydrateProducts([row])[0] });
});

apiRouter.put('/products/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const {
    name,
    description,
    price,
    original_price,
    category_id,
    sku,
    is_new_arrival,
    is_best_seller,
    is_featured,
    images,
    variants,
  } = req.body || {};

  if (price !== undefined && Number(price) < 0) {
    res.status(400).json({ error: 'Price cannot be negative.' });
    return;
  }

  const updateTx = db.transaction(() => {
    db.prepare(
      `UPDATE products SET
        name = ?, description = ?, price = ?, original_price = ?, category_id = ?,
        sku = ?, is_new_arrival = ?, is_best_seller = ?, is_featured = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      name ? String(name).trim() : existing.name,
      description ? String(description).trim() : existing.description,
      price !== undefined ? roundCurrency(Number(price)) : existing.price,
      original_price !== undefined
        ? original_price === null || original_price === ''
          ? null
          : roundCurrency(Number(original_price))
        : existing.original_price,
      category_id ? Number(category_id) : existing.category_id,
      sku ? String(sku).trim().toUpperCase() : existing.sku,
      is_new_arrival !== undefined ? (is_new_arrival ? 1 : 0) : existing.is_new_arrival,
      is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : existing.is_best_seller,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      id
    );

    if (Array.isArray(images) && images.length > 0) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      const insertImg = db.prepare(
        'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)'
      );
      images.filter(Boolean).forEach((url: string, idx: number) => {
        insertImg.run(id, url, idx === 0 ? 1 : 0, idx);
      });
    }

    if (Array.isArray(variants) && variants.length > 0) {
      const existingVars = db
        .prepare('SELECT id, size, color FROM product_variants WHERE product_id = ?')
        .all(id) as any[];
      const existingKeyToId = new Map(existingVars.map((ev) => [`${ev.size}::${ev.color}`, ev.id]));
      const keptIds = new Set<number>();

      const updateVar = db.prepare(
        'UPDATE product_variants SET color_hex = ?, stock_quantity = ? WHERE id = ?'
      );
      const insertVar = db.prepare(
        'INSERT INTO product_variants (product_id, size, color, color_hex, stock_quantity) VALUES (?, ?, ?, ?, ?)'
      );

      for (const v of variants) {
        const size = String(v.size).trim();
        const color = String(v.color).trim();
        const hex = v.color_hex || '#18181B';
        const stock = Math.max(0, Math.floor(Number(v.stock_quantity ?? 0)));
        const key = `${size}::${color}`;
        if (existingKeyToId.has(key)) {
          const varId = existingKeyToId.get(key)!;
          updateVar.run(hex, stock, varId);
          keptIds.add(varId);
        } else {
          const info = insertVar.run(id, size, color, hex, stock);
          keptIds.add(Number(info.lastInsertRowid));
        }
      }

      for (const ev of existingVars) {
        if (!keptIds.has(ev.id)) {
          db.prepare('DELETE FROM product_variants WHERE id = ?').run(ev.id);
        }
      }
    }
  });

  updateTx();
  const row = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id);
  res.json({ product: hydrateProducts([row])[0] });
});

apiRouter.delete('/products/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ message: 'Product deleted.' });
});

// ==========================================
// CART ENDPOINTS
// ==========================================

function getUserCart(userId: number) {
  return db
    .prepare(
      `SELECT
        ci.id, ci.product_id, ci.variant_id, ci.quantity,
        p.name as product_name, p.slug as product_slug, p.price, p.original_price,
        pv.size, pv.color, pv.color_hex, pv.stock_quantity,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC, ci.id DESC`
    )
    .all(userId);
}

apiRouter.get('/cart', requireAuth, (req: AuthenticatedRequest, res) => {
  const items = getUserCart(req.user!.id);
  res.json({ items });
});

apiRouter.post('/cart', requireAuth, (req: AuthenticatedRequest, res) => {
  const { product_id, variant_id, quantity = 1 } = req.body || {};
  const qty = Math.floor(Number(quantity));
  if (!variant_id || qty <= 0) {
    res.status(400).json({ error: 'Valid variant and positive quantity are required.' });
    return;
  }

  const variant = db
    .prepare('SELECT id, product_id, stock_quantity FROM product_variants WHERE id = ?')
    .get(Number(variant_id)) as any;
  if (!variant || (product_id && variant.product_id !== Number(product_id))) {
    res.status(404).json({ error: 'Product variant not found.' });
    return;
  }

  const existing = db
    .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ?')
    .get(req.user!.id, variant.id) as any;

  const check = canAddToCart(variant.stock_quantity, existing?.quantity || 0, qty);
  if (!check.allowed) {
    res.status(400).json({ error: check.reason });
    return;
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(existing.quantity + qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)').run(
      req.user!.id,
      variant.product_id,
      variant.id,
      qty
    );
  }

  res.status(201).json({ items: getUserCart(req.user!.id) });
});

apiRouter.post('/cart/sync', requireAuth, (req: AuthenticatedRequest, res) => {
  const { items } = req.body || {};
  if (Array.isArray(items)) {
    const syncTx = db.transaction(() => {
      for (const item of items) {
        const variantId = Number(item.variant_id);
        const qty = Math.floor(Number(item.quantity || 1));
        if (!variantId || qty <= 0) continue;

        const variant = db
          .prepare('SELECT id, product_id, stock_quantity FROM product_variants WHERE id = ?')
          .get(variantId) as any;
        if (!variant || variant.stock_quantity <= 0) continue;

        const existing = db
          .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ?')
          .get(req.user!.id, variantId) as any;

        const nextQty = Math.min(variant.stock_quantity, (existing?.quantity || 0) + qty);
        if (nextQty <= 0) continue;

        if (existing) {
          db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(nextQty, existing.id);
        } else {
          db.prepare('INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)').run(
            req.user!.id,
            variant.product_id,
            variant.id,
            nextQty
          );
        }
      }
    });
    syncTx();
  }
  res.json({ items: getUserCart(req.user!.id) });
});

apiRouter.put('/cart/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const qty = Math.floor(Number(req.body?.quantity));

  const item = db
    .prepare(
      `SELECT ci.id, pv.stock_quantity
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.id = ? AND ci.user_id = ?`
    )
    .get(id, req.user!.id) as any;

  if (!item) {
    res.status(404).json({ error: 'Cart item not found.' });
    return;
  }

  if (qty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(id);
    res.json({ items: getUserCart(req.user!.id) });
    return;
  }

  if (qty > item.stock_quantity) {
    res.status(400).json({ error: `Only ${item.stock_quantity} available in stock.` });
    return;
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, id);
  res.json({ items: getUserCart(req.user!.id) });
});

apiRouter.delete('/cart/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, req.user!.id);
  res.json({ items: getUserCart(req.user!.id) });
});

// ==========================================
// WISHLIST ENDPOINTS
// ==========================================

function getUserWishlist(userId: number) {
  const rows = db
    .prepare(
      `SELECT wi.id as wishlist_id, wi.created_at as wish_created_at, p.*, c.name as category_name, c.slug as category_slug
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE wi.user_id = ?
       ORDER BY wi.created_at DESC`
    )
    .all(userId) as any[];

  const hydrated = hydrateProducts(rows);
  return rows.map((r, idx) => ({
    id: r.wishlist_id,
    product_id: r.id,
    created_at: r.wish_created_at,
    product: hydrated[idx],
  }));
}

apiRouter.get('/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ items: getUserWishlist(req.user!.id) });
});

apiRouter.post('/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
  const productId = Number(req.body?.product_id);
  if (!productId || !db.prepare('SELECT id FROM products WHERE id = ?').get(productId)) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(
    req.user!.id,
    productId
  );
  res.status(201).json({ items: getUserWishlist(req.user!.id) });
});

apiRouter.delete('/wishlist/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND (id = ? OR product_id = ?)').run(
    req.user!.id,
    id,
    id
  );
  res.json({ items: getUserWishlist(req.user!.id) });
});

// ==========================================
// ORDERS & CHECKOUT ENDPOINTS
// ==========================================

apiRouter.post('/orders', attachOptionalUser, (req: AuthenticatedRequest, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    country,
    city,
    delivery_address,
    delivery_instructions,
    payment_method = 'COD',
    items: bodyItems,
  } = req.body || {};

  const validation = validateCheckoutForm({
    first_name: String(first_name || ''),
    last_name: String(last_name || ''),
    email: String(email || ''),
    phone: String(phone || ''),
    country: String(country || ''),
    city: String(city || ''),
    delivery_address: String(delivery_address || ''),
    delivery_instructions: delivery_instructions ? String(delivery_instructions) : '',
  });

  if (!validation.valid) {
    res.status(400).json({ error: 'Please correct the highlighted delivery details.', errors: validation.errors });
    return;
  }

  try {
    const createdOrderId = db.transaction(() => {
      let checkoutLines: Array<{ variant_id: number; quantity: number }> = [];

      if (req.user) {
        const dbCart = db
          .prepare('SELECT variant_id, quantity FROM cart_items WHERE user_id = ?')
          .all(req.user.id) as any[];
        if (dbCart.length > 0) {
          checkoutLines = dbCart;
        }
      }

      if (checkoutLines.length === 0 && Array.isArray(bodyItems) && bodyItems.length > 0) {
        checkoutLines = bodyItems.map((i: any) => ({
          variant_id: Number(i.variant_id),
          quantity: Math.floor(Number(i.quantity)),
        }));
      }

      if (checkoutLines.length === 0) {
        throw Object.assign(new Error('Your shopping bag is empty.'), { statusCode: 400 });
      }

      const resolvedItems: Array<{
        product_id: number;
        variant_id: number;
        product_name: string;
        size: string;
        color: string;
        unit_price: number;
        quantity: number;
        line_total: number;
      }> = [];

      for (const line of checkoutLines) {
        if (!line.variant_id || line.quantity <= 0) {
          throw Object.assign(new Error('Invalid cart item quantity.'), { statusCode: 400 });
        }
        const row = db
          .prepare(
            `SELECT pv.id as variant_id, pv.product_id, pv.size, pv.color, pv.stock_quantity,
                    p.name as product_name, p.price
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.id = ?`
          )
          .get(line.variant_id) as any;

        if (!row) {
          throw Object.assign(new Error('One of the selected items is no longer available.'), { statusCode: 404 });
        }

        if (row.stock_quantity < line.quantity) {
          throw Object.assign(
            new Error(
              `Insufficient stock for ${row.product_name} (${row.size}, ${row.color}). Only ${row.stock_quantity} remaining.`
            ),
            { statusCode: 400 }
          );
        }

        const lineTotal = roundCurrency(row.price * line.quantity);
        resolvedItems.push({
          product_id: row.product_id,
          variant_id: row.variant_id,
          product_name: row.product_name,
          size: row.size,
          color: row.color,
          unit_price: row.price,
          quantity: line.quantity,
          line_total: lineTotal,
        });
      }

      const totals = calculateCartTotals(
        resolvedItems.map((ri) => ({ price: ri.unit_price, quantity: ri.quantity }))
      );

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `LUMI-${datePart}-${randPart}`;

      const orderInfo = db
        .prepare(
          `INSERT INTO orders (
            order_number, user_id, first_name, last_name, email, phone, country, city,
            delivery_address, delivery_instructions, payment_method, payment_status, status,
            subtotal, delivery_cost, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', ?, ?, ?)`
        )
        .run(
          orderNumber,
          req.user?.id || null,
          String(first_name).trim(),
          String(last_name).trim(),
          String(email).trim(),
          String(phone).trim(),
          String(country).trim(),
          String(city).trim(),
          String(delivery_address).trim(),
          delivery_instructions ? String(delivery_instructions).trim() : null,
          payment_method === 'STRIPE' ? 'STRIPE' : 'COD',
          totals.subtotal,
          totals.deliveryCost,
          totals.total
        );

      const orderId = Number(orderInfo.lastInsertRowid);
      const insertOrderItem = db.prepare(
        `INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, size, color, unit_price, quantity, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const decrementStock = db.prepare(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?'
      );

      for (const item of resolvedItems) {
        insertOrderItem.run(
          orderId,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.size,
          item.color,
          item.unit_price,
          item.quantity,
          item.line_total
        );
        const dec = decrementStock.run(item.quantity, item.variant_id, item.quantity);
        if (dec.changes === 0) {
          throw Object.assign(new Error(`Concurrent stock conflict on ${item.product_name}.`), { statusCode: 409 });
        }
      }

      if (req.user) {
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      }

      return orderId;
    })();

    const order = hydrateOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(createdOrderId));
    res.status(201).json({ order });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to place order.' });
  }
});

apiRouter.get('/orders/my', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user!.id);
  res.json({ orders: rows.map(hydrateOrder) });
});

apiRouter.get('/orders/:id', attachOptionalUser, (req: AuthenticatedRequest, res) => {
  const param = req.params.id;
  const orderRow = db
    .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?')
    .get(Number(param) || -1, param) as any;

  if (!orderRow) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  // Enforce access control when order belongs to a registered account
  if (orderRow.user_id) {
    if (!req.user || (req.user.id !== orderRow.user_id && req.user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'You do not have permission to view this order.' });
      return;
    }
  }

  res.json({ order: hydrateOrder(orderRow) });
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

apiRouter.get('/admin/dashboard', requireAuth, requireAdmin, (_req, res) => {
  const revRow = db
    .prepare("SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as order_count FROM orders WHERE status != 'Cancelled'")
    .get() as any;
  const allOrdersCount = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;
  const customerCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'USER'").get() as any).c;
  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c;

  const recentOrders = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 8')
    .all()
    .map(hydrateOrder);

  const bestSelling = db
    .prepare(
      `SELECT
        oi.product_id,
        oi.product_name,
        COALESCE(p.sku, 'ARCHIVE') as sku,
        COALESCE((SELECT pi.image_url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1), '') as image_url,
        SUM(oi.quantity) as units_sold,
        SUM(oi.line_total) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.status != 'Cancelled'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY units_sold DESC, revenue DESC
       LIMIT 5`
    )
    .all();

  const statusRows = db
    .prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status')
    .all() as any[];
  const ordersByStatus: Record<string, number> = {
    Pending: 0,
    Confirmed: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  for (const r of statusRows) {
    ordersByStatus[r.status] = r.count;
  }

  res.json({
    stats: {
      total_revenue: roundCurrency(revRow.revenue || 0),
      total_orders: allOrdersCount,
      total_customers: customerCount,
      total_products: productCount,
      recent_orders: recentOrders,
      best_selling_products: bestSelling,
      orders_by_status: ordersByStatus,
    },
  });
});

apiRouter.get('/admin/orders', requireAuth, requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all();
  res.json({ orders: rows.map(hydrateOrder) });
});

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

apiRouter.put('/admin/orders/:id/status', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!VALID_ORDER_STATUSES.includes(status)) {
    res.status(400).json({ error: 'Invalid order status.' });
    return;
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const updateTx = db.transaction(() => {
    // Restore inventory if moving from active to Cancelled
    if (order.status !== 'Cancelled' && status === 'Cancelled') {
      const items = db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').all(id) as any[];
      const restore = db.prepare('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?');
      for (const item of items) {
        if (item.variant_id) restore.run(item.quantity, item.variant_id);
      }
    }

    const paymentStatus = status === 'Delivered' ? 'Paid' : order.payment_status;
    db.prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?`).run(
      status,
      paymentStatus,
      id
    );
  });

  updateTx();
  res.json({ order: hydrateOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)) });
});

apiRouter.get('/admin/users', requireAuth, requireAdmin, (_req, res) => {
  const users = db
    .prepare(
      `SELECT
        u.id, u.first_name, u.last_name, u.email, u.role, u.phone, u.country, u.city, u.address, u.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    .all();
  res.json({ users });
});

apiRouter.get('/admin/users/:id/orders', requireAuth, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(userId);
  res.json({ orders: rows.map(hydrateOrder) });
});

apiRouter.get('/admin/products', requireAuth, requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC, p.id DESC`
    )
    .all();
  res.json({ products: hydrateProducts(rows) });
});

apiRouter.post('/uploads', requireAuth, requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Image upload failed.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Please select an image file.' });
      return;
    }
    res.status(201).json({ image_url: `/uploads/${req.file.filename}` });
  });
});
