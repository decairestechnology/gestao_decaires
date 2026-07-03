import { Download, FileSpreadsheet, BarChart3, Users, TrendingUp, FolderKanban, Target, FileText, Globe } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const monthlyRevenue = [
  { month: "Jan", receita: 18500, despesa: 11200, lucro: 7300 },
  { month: "Fev", receita: 22000, despesa: 13500, lucro: 8500 },
  { month: "Mar", receita: 19800, despesa: 12000, lucro: 7800 },
  { month: "Abr", receita: 28500, despesa: 14200, lucro: 14300 },
  { month: "Mai", receita: 32000, despesa: 15800, lucro: 16200 },
  { month: "Jun", receita: 27500, despesa: 13000, lucro: 14500 },
];

const leadConversion = [
  { stage: "Leads", value: 48 },
  { stage: "Contato", value: 32 },
  { stage: "Qualif.", value: 21 },
  { stage: "Proposta", value: 14 },
  { stage: "Fechados", value: 5 },
];

const projectsByStatus = [
  { name: "Em andamento", value: 8 },
  { name: "Concluído", value: 12 },
  { name: "Planejamento", value: 3 },
  { name: "Atrasado", value: 2 },
  { name: "Pausado", value: 1 },
];
const statusChartColors = ["#06B6D4", "#10B981", "#7C3AED", "#EF4444", "#F59E0B"];

const contentByPlatform = [
  { platform: "Instagram", publicados: 24, planejados: 8 },
  { platform: "LinkedIn", publicados: 18, planejados: 6 },
  { platform: "YouTube", publicados: 12, planejados: 4 },
  { platform: "E-mail", publicados: 8, planejados: 2 },
];

const reportCards = [
  { label: "Projetos", icon: FolderKanban, color: "#06B6D4", stats: [["Total", "26"], ["Concluídos", "12"], ["Atrasados", "2"]] },
  { label: "Leads e Vendas", icon: Users, color: "#7C3AED", stats: [["Leads totais", "48"], ["Convertidos", "5"], ["Taxa", "10.4%"]] },
  { label: "Financeiro", icon: TrendingUp, color: "#10B981", stats: [["Receita total", "R$ 148k"], ["Despesas", "R$ 79.7k"], ["Lucro", "R$ 68.3k"]] },
  { label: "Metas", icon: Target, color: "#F59E0B", stats: [["Total", "6"], ["Em andamento", "6"], ["Progresso médio", "58%"]] },
  { label: "Conteúdo", icon: FileText, color: "#EF4444", stats: [["Publicados", "62"], ["Engajamento", "+24%"], ["Alcance", "18.5k"]] },
  { label: "Plataformas", icon: Globe, color: "#8B5CF6", stats: [["Ativas", "4"], ["Usuários", "554"], ["MRR", "R$ 13.5k"]] },
];

export function Reports() {
  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select className="text-sm px-3 py-2 rounded-lg border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          <option>Este semestre</option>
          <option>Este trimestre</option>
          <option>Este mês</option>
          <option>Este ano</option>
        </select>
        <select className="text-sm px-3 py-2 rounded-lg border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          <option>Todos os setores</option>
          <option>Comercial</option>
          <option>Financeiro</option>
          <option>Desenvolvimento</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border font-medium transition-colors hover:bg-muted" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            <FileSpreadsheet size={14} />Excel
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Download size={14} />PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {reportCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15` }}>
                  <Icon size={13} style={{ color: card.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{card.label}</span>
              </div>
              <div className="space-y-1.5">
                {card.stats.map(([k, v], j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k}</span>
                    <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Revenue */}
        <div className="rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Desempenho Financeiro Mensal</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="grR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="receita" stroke="#06B6D4" strokeWidth={2} fill="url(#grR)" name="Receita" />
              <Area type="monotone" dataKey="lucro" stroke="#10B981" strokeWidth={2} fill="url(#grL)" name="Lucro" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead conversion */}
        <div className="rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Conversão de Leads por Etapa</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadConversion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#06B6D4" radius={[0, 4, 4, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projects by status */}
        <div className="rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Projetos por Status</div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {projectsByStatus.map((_, i) => <Cell key={i} fill={statusChartColors[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {projectsByStatus.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: statusChartColors[i] }} />{s.name}</span>
                  <span className="font-bold" style={{ color: "var(--foreground)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content by platform */}
        <div className="rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Conteúdo por Plataforma</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contentByPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="publicados" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Publicados" />
              <Bar dataKey="planejados" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Planejados" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
