"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, User, LogOut, ArrowRight, Clock } from "lucide-react";
import { ordersApi, getErrorMessage } from "@/lib/api";
import { useAuthStore, useUIStore } from "@/lib/store";
import { formatPrice, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/ProductsSection";
import { SupportChatButton } from "@/components/SupportChat";
import { toast } from "sonner";
import type { Order } from "@/types";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "profile">("orders");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    ordersApi.list()
      .then((r) => setOrders(r.data.orders ?? []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-dark-2">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif font-black text-white text-3xl">{t.dashboard.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif font-black text-dark text-lg" style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}>
              {user?.name?.[0] ?? "?"}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 transition-colors text-sm">
              <LogOut size={15} />
              {t.nav.logout}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gold/15 mb-8">
          {([
            { key: "orders", label: t.dashboard.orders, icon: Package },
            { key: "profile", label: t.dashboard.profile, icon: User },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2"
              style={{ borderColor: tab === key ? "#C9A84C" : "transparent", color: tab === key ? "#C9A84C" : "#6B7280" }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <div>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card-dark h-20 animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <Package size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 font-semibold mb-2">{t.dashboard.no_orders}</p>
                <Link href="/products" className="btn-gold inline-flex mt-4">
                  Explorer les produits <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order, i) => {
                  const statusLabel = ORDER_STATUS_LABELS[order.status]?.[locale] ?? order.status;
                  const statusColor = ORDER_STATUS_COLORS[order.status] ?? "#6B7280";
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="card-dark p-5 flex items-center gap-4 flex-wrap"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}33` }}>
                        <Clock size={18} style={{ color: statusColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-gold text-sm font-bold">{order.order_ref}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${statusColor}20`, color: statusColor }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{formatDate(order.created_at, locale)} · {order.payment_method}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif font-black text-gold text-lg">
                          {formatPrice(order.total, locale)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-dark p-8 max-w-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-serif font-black text-dark text-2xl" style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}>
                {user?.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="text-white font-bold text-xl">{user?.name}</p>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
                  {user?.role === "admin" ? "⚙️ Admin" : "👤 Client"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: t.auth.email, value: user?.email },
                { label: t.auth.phone, value: user?.phone || "—" },
                { label: "WhatsApp", value: user?.whatsapp || "—" },
                { label: locale === "fr" ? "Membre depuis" : "Member since", value: user?.created_at ? formatDate(user.created_at, locale) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-3 border-b border-gold/8">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>

            {user?.role === "admin" && (
              <Link href="/admin" className="btn-gold w-full mt-6 justify-center flex">
                ⚙️ {t.nav.admin}
              </Link>
            )}
          </motion.div>
        )}
      </div>

      <Footer />
      <SupportChatButton />
    </main>
  );
}
