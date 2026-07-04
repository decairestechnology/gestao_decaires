import { useState, useEffect, useCallback } from "react";
import { Plus, X, Instagram, Youtube, Mail, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { contentApi, type ContentPost as ApiContentPost } from "../../lib/api";

const statusColors: Record<string, { bg: string; text: string }> = {
  Ideia: { bg: "#F1F5F9", text: "#475569" },
  "Em produção": { bg: "#EFF6FF", text: "#1D4ED8" },
  "Em revisão": { bg: "#FFFBEB", text: "#B45309" },
  Aprovado: { bg: "#ECFDF5", text: "#065F46" },
  Agendado: { bg: "#F5F3FF", text: "#7C3AED" },
  Publicado: { bg: "#E0F9FF", text: "#0E7490" },
};

const platformColors: Record<string, string> = {
  Instagram: "#E1306C", YouTube: "#FF0000", LinkedIn: "#0077B5",
  "E-mail": "#06B6D4", TikTok: "#000000", Blog: "#7C3AED",
};

interface UiContent {
  id: number;
  title: string;
  caption: string;
  platform: string;
  type: string;
  date: string;
  rawDate: string;
  responsible: string;
  status: string;
  hashtags: string[];
  cta: string;
}

function toUiContent(c: ApiContentPost): UiContent {
  return {
    id: c.id,
    title: c.title,
    caption: c.caption ?? "",
    platform: c.platform ?? "—",
    type: c.type ?? "—",
    date: c.scheduled_date ? new Date(c.scheduled_date).toLocaleDateString("pt-BR") : "—",
    rawDate: c.scheduled_date ? c.scheduled_date.slice(0, 10) : "",
    responsible: c.responsible_name ?? "—",
    status: c.status,
    hashtags: c.hashtags ?? [],
    cta: c.cta ?? "—",
  };
}

const contentTypes = ["Post", "Carrossel", "Reels", "Stories", "Artigo", "E-mail", "Vídeo", "Anúncio"];

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = { Instagram: "📸", YouTube: "▶️", LinkedIn: "💼", "E-mail": "📧", TikTok: "🎵", Blog: "📝" };
  return <span>{icons[platform] ?? "🌐"}</span>;
}

const emptyForm = { title: "", caption: "", platform: "Instagram", type: "Post", scheduled_date: "", cta: "", hashtagsRaw: "" };

export function Content() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [platformFilter, setPlatformFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<UiContent | null>(null);
  const [contents, setContents] = useState<UiContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const loadContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contentApi.list();
      setContents(data.map(toUiContent));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar o conteúdo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(c: UiContent) {
    setEditingId(c.id);
    setForm({
      title: c.title, caption: c.caption, platform: c.platform === "—" ? "Instagram" : c.platform,
      type: c.type === "—" ? "Post" : c.type, scheduled_date: c.rawDate,
      cta: c.cta === "—" ? "" : c.cta, hashtagsRaw: c.hashtags.join(", "),
    });
    setShowModal(true);
  }

  async function handleSaveContent() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const hashtags = form.hashtagsRaw.split(",").map((h) => h.trim()).filter(Boolean);
      const payload = { ...form, hashtags };
      if (editingId) {
        const updated = await contentApi.update(editingId, payload as any);
        if (selected?.id === editingId) setSelected(toUiContent(updated));
      } else {
        await contentApi.create(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadContents();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar o conteúdo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContent() {
    if (!selected) return;
    setDeleting(true);
    try {
      await contentApi.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      await loadContents();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o conteúdo.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!selected) return;
    setChangingStatus(true);
    try {
      const updated = await contentApi.update(selected.id, { status } as any);
      setSelected(toUiContent(updated));
      await loadContents();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível mudar o status.");
    } finally {
      setChangingStatus(false);
    }
  }

  function openContent(c: UiContent) {
    setSelected(c);
    setConfirmDelete(false);
  }

  const filtered = contents.filter((c) => {
    const matchPlat = platformFilter === "Todas" || c.platform === platformFilter;
    const matchStatus = statusFilter === "Todos" || c.status === statusFilter;
    return matchPlat && matchStatus;
  });

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Todas", "Instagram", "YouTube", "LinkedIn", "E-mail", "TikTok", "Blog"].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Todos", ...Object.keys(statusColors)].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={openCreateModal} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Novo conteúdo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {Object.entries(statusColors).map(([status, colors]) => {
          const count = contents.filter(c => c.status === status).length;
          return (
            <div key={status} className="rounded-xl border p-3 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{count}</div>
              <div className="text-xs mt-0.5" style={{ color: colors.text }}>{status}</div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" />Carregando conteúdo...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const s = statusColors[c.status] ?? { bg: "#F1F5F9", text: "#475569" };
          const pColor = platformColors[c.platform] ?? "#64748B";
          return (
            <div key={c.id} onClick={() => openContent(c)}
              className="rounded-xl border p-5 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg"><PlatformIcon platform={c.platform} /></span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: pColor }}>{c.platform}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.type}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: s.bg, color: s.text }}>{c.status}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: "var(--foreground)" }}>{c.title}</h3>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{c.caption}</p>
              {c.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.hashtags.slice(0, 3).map((h, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{h}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--muted-foreground)" }}>{c.responsible}</span>
                <span style={{ color: "var(--muted-foreground)" }}>{c.date}</span>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum conteúdo encontrado.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" style={{ background: "var(--card)", scrollbarWidth: "none" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm"><PlatformIcon platform={selected.platform} /></span>
                  <span className="text-xs font-semibold" style={{ color: platformColors[selected.platform] ?? "#64748B" }}>{selected.platform} · {selected.type}</span>
                </div>
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selected.title}</h3>
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
                <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir esse conteúdo?</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                  <button onClick={handleDeleteContent} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                    {deleting && <Loader2 size={11} className="animate-spin" />}Excluir
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Status</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(statusColors).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={changingStatus || selected.status === s}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:cursor-default"
                      style={{ background: selected.status === s ? statusColors[s].bg : "var(--muted)", color: selected.status === s ? statusColors[s].text : "var(--muted-foreground)", opacity: changingStatus ? 0.6 : 1 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>Legenda / Caption</div>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.caption}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Publicação", selected.date], ["Responsável", selected.responsible], ["CTA", selected.cta], ["Tipo", selected.type]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              {selected.hashtags.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.hashtags.map((h, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Conteúdo" : "Novo Conteúdo"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Título</label>
                <input
                  type="text"
                  placeholder="Título do conteúdo"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Legenda</label>
                <textarea
                  rows={3}
                  placeholder="Escreva a legenda..."
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Plataforma</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    {Object.keys(platformColors).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    {contentTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Data de publicação</label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>CTA</label>
                  <input
                    type="text"
                    placeholder="Ex: Comente sua opinião"
                    value={form.cta}
                    onChange={(e) => setForm({ ...form, cta: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Hashtags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="#Tech, #Inovação"
                  value={form.hashtagsRaw}
                  onChange={(e) => setForm({ ...form, hashtagsRaw: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSaveContent}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
