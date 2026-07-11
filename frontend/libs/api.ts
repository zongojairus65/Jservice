import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/lib/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message ?? err.message ?? "Une erreur est survenue";
  }
  if (err instanceof Error) return err.message;
  return "Une erreur est survenue";
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
};

// ─── Products ───────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: { limit?: number; category?: string }) => api.get("/products", { params }),
  get: (slug: string) => api.get(`/products/${slug}`),
  adminList: () => api.get("/admin/products"),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
  create: (data: Record<string, unknown>) => api.post("/admin/products", data),
};

// ─── Services ───────────────────────────────────────────────────────────────

export const servicesApi = {
  list: () => api.get("/services"),
  get: (slug: string) => api.get(`/services/${slug}`),
  adminList: () => api.get("/admin/services"),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/services/${id}`, data),
  delete: (id: string) => api.delete(`/admin/services/${id}`),
  create: (data: Record<string, unknown>) => api.post("/admin/services", data),
};

// ─── Orders ─────────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (data: {
    items: Record<string, unknown>[];
    payment_method: string;
    guest_name?: string;
    guest_phone?: string;
    notes?: string;
  }) => api.post("/orders", data),
  list: () => api.get("/orders"),
  get: (id: string) => api.get(`/orders/${id}`),
};

// ─── Payments ───────────────────────────────────────────────────────────────

export const paymentsApi = {
  confirm: (orderId: string, data: Record<string, unknown>) =>
    api.post(`/payments/${orderId}/confirm`, data),
  getByOrder: (orderId: string) => api.get(`/payments/${orderId}`),
};

// ─── Admin ──────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => api.get("/admin/stats"),
  orders: (status?: string) => api.get("/admin/orders", { params: status ? { status } : undefined }),
  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  payments: () => api.get("/admin/payments"),
  validatePayment: (id: string) => api.patch(`/admin/payments/${id}/validate`),
  users: () => api.get("/admin/users"),
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
};