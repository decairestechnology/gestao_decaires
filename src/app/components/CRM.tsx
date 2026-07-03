import { useState, useEffect, useCallback } from "react";
import { Plus, Phone, Mail, X, ArrowRight, Loader2, Pencil, Trash2, Send } from "lucide-react";
import { leadsApi, type Lead as ApiLead, type LeadActivity } from "../../lib/api";

const stages = [
  { id: "new", label: "Novo lead", color: "#64748B" },
  { id: "contact", label: "Primeiro contato", color: "#06B6D4" },
  { id: "qualify", label: "Qualificação", color: "#7C3AED" },
  { id: "proposal", label: "Proposta enviada", color: "#F59E0B" },
  { id: "negotiation", label: "Negociação", color: "#F97316" },
  { id: "won", label: "Cliente conquistado", color: "#10B981" },
  { id: "lost", label: "Lead perdido", color: "#EF4444" },
];

// Formato usado nas telas — convertido a partir do que a API devolve
interface UiLead {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  origin: string;
  interest: string;
  value: number;
  responsible: string;
  lastContact: string;
  nextAction: string;
  stage: string;
  description: string;
}

function toUiLead(l: ApiLead): UiLead {
  return {
    id: l.id,
    name: l.name,
    company: l.company ?? "",
    phone: l.phone ?? "",
    email: l.email ?? "",
    origin: l.origin ?? "",
    interest: l.interest ?? "",
    value: Number(l.value) || 0,
    responsible: l.responsible_name ?? "",
    lastContact: l.last_contact ? new Date(l.last_contact).toLocaleDateString("pt-BR") : "—",
    nextAction: l.next_action ?? "",
    stage: l.stage,
    description: l.description ?? "",
  };
}

const emptyForm = { name: "", company: "", phone: "", email: "", origin: "", interest: "", value: "", next_action: "", description: "" };

export function CRM() {
  const [leads, setLeads] = useState<UiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UiLead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.list();
      setLeads(data.map(toUiLead));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar os leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const loadActivities = useCallback(async (leadId: number) => {
    setActivitiesLoading(true);
    try {
      const data = await leadsApi.listActivities(leadId);
      setActivities(data);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  function openLead(lead: UiLead) {
    setSelected(lead);
    setConfirmDelete(false);
    setNewNote("");
    loadActivities(lead.id);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(lead: UiLead) {
    setEditingId(lead.id);
    setForm({
      name: lead.name, company: lead.company, phone: lead.phone, email: lead.email,
      origin: lead.origin, interest: lead.interest, value: String(lead.value || ""),
      next_action: lead.nextAction, description: lead.description,
    });
    setShowModal(true);
  }

  async function handleSaveLead() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await leadsApi.update(editingId, { ...form, value: form.value ? (Number(form.value) as any) : (0 as any) } as any);
        if (selected?.id === editingId) {
          setSelected(toUiLead(updated));
          loadActivities(editingId);
        }
      } else {
        await leadsApi.create({ ...form, value: form.value ? (Number(form.value) as any) : (0 as any) });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadLeads();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar o lead.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvanceStage() {
    if (!selected) return;
    setAdvancing(true);
    try {
      const updated = await leadsApi.advanceStage(selected.id);
      setSelected(toUiLead(updated));
      await loadLeads();
      await loadActivities(selected.id);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível avançar a etapa.");
    } finally {
      setAdvancing(false);
    }
  }

  async function handleDeleteLead() {
    if (!selected) return;
    setDeleting(true);
    try {
      await leadsApi.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      await loadLeads();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o lead.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddNote() {
    if (!selected || !newNote.trim()) return;
    setAddingNote(true);
    try {
      await leadsApi.addActivity(selected.id, newNote.trim());
      setNewNote("");
      await loadActivities(selected.id);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível registrar a nota.");
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium px-3 py-1 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--card)" }}>
            {loading ? "Carregando..." : `${leads.length} leads · R$ ${leads.reduce((a, l) => a + l.value, 0).toLocaleString("pt-BR")} potencial`}
          </div>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Cadastrar lead
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const totalValue = stageLeads.reduce((a, l) => a + l.value, 0);
          return (
            <div key={stage.id} className="flex-shrink-0 w-56 rounded-xl p-3" style={{ background: "var(--muted)" }}>
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                  <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: stage.color, fontSize: 10 }}>{stageLeads.length}</span>
                </div>
                {totalValue > 0 && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>R$ {totalValue.toLocaleString("pt-BR")}</div>}
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div key={lead.id} onClick={() => openLead(lead)}
                    className="rounded-lg p-3 border cursor-pointer shadow-sm hover:shadow-md transition-all"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="font-semibold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>{lead.name}</div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{lead.company}</div>
                    <div className="text-xs font-semibold mb-2" style={{ color: "#10B981" }}>R$ {lead.value.toLocaleString("pt-BR")}</div>
                    <div className="text-xs pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      <span>{lead.responsible}</span>
                      <span>{lead.lastContact.split("/")[0]}/{lead.lastContact.split("/")[1]}</span>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="rounded-lg p-3 text-center text-xs" style={{ color: "var(--muted-foreground)", border: "1px dashed var(--border)" }}>
                    Sem leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selected.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{selected.company}</p>
              </div>
              <div className="flex items-center gap-1">
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
                <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Tem certeza que quer excluir esse lead? Essa ação não pode ser desfeita.</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                  <button onClick={handleDeleteLead} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                    {deleting && <Loader2 size={11} className="animate-spin" />}
                    Excluir
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "none" }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Telefone", selected.phone],
                  ["Email", selected.email],
                  ["Origem", selected.origin],
                  ["Interesse", selected.interest],
                  ["Valor estimado", `R$ ${selected.value.toLocaleString("pt-BR")}`],
                  ["Responsável", selected.responsible],
                  ["Último contato", selected.lastContact],
                  ["Próxima ação", selected.nextAction],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{(v as string) || "—"}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <div className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>O que o cliente precisa</div>
                  <div className="text-sm" style={{ color: "var(--foreground)" }}>{selected.description}</div>
                </div>
              )}
              <div>
                <div className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Etapa no funil</div>
                <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {stages.filter(s => s.id !== "lost").map((s, i) => {
                    const stageIds = stages.map(s => s.id);
                    const currentIdx = stageIds.indexOf(selected.stage);
                    const thisIdx = stageIds.indexOf(s.id);
                    const active = selected.stage === s.id;
                    const passed = thisIdx < currentIdx;
                    return (
                      <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                        <div className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0" style={{ background: active ? s.color : passed ? `${s.color}30` : "var(--muted)", color: active ? "white" : passed ? s.color : "var(--muted-foreground)" }}>
                          {s.label}
                        </div>
                        {i < 5 && <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Histórico</div>
                <div className="flex gap-2 mb-4">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
                    placeholder="Registrar contato, observação..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="px-3 rounded-lg flex items-center justify-center disabled:opacity-50"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {addingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
                {activitiesLoading && (
                  <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                    <Loader2 size={12} className="animate-spin" /> Carregando histórico...
                  </div>
                )}
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--primary)" }} />
                      <div className="flex-1">
                        <div className="text-xs" style={{ color: "var(--foreground)" }}>{a.note}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          {a.author_name ? `${a.author_name} · ` : ""}{new Date(a.created_at).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!activitiesLoading && activities.length === 0 && (
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum registro ainda.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <a
                href={selected.phone ? `tel:${selected.phone.replace(/\D/g, "")}` : undefined}
                aria-disabled={!selected.phone}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium"
                style={{ borderColor: "var(--border)", color: selected.phone ? "var(--foreground)" : "var(--muted-foreground)", opacity: selected.phone ? 1 : 0.5, pointerEvents: selected.phone ? "auto" : "none" }}
              >
                <Phone size={13} />Ligar
              </a>
              <a
                href={selected.email ? `mailto:${selected.email}` : undefined}
                aria-disabled={!selected.email}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium"
                style={{ borderColor: "var(--border)", color: selected.email ? "var(--foreground)" : "var(--muted-foreground)", opacity: selected.email ? 1 : 0.5, pointerEvents: selected.email ? "auto" : "none" }}
              >
                <Mail size={13} />Email
              </a>
              <button
                onClick={handleAdvanceStage}
                disabled={advancing || selected.stage === "won" || selected.stage === "lost"}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {advancing && <Loader2 size={13} className="animate-spin" />}
                Avançar etapa
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Lead" : "Cadastrar Lead"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {[
                ["Nome", "text", "Nome completo", "name"],
                ["Empresa", "text", "Empresa", "company"],
                ["Telefone", "tel", "(11) 9...", "phone"],
                ["Email", "email", "email@...", "email"],
                ["Origem", "text", "LinkedIn, Site...", "origin"],
                ["Interesse", "text", "Tipo de serviço", "interest"],
                ["Próxima ação", "text", "Ex: Ligar amanhã", "next_action"],
              ].map(([l, t, ph, key]) => (
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Valor estimado (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>O que o cliente precisa</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a necessidade do cliente..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSaveLead}
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
