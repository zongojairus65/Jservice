"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowRight, MessageCircle, ExternalLink } from "lucide-react";
import { productsApi, servicesApi } from "@/lib/api";
import { useCartStore, useUIStore } from "@/lib/store";
import { formatPrice, getServiceWhatsAppLink, getWhatsAppLink } from "@/lib/utils";
import type { Product, Service } from "@/types";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/25 bg-gold/8 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
      <span className="text-gold text-[11px] font-black tracking-[2px] uppercase font-mono">
        {label}
      </span>
    </div>
  );
}

function BadgePill({ type, t }: { type: string | null; t: typeof frT }) {
  if (!type) return null;
  const styles: Record<string, string> = {
    popular: "bg-gold/15 text-gold border border-gold/30",
    new:     "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    quote:   "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  };
  const label = (t.badges as Record<string, string>)[type] ?? type;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono ${styles[type] ?? ""}`}>
      {label}
    </span>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

export function ProductsSection({ featured }: { featured?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale } = useUIStore();
  const { addItem } = useCartStore();
  const t = locale === "fr" ? frT : enT;

  useEffect(() => {
    productsApi.list({ limit: featured ? 4 : 20 })
      .then((r) => setProducts(r.data.products ?? []))
      .catch(() => {
        // Fallback seed data for demo
        setProducts([
          { id: "1", slug: "bot-sportif-pro", name_fr: "Bot Sportif Pro", name_en: "Pro Sports Bot", desc_fr: "Pronostics sportifs automatisés en temps réel", desc_en: "Automated real-time sports predictions", price: 15000, category: "bot", badge: "popular", icon: "⚽", is_active: true },
          { id: "2", slug: "bot-crypto-trader", name_fr: "Bot Crypto Trader", name_en: "Crypto Trader Bot", desc_fr: "Signaux de trading crypto automatisés", desc_en: "Automated crypto trading signals", price: 25000, category: "bot", badge: "new", icon: "₿", is_active: true },
          { id: "3", slug: "pack-donnees-foot", name_fr: "Pack Données Foot", name_en: "Football Data Pack", desc_fr: "Base de données complète des matchs", desc_en: "Complete football match database", price: 8000, category: "file", badge: null, icon: "📊", is_active: true },
          { id: "4", slug: "template-business", name_fr: "Template Business", name_en: "Business Template", desc_fr: "Pack de templates professionnels", desc_en: "Professional template pack", price: 5000, category: "template", badge: null, icon: "📁", is_active: true },
        ]);
      })
      .finally(() => setLoading(false));
  }, [featured]);

  const handleAdd = (p: Product) => {
    addItem({
      id: p.id,
      type: "product",
      slug: p.slug,
      name_fr: p.name_fr,
      name_en: p.name_en,
      price: p.price,
      icon: p.icon,
    });
  };

  return (
    <section className="bg-dark-2 py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <SectionBadge label={t.products.badge} />
          <h2 className="font-serif font-black text-white mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
            {t.products.title}
          </h2>
          <p className="text-gray-400 text-base">{t.products.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-dark h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p, i) => {
              const name = locale === "fr" ? p.name_fr : p.name_en;
              const desc = locale === "fr" ? p.desc_fr : p.desc_en;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="card-dark p-6 flex flex-col group cursor-default"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-2xl">
                      {p.icon}
                    </div>
                    <BadgePill type={p.badge} t={t} />
                  </div>
                  <h3 className="font-serif font-bold text-white text-lg mb-2">{name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">{desc}</p>
                  <div className="flex justify-between items-center gap-3">
                    <span className="font-serif font-black text-gold text-xl">
                      {formatPrice(p.price, locale)}
                    </span>
                    <button
                      onClick={() => handleAdd(p)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 border border-gold/25 text-gold text-xs font-bold hover:bg-gold/20 transition-colors"
                    >
                      <ShoppingCart size={13} />
                      {t.products.add_cart}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {featured && (
          <div className="text-center mt-10">
            <Link href="/products" className="btn-gold-outline inline-flex items-center gap-2">
              {t.products.see_all} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Services Section ─────────────────────────────────────────────────────────

export function ServicesSection({ featured }: { featured?: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  useEffect(() => {
    servicesApi.list()
      .then((r) => {
        const all = r.data.services ?? [];
        setServices(featured ? all.slice(0, 3) : all);
      })
      .catch(() => {
        const fallback: Service[] = [
          { id: "1", slug: "carte-virtuelle", name_fr: "Carte Virtuelle", name_en: "Virtual Card", desc_fr: "Cartes de visite virtuelles professionnelles", desc_en: "Professional virtual business cards", price: 3500, on_quote: false, badge: "popular", icon: "💳", is_active: true },
          { id: "2", slug: "creation-poster", name_fr: "Création Poster", name_en: "Poster Design", desc_fr: "Design de posters et visuels marketing premium", desc_en: "Premium marketing poster design", price: null, on_quote: true, badge: "quote", icon: "🎨", is_active: true },
          { id: "3", slug: "restauration-photo", name_fr: "Restauration Photo", name_en: "Photo Restoration", desc_fr: "Restauration IA de photos anciennes", desc_en: "AI restoration of old or damaged photos", price: 4000, on_quote: false, badge: "new", icon: "🖼️", is_active: true },
          { id: "4", slug: "assistance-whatsapp", name_fr: "Assistance WhatsApp", name_en: "WhatsApp Support", desc_fr: "Accompagnement personnalisé via WhatsApp", desc_en: "Personalized support via WhatsApp", price: null, on_quote: true, badge: "quote", icon: "💬", is_active: true },
          { id: "5", slug: "logo-branding", name_fr: "Logo & Branding", name_en: "Logo & Branding", desc_fr: "Création d'identité visuelle complète", desc_en: "Complete visual identity creation", price: null, on_quote: true, badge: "quote", icon: "✨", is_active: true },
          { id: "6", slug: "setup-digital", name_fr: "Setup Digital", name_en: "Digital Setup", desc_fr: "Configuration de vos outils digitaux", desc_en: "Digital tools configuration & setup", price: 12000, on_quote: false, badge: null, icon: "⚙️", is_active: true },
        ];
        setServices(featured ? fallback.slice(0, 3) : fallback);
      })
      .finally(() => setLoading(false));
  }, [featured]);

  return (
    <section className="bg-dark py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <SectionBadge label={t.services.badge} />
          <h2 className="font-serif font-black text-white mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
            {t.services.title}
          </h2>
          <p className="text-gray-400 text-base">{t.services.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-dark h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => {
              const name = locale === "fr" ? s.name_fr : s.name_en;
              const desc = locale === "fr" ? s.desc_fr : s.desc_en;
              const waLink = getServiceWhatsAppLink(name, s.whatsapp_template, locale);

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="card-dark p-6 flex flex-col group hover:border-gold/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-2xl">
                      {s.icon}
                    </div>
                    <BadgePill type={s.badge} t={t} />
                  </div>
                  <h3 className="font-serif font-bold text-white text-lg mb-2">{name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">{desc}</p>
                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <span className={`font-serif font-black text-xl ${s.on_quote ? "text-purple-400 text-sm" : "text-gold"}`}>
                      {s.on_quote ? t.services.on_quote : formatPrice(s.price, locale)}
                    </span>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/25 text-gold text-xs font-bold hover:bg-gold/10 transition-colors"
                    >
                      <MessageCircle size={13} />
                      {t.services.order_whatsapp}
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {featured && (
          <div className="text-center mt-10">
            <Link href="/services" className="btn-gold-outline inline-flex items-center gap-2">
              {t.services.see_all} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

export function CTASection() {
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const waLink = getWhatsAppLink(
    locale === "fr"
      ? "Bonjour ! Je souhaite démarrer avec JServices."
      : "Hello! I'd like to get started with JServices."
  );

  return (
    <section className="relative py-24 px-4 sm:px-6 bg-dark overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.1), transparent)" }}
      />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-4xl mx-auto mb-6">
          💬
        </div>
        <h2 className="font-serif font-black text-white mb-4" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
          {t.cta.title}
        </h2>
        <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-lg mx-auto">
          {t.cta.subtitle}
        </p>
        <a href={waLink} target="_blank" rel="noreferrer" className="btn-gold inline-flex text-base px-8 py-4">
          <MessageCircle size={18} />
          {t.cta.btn}
        </a>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const stack = [
    { label: "Next.js", color: "#fff" },
    { label: "Go",      color: "#00ACD7" },
    { label: "PostgreSQL", color: "#336791" },
    { label: "Docker",  color: "#2496ED" },
  ];

  return (
    <footer className="bg-[#05050A] border-t border-gold/15 pt-14 pb-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center text-dark font-black">J</div>
              <span className="font-serif text-xl font-bold text-white">
                J<span className="text-gold">Services</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">{t.footer.tagline}</p>
            <div className="flex gap-3">
              {["🌐", "📘", "📸"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-gold/8 border border-gold/20 flex items-center justify-center text-base hover:bg-gold/15 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div>
            <p className="text-gold text-xs font-black tracking-widest uppercase mb-4">{t.footer.nav}</p>
            {[
              { href: "/products", label: t.nav.products },
              { href: "/services", label: t.nav.services },
              { href: "/dashboard", label: t.nav.dashboard },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block text-gray-500 text-sm hover:text-gold transition-colors mb-2"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p className="text-gold text-xs font-black tracking-widest uppercase mb-4">{t.footer.contact}</p>
            <a
              href="https://wa.me/22672157058"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-emerald-400 text-sm mb-3 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink size={13} />
              WhatsApp: +226 72 157 058
            </a>
            <p className="text-gray-500 text-sm">📍 {t.footer.location}</p>
          </div>
        </div>

        <div className="border-t border-gold/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">{t.footer.rights}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {stack.map(({ label, color }) => (
              <span
                key={label}
                className="px-2 py-1 rounded text-[10px] font-black font-mono"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
