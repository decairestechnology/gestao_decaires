import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Star, X, Lightbulb, Loader2 } from "lucide-react";
import { ideasApi, type Idea as ApiIdea } from "../../lib/api";

const statusColors: Record<string, { bg: string; text: string }> = {
  Nova: { bg: "#E0F9FF", text: "#0E7490" },
  "Em análise": { bg: "#F5F3FF", text: "#7C3AED" },
  Validando: { bg: "#FFFBEB", text: "#B45309" },
  Aprovada: { bg: "#ECFDF5", text: "#065F46" },
  "Em desenvolvimento": { bg: "#EFF6FF", text: "#1D4ED8" },
  Arquivada: { bg: "#F1F5F9", text: "#475569" },
};

interface UiIdea {
  id: number;
  title: string;
  desc: string;
  category: string;
  author: string;
  date: string;
  priority: string;
  revenue: string;
  complexity: string;
  target: string;
  status: string;
  scores: { viabilidade: number; comercial: number; inovacao: number; custo: number; tempo: number };
}

function toUiIdea(i: ApiIdea): UiIdea {
  return {
    id: i.id,
    title: i.title,
    desc: i.description ?? "",
    category: i.category ?? "—",
    author: i.author_name ?? "—",
    date: i.created_at ? new Date(i.created_at).toLocaleDateString("pt-BR") : "—",
    priority: i.priority,
    revenue: i.revenue_potential ?? "—",
    complexity: i.complexity ?? "—",
    target: i.target_audience ?? "—",
    status: i.status,
    scores: {
      viabilidade: i.score_viability ?? 0,
      comercial: i.score_commercial ?? 0,
      inovacao: i.score_innovation ?? 0,
      custo: i.score_cost ?? 0,
      tempo: i.score_time ?? 0,
    },
  };
}

const priorityColors: Record<string, string> = { Alta: "#EF4444", Média: "#F59E0B", Baixa: "#10B981" };

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex-1 h-1.5 rounded-full" style={{ background: n <= value ? "var(--primary)" : "var(--muted)" }} />
        ))}
      </div>
    </div>
  );
}

const emptyForm = { title: "", category: "", target_audience: "", description: "", priority: "Média", revenue_potential: "Médio" };

export function Ideas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<UiIdea | null>(null);
  const [ideas, setIdeas] = useState<UiIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ideasApi.list();
      setIdeas(data.map(toUiIdea));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar as ideias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  async function handleCreateIdea() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await ideasApi.create(form);
      setForm(emptyForm);
      setShowModal(false);
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar a ideia.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = ideas.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todas" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ideias..."
            className="w-full pl-8 pr-4 py-2 rounded-lg text-sm outline-none border"
            style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Todas", ...Object.keys(statusColors)].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Nova ideia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((idea) => {
          const s = statusColors[idea.status] ?? { bg: "#F1F5F9", text: "#475569" };
          const avgScore = Math.round((idea.scores.viabilidade + idea.scores.comercial + idea.scores.inovacao) / 3 * 10) / 10;
          return (
            <div key={idea.id} onClick={() => setSelected(idea)}
              className="rounded-xl border p-5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FFFBEB" }}>
                  <Lightbulb size={15} style={{ color: "#F59E0B" }} />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2" style={{ background: s.bg, color: s.text }}>{idea.status}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{idea.title}</h3>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{idea.desc}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{idea.category}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: `${priorityColors[idea.priority]}15`, color: priorityColors[idea.priority] }}>{idea.priority}</span>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Receita: {idea.revenue}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--muted-foreground)" }}>por {idea.author} · {idea.date}</span>
                <div className="flex items-center gap-1">
                  <Star size={11} style={{ color: "#F59E0B" }} />
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>{avgScore}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Idea Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" style={{ background: "var(--card)", scrollbarWidth: "none" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColors[selected.status]?.bg, color: statusColors[selected.status]?.text }}>{selected.status}</span>
                <h3 className="font-bold mt-1" style={{ color: "var(--foreground)" }}>{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {[["Categoria", selected.category], ["Público-alvo", selected.target], ["Potencial de receita", selected.revenue], ["Complexidade", selected.complexity], ["Autor", selected.author], ["Data", selected.date]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Avaliação</div>
                <ScoreBar label="Viabilidade" value={selected.scores.viabilidade} />
                <ScoreBar label="Potencial comercial" value={selected.scores.comercial} />
                <ScoreBar label="Inovação" value={selected.scores.inovacao} />
                <ScoreBar label="Custo estimado" value={selected.scores.custo} />
                <ScoreBar label="Tempo de desenvolvimento" value={selected.scores.tempo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Nova Ideia</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Título", "text", "Nome da ideia", "title"], ["Categoria", "text", "Ex: SaaS, Fintech...", "category"], ["Público-alvo", "text", "Quem vai usar?", "target_audience"]].map(([l, t, ph, key]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input
                    type={t as string}
                    placeholder={ph as string}
                    value={(form as any)[key as string]}
                    onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a ideia..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Potencial de receita</label>
                  <select
                    value={form.revenue_potential}
                    onChange={(e) => setForm({ ...form, revenue_potential: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <option>Alto</option><option>Médio</option><option>Baixo</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleCreateIdea}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Salvar ideia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
