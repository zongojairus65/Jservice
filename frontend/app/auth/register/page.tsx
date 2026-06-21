"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { authApi, getErrorMessage } from "@/lib/api";
import { useAuthStore, useUIStore } from "@/lib/store";
import { toast } from "sonner";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error(locale === "fr" ? "Mot de passe trop court (8 min)" : "Password too short (8 min)");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.token);
      toast.success(locale === "fr" ? "Compte créé !" : "Account created!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 grid-bg">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.08), transparent)" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-dark font-black text-lg" style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}>J</div>
            <span className="font-serif text-2xl font-bold text-white">J<span className="text-gold">Services</span></span>
          </Link>
        </div>

        <div className="card-dark p-8">
          <h1 className="font-serif font-bold text-white text-2xl mb-1">{t.auth.register_title}</h1>
          <p className="text-gray-500 text-sm mb-7">
            {t.auth.has_account}{" "}
            <Link href="/auth/login" className="text-gold hover:underline font-semibold">{t.nav.login}</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.auth.name}</label>
              <input type="text" required value={form.name} onChange={set("name")} className="input-dark" placeholder="Jean Kofi" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.auth.email}</label>
              <input type="email" required value={form.email} onChange={set("email")} className="input-dark" placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.auth.phone} <span className="text-gray-600">(optionnel)</span></label>
              <input type="tel" value={form.phone} onChange={set("phone")} className="input-dark" placeholder="+226 70 000 000" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">{t.auth.password}</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required value={form.password} onChange={set("password")} className="input-dark pr-11" placeholder="8 caractères minimum" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-2 disabled:opacity-60">
              {loading ? (locale === "fr" ? "Création..." : "Creating...") : t.auth.register_btn}
            </button>
          </form>

          <p className="text-gray-600 text-xs text-center mt-5 leading-relaxed">
            {locale === "fr"
              ? "En créant un compte, vous acceptez nos conditions d'utilisation."
              : "By creating an account, you agree to our terms of service."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
