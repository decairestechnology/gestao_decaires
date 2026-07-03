import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

type ViewMode = "mensal" | "semanal" | "diário" | "lista";

const eventTypes = ["Reunião", "Prazo", "Lembrete", "Tarefa", "Apresentação", "Evento", "Contato com cliente"];
const typeColors: Record<string, string> = {
  Reunião: "#06B6D4", Prazo: "#EF4444", Lembrete: "#F59E0B", Tarefa: "#7C3AED",
  Apresentação: "#7C3AED", Evento: "#10B981", "Contato com cliente": "#06B6D4",
};

const events = [
  { id: 1, title: "Reunião de alinhamento – Alpha", date: "2026-06-10", time: "09:00", end: "10:00", location: "Google Meet", participants: ["Daniel", "Marcos", "Julia"], project: "Projeto Alpha", responsible: "Daniel", status: "Confirmado", type: "Reunião" },
  { id: 2, title: "Entrega de proposta – Innovate", date: "2026-06-10", time: "14:00", end: "14:30", location: "Online", participants: ["Daniel"], project: "—", responsible: "Daniel", status: "Pendente", type: "Prazo" },
  { id: 3, title: "Sprint Review – Beta", date: "2026-06-11", time: "10:00", end: "11:30", location: "Zoom", participants: ["Julia", "Rafael", "Carlos"], project: "App Mobile Nexus", responsible: "Julia", status: "Confirmado", type: "Reunião" },
  { id: 4, title: "Apresentação cliente Nexus", date: "2026-06-12", time: "15:30", end: "16:30", location: "Escritório cliente", participants: ["Daniel", "Marcos"], project: "App Mobile Nexus", responsible: "Daniel", status: "Confirmado", type: "Apresentação" },
  { id: 5, title: "Reunião financeira mensal", date: "2026-06-15", time: "09:00", end: "10:00", location: "Sala de reuniões", participants: ["Daniel", "Fernanda"], project: "—", responsible: "Daniel", status: "Confirmado", type: "Reunião" },
  { id: 6, title: "Deadline – Módulo de pagamentos", date: "2026-06-16", time: "17:00", end: "17:00", location: "—", participants: ["Rafael"], project: "E-commerce Premium", responsible: "Rafael", status: "Pendente", type: "Prazo" },
  { id: 7, title: "Lembrete – Renovar certificado SSL", date: "2026-06-18", time: "08:00", end: "08:15", location: "—", participants: ["Carlos"], project: "Portal Gov", responsible: "Carlos", status: "Pendente", type: "Lembrete" },
  { id: 8, title: "Ligar para lead Maria Fernandes", date: "2026-06-13", time: "11:00", end: "11:30", location: "Telefone", participants: ["Julia"], project: "—", responsible: "Julia", status: "Pendente", type: "Contato com cliente" },
];

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function CalendarGrid({ year, month, events, onSelect }: { year: number; month: number; events: typeof events; onSelect: (e: typeof events[0]) => void }) {
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

export function Agenda() {
  const [view, setView] = useState<ViewMode>("mensal");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // June
  const [selected, setSelected] = useState<typeof events[0] | null>(null);
  const [showModal, setShowModal] = useState(false);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-muted" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronLeft size={14} /></button>
          <span className="text-sm font-bold min-w-[140px] text-center" style={{ color: "var(--foreground)" }}>{months[month]} {year}</span>
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
        <button onClick={() => setShowModal(true)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Novo evento
        </button>
      </div>

      {view === "mensal" && (
        <div className="rounded-xl border shadow-sm p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <CalendarGrid year={year} month={month} events={events} onSelect={setSelected} />
        </div>
      )}

      {view === "lista" && (
        <div className="space-y-3">
          {events.sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
            <div key={e.id} onClick={() => setSelected(e)}
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

      {(view === "semanal" || view === "diário") && (
        <div className="rounded-xl border p-8 flex items-center justify-center" style={{ background: "var(--card)", borderColor: "var(--border)", minHeight: 400 }}>
          <div className="text-center">
            <div className="text-4xl mb-3">📅</div>
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Visualização {view} disponível em breve</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Use a visualização em lista ou mensal por enquanto</div>
          </div>
        </div>
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
              <button onClick={() => setSelected(null)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                ["Data", new Date(selected.date + "T00:00:00").toLocaleDateString("pt-BR")],
                ["Horário", `${selected.time} – ${selected.end}`],
                ["Local", selected.location],
                ["Projeto", selected.project],
                ["Responsável", selected.responsible],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                </div>
              ))}
              <div className="col-span-2 rounded-lg p-3" style={{ background: "var(--muted)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Participantes</div>
                <div className="flex gap-2 flex-wrap">
                  {selected.participants.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Novo Evento</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Título", "text", "Nome do evento"], ["Data", "date", ""], ["Horário", "time", ""], ["Local / Link", "text", "Sala, Google Meet..."]].map(([l, t, ph]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input type={t as string} placeholder={ph as string} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Tipo de evento</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  {eventTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Criar evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
