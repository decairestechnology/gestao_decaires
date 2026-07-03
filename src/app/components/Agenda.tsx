import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { eventsApi, projectsApi, type AgendaEvent as ApiEvent, type Project } from "../../lib/api";

type ViewMode = "mensal" | "semanal" | "diário" | "lista";

const eventTypes = ["Reunião", "Prazo", "Lembrete", "Tarefa", "Apresentação", "Evento", "Contato com cliente"];
const typeColors: Record<string, string> = {
  Reunião: "#06B6D4", Prazo: "#EF4444", Lembrete: "#F59E0B", Tarefa: "#7C3AED",
  Apresentação: "#7C3AED", Evento: "#10B981", "Contato com cliente": "#06B6D4",
};

interface UiEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  end: string;
  location: string;
  description: string;
  participants: string[];
  project: string;
  projectId: number | null;
  responsible: string;
  status: string;
  type: string;
}

function toUiEvent(e: ApiEvent): UiEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.date ? e.date.slice(0, 10) : "", // normaliza, a API pode devolver com ou sem horário junto
    time: e.start_time ? e.start_time.slice(0, 5) : "—",
    end: e.end_time ? e.end_time.slice(0, 5) : "—",
    location: e.location ?? "—",
    description: e.description ?? "",
    participants: e.responsible_name ? [e.responsible_name] : [],
    project: "—",
    projectId: e.project_id,
    responsible: e.responsible_name ?? "—",
    status: e.status,
    type: e.type ?? "Evento",
  };
}

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function CalendarGrid({ year, month, events, onSelect }: { year: number; month: number; events: UiEvent[]; onSelect: (e: UiEvent) => void }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {days.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "var(--muted-foreground)" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayEvents = day ? events.filter((e) => e.date === dateStr) : [];
          return (
            <div key={i} className="min-h-[80px] rounded-lg p-1 border transition-colors" style={{ borderColor: isToday ? "var(--primary)" : "var(--border)", background: isToday ? "var(--accent)" : day ? "var(--card)" : "transparent", borderWidth: isToday ? 1.5 : 1 }}>
              {day && (
                <>
                  <div className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1`} style={{ color: isToday ? "var(--primary)" : "var(--foreground)" }}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div key={e.id} onClick={() => onSelect(e)}
                        className="truncate text-xs px-1 py-0.5 rounded cursor-pointer font-medium"
                        style={{ background: `${typeColors[e.type]}20`, color: typeColors[e.type] }}>
                        {e.time} {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs px-1" style={{ color: "var(--muted-foreground)" }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function fmtLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function WeekView({ referenceDate, events, onSelect }: { referenceDate: Date; events: UiEvent[]; onSelect: (e: UiEvent) => void }) {
  const start = startOfWeek(referenceDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((d, i) => {
        const dateStr = fmtLocalDate(d);
        const isToday = fmtLocalDate(today) === dateStr;
        const dayEvents = events.filter((e) => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
        return (
          <div key={i} className="rounded-xl border p-2 flex flex-col" style={{ minHeight: 320, borderColor: isToday ? "var(--primary)" : "var(--border)", background: isToday ? "var(--accent)" : "var(--card)", borderWidth: isToday ? 1.5 : 1 }}>
            <div className="text-center mb-2">
              <div className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{days[d.getDay()]}</div>
              <div className="text-sm font-bold" style={{ color: isToday ? "var(--primary)" : "var(--foreground)" }}>{d.getDate()}</div>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {dayEvents.map((e) => (
                <div key={e.id} onClick={() => onSelect(e)}
                  className="text-xs px-1.5 py-1 rounded cursor-pointer font-medium truncate"
                  style={{ background: `${typeColors[e.type]}20`, color: typeColors[e.type] }}>
                  {e.time !== "—" && `${e.time} `}{e.title}
                </div>
              ))}
              {dayEvents.length === 0 && <div className="text-xs text-center pt-4" style={{ color: "var(--muted-foreground)" }}>—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ referenceDate, events, onSelect }: { referenceDate: Date; events: UiEvent[]; onSelect: (e: UiEvent) => void }) {
  const dateStr = fmtLocalDate(referenceDate);
  const dayEvents = events.filter((e) => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-2">
      <div className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>
        {days[referenceDate.getDay()]}, {referenceDate.getDate()} de {months[referenceDate.getMonth()]}
      </div>
      {dayEvents.length === 0 && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum evento nesse dia.</div>
      )}
      {dayEvents.map((e) => (
        <div key={e.id} onClick={() => onSelect(e)}
          className="rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: typeColors[e.type] }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{e.title}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {e.time}{e.end !== "—" ? `–${e.end}` : ""} · {e.location}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: `${typeColors[e.type]}20`, color: typeColors[e.type] }}>{e.type}</span>
        </div>
      ))}
    </div>
  );
}

const emptyForm = { title: "", date: "", start_time: "", location: "", description: "", type: "Reunião", project_id: "" };

export function Agenda() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("mensal");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [referenceDate, setReferenceDate] = useState(today);
  const [selected, setSelected] = useState<UiEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.list();
      setEvents(data.map(toUiEvent));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    projectsApi.list().then(setProjects).catch(() => {});
  }, [loadEvents]);

  function projectName(id: number | null) {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  }

  async function handleSaveEvent() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const payload = { ...form, project_id: form.project_id ? Number(form.project_id) : null };
      if (editingId) {
        const updated = await eventsApi.update(editingId, payload as any);
        if (selected?.id === editingId) setSelected(toUiEvent(updated));
      } else {
        await eventsApi.create(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar o evento.");
    } finally {
      setSaving(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(e: UiEvent) {
    setEditingId(e.id);
    setForm({
      title: e.title,
      date: e.date,
      start_time: e.time === "—" ? "" : e.time,
      location: e.location === "—" ? "" : e.location,
      description: e.description,
      type: e.type,
      project_id: e.projectId ? String(e.projectId) : "",
    });
    setShowModal(true);
  }

  async function handleDeleteEvent() {
    if (!selected) return;
    setDeleting(true);
    try {
      await eventsApi.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o evento.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmStatus() {
    if (!selected) return;
    setConfirmingStatus(true);
    try {
      const updated = await eventsApi.setStatus(selected.id, "Confirmado");
      setSelected(toUiEvent(updated));
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível confirmar o evento.");
    } finally {
      setConfirmingStatus(false);
    }
  }

  function openEvent(e: UiEvent) {
    setSelected(e);
    setConfirmDelete(false);
  }

  const prevMonth = () => {
    if (view === "semanal") { const d = new Date(referenceDate); d.setDate(d.getDate() - 7); setReferenceDate(d); return; }
    if (view === "diário") { const d = new Date(referenceDate); d.setDate(d.getDate() - 1); setReferenceDate(d); return; }
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (view === "semanal") { const d = new Date(referenceDate); d.setDate(d.getDate() + 7); setReferenceDate(d); return; }
    if (view === "diário") { const d = new Date(referenceDate); d.setDate(d.getDate() + 1); setReferenceDate(d); return; }
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const headerLabel = view === "diário"
    ? `${referenceDate.getDate()} de ${months[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`
    : view === "semanal"
    ? `Semana de ${startOfWeek(referenceDate).getDate()} de ${months[startOfWeek(referenceDate).getMonth()]}`
    : `${months[month]} ${year}`;

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-muted" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronLeft size={14} /></button>
          <span className="text-sm font-bold min-w-[140px] text-center" style={{ color: "var(--foreground)" }}>{headerLabel}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-muted" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronRight size={14} /></button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          {(["mensal", "semanal", "diário", "lista"] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors"
              style={{ background: view === v ? "var(--primary)" : "transparent", color: view === v ? "white" : "var(--muted-foreground)" }}>
              {v}
            </button>
          ))}
        </div>
        <button onClick={openCreateModal} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Novo evento
        </button>
      </div>

      {view === "mensal" && (
        <div className="rounded-xl border shadow-sm p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <CalendarGrid year={year} month={month} events={events} onSelect={openEvent} />
        </div>
      )}

      {view === "lista" && (
        <div className="space-y-3">
          {events.sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
            <div key={e.id} onClick={() => openEvent(e)}
              className="rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: typeColors[e.type] }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{e.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(e.date + "T00:00:00").toLocaleDateString("pt-BR")} · {e.time}–{e.end} · {e.location}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: `${typeColors[e.type]}20`, color: typeColors[e.type] }}>{e.type}</span>
            </div>
          ))}
        </div>
      )}

      {view === "semanal" && (
        <WeekView referenceDate={referenceDate} events={events} onSelect={openEvent} />
      )}

      {view === "diário" && (
        <DayView referenceDate={referenceDate} events={events} onSelect={openEvent} />
      )}

      {/* Event Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${typeColors[selected.type]}20`, color: typeColors[selected.type] }}>{selected.type}</span>
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
                <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir esse evento?</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                  <button onClick={handleDeleteEvent} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                    {deleting && <Loader2 size={11} className="animate-spin" />}
                    Excluir
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                ["Data", new Date(selected.date + "T00:00:00").toLocaleDateString("pt-BR")],
                ["Horário", `${selected.time} – ${selected.end}`],
                ["Local", selected.location],
                ["Projeto", projectName(selected.projectId)],
                ["Responsável", selected.responsible],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                </div>
              ))}
              {selected.description && (
                <div className="col-span-2 rounded-lg p-3" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Descrição</div>
                  <div className="text-sm" style={{ color: "var(--foreground)" }}>{selected.description}</div>
                </div>
              )}
              <div className="col-span-2 rounded-lg p-3" style={{ background: "var(--muted)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Participantes</div>
                <div className="flex gap-2 flex-wrap">
                  {selected.participants.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
            {selected.status !== "Confirmado" && (
              <div className="px-6 pb-6">
                <button
                  onClick={handleConfirmStatus}
                  disabled={confirmingStatus}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#ECFDF5", color: "#065F46" }}
                >
                  {confirmingStatus ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Marcar como confirmado
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Evento" : "Novo Evento"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Título", "text", "Nome do evento", "title"], ["Data", "date", "", "date"], ["Horário", "time", "", "start_time"], ["Local / Link", "text", "Sala, Google Meet...", "location"]].map(([l, t, ph, key]) => (
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
                  placeholder="Detalhes do evento..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Tipo de evento</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  {eventTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Projeto (opcional)</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  <option value="">Nenhum</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSaveEvent}
                disabled={saving || !form.title.trim() || !form.date}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : "Criar evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
