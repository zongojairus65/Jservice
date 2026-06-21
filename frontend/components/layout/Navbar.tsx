"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, Globe } from "lucide-react";
import { useCartStore, useUIStore, useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, setLocale, toggleCart } = useUIStore();
  const { count } = useCartStore();
  const { user, clearAuth, isAdmin } = useAuthStore();
  const t = locale === "fr" ? frT : enT;
  const cartCount = count();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/",          label: t.nav.home },
    { href: "/products",  label: t.nav.products },
    { href: "/services",  label: t.nav.services },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          scrolled
            ? "bg-dark/95 backdrop-blur-xl border-b border-gold/10 shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center text-dark font-black text-lg">
              J
            </div>
            <span className="font-serif text-xl font-bold text-white">
              J<span className="text-gold">Services</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 ml-4 flex-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-gray-400 hover:text-gold transition-colors duration-200 relative group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Lang switcher */}
            <button
              onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 transition-colors"
            >
              <Globe size={12} />
              {locale === "fr" ? "EN" : "FR"}
            </button>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2.5 rounded-lg text-gray-300 hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-dark text-[10px] font-black rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Auth */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin() && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-xs font-bold text-gold border border-gold/30 rounded-md hover:bg-gold/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  {user.name.split(" ")[0]}
                </Link>
                <button
                  onClick={clearAuth}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link href="/auth/register" className="btn-gold text-sm px-4 py-2">
                  {t.nav.signup}
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-dark-3 border-t border-gold/10 overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-gray-300 hover:text-gold py-2 border-b border-white/5 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                <div className="flex gap-3 pt-2">
                  <Link href="/auth/login" className="flex-1 btn-gold-outline text-center text-sm py-2">
                    {t.nav.login}
                  </Link>
                  <Link href="/auth/register" className="flex-1 btn-gold text-center text-sm py-2">
                    {t.nav.signup}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
