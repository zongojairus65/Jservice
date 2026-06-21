import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/layout/HeroSection";
import { ProductsSection } from "@/components/layout/ProductsSection";
import { ServicesSection } from "@/components/layout/ServicesSection";
import { CTASection } from "@/components/layout/CTASection";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { SupportChatButton } from "@/components/SupportChat";

export const metadata: Metadata = {
  title: "JServices — Vos services digitaux en un clic",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-2">
      <Navbar />
      <HeroSection />
      <ProductsSection featured />
      <ServicesSection featured />
      <CTASection />
      <Footer />
      <CartDrawer />
      <SupportChatButton />
    </main>
  );
}
