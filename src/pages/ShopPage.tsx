import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { categoriesApi, productsApi } from '../services/api';
import type { Category, Product } from '../types/index';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const sortOrder = searchParams.get('sort') || 'curated';
  const selectedSize = searchParams.get('size') || 'all';
  const selectedColor = searchParams.get('color') || 'all';
  const maxPrice = searchParams.get('maxPrice') || '';
  const onlyOnSale = searchParams.get('onSale') === 'true';

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    productsApi
      .list({
        search: searchQuery || undefined,
        category: activeCategory !== 'all' ? activeCategory : undefined,
        size: selectedSize !== 'all' ? selectedSize : undefined,
        color: selectedColor !== 'all' ? selectedColor : undefined,
        maxPrice: maxPrice || undefined,
        sort: sortOrder,
        onSale: onlyOnSale || undefined,
      })
      .then((data) => {
        if (active) setAllProducts(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [searchQuery, activeCategory, selectedSize, selectedColor, maxPrice, sortOrder, onlyOnSale]);

  // Derive available size and color options dynamically
  const availableSizes = useMemo(() => ['XS', 'S', 'M', 'L', 'XL', '38', '39', '40', '41', '42', '43', 'One Size'], []);
  const availableColors = useMemo(
    () => ['Obsidian', 'Sand', 'Ivory', 'Oatmeal', 'Charcoal', 'Espresso', 'Ecru', 'Cognac', 'Camel'],
    []
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'false') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setSearchParams({});
  };

  const hasActiveFilters =
    activeCategory !== 'all' ||
    Boolean(searchQuery) ||
    selectedSize !== 'all' ||
    selectedColor !== 'all' ||
    Boolean(maxPrice) ||
    onlyOnSale;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Title & Search */}
      <div className="flex flex-col gap-6 border-b border-[#E6E2DC] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
            LUMI Catalog
          </p>
          <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111] sm:text-5xl">
            {activeCategory === 'all'
              ? onlyOnSale
                ? 'Seasonal Offers'
                : 'All Collections'
              : categories.find((c) => c.slug === activeCategory)?.name || 'Collection'}
          </h1>
          <p className="mt-2 text-sm text-[#52525B] tabular-nums">
            {loading ? 'Loading pieces...' : `${allProducts.length} ${allProducts.length === 1 ? 'piece' : 'pieces'} available`}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam('search', localSearch.trim());
          }}
          className="flex w-full max-w-md items-center gap-2"
        >
          <label htmlFor="catalog-search" className="sr-only">
            Search catalog by name
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
            <input
              id="catalog-search"
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by garment, fabric, or SKU..."
              className="h-10 w-full border border-[#D4D0C8] bg-white pr-3 pl-10 text-sm text-[#111111] placeholder:text-[#71717A] focus:border-[#111111] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-10 bg-[#111111] px-5 text-xs font-medium tracking-wide text-white hover:bg-[#27272A] whitespace-nowrap shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Tabs & Sort Toolbar */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => updateParam('category', 'all')}
            className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#111111] text-white'
                : 'bg-[#F4F2EE] text-[#3F3F46] hover:bg-[#E6E2DC]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat.slug
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#F4F2EE] text-[#3F3F46] hover:bg-[#E6E2DC]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="inline-flex h-10 items-center gap-2 border border-[#D4D0C8] bg-white px-4 text-xs font-medium text-[#111111] hover:border-[#111111] whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>

          <label htmlFor="catalog-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalog-sort"
            value={sortOrder}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="h-10 border border-[#D4D0C8] bg-white px-3 text-xs font-medium text-[#111111] focus:border-[#111111] focus:outline-none"
          >
            <option value="curated">Sort: Featured</option>
            <option value="newest">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="bestseller">Sort: Best Sellers</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex h-10 items-center gap-1.5 px-3 text-xs font-medium text-[#52525B] hover:text-[#111111] whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {filtersOpen && (
        <div className="mt-4 grid grid-cols-1 gap-6 border border-[#E6E2DC] bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-size" className="block text-xs font-semibold uppercase tracking-wider text-[#52525B]">
              Size
            </label>
            <select
              id="filter-size"
              value={selectedSize}
              onChange={(e) => updateParam('size', e.target.value)}
              className="mt-2 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm text-[#111111]"
            >
              <option value="all">All Sizes</option>
              {availableSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-color" className="block text-xs font-semibold uppercase tracking-wider text-[#52525B]">
              Color
            </label>
            <select
              id="filter-color"
              value={selectedColor}
              onChange={(e) => updateParam('color', e.target.value)}
              className="mt-2 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm text-[#111111]"
            >
              <option value="all">All Colors</option>
              {availableColors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-price" className="block text-xs font-semibold uppercase tracking-wider text-[#52525B]">
              Maximum Price
            </label>
            <select
              id="filter-price"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value)}
              className="mt-2 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm text-[#111111]"
            >
              <option value="">Any Price</option>
              <option value="250">Under $250</option>
              <option value="400">Under $400</option>
              <option value="600">Under $600</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex h-10 cursor-pointer items-center gap-2.5 text-sm text-[#111111]">
              <input
                type="checkbox"
                checked={onlyOnSale}
                onChange={(e) => updateParam('onSale', e.target.checked ? 'true' : 'false')}
                className="h-4 w-4 accent-[#111111]"
              />
              <span>Special Offers Only</span>
            </label>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] w-full bg-[#EFECE4]" />
              <div className="mt-3 h-3 w-24 bg-[#EFECE4]" />
              <div className="mt-2 h-4 w-48 bg-[#EFECE4]" />
              <div className="mt-2 h-4 w-16 bg-[#EFECE4]" />
            </div>
          ))}
        </div>
      ) : allProducts.length === 0 ? (
        <div className="mt-16 border border-[#E6E2DC] bg-white px-6 py-16 text-center">
          <h2 className="font-editorial text-3xl text-[#111111]">No matching pieces found</h2>
          <p className="mt-2 text-sm text-[#52525B]">
            Try adjusting your search terms, size selection, or price filter.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-6 bg-[#111111] px-6 py-3 text-xs font-medium tracking-wider uppercase text-white hover:bg-[#27272A]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
