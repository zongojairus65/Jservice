"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, ExternalLink } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { getWhatsAppLink } from "@/lib/utils";
import frT from "@/i18n/fr.json";
import enT from "@/i18n/en.json";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  time: string;
}

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "22672157058";

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SupportChatButton() {
  const { locale, isChatOpen, toggleChat } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  return (
    <>
      <AnimatePresence>{isChatOpen && <SupportChatPanel />}</AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggleChat}
        aria-label={t.chat.title}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #9A7535, #C9A84C, #E8C97A)",
          boxShadow: "0 8px 28px rgba(201,168,76,0.5)",
        }}
      >
        <AnimatePresence mode="wait">
          {isChatOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} className="text-dark" />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} className="text-dark" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

function SupportChatPanel() {
  const { locale } = useUIStore();
  const t = locale === "fr" ? frT : enT;

  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "bot", content: t.chat.greeting, time: nowTime() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      time: nowTime(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Tu es l'assistant support de JServices, plateforme SaaS en Afrique de l'Ouest (Burkina Faso).
Produits disponibles: Bot Sportif Pro (15 000 FCFA), Bot Crypto Trader (25 000 FCFA), Pack Données Foot (8 000 FCFA), Template Business (5 000 FCFA).
Services: Carte Virtuelle (3 500 FCFA), Création Poster (sur devis), Restauration Photo (4 000 FCFA), Assistance WhatsApp (sur devis), Logo & Branding (sur devis), Setup Digital (12 000 FCFA).
Paiement: Mobile Money (Orange Money, Moov Money, Wave) ou virement manuel. Toutes les commandes sont validées par un admin.
Contact direct WhatsApp: https://wa.me/${WA_NUMBER}
Langue de réponse: ${locale === "fr" ? "français" : "anglais"}.
Sois chaleureux, concis et professionnel. Pour tout devis ou commande complexe, oriente vers WhatsApp.`,
          messages: messages
            .concat(userMsg)
            .filter((m) => m.role === "user")
            .slice(-6)
            .map((m) => ({ role: "user" as const, content: m.content })),
        }),
      });

      const data = await res.json();
      const botText =
        data.content?.[0]?.text ??
        (locale === "fr"
          ? "Je vous redirige vers notre équipe sur WhatsApp."
          : "I'm redirecting you to our team on WhatsApp.");

      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "bot", content: botText, time: nowTime() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content:
            locale === "fr"
              ? "Erreur de connexion. Contactez-nous directement sur WhatsApp."
              : "Connection error. Please contact us directly on WhatsApp.",
          time: nowTime(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const waLink = getWhatsAppLink(
    locale === "fr"
      ? "Bonjour JServices ! J'ai besoin d'assistance."
      : "Hello JServices! I need assistance."
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 20 }}
      transition={{ type: "spring", damping: 26, stiffness: 300 }}
      className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: 360,
        maxHeight: 520,
        border: "1px solid rgba(201,168,76,0.25)",
        background: "#0F0F14",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: "#13131A", borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-dark font-black text-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}
        >
          J
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">{t.chat.title}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs">{t.chat.online}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0" style={{ minHeight: 200 }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? {
                      background: "linear-gradient(135deg,#9A7535,#C9A84C)",
                      color: "#0A0A0B",
                      borderRadius: "16px 16px 4px 16px",
                    }
                  : {
                      background: "#1A1A24",
                      color: "#E5E7EB",
                      borderRadius: "16px 16px 16px 4px",
                    }
              }
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <p className="text-[10px] mt-1 opacity-50 text-right">{msg.time}</p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: "#1A1A24" }}>
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#C9A84C" }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        className="px-3 py-3 flex gap-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={t.chat.placeholder}
          className="flex-1 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none placeholder-gray-600 transition-colors"
          style={{
            background: "#1A1A24",
            border: "1px solid rgba(201,168,76,0.15)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.15)")}
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg,#9A7535,#C9A84C)" }}
        >
          <Send size={15} className="text-dark" />
        </button>
      </div>

      {/* WhatsApp fallback */}
      <div className="px-4 pb-3 text-center flex-shrink-0">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
        >
          <ExternalLink size={11} />
          {t.chat.wa_fallback}
        </a>
      </div>
    </motion.div>
  );
}
