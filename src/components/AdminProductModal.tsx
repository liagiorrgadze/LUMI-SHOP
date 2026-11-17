import React, { useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { adminApi, getApiErrorMessage, productsApi } from '../services/api';
import type { Category, Product } from '../types/index';

interface AdminProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  onToast: (text: string, type?: 'success' | 'error') => void;
}

interface VariantDraft {
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: number;
}

export function AdminProductModal({
  product,
  categories,
  onClose,
  onSaved,
  onToast,
}: AdminProductModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [categoryId, setCategoryId] = useState<number>(
    product?.category_id || categories[0]?.id || 1
  );
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(
    product?.original_price ? String(product.original_price) : ''
  );
  const [description, setDescription] = useState(product?.description || '');
  const [isNewArrival, setIsNewArrival] = useState(product?.is_new_arrival ?? true);
  const [isBestSeller, setIsBestSeller] = useState(product?.is_best_seller ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);

  const [images, setImages] = useState<string[]>(
    product?.images.length
      ? product.images.map((i) => i.image_url)
      : ['/src/assets/images/women_trench_coat_1794831905945.jpg']
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.length
      ? product.variants.map((v) => ({
          size: v.size,
          color: v.color,
          color_hex: v.color_hex,
          stock_quantity: v.stock_quantity,
        }))
      : [
          { size: 'S', color: 'Obsidian', color_hex: '#18181B', stock_quantity: 10 },
          { size: 'M', color: 'Obsidian', color_hex: '#18181B', stock_quantity: 12 },
        ]
  );

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await adminApi.uploadImage(file);
      setImages((prev) => [...prev, url]);
      onToast('Image uploaded successfully.');
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Image upload failed.'), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { size: 'L', color: 'Sand', color_hex: '#D6C7B2', stock_quantity: 8 },
    ]);
  };

  const handleUpdateVariant = (idx: number, field: keyof VariantDraft, value: string | number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (variants.length === 0) {
      setError('At least one size/color variant is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category_id: Number(categoryId),
        price: Number(price),
        original_price: originalPrice.trim() ? Number(originalPrice) : null,
        description: description.trim(),
        is_new_arrival: isNewArrival,
        is_best_seller: isBestSeller,
        is_featured: isFeatured,
        images,
        variants,
      };

      if (isEditing && product) {
        await productsApi.update(product.id, payload);
        onToast('Product updated.');
      } else {
        await productsApi.create(payload);
        onToast('Product created.');
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save product.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? `Edit ${product?.name}` : 'Add New Product'}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#E6E2DC] bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-4">
          <h2 className="font-editorial text-2xl text-[#111111]">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product modal"
            className="p-1.5 text-[#52525B] hover:text-[#111111]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 border border-[#991B1B] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-name" className="block text-xs font-medium text-[#3F3F46]">
                Product Name *
              </label>
              <input
                id="prod-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prod-sku" className="block text-xs font-medium text-[#3F3F46]">
                SKU *
              </label>
              <input
                id="prod-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="LUMI-WC-010"
                className="mt-1 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 font-mono text-sm uppercase"
              />
            </div>

            <div>
              <label htmlFor="prod-cat" className="block text-xs font-medium text-[#3F3F46]">
                Category *
              </label>
              <select
                id="prod-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="mt-1 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prod-price" className="block text-xs font-medium text-[#3F3F46]">
                  Price ($) *
                </label>
                <input
                  id="prod-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="prod-orig-price" className="block text-xs font-medium text-[#3F3F46]">
                  Original Price ($)
                </label>
                <input
                  id="prod-orig-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm tabular-nums"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-xs font-medium text-[#3F3F46]">
              Description *
            </label>
            <textarea
              id="prod-desc"
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full border border-[#D4D0C8] bg-[#FAFAF8] p-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-medium text-[#111111]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="h-4 w-4 accent-[#111111]"
              />
              <span>New Arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="h-4 w-4 accent-[#111111]"
              />
              <span>Best Seller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-[#111111]"
              />
              <span>Featured</span>
            </label>
          </div>

          {/* Product Images */}
          <div className="border-t border-[#E6E2DC] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                Product Images
              </h3>
              <label className="inline-flex cursor-pointer items-center gap-1.5 border border-[#D4D0C8] bg-[#FAFAF8] px-3 py-1.5 text-xs font-medium text-[#111111] hover:border-[#111111]">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste image path (/src/assets/images/... or /uploads/...)"
                className="h-9 flex-1 border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (newImageUrl.trim()) {
                    setImages((prev) => [...prev, newImageUrl.trim()]);
                    setNewImageUrl('');
                  }
                }}
                className="h-9 border border-[#111111] px-3 text-xs font-medium text-[#111111]"
              >
                Add URL
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative h-20 w-16 border border-[#E6E2DC] bg-[#F4F2EE]">
                  <img src={url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={`Remove image ${idx + 1}`}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-[#111111] text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="border-t border-[#E6E2DC] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                Sizes, Colors &amp; Inventory
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1 border border-[#D4D0C8] bg-[#FAFAF8] px-3 py-1.5 text-xs font-medium text-[#111111] hover:border-[#111111]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={v.size}
                    onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                    placeholder="Size (S, M, 41)"
                    aria-label={`Variant ${idx + 1} size`}
                    className="col-span-3 h-9 border border-[#D4D0C8] bg-[#FAFAF8] px-2.5 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={v.color}
                    onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                    placeholder="Color"
                    aria-label={`Variant ${idx + 1} color`}
                    className="col-span-4 h-9 border border-[#D4D0C8] bg-[#FAFAF8] px-2.5 text-xs"
                  />
                  <input
                    type="color"
                    value={v.color_hex}
                    onChange={(e) => handleUpdateVariant(idx, 'color_hex', e.target.value)}
                    aria-label={`Variant ${idx + 1} color swatch`}
                    className="col-span-1 h-9 w-full cursor-pointer border border-[#D4D0C8] bg-white p-0.5"
                  />
                  <input
                    type="number"
                    min="0"
                    required
                    value={v.stock_quantity}
                    onChange={(e) =>
                      handleUpdateVariant(idx, 'stock_quantity', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="Stock"
                    aria-label={`Variant ${idx + 1} stock quantity`}
                    className="col-span-3 h-9 border border-[#D4D0C8] bg-[#FAFAF8] px-2.5 text-xs tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={`Remove variant ${idx + 1}`}
                    className="col-span-1 flex h-9 items-center justify-center text-[#71717A] hover:text-[#991B1B]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E6E2DC] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 border border-[#D4D0C8] bg-white px-5 text-xs font-medium text-[#111111]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 bg-[#111111] px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#27272A] disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
