import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ServicesSection, CTASection, Footer } from "@/components/layout/ProductsSection";
import { CartDrawer } from "@/components/CartDrawer";
import { SupportChatButton } from "@/components/SupportChat";

export const metadata: Metadata = {
  title: "Services Digitaux — Cartes, Posters, Photo",
  description:
    "Création de cartes virtuelles, design de posters, restauration de photos, assistance WhatsApp. Commandez en un clic.",
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-dark-2">
      <Navbar />
      <div className="pt-20">
        <ServicesSection />
      </div>
      <CTASection />
      <Footer />
      <CartDrawer />
      <SupportChatButton />
    </main>
  );
}
