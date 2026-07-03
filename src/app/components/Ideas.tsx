import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Star, X, Lightbulb, Loader2, Pencil, Trash2, Rocket, Ban, RotateCcw, ExternalLink } from "lucide-react";
import { ideasApi, type Idea as ApiIdea } from "../../lib/api";

const statusColors: Record<string, { bg: string; text: string }> = {
  Nova: { bg: "#E0F9FF", text: "#0E7490" },
  "Em análise": { bg: "#F5F3FF", text: "#7C3AED" },
  Validando: { bg: "#FFFBEB", text: "#B45309" },
  Aprovada: { bg: "#ECFDF5", text: "#065F46" },
  "Em desenvolvimento": { bg: "#EFF6FF", text: "#1D4ED8" },
  Arquivada: { bg: "#F1F5F9", text: "#475569" },
  Cancelada: { bg: "#FEF2F2", text: "#991B1B" },
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
  projectId: number | null;
  cancelReason: string;
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
    projectId: i.project_id,
    cancelReason: i.cancel_reason ?? "",
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

function ScoreBar({ label, value, onChange, saving }: { label: string; value: number; onChange?: (v: number) => void; saving?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <span className="font-semibold flex items-center gap-1" style={{ color: "var(--foreground)" }}>
          {saving && <Loader2 size={10} className="animate-spin" />}
          {value}/5
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            onClick={onChange ? () => onChange(n) : undefined}
            className="flex-1 h-1.5 rounded-full"
            style={{
              background: n <= value ? "var(--primary)" : "var(--muted)",
              cursor: onChange ? "pointer" : "default",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const emptyForm = { title: "", category: "", target_audience: "", description: "", priority: "Média", revenue_potential: "Médio", complexity: "Média" };

export function Ideas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<UiIdea | null>(null);
  const [ideas, setIdeas] = useState<UiIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [scoreDraft, setScoreDraft] = useState<UiIdea["scores"] | null>(null);
  const [savingScores, setSavingScores] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    setScoreDraft(selected ? { ...selected.scores } : null);
  }, [selected?.id]);

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

  async function handleSaveIdea() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await ideasApi.update(editingId, form as any);
        if (selected?.id === editingId) setSelected(toUiIdea(updated));
      } else {
        await ideasApi.create(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar a ideia.");
    } finally {
      setSaving(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(idea: UiIdea) {
    setEditingId(idea.id);
    setForm({
      title: idea.title, category: idea.category, target_audience: idea.target,
      description: idea.desc, priority: idea.priority, revenue_potential: idea.revenue,
      complexity: idea.complexity,
    });
    setShowModal(true);
  }

  async function handleDeleteIdea() {
    if (!selected) return;
    setDeleting(true);
    try {
      await ideasApi.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir a ideia.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleConvertToProject() {
    if (!selected) return;
    setConverting(true);
    try {
      const updated = await ideasApi.convertToProject(selected.id);
      setSelected(toUiIdea(updated));
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar essa ideia pra projeto.");
    } finally {
      setConverting(false);
    }
  }

  async function handleCancelIdea() {
    if (!selected) return;
    setCancelling(true);
    try {
      const updated = await ideasApi.cancel(selected.id, cancelReason.trim() || undefined);
      setSelected(toUiIdea(updated));
      setShowCancelBox(false);
      setCancelReason("");
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível cancelar a ideia.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleReactivateIdea() {
    if (!selected) return;
    setReactivating(true);
    try {
      const updated = await ideasApi.reactivate(selected.id);
      setSelected(toUiIdea(updated));
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível reativar a ideia.");
    } finally {
      setReactivating(false);
    }
  }

  function handleScoreDraftChange(field: keyof UiIdea["scores"], value: number) {
    setScoreDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSaveScores() {
    if (!selected || !scoreDraft) return;
    setSavingScores(true);
    try {
      const updated = await ideasApi.update(selected.id, {
        score_viability: scoreDraft.viabilidade,
        score_commercial: scoreDraft.comercial,
        score_innovation: scoreDraft.inovacao,
        score_cost: scoreDraft.custo,
        score_time: scoreDraft.tempo,
      } as any);
      setSelected(toUiIdea(updated));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar a avaliação.");
    } finally {
      setSavingScores(false);
    }
  }

  async function handleChangeStatus(status: string) {
    if (!selected) return;
    setChangingStatus(true);
    try {
      const updated = await ideasApi.updateStatus(selected.id, status);
      setSelected(toUiIdea(updated));
      await loadIdeas();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível mudar o status.");
    } finally {
      setChangingStatus(false);
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
        <button onClick={openCreateModal}
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
            <div key={idea.id} onClick={() => { setSelected(idea); setConfirmDelete(false); setShowCancelBox(false); setCancelReason(""); }}
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEditModal(selected)} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDelete(true)} title="Excluir" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "#EF4444" }}>
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
              </div>
            </div>

            {confirmDelete && (
              <div className="px-6 py-3 flex items-center justify-between gap-3" style={{ background: "#FEF2F2" }}>
                <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir essa ideia? Não dá pra desfazer.</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                  <button onClick={handleDeleteIdea} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                    {deleting && <Loader2 size={11} className="animate-spin" />}
                    Excluir
                  </button>
                </div>
              </div>
            )}
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
              <div>
                <div className="font-semibold text-sm mb-2" style={{ color: "var(--foreground)" }}>Status no fluxo</div>
                <div className="flex flex-wrap gap-2">
                  {["Nova", "Em análise", "Validando", "Aprovada", "Arquivada"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleChangeStatus(s)}
                      disabled={changingStatus || selected.status === s}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:cursor-default transition-opacity"
                      style={{
                        background: selected.status === s ? statusColors[s]?.bg : "var(--muted)",
                        color: selected.status === s ? statusColors[s]?.text : "var(--muted-foreground)",
                        opacity: changingStatus ? 0.6 : 1,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {(selected.status === "Cancelada" || selected.status === "Em desenvolvimento") && (
                  <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                    {selected.status === "Em desenvolvimento" ? "Essa ideia já virou projeto — o fluxo acima não se aplica mais." : "Reative a ideia (botão abaixo) pra voltar ao fluxo normal."}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Avaliação</div>
                  <button
                    onClick={handleSaveScores}
                    disabled={savingScores || !scoreDraft || JSON.stringify(scoreDraft) === JSON.stringify(selected.scores)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 flex items-center gap-1.5"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {savingScores && <Loader2 size={11} className="animate-spin" />}
                    Salvar avaliação
                  </button>
                </div>
                <p className="text-xs -mt-2" style={{ color: "var(--muted-foreground)" }}>Clique nas barras pra ajustar a nota, depois clique em "Salvar avaliação".</p>
                {scoreDraft && (
                  <>
                    <ScoreBar label="Viabilidade" value={scoreDraft.viabilidade} onChange={(v) => handleScoreDraftChange("viabilidade", v)} />
                    <ScoreBar label="Potencial comercial" value={scoreDraft.comercial} onChange={(v) => handleScoreDraftChange("comercial", v)} />
                    <ScoreBar label="Inovação" value={scoreDraft.inovacao} onChange={(v) => handleScoreDraftChange("inovacao", v)} />
                    <ScoreBar label="Custo estimado" value={scoreDraft.custo} onChange={(v) => handleScoreDraftChange("custo", v)} />
                    <ScoreBar label="Tempo de desenvolvimento" value={scoreDraft.tempo} onChange={(v) => handleScoreDraftChange("tempo", v)} />
                  </>
                )}
              </div>

              {selected.status === "Cancelada" && selected.cancelReason && (
                <div className="rounded-lg p-3" style={{ background: "#FEF2F2" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#991B1B" }}>Motivo do cancelamento</div>
                  <div className="text-sm" style={{ color: "#991B1B" }}>{selected.cancelReason}</div>
                </div>
              )}

              {showCancelBox && (
                <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--muted)" }}>
                  <label className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Motivo (opcional)</label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Por que essa ideia está sendo cancelada?"
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                    style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowCancelBox(false); setCancelReason(""); }} className="text-xs px-3 py-1.5 rounded-lg font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Voltar</button>
                    <button onClick={handleCancelIdea} disabled={cancelling} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                      {cancelling && <Loader2 size={11} className="animate-spin" />}
                      Confirmar cancelamento
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                {selected.status === "Cancelada" ? (
                  <button
                    onClick={handleReactivateIdea}
                    disabled={reactivating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {reactivating ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    Reativar ideia
                  </button>
                ) : selected.projectId ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#ECFDF5", color: "#065F46" }}>
                    <ExternalLink size={13} />Já enviada pra Projetos
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleConvertToProject}
                      disabled={converting}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {converting ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
                      Enviar pra Projetos
                    </button>
                    <button
                      onClick={() => setShowCancelBox(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium"
                      style={{ borderColor: "var(--border)", color: "#EF4444" }}
                    >
                      <Ban size={13} />Cancelar ideia
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Ideia" : "Nova Ideia"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
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
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Complexidade</label>
                  <select
                    value={form.complexity}
                    onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSaveIdea}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : "Salvar ideia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
