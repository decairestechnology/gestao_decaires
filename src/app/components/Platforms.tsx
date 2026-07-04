import { useState, useEffect, useCallback } from "react";
import { Plus, ExternalLink, Github, Users, X, Globe, Loader2, Pencil, Trash2 } from "lucide-react";
import { platformsApi, type Platform as ApiPlatform } from "../../lib/api";

const statusColors: Record<string, { bg: string; text: string }> = {
  Ideia: { bg: "#F1F5F9", text: "#475569" },
  Planejamento: { bg: "#F5F3FF", text: "#7C3AED" },
  Desenvolvimento: { bg: "#EFF6FF", text: "#1D4ED8" },
  Testes: { bg: "#FFFBEB", text: "#B45309" },
  Produção: { bg: "#ECFDF5", text: "#065F46" },
  Manutenção: { bg: "#E0F9FF", text: "#0E7490" },
  Descontinuada: { bg: "#FEF2F2", text: "#991B1B" },
};

interface UiPlatform {
  id: number;
  name: string;
  logo: string;
  desc: string;
  category: string;
  tech: string[];
  status: string;
  responsible: string;
  launch: string;
  users: number;
  revenue: number;
  costs: number;
  link: string;
  repo: string;
  prod: string;
  staging: string;
}

function toUiPlatform(p: ApiPlatform): UiPlatform {
  return {
    id: p.id,
    name: p.name,
    logo: p.logo_emoji ?? "🚀",
    desc: p.description ?? "",
    category: p.category ?? "—",
    tech: p.tech ?? [],
    status: p.status,
    responsible: p.responsible_name ?? "—",
    launch: p.launch_date ?? "—",
    users: p.users_count ?? 0,
    revenue: Number(p.revenue) || 0,
    costs: Number(p.monthly_costs) || 0,
    link: p.public_link ?? "—",
    repo: p.repo_link ?? "—",
    prod: p.prod_link ?? "—",
    staging: p.staging_link ?? "—",
  };
}

const emptyForm = {
  name: "", category: "", description: "", logo_emoji: "", status: "Ideia", launch_date: "",
  users_count: "", revenue: "", monthly_costs: "", public_link: "", repo_link: "", prod_link: "", staging_link: "", techRaw: "",
};

export function Platforms() {
  const [selected, setSelected] = useState<UiPlatform | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [platforms, setPlatforms] = useState<UiPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const loadPlatforms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await platformsApi.list();
      setPlatforms(data.map(toUiPlatform));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar as plataformas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(p: UiPlatform) {
    setEditingId(p.id);
    setForm({
      name: p.name, category: p.category === "—" ? "" : p.category, description: p.desc,
      logo_emoji: p.logo, status: p.status, launch_date: p.launch === "—" ? "" : p.launch,
      users_count: String(p.users || ""), revenue: String(p.revenue || ""), monthly_costs: String(p.costs || ""),
      public_link: p.link === "—" ? "" : p.link, repo_link: p.repo === "—" ? "" : p.repo,
      prod_link: p.prod === "—" ? "" : p.prod, staging_link: p.staging === "—" ? "" : p.staging,
      techRaw: p.tech.join(", "),
    });
    setShowModal(true);
  }

  async function handleSavePlatform() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const tech = form.techRaw.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        ...form,
        tech,
        users_count: form.users_count ? Number(form.users_count) : 0,
        revenue: form.revenue ? Number(form.revenue) : 0,
        monthly_costs: form.monthly_costs ? Number(form.monthly_costs) : 0,
      };
      if (editingId) {
        const updated = await platformsApi.update(editingId, payload as any);
        if (selected?.id === editingId) setSelected(toUiPlatform(updated));
      } else {
        await platformsApi.create(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadPlatforms();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar a plataforma.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlatform() {
    if (!selected) return;
    setDeleting(true);
    try {
      await platformsApi.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      await loadPlatforms();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir a plataforma.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!selected) return;
    setChangingStatus(true);
    try {
      const updated = await platformsApi.update(selected.id, { status } as any);
      setSelected(toUiPlatform(updated));
      await loadPlatforms();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível mudar o status.");
    } finally {
      setChangingStatus(false);
    }
  }

  function openPlatform(p: UiPlatform) {
    setSelected(p);
    setConfirmDelete(false);
  }

  const filtered = platforms.filter(p => statusFilter === "Todas" || p.status === statusFilter);

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Todas", ...Object.keys(statusColors)].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={14} />Nova plataforma
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" />Carregando plataformas...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const s = statusColors[p.status] ?? { bg: "#F1F5F9", text: "#475569" };
          return (
            <div key={p.id} onClick={() => openPlatform(p)}
              className="rounded-xl border p-5 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--muted)" }}>
                    {p.logo}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{p.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.category}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2" style={{ background: s.bg, color: s.text }}>{p.status}</span>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{p.desc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.tech.map((t, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                  <Users size={11} />{p.users} usuários
                </div>
                <div className="font-semibold" style={{ color: p.revenue > 0 ? "#10B981" : "var(--muted-foreground)" }}>
                  {p.revenue > 0 ? `R$ ${p.revenue.toLocaleString("pt-BR")}/mês` : "Sem receita"}
                </div>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma plataforma encontrada.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" style={{ background: "var(--card)", scrollbarWidth: "none" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{selected.logo}</div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selected.name}</h3>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{selected.category}</span>
                </div>
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
                <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir essa plataforma?</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                  <button onClick={handleDeletePlatform} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                    {deleting && <Loader2 size={11} className="animate-spin" />}Excluir
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-5">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.desc}</p>

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

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Responsável", selected.responsible],
                  ["Lançamento", selected.launch],
                  ["Usuários", selected.users.toString()],
                  ["Receita", selected.revenue > 0 ? `R$ ${selected.revenue.toLocaleString("pt-BR")}/mês` : "—"],
                  ["Custos", selected.costs > 0 ? `R$ ${selected.costs.toLocaleString("pt-BR")}/mês` : "—"],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              {selected.tech.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Tecnologias</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.tech.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded font-mono font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {[["🌐 Produção", selected.prod], ["🧪 Staging", selected.staging], ["📦 Repositório", selected.repo], ["🔗 Link público", selected.link]].map(([label, url]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>{label as string}</span>
                    <span className="text-xs font-mono truncate max-w-[60%]" style={{ color: "var(--muted-foreground)" }}>{url as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Plataforma" : "Nova Plataforma"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              <div className="grid grid-cols-2 gap-3">
                {[["Nome", "text", "Nome da plataforma", "name"], ["Emoji/Logo", "text", "🚀", "logo_emoji"]].map(([l, t, ph, key]) => (
                  <div key={l as string}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                    <input
                      type={t as string} placeholder={ph as string} value={(form as any)[key as string]}
                      onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Categoria</label>
                  <input
                    type="text" placeholder="SaaS, Fintech..." value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Status</label>
                  <select
                    value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea
                  rows={2} placeholder="Descreva a plataforma..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Tecnologias (separadas por vírgula)</label>
                <input
                  type="text" placeholder="React, Node.js, PostgreSQL" value={form.techRaw}
                  onChange={(e) => setForm({ ...form, techRaw: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Lançamento", "text", "Set 2026", "launch_date"], ["Usuários", "number", "0", "users_count"], ["Receita (R$/mês)", "number", "0", "revenue"]].map(([l, t, ph, key]) => (
                  <div key={l as string}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                    <input
                      type={t as string} placeholder={ph as string} value={(form as any)[key as string]}
                      onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Custos mensais (R$)</label>
                <input
                  type="number" placeholder="0" value={form.monthly_costs}
                  onChange={(e) => setForm({ ...form, monthly_costs: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Link público", "public_link"], ["Repositório", "repo_link"], ["Produção", "prod_link"], ["Staging", "staging_link"]].map(([l, key]) => (
                  <div key={l as string}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                    <input
                      type="text" placeholder="https://..." value={(form as any)[key as string]}
                      onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSavePlatform}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
