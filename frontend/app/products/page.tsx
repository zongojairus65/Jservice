import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ProductsSection, CTASection, Footer } from "@/components/layout/ProductsSection";
import { CartDrawer } from "@/components/CartDrawer";
import { SupportChatButton } from "@/components/SupportChat";

export const metadata: Metadata = {
  title: "Produits Digitaux — Bots & Fichiers",
  description:
    "Achetez nos bots sportifs, crypto et fichiers numériques. Téléchargement instantané après paiement Mobile Money.",
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-dark-2">
      <Navbar />
      <div className="pt-20">
        <ProductsSection />
      </div>
      <CTASection />
      <Footer />
      <CartDrawer />
      <SupportChatButton />
    </main>
  );
}
