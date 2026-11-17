import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/index';
import { calculateDiscountPercent, formatPrice } from '../utils/commerce';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { wishlistProductIds, toggleWishlist } = useStore();
  const isWishlisted = wishlistProductIds.has(product.id);
  const primaryImage = product.images[0]?.image_url;
  const secondaryImage = product.images[1]?.image_url;
  const discount = calculateDiscountPercent(product.price, product.original_price);

  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F2EE]">
        <Link
          to={`/product/${product.slug}`}
          className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            src={primaryImage}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
              secondaryImage ? 'group-hover:opacity-0 transition-opacity duration-300' : ''
            }`}
          />
          {secondaryImage && (
            <ProductImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
            />
          )}
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center bg-white/90 text-[#111111] backdrop-blur-xs transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#111111]"
        >
          <Heart
            className={`h-4 w-4 stroke-[1.5] ${
              isWishlisted ? 'fill-[#111111] text-[#111111]' : 'text-[#111111]'
            }`}
          />
        </button>

        {product.total_stock === 0 ? (
          <span className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#52525B]">
            Sold Out
          </span>
        ) : discount > 0 ? (
          <span className="absolute bottom-3 left-3 bg-[#111111] px-2.5 py-1 text-[11px] font-medium tracking-wide text-white tabular-nums">
            Save {discount}%
          </span>
        ) : product.is_new_arrival ? (
          <span className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#111111]">
            New Arrival
          </span>
        ) : null}
      </div>

      <div className="mt-3.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
          <span>{product.category_name}</span>
          {uniqueColors.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {uniqueColors.length} {uniqueColors.length === 1 ? 'shade' : 'shades'}
              </span>
            </>
          )}
        </div>

        <Link
          to={`/product/${product.slug}`}
          className="text-sm font-medium text-[#111111] hover:text-[#52525B] transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2 text-sm tabular-nums">
          <span className="font-medium text-[#111111]">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-[#71717A] line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
