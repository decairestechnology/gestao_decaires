import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { scoutChat, type ScoutMessage } from "../../lib/api";

interface DisplayMessage {
  role: "user" | "assistant";
  text: string;
}

function extractText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
  }
  return "";
}

export function ScoutChat() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ScoutMessage[]>([]);
  const [display, setDisplay] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [display, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    setDisplay((d) => [...d, { role: "user", text }]);
    setSending(true);
    try {
      const newHistory: ScoutMessage[] = [...history, { role: "user", content: text }];
      const result = await scoutChat(newHistory);
      setHistory(result.messages);
      setDisplay((d) => [...d, { role: "assistant", text: result.text }]);
    } catch (err: any) {
      setError(err?.message ?? "A Scout não respondeu. Tenta de novo?");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 no-print"
          style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
          title="Conversar com a Scout"
        >
          <Sparkles size={22} color="white" />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-5 right-5 z-40 w-[360px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl border overflow-hidden flex flex-col no-print"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="white" />
              <span className="text-sm font-bold text-white">Scout</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "white" }}>
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "none" }}>
            {display.length === 0 && (
              <div className="text-xs text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                Oi! Sou a Scout 👋 Posso cadastrar um lead pra você ou responder sobre os números do negócio. Manda uma mensagem.
              </div>
            )}
            {display.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap"
                  style={{
                    background: m.role === "user" ? "var(--primary)" : "var(--muted)",
                    color: m.role === "user" ? "var(--primary-foreground)" : "var(--foreground)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 flex items-center gap-2" style={{ background: "var(--muted)" }}>
                  <Loader2 size={13} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Scout está pensando...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF2F2", color: "#991B1B" }}>{error}</div>
            )}
          </div>

          <div className="p-3 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Escreva pra Scout..."
              className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
