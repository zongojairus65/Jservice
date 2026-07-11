// Shared frontend types — mirror the Go backend JSON shapes
// (backend/internal/products, services, orders, admin, auth)

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  role: "user" | "admin";
  created_at?: string;
}

export interface Product {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  desc_fr: string;
  desc_en: string;
  price: number | null; // null = on quote
  category: string;
  badge: string | null;
  icon: string;
  file_url?: string | null;
  is_active: boolean;
}

export interface Service {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  desc_fr: string;
  desc_en: string;
  price: number | null;
  on_quote: boolean;
  badge: string | null;
  icon: string;
  whatsapp_template?: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_ref: string;
  total: number | null;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  order_ref: string;
  total: number | null;
  status: string;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface AdminPayment {
  id: string;
  order_ref: string;
  method: string;
  provider?: string | null;
  provider_ref?: string | null;
  amount: number;
  status: string;
}

export interface AdminStats {
  revenue: { total: number; month: number };
  orders: { total: number; pending: number; paid: number; delivered: number };
  users: { total: number; new_this_month: number };
  catalog: { products: number; services: number };
  generated_at: string;
}
