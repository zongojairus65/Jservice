"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Package, Wrench, Users, CreditCard, CheckCircle, Pencil, Trash2, Plus } from "lucide-react";
import { adminApi, productsApi, servicesApi, getErrorMessage } from "@/lib/api";
import { useAuthStore, useUIStore } from "@/lib/store";
import { formatPrice, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";
import { toast } from "sonner";
import type { AdminStats, AdminOrder, AdminUser, AdminPayment, Product, Service } from "@/types";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{ background: "#13131A", border: `1px solid ${color}28` }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-serif font-black text-3xl mb-1" style={{ color }}>{value}</div>
      <div className="text-white text-sm font-semibold">{label}</div>
      {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, locale }: { status: string; locale: "fr" | "en" }) {
  const color = ORDER_STATUS_COLORS[status] ?? "#6B7280";
  const label = ORDER_STATUS_LABELS[status]?.[locale] ?? status;
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-black whitespace-nowrap"
      style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuthStore();
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const [tab, setTab] = useState<"stats" | "orders" | "products" | "services" | "users" | "payments">("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<{ id: string; type: "product" | "service"; price: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push("/");
      return;
    }
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, servicesRes, usersRes, paymentsRes] = await Promise.all([
        adminApi.stats(),
        adminApi.orders(),
        productsApi.adminList(),
        servicesApi.adminList(),
        adminApi.users(),
        adminApi.payments(),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders ?? []);
      setProducts(productsRes.data.products ?? []);
      setServices(servicesRes.data.services ?? []);
      setUsers(usersRes.data.users ?? []);
      setPayments(paymentsRes.data.payments ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(locale === "fr" ? "Statut mis à jour" : "Status updated");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const validatePayment = async (id: string) => {
    try {
      await adminApi.validatePayment(id);
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "validated" } : p)));
      toast.success(locale === "fr" ? "Paiement validé !" : "Payment validated!");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const savePrice = async () => {
    if (!editingPrice) return;
    const price = editingPrice.price === "" ? null : parseInt(editingPrice.price, 10);
    try {
      if (editingPrice.type === "product") {
        await productsApi.update(editingPrice.id, { price });
        setProducts((prev) => prev.map((p) => (p.id === editingPrice.id ? { ...p, price } : p)));
      } else {
        await servicesApi.update(editingPrice.id, { price });
        setServices((prev) => prev.map((s) => (s.id === editingPrice.id ? { ...s, price } : s)));
      }
      toast.success(locale === "fr" ? "Prix mis à jour" : "Price updated");
      setEditingPrice(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const tabs = [
    { key: "stats",    label: t.admin.stats,    icon: BarChart3 },
    { key: "orders",   label: t.admin.orders,   icon: Package },
    { key: "products", label: t.admin.products, icon: Package },
    { key: "services", label: t.admin.services, icon: Wrench },
    { key: "payments", label: t.admin.payments, icon: CreditCard },
    { key: "users",    label: t.admin.users,    icon: Users },
  ] as const;

  const inputCls = "input-dark text-sm py-2";

  return (
    <div className="min-h-screen bg-dark-2">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-gold/15" style={{ background: "rgba(10,10,11,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-dark font-black text-sm" style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}>J</div>
              <span className="font-serif font-bold text-white text-lg">J<span className="text-gold">Services</span></span>
            </Link>
            <div className="h-5 w-px bg-gold/20" />
            <span className="text-gray-500 text-sm font-semibold">{t.admin.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold">{user?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Tabs */}
        <div className="flex gap-0 border-b border-gold/15 mb-8 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex-shrink-0"
              style={{ borderColor: tab === key ? "#C9A84C" : "transparent", color: tab === key ? "#C9A84C" : "#6B7280" }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card-dark h-28 animate-pulse" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Stats ─────────────────────────────────────────────────── */}
            {tab === "stats" && stats && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon="💰" label={t.admin.revenue_month} value={formatPrice(stats.revenue.month, locale)} color="#C9A84C" />
                  <StatCard icon="📦" label={t.admin.orders_total}  value={stats.orders.total} sub={`${stats.orders.pending} ${t.admin.orders_pending}`} color="#10B981" />
                  <StatCard icon="👥" label={t.admin.users_total}   value={stats.users.total}  sub={`+${stats.users.new_this_month} ce mois`} color="#6366F1" />
                  <StatCard icon="⏳" label={t.admin.orders_pending} value={stats.orders.pending} color="#F59E0B" />
                </div>

                {/* Revenue bar chart (visual) */}
                <div className="card-dark p-6">
                  <h3 className="text-white font-bold text-sm mb-5">📈 {locale === "fr" ? "Activité 14 derniers jours" : "Last 14 days activity"}</h3>
                  <div className="flex items-end gap-2 h-28">
                    {[40,65,45,80,55,90,70,85,60,95,75,100,50,88].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.4 }}
                        className="flex-1 rounded-t"
                        style={{ height: `${h}%`, background: "linear-gradient(to top,#9A7535,#E8C97A)", transformOrigin: "bottom", opacity: 0.85 }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 text-gray-600 text-[10px] font-mono">
                    <span>J-14</span><span>J-7</span><span>Aujourd&apos;hui</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Orders ────────────────────────────────────────────────── */}
            {tab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex gap-2 mb-5 flex-wrap">
                  {["all","pending","paid","delivered"].map((s) => (
                    <button key={s} onClick={async () => {
                      const res = await adminApi.orders(s === "all" ? undefined : s);
                      setOrders(res.data.orders ?? []);
                    }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                      style={{ borderColor: "rgba(201,168,76,0.25)", color: "#C9A84C", background: "rgba(201,168,76,0.08)" }}
                    >
                      {s === "all" ? (locale === "fr" ? "Toutes" : "All") : ORDER_STATUS_LABELS[s]?.[locale] ?? s}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {orders.map((order) => (
                    <div key={order.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-mono text-gold text-sm font-bold">{order.order_ref}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{formatDate(order.created_at, locale)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">
                          {order.user_name ?? order.guest_name ?? "—"}
                        </div>
                        <div className="text-gray-600 text-xs truncate">{order.user_email ?? order.guest_phone ?? ""}</div>
                      </div>
                      <div className="text-gold font-serif font-black">{formatPrice(order.total, locale)}</div>
                      <StatusBadge status={order.status} locale={locale} />
                      <div className="flex gap-2">
                        {order.status === "payment_submitted" && (
                          <button onClick={() => updateOrderStatus(order.id, "paid")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                            <CheckCircle size={13} /> {t.admin.validate}
                          </button>
                        )}
                        {order.status === "paid" && (
                          <button onClick={() => updateOrderStatus(order.id, "delivered")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.3)" }}>
                            📦 Livrer
                          </button>
                        )}
                        <a href={`https://wa.me/${order.user_phone ?? order.guest_phone}`.replace(/[^\d]/g,"")}
                          target="_blank" rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}>
                          💬
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Products ──────────────────────────────────────────────── */}
            {tab === "products" && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-white font-bold">{locale === "fr" ? "Gestion des produits" : "Product management"}</h2>
                  <button className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5"><Plus size={15}/>{t.admin.add_product}</button>
                </div>
                <div className="flex flex-col gap-3">
                  {products.map((p) => (
                    <div key={p.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold">{p.name_fr}</div>
                        <div className="text-gray-600 text-xs font-mono">{p.category} · {p.slug}</div>
                      </div>
                      {editingPrice?.id === p.id && editingPrice.type === "product" ? (
                        <div className="flex items-center gap-2">
                          <input
                            className={inputCls + " w-32"}
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                            placeholder="FCFA (vide=devis)"
                          />
                          <button onClick={savePrice} className="btn-gold text-xs px-3 py-2">{t.admin.save}</button>
                          <button onClick={() => setEditingPrice(null)} className="text-gray-500 text-xs hover:text-white">{t.admin.cancel}</button>
                        </div>
                      ) : (
                        <span className="font-serif font-black text-gold">{formatPrice(p.price, locale)}</span>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPrice({ id: p.id, type: "product", price: p.price?.toString() ?? "" })}
                          className="p-2 rounded-lg text-gold hover:bg-gold/10 transition-colors"><Pencil size={14}/></button>
                        <button onClick={async () => { await productsApi.delete(p.id); setProducts((prev) => prev.filter((x) => x.id !== p.id)); toast.success("Supprimé"); }}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Services ──────────────────────────────────────────────── */}
            {tab === "services" && (
              <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-white font-bold">{locale === "fr" ? "Gestion des services" : "Service management"}</h2>
                  <button className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5"><Plus size={15}/>{t.admin.add_service}</button>
                </div>
                <div className="flex flex-col gap-3">
                  {services.map((s) => (
                    <div key={s.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                      <span className="text-2xl">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold">{s.name_fr}</div>
                        <div className="text-gray-600 text-xs font-mono">{s.on_quote ? (locale === "fr" ? "Sur devis" : "On quote") : ""} · {s.slug}</div>
                      </div>
                      {editingPrice?.id === s.id && editingPrice.type === "service" ? (
                        <div className="flex items-center gap-2">
                          <input
                            className={inputCls + " w-32"}
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                            placeholder="FCFA (vide=devis)"
                          />
                          <button onClick={savePrice} className="btn-gold text-xs px-3 py-2">{t.admin.save}</button>
                          <button onClick={() => setEditingPrice(null)} className="text-gray-500 text-xs hover:text-white">{t.admin.cancel}</button>
                        </div>
                      ) : (
                        <span className={`font-serif font-black ${s.on_quote && !s.price ? "text-purple-400 text-sm" : "text-gold"}`}>
                          {formatPrice(s.price, locale)}
                        </span>
                      )}
                      <button onClick={() => setEditingPrice({ id: s.id, type: "service", price: s.price?.toString() ?? "" })}
                        className="p-2 rounded-lg text-gold hover:bg-gold/10 transition-colors"><Pencil size={14}/></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Payments ──────────────────────────────────────────────── */}
            {tab === "payments" && (
              <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col gap-3">
                  {payments.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">{locale === "fr" ? "Aucun paiement" : "No payments"}</p>
                  ) : payments.map((p) => (
                    <div key={p.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                      <div className="font-mono text-xs text-gray-500">{p.order_ref}</div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-semibold">{p.method} {p.provider ? `· ${p.provider}` : ""}</div>
                        {p.provider_ref && <div className="text-gray-600 text-xs font-mono">{p.provider_ref}</div>}
                      </div>
                      <div className="font-serif font-black text-gold">{formatPrice(p.amount, locale)}</div>
                      <StatusBadge status={p.status === "validated" ? "paid" : "pending"} locale={locale} />
                      {p.status === "pending" && (
                        <button onClick={() => validatePayment(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                          <CheckCircle size={13}/> {t.admin.validate}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Users ─────────────────────────────────────────────────── */}
            {tab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col gap-3">
                  {users.map((u) => (
                    <div key={u.id} className="card-dark p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif font-black text-dark flex-shrink-0" style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}>
                        {u.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{u.name}</div>
                        <div className="text-gray-500 text-xs truncate">{u.email} {u.phone ? `· ${u.phone}` : ""}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black"
                        style={{ background: u.role === "admin" ? "rgba(201,168,76,0.15)" : "rgba(99,102,241,0.15)", color: u.role === "admin" ? "#C9A84C" : "#818CF8", border: `1px solid ${u.role === "admin" ? "rgba(201,168,76,0.3)" : "rgba(99,102,241,0.3)"}` }}>
                        {u.role}
                      </span>
                      <div className="text-gray-600 text-xs">{formatDate(u.created_at, locale)}</div>
                      {u.role !== "admin" && (
                        <button onClick={async () => {
                          await adminApi.updateUserRole(u.id, "admin");
                          setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: "admin" } : x));
                          toast.success(locale === "fr" ? "Rôle mis à jour" : "Role updated");
                        }}
                          className="text-xs text-gold hover:underline whitespace-nowrap">
                          → Admin
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
