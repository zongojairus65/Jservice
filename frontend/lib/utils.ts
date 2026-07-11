import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatting ─────────────────────────────────────────────────────────────

export function formatPrice(price: number | null | undefined, locale: "fr" | "en" = "fr"): string {
  if (price === null || price === undefined) {
    return locale === "fr" ? "Sur devis" : "On quote";
  }
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US").format(price);
  return `${formatted} FCFA`;
}

export function formatDate(dateStr: string, locale: "fr" | "en" = "fr"): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Order status ───────────────────────────────────────────────────────────

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#6B7280",
  payment_submitted: "#F59E0B",
  paid: "#10B981",
  delivered: "#6366F1",
  cancelled: "#EF4444",
};

export const ORDER_STATUS_LABELS: Record<string, { fr: string; en: string }> = {
  pending: { fr: "En attente", en: "Pending" },
  payment_submitted: { fr: "Paiement soumis", en: "Payment submitted" },
  paid: { fr: "Payée", en: "Paid" },
  delivered: { fr: "Livrée", en: "Delivered" },
  cancelled: { fr: "Annulée", en: "Cancelled" },
};

// ─── WhatsApp ───────────────────────────────────────────────────────────────

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "22672157058";

export function getWhatsAppLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getServiceWhatsAppLink(
  serviceName: string,
  template: string | null | undefined,
  locale: "fr" | "en" = "fr"
): string {
  const message =
    template ??
    (locale === "fr"
      ? `Bonjour ! Je suis intéressé(e) par le service "${serviceName}". Pouvez-vous me donner plus d'informations ?`
      : `Hello! I'm interested in the "${serviceName}" service. Could you give me more information?`);
  return getWhatsAppLink(message);
}

export function getOrderWhatsAppLink(
  orderRef: string,
  itemLabels: string[],
  total: number,
  name: string,
  phone: string,
  paymentMethod: string,
  locale: "fr" | "en" = "fr"
): string {
  const lines =
    locale === "fr"
      ? [
          `Bonjour ! Voici ma commande :`,
          `Réf: ${orderRef}`,
          ``,
          ...itemLabels,
          ``,
          `Total: ${formatPrice(total, locale)}`,
          `Nom: ${name}`,
          `Téléphone: ${phone}`,
          `Paiement: ${paymentMethod === "mobilemoney" ? "Mobile Money" : "Virement manuel"}`,
        ]
      : [
          `Hello! Here is my order:`,
          `Ref: ${orderRef}`,
          ``,
          ...itemLabels,
          ``,
          `Total: ${formatPrice(total, locale)}`,
          `Name: ${name}`,
          `Phone: ${phone}`,
          `Payment: ${paymentMethod === "mobilemoney" ? "Mobile Money" : "Manual transfer"}`,
        ];
  return getWhatsAppLink(lines.join("\n"));
}
