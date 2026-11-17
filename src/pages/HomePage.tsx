import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import { productsApi } from '../services/api';
import type { Product } from '../types/index';

type ShowcaseTab = 'new' | 'bestsellers' | 'offers';

const HERO_IMAGE = '/src/assets/images/hero_lumi_fashion_1794831905230.jpg';
const WOMEN_EDITORIAL = '/src/assets/images/women_silk_slip_1794831907340.jpg';
const MEN_EDITORIAL = '/src/assets/images/men_linen_shirt_1794831908174.jpg';
const BAG_EDITORIAL = '/src/assets/images/bag_structured_tote_1794831908767.jpg';
const SHOES_EDITORIAL = '/src/assets/images/shoes_leather_loafers_1794831908189.jpg';

const TESTIMONIALS = [
  {
    quote:
      'The double-woven gabardine trench holds its structure effortlessly from morning meetings to evening flights. It feels tailored specifically to my shoulders.',
    author: 'Claire Laurent',
    location: 'New York · Verified Client',
  },
  {
    quote:
      'Every piece in the menswear line—from the Italian flannel blazer to the calfskin loafers—carries a quiet permanence you rarely find outside bespoke houses.',
    author: 'Julian Mercer',
    location: 'London · Verified Client',
  },
  {
    quote:
      'Fast dispatch, thoughtful packaging, and Cash on Delivery made ordering my first Palazzo tote seamless. The leather grain is extraordinary.',
    author: 'Sora Takahashi',
    location: 'Tokyo · Verified Client',
  },
];

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('new');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    let active = true;
    productsApi
      .list()
      .then((data) => {
        if (active) setProducts(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const showcaseProducts = useMemo(() => {
    if (activeTab === 'new') {
      return products.filter((p) => p.is_new_arrival).slice(0, 4);
    }
    if (activeTab === 'bestsellers') {
      return products.filter((p) => p.is_best_seller).slice(0, 4);
    }
    return products.filter((p) => p.original_price && p.original_price > p.price).slice(0, 4);
  }, [products, activeTab]);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <div>
      {/* 1. Editorial Campaign Hero */}
      <section className="relative h-[78vh] min-h-[520px] max-h-[820px] w-full overflow-hidden bg-[#18181B]">
        <ProductImage
          src={HERO_IMAGE}
          alt="LUMI STORE Autumn Winter Architectural Collection"
          className="h-full w-full object-cover object-[28%_center] sm:object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
          aria-hidden="true"
        />
        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
          <div className="max-w-xl text-white">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/85">
              Autumn / Winter Atelier
            </p>
            <h1 className="mt-3 font-editorial text-5xl font-normal leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl [text-wrap:balance]">
              Discover Your Style
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Architectural outerwear, pure mulberry silk, and Italian leather essentials crafted for enduring everyday refinement.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2.5 bg-white px-7 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#111111] transition-colors hover:bg-[#F4F2EE]"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shop?onSale=true"
                className="inline-flex items-center gap-2 border border-white/60 bg-black/20 px-6 py-3.5 text-xs font-semibold tracking-wider uppercase text-white backdrop-blur-xs transition-colors hover:bg-white/15"
              >
                <span>Seasonal Offers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Curated Collections Showcase (New Arrivals / Best Sellers / Special Offers) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-[#E6E2DC] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
              Curated Wardrobe
            </p>
            <h2 className="mt-1.5 font-editorial text-3xl font-normal text-[#111111] sm:text-4xl">
              Featured Edit
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Curated collections">
            {[
              { id: 'new' as const, label: 'New Arrivals' },
              { id: 'bestsellers' as const, label: 'Best Sellers' },
              { id: 'offers' as const, label: 'Special Offers' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F4F2EE] text-[#3F3F46] hover:bg-[#E6E2DC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] w-full bg-[#EFECE4]" />
                <div className="mt-3 h-3 w-24 bg-[#EFECE4]" />
                <div className="mt-2 h-4 w-48 bg-[#EFECE4]" />
                <div className="mt-2 h-4 w-16 bg-[#EFECE4]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {showcaseProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            to={
              activeTab === 'offers'
                ? '/shop?onSale=true'
                : activeTab === 'bestsellers'
                ? '/shop?sort=bestseller'
                : '/shop'
            }
            className="inline-flex items-center gap-2 border border-[#111111] px-8 py-3 text-xs font-medium tracking-wider uppercase text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
          >
            <span>View Full Collection</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 3. Women's & Men's Editorial Split + Leather Goods */}
      <section className="border-y border-[#E6E2DC] bg-[#F4F2EE]/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-stretch">
            {/* Women's Fashion */}
            <Link
              to="/shop?category=womens-clothing"
              className="group relative flex min-h-[480px] overflow-hidden bg-[#E6E2DC]"
            >
              <ProductImage
                src={WOMEN_EDITORIAL}
                alt="Women's Fashion Collection"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="relative mt-auto p-8 text-white">
                <p className="text-xs tracking-[0.16em] uppercase text-white/80">
                  Womenswear
                </p>
                <h3 className="mt-1.5 font-editorial text-3xl sm:text-4xl">
                  Women&apos;s Fashion
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/85">
                  Bias-cut mulberry silk dresses, Mongolian cashmere, and tailored gabardine coats.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase underline underline-offset-4">
                  Explore Women <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>

            {/* Men's Fashion */}
            <Link
              to="/shop?category=mens-clothing"
              className="group relative flex min-h-[480px] overflow-hidden bg-[#E6E2DC]"
            >
              <ProductImage
                src={MEN_EDITORIAL}
                alt="Men's Fashion Collection"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="relative mt-auto p-8 text-white">
                <p className="text-xs tracking-[0.16em] uppercase text-white/80">
                  Menswear
                </p>
                <h3 className="mt-1.5 font-editorial text-3xl sm:text-4xl">
                  Men&apos;s Fashion
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/85">
                  Half-canvas Milanese wool blazers, organic Belgian linen, and pleated trousers.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase underline underline-offset-4">
                  Explore Men <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </div>

          {/* Secondary Categories Strip: Footwear, Bags & Special Offers Banner */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Link
              to="/shop?category=shoes"
              className="group flex items-center gap-5 border border-[#E6E2DC] bg-white p-5 transition-colors hover:border-[#111111]"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#F4F2EE]">
                <ProductImage
                  src={SHOES_EDITORIAL}
                  alt="Artisanal Footwear"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-wider">Category</p>
                <h4 className="mt-0.5 font-editorial text-2xl text-[#111111]">Footwear</h4>
                <p className="mt-1 text-xs text-[#52525B]">Italian calfskin loafers &amp; suede boots</p>
              </div>
            </Link>

            <Link
              to="/shop?category=bags"
              className="group flex items-center gap-5 border border-[#E6E2DC] bg-white p-5 transition-colors hover:border-[#111111]"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#F4F2EE]">
                <ProductImage
                  src={BAG_EDITORIAL}
                  alt="Structured Leather Bags"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-wider">Category</p>
                <h4 className="mt-0.5 font-editorial text-2xl text-[#111111]">Leather Bags</h4>
                <p className="mt-1 text-xs text-[#52525B]">Structured totes &amp; saddle crossbodies</p>
              </div>
            </Link>

            <Link
              to="/shop?onSale=true"
              className="group flex flex-col justify-center border border-[#111111] bg-[#111111] p-6 text-white transition-colors hover:bg-[#1E1E22]"
            >
              <p className="text-xs tracking-[0.16em] uppercase text-[#D6C7B2]">
                Private Archive
              </p>
              <h4 className="mt-1 font-editorial text-2xl">Up to 20% Off Archive</h4>
              <p className="mt-1.5 text-xs text-[#A1A1AA]">
                Limited seasonal reductions on silk, outerwear, and accessories.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Client Testimonials & Newsletter */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
            Client Notes
          </p>
          <h2 className="mt-1.5 font-editorial text-3xl font-normal text-[#111111] sm:text-4xl">
            Worn Around the World
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.author}
              className="flex flex-col justify-between border border-[#E6E2DC] bg-white p-7"
            >
              <p className="text-sm leading-relaxed text-[#3F3F46]">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-[#F4F2EE] pt-4">
                <p className="text-sm font-medium text-[#111111]">{t.author}</p>
                <p className="text-xs text-[#71717A]">{t.location}</p>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 border border-[#E6E2DC] bg-[#F4F2EE] px-6 py-12 text-center sm:px-12">
          <h3 className="font-editorial text-3xl text-[#111111]">Join the LUMI Journal</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#52525B]">
            Receive early invitations to private archive releases, lookbooks, and seasonal atelier dispatches.
          </p>

          {newsletterSubscribed ? (
            <div className="mx-auto mt-6 inline-flex items-center gap-2 border border-[#111111] bg-white px-5 py-3 text-sm text-[#111111]">
              <Check className="h-4 w-4 text-[#16A34A]" />
              <span>Welcome to the LUMI Journal. Your subscription is confirmed.</span>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletter}
              className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address for newsletter
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-11 flex-1 border border-[#D4D0C8] bg-white px-4 text-sm text-[#111111] placeholder:text-[#71717A] focus:border-[#111111] focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 bg-[#111111] px-6 text-xs font-medium tracking-wider uppercase text-white transition-colors hover:bg-[#27272A] whitespace-nowrap shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
