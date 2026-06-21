import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JServices — Vos services digitaux en un clic",
    template: "%s | JServices",
  },
  description:
    "Plateforme SaaS de services digitaux en Afrique de l'Ouest. Bots sportifs, cartes virtuelles, restauration d'images, assistance WhatsApp.",
  keywords: [
    "services digitaux",
    "Afrique de l'Ouest",
    "bot sportif",
    "carte virtuelle",
    "restauration photo",
    "Mobile Money",
    "Burkina Faso",
  ],
  authors: [{ name: "JServices" }],
  creator: "JServices",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jservices.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_US",
    siteName: "JServices",
    title: "JServices — Vos services digitaux en un clic",
    description:
      "Bots sportifs, cartes virtuelles, restauration d'images — tout en un clic.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JServices",
    description: "Vos services digitaux en un clic",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A84C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans bg-dark-2 text-white antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#13131A",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
