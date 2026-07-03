import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FolderKanban, AlertTriangle, Users, TrendingUp, TrendingDown,
  Wallet, Calendar, Target, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, Circle, Sparkles, ArrowRight, Loader2,
} from "lucide-react";
import type { Page } from "../App";
import { fetchDashboard } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";

// Gráficos de tendência (últimos 6 meses, funil, metas em barra) ainda são ilustrativos —
// viram consultas reais quando houver histórico suficiente acumulado no banco.
const revenueData = [
  { month: "Jan", receita: 18500, despesa: 11200 },
  { month: "Fev", receita: 22000, despesa: 13500 },
  { month: "Mar", receita: 19800, despesa: 12000 },
  { month: "Abr", receita: 28500, despesa: 14200 },
  { month: "Mai", receita: 32000, despesa: 15800 },
  { month: "Jun", receita: 27500, despesa: 13000 },
];

const goalsData = [
  { goal: "Receita R$200k", progress: 73, color: "#10B981" },
  { goal: "20 novos clientes", progress: 55, color: "#F59E0B" },
  { goal: "Lançar plataforma", progress: 88, color: "#10B981" },
  { goal: "Equipe 10 pessoas", progress: 33, color: "#EF4444" },
];

const recentActivity = [
  { text: "Projeto Alpha atualizado por Marcos", time: "5min", icon: FolderKanban, color: "#06B6D4" },
  { text: "Lead João Silva movido para Proposta", time: "18min", icon: Users, color: "#7C3AED" },
  { text: "Despesa R$1.200 registrada", time: "1h", icon: Wallet, color: "#EF4444" },
  { text: "Reunião com Innovate agendada", time: "2h", icon: Calendar, color: "#F59E0B" },
  { text: "Meta Q2 atingiu 73%", time: "3h", icon: Target, color: "#10B981" },
];

const pendingTasks = [
  { text: "Revisar proposta técnica Nexus", priority: "Alta", done: false },
  { text: "Enviar relatório mensal de custos", priority: "Média", done: false },
  { text: "Atualizar documentação do Alpha", priority: "Baixa", done: true },
  { text: "Configurar staging do Beta", priority: "Alta", done: false },
  { text: "Ligar para lead Maria Fernandes", priority: "Média", done: false },
];

const priorityColors: Record<string, string> = { Alta: "#EF4444", Média: "#F59E0B", Baixa: "#10B981" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl border text-xs" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--muted-foreground)" }}>{p.name}:</span>
          <span className="font-bold" style={{ color: "var(--foreground)" }}>
            {typeof p.value === "number" && p.value > 999
              ? `R$ ${p.value.toLocaleString("pt-BR")}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard();
      setData(result);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statusColorMap: Record<string, string> = {
    "Em andamento": "#06B6D4", Planejamento: "#7C3AED", Concluído: "#10B981", Atrasado: "#EF4444", Pausado: "#F59E0B", "Em revisão": "#F59E0B",
  };
  const stageLabels: Record<string, string> = { new: "Leads", contact: "Contato", qualify: "Qualificação", proposal: "Proposta", negotiation: "Negociação", won: "Fechados" };
  const stageOrder = ["new", "contact", "qualify", "proposal", "negotiation", "won"];

  const projectStatus = (data?.projectStatusRows ?? []).map((r: any) => ({ name: r.status, value: r.total, color: statusColorMap[r.status] ?? "#94A3B8" }));
  const funnelMap = new Map((data?.funnelRows ?? []).map((r: any) => [r.stage, r.total]));
  const funnelData = stageOrder.map((s) => ({ name: stageLabels[s], value: funnelMap.get(s) ?? 0 }));
  const funnelMax = Math.max(1, ...funnelData.map((f) => f.value));

  const kpiCards = data ? [
    { label: "Projetos ativos", value: String(data.projects.total), icon: FolderKanban, color: "#06B6D4", bg: "#E0F9FF", page: "projects" as Page },
    { label: "Projetos atrasados", value: String(data.projects.atrasados), icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2", page: "projects" as Page },
    { label: "Leads em negociação", value: String(data.leads.negociacao), icon: Users, color: "#7C3AED", bg: "#F5F3FF", page: "crm" as Page },
    { label: "Receita do mês", value: `R$${data.financial.receita.toLocaleString("pt-BR")}`, icon: TrendingUp, color: "#10B981", bg: "#ECFDF5", page: "financial" as Page },
    { label: "Despesas do mês", value: `R$${data.financial.despesa.toLocaleString("pt-BR")}`, icon: TrendingDown, color: "#EF4444", bg: "#FEF2F2", page: "financial" as Page },
    { label: "Saldo do mês", value: `R$${(data.financial.receita - data.financial.despesa).toLocaleString("pt-BR")}`, icon: Wallet, color: "#06B6D4", bg: "#E0F9FF", page: "financial" as Page },
    { label: "Compromissos (7 dias)", value: String(data.events.proxima_semana), icon: Calendar, color: "#F59E0B", bg: "#FFFBEB", page: "agenda" as Page },
    { label: "Metas em andamento", value: String(data.goals.em_andamento), icon: Target, color: "#7C3AED", bg: "#F5F3FF", page: "goals" as Page },
  ] : [];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "";
  const todayStr = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="p-4 md:p-6 space-y-5 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0E7490 0%, #7C3AED 100%)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="rgba(255,255,255,0.8)" />
            <span className="text-xs font-medium capitalize" style={{ color: "rgba(255,255,255,0.8)" }}>
              {todayStr}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Bom dia{displayName ? `, ${displayName}` : ""}! 👋</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
            {data ? (
              <>Você tem <strong style={{ color: "white" }}>{data.events.proxima_semana} compromissos</strong> nos próximos 7 dias e <strong style={{ color: "white" }}>{data.projects.atrasados} projetos</strong> precisam de atenção.</>
            ) : "Carregando seu resumo..."}
          </p>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" /> Carregando dashboard...
        </div>
      )}

      {data && (
      <>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={i}
              onClick={() => onNavigate(card.page)}
              className="text-left rounded-2xl p-4 border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium leading-tight" style={{ color: "var(--muted-foreground)" }}>
                  {card.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: card.bg }}
                >
                  <Icon size={15} style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-xl font-extrabold leading-none mb-2" style={{ color: "var(--foreground)" }}>
                {card.value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart — spans 2 cols */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5 shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Receitas vs Despesas</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Últimos 6 meses</div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#06B6D4" }} />
                <span style={{ color: "var(--muted-foreground)" }}>Receita</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#EF4444" }} />
                <span style={{ color: "var(--muted-foreground)" }}>Despesa</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="receita" stroke="#06B6D4" strokeWidth={2.5} fill="url(#gradR)" name="Receita" dot={false} activeDot={{ r: 4, fill: "#06B6D4", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2.5} fill="url(#gradD)" name="Despesa" dot={false} activeDot={{ r: 4, fill: "#EF4444", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Donut */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-bold text-sm mb-0.5" style={{ color: "var(--foreground)" }}>Status dos Projetos</div>
          <div className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{data.projects.total} projetos no total</div>
          <div className="flex items-center justify-center mb-3">
            <ResponsiveContainer width={160} height={140}>
              <PieChart>
                <Pie data={projectStatus} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {projectStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {projectStatus.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span style={{ color: "var(--muted-foreground)" }}>{s.name}</span>
                </span>
                <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales funnel */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>Funil de Vendas</div>
          <div className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Leads por etapa do funil</div>
          <div className="space-y-2">
            {funnelData.map((f, i) => {
              const pct = Math.round((f.value / funnelMax) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-xs w-20 flex-shrink-0 text-right font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {f.name}
                  </div>
                  <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-lg flex items-center justify-end pr-2.5 transition-all duration-500"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, #0E7490, #06B6D4)`, minWidth: 32 }}
                    >
                      <span className="text-xs font-bold text-white">{f.value}</span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold w-8 text-right flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals progress */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>Progresso das Metas</div>
          <div className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Metas do trimestre Q2</div>
          <div className="space-y-4">
            {goalsData.map((g, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{g.goal}</span>
                  <span className="text-xs font-bold" style={{ color: g.color }}>{g.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${g.progress}%`, background: g.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upcoming events */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Próximos Compromissos</div>
            <button onClick={() => onNavigate("agenda")} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--primary)" }}>
              Ver todos <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-3">
            {(data.upcomingEvents ?? []).map((e: any) => (
              <div key={e.id} className="flex items-start gap-3">
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ background: "#06B6D4", minHeight: 40 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{e.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(e.date + "T00:00:00").toLocaleDateString("pt-BR")} {e.start_time ? `· ${e.start_time.slice(0, 5)}` : ""}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: "#06B6D418", color: "#06B6D4" }}>
                      {e.type ?? "Evento"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(data.upcomingEvents ?? []).length === 0 && (
              <div className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>Nenhum compromisso próximo</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-bold text-sm mb-4" style={{ color: "var(--foreground)" }}>Atividades Recentes</div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${a.color}18` }}
                  >
                    <Icon size={13} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs leading-snug" style={{ color: "var(--foreground)" }}>{a.text}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>há {a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending tasks */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Tarefas Pendentes</div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#FEF2F2", color: "#EF4444" }}>
              {pendingTasks.filter(t => !t.done).length}
            </span>
          </div>
          <div className="space-y-2.5">
            {pendingTasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {t.done
                  ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                  : <Circle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--border)" }} />}
                <span
                  className="flex-1 text-xs leading-snug"
                  style={{
                    color: t.done ? "var(--muted-foreground)" : "var(--foreground)",
                    textDecoration: t.done ? "line-through" : "none",
                    opacity: t.done ? 0.6 : 1,
                  }}
                >
                  {t.text}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 font-bold"
                  style={{ background: `${priorityColors[t.priority]}15`, color: priorityColors[t.priority] }}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attention Projects */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Projetos que Precisam de Atenção</div>
          <button onClick={() => onNavigate("projects")} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--primary)" }}>
            Ver todos <ArrowRight size={11} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data.recentProjects ?? []).map((p: any) => {
            const color = statusColorMap[p.status] ?? "#94A3B8";
            return (
              <div
                key={p.id}
                className="rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md"
                style={{ borderColor: `${color}30`, background: `${color}06` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{p.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${color}18`, color }}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>Cliente: {p.client ?? "—"}</div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Progresso</span>
                  <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
          {(data.recentProjects ?? []).length === 0 && (
            <div className="text-xs text-center py-4 col-span-3" style={{ color: "var(--muted-foreground)" }}>Nenhum projeto cadastrado ainda</div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
