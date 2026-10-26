import { useEffect, useRef, useState } from "react";
import { Bot, Globe, Layers, RotateCcw, Send, Sparkles } from "lucide-react";
import api from "../api/client";
import useAuthStore from "../context/authStore";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
];

const SUGGESTIONS = [
  "What documents do I need for this licence?",
  "Why do applications get rejected?",
  "How long does officer review take?",
  "What’s the difference between manufacturing and a loan licence?",
];

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const WELCOME = {
  role: "assistant",
  text: "Namaste! I’m your AYUSH compliance assistant. Ask me about licence eligibility, required documents, or how to fix correction remarks.",
  time: now(),
};

export default function Assistant() {
  const user = useAuthStore((s) => s.user);
  const [lang, setLang] = useState("en");
  const [pathways, setPathways] = useState([]);
  const [pathwayCode, setPathwayCode] = useState("manufacturing");
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/pathway").then((res) => setPathways(res.pathways || [])).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(text) {
    const question = text.trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: "user", text: question, time: now() }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/assistant/ask", { question, pathwayCode, lang });
      setMessages((m) => [...m, { role: "assistant", text: res.answer || "No response received.", time: now() }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Sorry, something went wrong: ${err.message}`, time: now(), error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <div className="card mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-glow">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold">Compliance assistant</h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online · answers in seconds
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label className="relative">
            <span className="sr-only">Pathway</span>
            <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={pathwayCode} onChange={(e) => setPathwayCode(e.target.value)} className="input py-2 pl-9 pr-8 sm:w-52">
              {pathways.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="relative">
            <span className="sr-only">Language</span>
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="input py-2 pl-9 pr-8 sm:w-36">
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Conversation */}
      <div className="card flex min-h-[420px] flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.map((m, i) => {
            const mine = m.role === "user";
            return (
              <div key={i} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    mine ? "bg-accent-100 text-accent-700" : "bg-gradient-to-br from-primary-600 to-secondary-500 text-white"
                  }`}
                >
                  {mine ? user?.name?.[0]?.toUpperCase() || "U" : <Bot className="h-5 w-5" />}
                </div>
                <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? "text-right" : ""}`}>
                  <div
                    className={`whitespace-pre-line rounded-2xl px-4 py-3 text-left text-sm leading-relaxed ${
                      mine ? "rounded-tr-md bg-primary-600 text-white" : m.error ? "rounded-tl-md bg-rose-50 text-rose-700" : "rounded-tl-md bg-slate-100 text-slate-700"
                    }`}
                  >
                    {m.text}
                  </div>
                  <p className="mt-1 px-1 text-[11px] text-slate-400">{m.time}</p>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 sm:flex-wrap sm:px-6">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100">
                <Sparkles className="h-3.5 w-3.5" /> {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-slate-100 p-3 sm:p-4"
        >
          <button type="button" onClick={() => setMessages([WELCOME])} className="btn-ghost shrink-0 px-3" aria-label="Clear conversation" title="Clear conversation">
            <RotateCcw className="h-4 w-4" />
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about licences, documents or fees…" className="input flex-1" aria-label="Your question" />
          <button type="submit" disabled={!input.trim() || loading} className="btn-primary shrink-0 px-3 sm:px-4">
            <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
