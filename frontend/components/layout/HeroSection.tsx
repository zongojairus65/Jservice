"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { getWhatsAppLink } from "@/lib/utils";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

const STATS = [
  { value: "500+", keyFr: "stat_clients",      keyEn: "stat_clients" },
  { value: "50+",  keyFr: "stat_services",     keyEn: "stat_services" },
  { value: "98%",  keyFr: "stat_satisfaction", keyEn: "stat_satisfaction" },
];

export function HeroSection() {
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const waLink = getWhatsAppLink(
    locale === "fr"
      ? "Bonjour ! Je souhaite en savoir plus sur vos services."
      : "Hello! I'd like to learn more about your services."
  );

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-dark">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 bg-dark-mesh" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(201,168,76,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Animated particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(i * 7.3) % 100}%`,
            top: `${(i * 11.7) % 100}%`,
            width: (i % 3) + 2,
            height: (i % 3) + 2,
            background: "var(--gold)",
            boxShadow: "0 0 6px var(--gold)",
          }}
          animate={{ y: [0, -24, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Rotating circles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute right-[5%] top-[10%] w-[500px] h-[500px] rounded-full border border-gold/10 pointer-events-none hidden lg:block"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute right-[10%] top-[15%] w-[380px] h-[380px] rounded-full border border-dashed border-gold/8 pointer-events-none hidden lg:block"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/25 bg-gold/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-xs font-bold tracking-widest uppercase font-mono">
              {t.hero.badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif font-black leading-[1.05] mb-5"
            style={{ fontSize: "clamp(44px, 7vw, 82px)" }}
          >
            <span className="text-white">{t.hero.title}</span>
            <br />
            <span className="text-gold-gradient">{t.hero.title_gold}</span>
          </motion.h1>

          {/* Gold line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="h-[3px] bg-gold-gradient mb-6 rounded-full"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 leading-relaxed mb-10 max-w-[580px]"
            style={{ fontSize: "clamp(15px, 2vw, 18px)" }}
          >
            {t.hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/services" className="btn-gold">
              {t.hero.cta_primary}
              <ArrowRight size={16} />
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn-gold-outline"
            >
              <MessageCircle size={16} />
              {t.hero.cta_secondary}
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-10 mt-16 pt-10 border-t border-white/5"
          >
            {STATS.map((s, i) => (
              <div key={i}>
                <p className="font-serif text-4xl font-black text-gold">{s.value}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(t.hero as Record<string, string>)[s.keyFr]}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-2 to-transparent" />
    </section>
  );
}
