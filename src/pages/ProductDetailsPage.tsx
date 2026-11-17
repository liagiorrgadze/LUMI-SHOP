import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Minus, Plus, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getApiErrorMessage, productsApi } from '../services/api';
import type { Product } from '../types/index';
import { calculateDiscountPercent, formatPrice } from '../utils/commerce';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { addToCart, toggleWishlist, wishlistProductIds, showToast } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProduct = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await productsApi.getById(id);
      setProduct(data);
      setActiveImageIdx(0);
      setQuantity(1);
      if (data.variants.length > 0) {
        const inStockVariant = data.variants.find((v) => v.stock_quantity > 0) || data.variants[0];
        setSelectedColor(inStockVariant.color);
        setSelectedSize(inStockVariant.size);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Product could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const uniqueColors = useMemo(() => {
    if (!product) return [];
    const seen = new Map<string, string>();
    for (const v of product.variants) {
      if (!seen.has(v.color)) seen.set(v.color, v.color_hex);
    }
    return Array.from(seen.entries()).map(([color, hex]) => ({ color, hex }));
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product) return [];
    const list = product.variants.filter((v) => v.color === selectedColor);
    if (list.length > 0) return list;
    return product.variants;
  }, [product, selectedColor]);

  const activeVariant = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) => v.color === selectedColor && v.size === selectedSize) ||
      sizesForColor[0]
    );
  }, [product, selectedColor, selectedSize, sizesForColor]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const matching = product?.variants.filter((v) => v.color === color) || [];
    const sameSize = matching.find((v) => v.size === selectedSize && v.stock_quantity > 0);
    if (!sameSize && matching.length > 0) {
      const available = matching.find((v) => v.stock_quantity > 0) || matching[0];
      setSelectedSize(available.size);
    }
    setQuantity(1);
  };

  const handleAddToBag = async () => {
    if (!product || !activeVariant) return;
    await addToCart(product, activeVariant, quantity);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    try {
      await productsApi.addReview(product.id, {
        rating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviewTitle('');
      setReviewComment('');
      setRating(5);
      showToast('Thank you. Your review has been published.');
      await fetchProduct();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not submit review.'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="aspect-[3/4] bg-[#EFECE4] animate-pulse lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <div className="h-4 w-32 bg-[#EFECE4] animate-pulse" />
            <div className="h-10 w-3/4 bg-[#EFECE4] animate-pulse" />
            <div className="h-6 w-24 bg-[#EFECE4] animate-pulse" />
            <div className="h-28 w-full bg-[#EFECE4] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl text-[#111111]">Piece Not Found</h1>
        <p className="mt-3 text-sm text-[#52525B]">{error || 'This item is no longer available.'}</p>
        <Link
          to="/shop"
          className="mt-6 inline-block bg-[#111111] px-7 py-3 text-xs font-medium tracking-wider uppercase text-white"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const discount = calculateDiscountPercent(product.price, product.original_price);
  const isWishlisted = wishlistProductIds.has(product.id);
  const stockQty = activeVariant?.stock_quantity ?? 0;
  const isOutOfStock = stockQty <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-[#71717A]">
        <Link to="/" className="hover:text-[#111111]">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/shop?category=${product.category_slug}`} className="hover:text-[#111111]">
          {product.category_name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#111111] truncate">{product.name}</span>
      </nav>

      {/* Main Split: Sticky Gallery + Purchase Module */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-7">
          <div className="aspect-[3/4] w-full overflow-hidden bg-[#F4F2EE]">
            <ProductImage
              src={product.images[activeImageIdx]?.image_url || product.images[0]?.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View image ${idx + 1} of ${product.name}`}
                  className={`aspect-[3/4] overflow-hidden border bg-[#F4F2EE] transition-colors ${
                    activeImageIdx === idx ? 'border-[#111111]' : 'border-transparent hover:border-[#D4D0C8]'
                  }`}
                >
                  <ProductImage
                    src={img.image_url}
                    alt={`${product.name} view ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:sticky lg:top-24 lg:col-span-5">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>{product.category_name}</span>
            <span className="font-mono tabular-nums">SKU {product.sku}</span>
          </div>

          <h1 className="mt-2 font-editorial text-3xl font-normal text-[#111111] sm:text-4xl">
            {product.name}
          </h1>

          {/* Rating Summary */}
          {product.review_count !== undefined && product.review_count > 0 && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-[#52525B]">
              <div className="flex items-center gap-0.5 text-[#111111]" aria-label={`Rated ${product.average_rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= Math.round(product.average_rating || 0)
                        ? 'fill-[#111111] text-[#111111]'
                        : 'text-[#D4D0C8]'
                    }`}
                  />
                ))}
              </div>
              <span className="tabular-nums">
                {product.average_rating} ({product.review_count}{' '}
                {product.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-3 tabular-nums">
            <span className="text-2xl font-medium text-[#111111]">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-base text-[#71717A] line-through">
                  {formatPrice(product.original_price)}
                </span>
                <span className="text-xs font-medium text-[#8C7355]">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[#3F3F46]">{product.description}</p>

          <div className="my-7 border-t border-[#E6E2DC]" />

          {/* Color Selector */}
          {uniqueColors.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-[#52525B]">Color</span>
                <span className="font-medium text-[#111111]">{selectedColor}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {uniqueColors.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => handleColorSelect(c.color)}
                    aria-label={`Select color ${c.color}`}
                    aria-pressed={selectedColor === c.color}
                    className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${
                      selectedColor === c.color
                        ? 'border-[#111111] bg-white font-medium text-[#111111]'
                        : 'border-[#E6E2DC] bg-[#FAFAF8] text-[#52525B] hover:border-[#111111]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 border border-black/15"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    <span>{c.color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-[#52525B]">Size</span>
              <span
                className={`tabular-nums font-medium ${
                  isOutOfStock
                    ? 'text-[#991B1B]'
                    : stockQty <= 5
                    ? 'text-[#B45309]'
                    : 'text-[#166534]'
                }`}
              >
                {isOutOfStock
                  ? 'Out of Stock'
                  : stockQty <= 5
                  ? `Low Stock · ${stockQty} left`
                  : `In Stock · ${stockQty} available`}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {sizesForColor.map((variant) => {
                const unavailable = variant.stock_quantity <= 0;
                const active = selectedSize === variant.size;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => {
                      setSelectedSize(variant.size);
                      setQuantity(1);
                    }}
                    aria-pressed={active}
                    className={`h-11 border text-xs font-medium transition-colors ${
                      unavailable
                        ? 'cursor-not-allowed border-[#E6E2DC] bg-[#F4F2EE] text-[#A1A1AA] line-through'
                        : active
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-[#D4D0C8] bg-white text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 items-center border border-[#D4D0C8] bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock || quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-full w-11 items-center justify-center text-[#111111] hover:bg-[#F4F2EE] disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium tabular-nums" data-testid="pdp-qty">
                {isOutOfStock ? 0 : quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stockQty, q + 1))}
                disabled={isOutOfStock || quantity >= stockQty}
                aria-label="Increase quantity"
                className="flex h-full w-11 items-center justify-center text-[#111111] hover:bg-[#F4F2EE] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToBag}
              disabled={isOutOfStock}
              className="h-12 flex-1 bg-[#111111] px-6 text-xs font-semibold tracking-wider uppercase text-white transition-colors hover:bg-[#27272A] disabled:cursor-not-allowed disabled:bg-[#A1A1AA]"
            >
              {isOutOfStock ? 'Unavailable' : 'Add to Bag'}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D4D0C8] bg-white text-[#111111] transition-colors hover:border-[#111111]"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-[#111111]' : ''}`} />
            </button>
          </div>

          <div className="mt-6 space-y-2 border-t border-[#E6E2DC] pt-5 text-xs text-[#52525B]">
            <p>Complimentary express shipping on orders above $250.</p>
            <p>Cash on Delivery available at checkout · 30-day complimentary atelier returns.</p>
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <section className="mt-20 border-t border-[#E6E2DC] pt-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-editorial text-3xl text-[#111111]">Client Reviews</h2>
            <p className="mt-2 text-sm text-[#52525B]">
              Verified impressions from LUMI STORE clients.
            </p>

            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4 border border-[#E6E2DC] bg-white p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  Write a Review
                </h3>
                <div>
                  <label htmlFor="review-rating" className="block text-xs text-[#52525B]">
                    Rating
                  </label>
                  <select
                    id="review-rating"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="mt-1.5 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm"
                  >
                    <option value={5}>5 — Exceptional</option>
                    <option value={4}>4 — Very Good</option>
                    <option value={3}>3 — Satisfactory</option>
                    <option value={2}>2 — Fair</option>
                    <option value={1}>1 — Poor</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="review-title" className="block text-xs text-[#52525B]">
                    Headline (optional)
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Impeccable drape and weight"
                    className="mt-1.5 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="review-comment" className="block text-xs text-[#52525B]">
                    Your Review
                  </label>
                  <textarea
                    id="review-comment"
                    required
                    minLength={5}
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts on fit, fabric, and tailoring..."
                    className="mt-1.5 w-full border border-[#D4D0C8] bg-[#FAFAF8] p-3 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="h-10 bg-[#111111] px-6 text-xs font-medium tracking-wider uppercase text-white hover:bg-[#27272A] disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mt-6 border border-[#E6E2DC] bg-white p-6">
                <p className="text-sm text-[#52525B]">
                  Sign in to share your fit notes and rating for this piece.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-block border border-[#111111] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white"
                >
                  Sign In to Review
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            {!product.reviews || product.reviews.length === 0 ? (
              <div className="border border-[#E6E2DC] bg-white p-8 text-sm text-[#52525B]">
                No reviews yet for this piece. Be the first to share your experience.
              </div>
            ) : (
              <ul className="space-y-4">
                {product.reviews.map((rev) => (
                  <li key={rev.id} className="border border-[#E6E2DC] bg-white p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1 text-[#111111]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= rev.rating ? 'fill-[#111111] text-[#111111]' : 'text-[#D4D0C8]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#71717A] tabular-nums">
                        {new Date(rev.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {rev.title && (
                      <h3 className="mt-3 text-sm font-semibold text-[#111111]">{rev.title}</h3>
                    )}
                    <p className="mt-1.5 text-sm leading-relaxed text-[#3F3F46]">{rev.comment}</p>
                    <p className="mt-3 text-xs font-medium text-[#71717A]">— {rev.user_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {product.related_products && product.related_products.length > 0 && (
        <section className="mt-20 border-t border-[#E6E2DC] pt-14">
          <h2 className="font-editorial text-3xl text-[#111111]">Complementary Pieces</h2>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {product.related_products.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
