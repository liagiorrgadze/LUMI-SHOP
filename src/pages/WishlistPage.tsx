import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/commerce';

export function WishlistPage() {
  const { wishlistItems, removeFromWishlist, addToCart } = useStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-[#E6E2DC] pb-6">
        <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
          Saved Pieces
        </p>
        <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111]">
          Wishlist <span className="text-xl font-sans text-[#71717A] tabular-nums">({wishlistItems.length})</span>
        </h1>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="mt-12 border border-[#E6E2DC] bg-white px-6 py-20 text-center">
          <Heart className="mx-auto h-10 w-10 stroke-[1.2] text-[#8C7355]" />
          <h2 className="mt-4 font-editorial text-3xl text-[#111111]">Your wishlist is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#52525B]">
            Save pieces you love to revisit sizing, tailoring notes, and availability anytime.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-block bg-[#111111] px-7 py-3.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#27272A]"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {wishlistItems.map(({ product }) => {
            const firstAvailableVariant = product.variants.find((v) => v.stock_quantity > 0);
            return (
              <div key={product.id} className="flex flex-col border border-[#E6E2DC] bg-white p-4">
                <Link
                  to={`/product/${product.slug}`}
                  className="aspect-[3/4] w-full overflow-hidden bg-[#F4F2EE]"
                >
                  <ProductImage
                    src={product.images[0]?.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </Link>

                <div className="mt-4 flex-1">
                  <p className="text-xs text-[#71717A]">{product.category_name}</p>
                  <Link
                    to={`/product/${product.slug}`}
                    className="mt-1 block text-sm font-medium text-[#111111] hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm font-medium text-[#111111] tabular-nums">
                    {formatPrice(product.price)}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!firstAvailableVariant}
                    onClick={() => {
                      if (firstAvailableVariant) {
                        addToCart(product, firstAvailableVariant, 1);
                      }
                    }}
                    className="h-10 flex-1 bg-[#111111] px-3 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#27272A] disabled:bg-[#A1A1AA]"
                  >
                    {firstAvailableVariant ? `Add (${firstAvailableVariant.size})` : 'Sold Out'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="flex h-10 w-10 items-center justify-center border border-[#D4D0C8] text-[#52525B] hover:border-[#111111] hover:text-[#111111]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
