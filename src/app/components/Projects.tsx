import { useState, useEffect, useCallback } from "react";
import { Search, Plus, LayoutGrid, List, Columns3, X, ArrowRight, Clock, CheckSquare, User, Calendar, ChevronDown, Filter, Loader2 } from "lucide-react";
import { projectsApi, type Project as ApiProject } from "../../lib/api";

type ViewMode = "cards" | "list" | "kanban";

const statusMeta: Record<string, { bg: string; text: string; dot: string }> = {
  "Em andamento": { bg: "#E0F9FF", text: "#0E7490", dot: "#06B6D4" },
  Planejamento: { bg: "#F5F3FF", text: "#6D28D9", dot: "#7C3AED" },
  "Em revisão": { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  Concluído: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  Pausado: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  Atrasado: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
};

const priorityColors: Record<string, string> = { Alta: "#EF4444", Média: "#F59E0B", Baixa: "#10B981" };

interface UiProject {
  id: number;
  name: string;
  client: string;
  desc: string;
  responsible: string;
  team: string[];
  start: string;
  deadline: string;
  progress: number;
  status: string;
  priority: string;
  tasks: { done: number; total: number };
  delayed: boolean;
}

function toUiProject(p: ApiProject): UiProject {
  return {
    id: p.id,
    name: p.name,
    client: p.client ?? "",
    desc: p.description ?? "",
    responsible: p.responsible_name ?? "",
    team: p.responsible_name ? [p.responsible_name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()] : [],
    start: p.start_date ? new Date(p.start_date).toLocaleDateString("pt-BR") : "—",
    deadline: p.deadline ? new Date(p.deadline).toLocaleDateString("pt-BR") : "—",
    progress: p.progress ?? 0,
    status: p.status,
    priority: p.priority,
    tasks: { done: p.tasks_done ?? 0, total: p.tasks_total ?? 0 },
    delayed: p.status === "Atrasado",
  };
}

const kanbanStatuses = ["Planejamento", "Em andamento", "Em revisão", "Concluído", "Atrasado"];

const avatarColors = ["#06B6D4", "#7C3AED", "#10B981", "#F59E0B"];

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: meta.bg, color: meta.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
      {status}
    </span>
  );
}

interface ProjectDetailProps {
  project: UiProject;
  onClose: () => void;
}

function ProjectDetail({ project, onClose }: ProjectDetailProps) {
  const [tab, setTab] = useState("visão geral");
  const innerTabs = ["visão geral", "tarefas", "equipe", "arquivos", "financeiro", "comentários"];
  const pct = project.progress;
  const progressColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#06B6D4" : pct >= 25 ? "#F59E0B" : "#EF4444";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--card)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-0 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge status={project.status} />
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${priorityColors[project.priority]}15`, color: priorityColors[project.priority] }}
                >
                  {project.priority}
                </span>
              </div>
              <h3 className="font-extrabold text-lg leading-tight" style={{ color: "var(--foreground)" }}>{project.name}</h3>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Cliente: {project.client}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-muted flex-shrink-0 ml-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar in header */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "var(--muted-foreground)" }}>{project.tasks.done}/{project.tasks.total} tarefas</span>
              <span className="font-bold" style={{ color: progressColor }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: progressColor }} />
            </div>
          </div>

          {/* Inner tabs */}
          <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {innerTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px flex-shrink-0"
                style={{
                  borderColor: tab === t ? "var(--primary)" : "transparent",
                  color: tab === t ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
          {tab === "visão geral" && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{project.desc}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["Responsável", project.responsible],
                  ["Cliente", project.client],
                  ["Início", project.start],
                  ["Prazo", project.deadline],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {project.team.map((m, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {m}
                  </div>
                ))}
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Equipe do projeto</span>
              </div>
            </div>
          )}

          {tab === "tarefas" && (
            <div className="space-y-2">
              {[
                "Definir arquitetura do sistema",
                "Criar mockups e protótipo de UI",
                "Configurar pipeline de CI/CD",
                "Desenvolver módulo de autenticação",
                "Integrar APIs externas",
                "Implementar testes automatizados",
                "Realizar testes de carga",
                "Deploy em ambiente de produção",
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted"
                  style={{ borderColor: "var(--border)" }}
                >
                  <input
                    type="checkbox"
                    defaultChecked={i < Math.floor(project.tasks.done / 6)}
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{t}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: "#FEF2F2", color: "#EF4444" }}
                  >
                    Alta
                  </span>
                </div>
              ))}
            </div>
          )}

          {!["visão geral", "tarefas"].includes(tab) && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-4">📂</div>
              <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nenhum conteúdo em {tab}</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Adicione itens para vê-los aqui.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const emptyForm = { name: "", client: "", deadline: "", priority: "Média", description: "" };

export function Projects() {
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<UiProject | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projects, setProjects] = useState<UiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list();
      setProjects(data.map(toUiProject));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar os projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreateProject() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await projectsApi.create(form);
      setForm(emptyForm);
      setShowNewProject(false);
      await loadProjects();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível criar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = projects.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(s) || p.client.toLowerCase().includes(s)) &&
      (statusFilter === "Todos" || p.status === statusFilter)
    );
  });

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 text-sm flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={14} className="animate-spin" /> Carregando projetos...
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className="w-full pl-8 pr-4 py-2 rounded-xl text-sm outline-none border transition-all"
            style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm pl-3 pr-8 py-2 rounded-xl border outline-none appearance-none cursor-pointer"
            style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}
          >
            <option value="Todos">Todos os status</option>
            {Object.keys(statusMeta).map((s) => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
        </div>

        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          {([["cards", LayoutGrid], ["list", List], ["kanban", Columns3]] as [ViewMode, any][]).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: view === v ? "var(--primary)" : "transparent",
                color: view === v ? "white" : "var(--muted-foreground)",
              }}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)", color: "white" }}
        >
          <Plus size={14} />
          <span>Novo projeto</span>
        </button>
      </div>

      {/* Summary row */}
      <div className="flex gap-3 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {Object.entries(statusMeta).map(([status, meta]) => {
          const count = projects.filter(p => p.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "Todos" : status)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-shrink-0 transition-all text-xs font-bold"
              style={{
                background: statusFilter === status ? meta.bg : "var(--card)",
                borderColor: statusFilter === status ? meta.dot : "var(--border)",
                color: statusFilter === status ? meta.text : "var(--muted-foreground)",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: meta.dot }} />
              {status}
              <span className="ml-1 font-extrabold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Cards view */}
      {view === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const meta = statusMeta[p.status] ?? statusMeta["Planejamento"];
            const progressColor = p.delayed ? "#EF4444" : "var(--primary)";
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className="rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group"
                style={{
                  background: "var(--card)",
                  borderColor: p.delayed ? "#EF444430" : "var(--border)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-extrabold text-sm truncate" style={{ color: "var(--foreground)" }}>{p.name}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>{p.client}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{p.desc}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <User size={11} />
                    <span>{p.responsible.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: p.delayed ? "#EF4444" : "var(--muted-foreground)" }}>
                    <Calendar size={11} />
                    <span>{p.deadline}</span>
                    {p.delayed && <span className="font-bold" style={{ color: "#EF4444" }}>· Atrasado</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <CheckSquare size={11} />
                    <span>{p.tasks.done}/{p.tasks.total}</span>
                  </div>
                  <span className="text-xs font-extrabold" style={{ color: progressColor }}>{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--muted)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, background: progressColor }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {p.team.map((m, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold border-2"
                        style={{ background: avatarColors[i % avatarColors.length], borderColor: "var(--card)", marginLeft: i > 0 ? -6 : 0 }}
                      >
                        {m[0]}
                      </div>
                    ))}
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: priorityColors[p.priority] }}
                  >
                    {p.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  {["Projeto", "Status", "Prioridade", "Responsável", "Prazo", "Progresso", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.client}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: priorityColors[p.priority] }}>{p.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.responsible}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: p.delayed ? "#EF4444" : "var(--muted-foreground)" }}>
                      {p.delayed && <Clock size={11} className="inline mr-1" />}{p.deadline}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.delayed ? "#EF4444" : "var(--primary)" }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ArrowRight size={14} style={{ color: "var(--muted-foreground)" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {kanbanStatuses.map((status) => {
            const meta = statusMeta[status] ?? statusMeta["Planejamento"];
            const cols = filtered.filter((p) => p.status === status);
            return (
              <div
                key={status}
                className="flex-shrink-0 w-60 rounded-2xl p-3 flex flex-col"
                style={{ background: "var(--muted)", minHeight: 400 }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-extrabold" style={{ color: meta.text }}>{status}</span>
                  <span
                    className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                    style={{ background: meta.bg, color: meta.text, fontSize: 10 }}
                  >
                    {cols.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  {cols.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="rounded-xl p-3 border cursor-pointer shadow-sm hover:shadow-md transition-all"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <div className="font-bold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>{p.name}</div>
                      <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{p.client}</div>
                      <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: meta.dot }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.progress}%</span>
                        <span className="text-xs font-bold" style={{ color: priorityColors[p.priority] }}>{p.priority}</span>
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <div
                      className="rounded-xl p-4 text-center text-xs border-2 border-dashed mt-2"
                      style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
                    >
                      Sem projetos
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <ProjectDetail project={selected} onClose={() => setSelected(null)} />}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-extrabold" style={{ color: "var(--foreground)" }}>Novo Projeto</h3>
              <button onClick={() => setShowNewProject(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[["Nome do projeto", "text", "Ex: App Mobile X", "name"], ["Cliente", "text", "Nome do cliente", "client"], ["Prazo", "date", "", "deadline"]].map(([l, t, ph, key]) => (
                  <div key={l as string}>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                    <input
                      type={t as string}
                      placeholder={ph as string}
                      value={(form as any)[key as string]}
                      onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                      style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none appearance-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Descreva o projeto..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowNewProject(false); setForm(emptyForm); }}
                className="flex-1 py-2.5 rounded-xl text-sm border font-bold"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProject}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)", color: "white" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Criar projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
