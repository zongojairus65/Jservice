"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useCartStore, useUIStore, useAuthStore } from "@/lib/store";
import { ordersApi, getErrorMessage } from "@/lib/api";
import { formatPrice, getOrderWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

export function CartDrawer() {
  const { items, removeItem, updateQty, clearCart, total, count } = useCartStore();
  const { isCartOpen, setCartOpen, locale } = useUIStore();
  const { user } = useAuthStore();
  const t = locale === "fr" ? frT : enT;

  const [step, setStep] = useState<"cart" | "form" | "success">("cart");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    method: "mobilemoney",
    notes: "",
  });
  const [orderId, setOrderId] = useState("");
  const [orderRef, setOrderRef] = useState("");

  const cartTotal = total();
  const cartCount = count();

  const close = () => {
    setCartOpen(false);
    setTimeout(() => setStep("cart"), 400);
  };

  const handleCheckout = async () => {
    if (!form.name || !form.phone) {
      toast.error(locale === "fr" ? "Nom et téléphone requis" : "Name and phone required");
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        [i.type === "product" ? "product_id" : "service_id"]: i.id,
        quantity: i.quantity,
      }));

      const res = await ordersApi.create({
        items: orderItems,
        payment_method: form.method,
        guest_name: form.name,
        guest_phone: form.phone,
        notes: form.notes || undefined,
      });

      const { order_id, order_ref } = res.data;
      setOrderId(order_id);
      setOrderRef(order_ref);

      // Open WhatsApp with order details
      const itemLabels = items.map(
        (i) =>
          `• ${locale === "fr" ? i.name_fr : i.name_en} x${i.quantity} — ${formatPrice((i.price ?? 0) * i.quantity, locale)}`
      );
      const waLink = getOrderWhatsAppLink(
        order_ref, itemLabels, cartTotal, form.name, form.phone, form.method, locale
      );
      window.open(waLink, "_blank");

      clearCart();
      setStep("success");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "input-dark";

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] z-50 bg-dark-3 border-l border-gold/20 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/15">
              <h2 className="font-serif font-bold text-white text-xl">
                {step === "cart" ? `🛒 ${t.cart.title}` : step === "form" ? `📋 ${t.order.title}` : "✅"}
              </h2>
              <button onClick={close} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Cart step */}
              {step === "cart" && (
                <>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <ShoppingBag size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-400 font-semibold">{t.cart.empty}</p>
                      <p className="text-gray-600 text-sm mt-1">{t.cart.empty_sub}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-dark-4 border border-gold/10"
                        >
                          <div className="text-2xl w-10 flex-shrink-0">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {locale === "fr" ? item.name_fr : item.name_en}
                            </p>
                            <p className="text-gold text-sm font-bold mt-0.5">
                              {formatPrice((item.price ?? 0) * item.quantity, locale)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-dark text-gray-400 hover:text-white text-lg flex items-center justify-center transition-colors"
                            >
                              −
                            </button>
                            <span className="text-white text-sm w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-dark text-gray-400 hover:text-white text-lg flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-1 text-red-500 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Order form step */}
              {step === "form" && (
                <div className="flex flex-col gap-4">
                  <p className="text-gray-500 text-xs">{t.order.note_dynamic}</p>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.order.name}</label>
                    <input
                      className={inputCls}
                      placeholder="Jean Kofi..."
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.order.phone}</label>
                    <input
                      className={inputCls}
                      placeholder="+226 70 000 000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.order.payment_method}</label>
                    <select
                      className={`${inputCls} appearance-none`}
                      value={form.method}
                      onChange={(e) => setForm({ ...form, method: e.target.value })}
                    >
                      <option value="mobilemoney">{t.order.mobile_money} (Orange, Moov, Wave)</option>
                      <option value="manual">{t.order.manual}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.order.notes}</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Success step */}
              {step === "success" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">✅</motion.div>
                  <h3 className="font-serif font-bold text-white text-xl mb-2">{t.order.success_title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{t.order.success_msg}</p>
                  {orderRef && (
                    <div className="mt-4 px-4 py-2 bg-gold/10 border border-gold/25 rounded-lg">
                      <p className="text-gold text-xs font-mono">Réf: {orderRef}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {step !== "success" && items.length > 0 && (
              <div className="px-6 py-5 border-t border-gold/15 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-semibold text-sm">{t.cart.total}</span>
                  <span className="font-serif font-black text-gold text-2xl">
                    {cartTotal > 0 ? formatPrice(cartTotal, locale) : locale === "fr" ? "Sur devis" : "On quote"}
                  </span>
                </div>

                {step === "cart" ? (
                  <button onClick={() => setStep("form")} className="btn-gold w-full">
                    {t.cart.checkout} →
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="btn-gold w-full disabled:opacity-60"
                  >
                    <MessageCircle size={16} />
                    {loading ? (locale === "fr" ? "Traitement..." : "Processing...") : t.order.submit}
                  </button>
                )}

                {step === "form" && (
                  <button onClick={() => setStep("cart")} className="btn-gold-outline w-full text-sm py-2.5">
                    ← {t.common.back}
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
