import { useState, useEffect, useCallback } from "react";
import { Download, FileSpreadsheet, BarChart3, Users, TrendingUp, FolderKanban, Target, FileText, Globe, Loader2 } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchDashboard, contentApi, platformsApi } from "../../lib/api";

// Tendência mensal ainda é ilustrativa — mesma lógica das outras telas: vira real
// quando houver histórico acumulado suficiente no banco.
const monthlyRevenue = [
  { month: "Jan", receita: 18500, despesa: 11200, lucro: 7300 },
  { month: "Fev", receita: 22000, despesa: 13500, lucro: 8500 },
  { month: "Mar", receita: 19800, despesa: 12000, lucro: 7800 },
  { month: "Abr", receita: 28500, despesa: 14200, lucro: 14300 },
  { month: "Mai", receita: 32000, despesa: 15800, lucro: 16200 },
  { month: "Jun", receita: 27500, despesa: 13000, lucro: 14500 },
];

const statusChartColors = ["#06B6D4", "#10B981", "#7C3AED", "#EF4444", "#F59E0B"];
const statusColorMap: Record<string, string> = {
  "Em andamento": "#06B6D4", Concluído: "#10B981", Planejamento: "#7C3AED", Atrasado: "#EF4444", Pausado: "#F59E0B", "Em revisão": "#F59E0B",
};
const stageLabels: Record<string, string> = { new: "Leads", contact: "Contato", qualify: "Qualif.", proposal: "Proposta", negotiation: "Negociação", won: "Fechados" };
const stageOrder = ["new", "contact", "qualify", "proposal", "negotiation", "won"];

export function Reports() {
  const [data, setData] = useState<any>(null);
  const [contentStats, setContentStats] = useState<{ platform: string; publicados: number; planejados: number }[]>([]);
  const [platformStats, setPlatformStats] = useState({ ativas: 0, usuarios: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, content, platforms] = await Promise.all([
        fetchDashboard(),
        contentApi.list(),
        platformsApi.list(),
      ]);
      setData(dash);

      const byPlatform = new Map<string, { publicados: number; planejados: number }>();
      for (const c of content) {
        const key = c.platform ?? "Outro";
        const entry = byPlatform.get(key) ?? { publicados: 0, planejados: 0 };
        if (c.status === "Publicado") entry.publicados++; else entry.planejados++;
        byPlatform.set(key, entry);
      }
      setContentStats(Array.from(byPlatform.entries()).map(([platform, v]) => ({ platform, ...v })));

      const ativas = platforms.filter((p: any) => p.status === "Produção" || p.status === "Manutenção").length;
      const usuarios = platforms.reduce((a: number, p: any) => a + (p.users_count ?? 0), 0);
      const mrr = platforms.reduce((a: number, p: any) => a + (Number(p.revenue) || 0), 0);
      setPlatformStats({ ativas, usuarios, mrr });
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projectsByStatus = (data?.projectStatusRows ?? []).map((r: any) => ({ name: r.status, value: r.total }));
  const funnelMap = new Map((data?.funnelRows ?? []).map((r: any) => [r.stage, r.total]));
  const leadConversion = stageOrder.map((s) => ({ stage: stageLabels[s], value: funnelMap.get(s) ?? 0 }));

  const reportCards = data ? [
    { label: "Projetos", icon: FolderKanban, color: "#06B6D4", stats: [["Total", String(data.projects.total)], ["Concluídos", String(data.projects.concluidos)], ["Atrasados", String(data.projects.atrasados)]] },
    { label: "Leads e Vendas", icon: Users, color: "#7C3AED", stats: [["Leads totais", String(data.leads.total)], ["Convertidos", String(data.leads.ganhos)], ["Em negociação", String(data.leads.negociacao)]] },
    { label: "Financeiro (mês)", icon: TrendingUp, color: "#10B981", stats: [["Receita", `R$ ${data.financial.receita.toLocaleString("pt-BR")}`], ["Despesas", `R$ ${data.financial.despesa.toLocaleString("pt-BR")}`], ["Saldo", `R$ ${(data.financial.receita - data.financial.despesa).toLocaleString("pt-BR")}`]] },
    { label: "Metas", icon: Target, color: "#F59E0B", stats: [["Total", String(data.goals.total)], ["Em andamento", String(data.goals.em_andamento)], ["", ""]] },
    { label: "Conteúdo", icon: FileText, color: "#EF4444", stats: [["Publicados", String(contentStats.reduce((a, c) => a + c.publicados, 0))], ["Planejados", String(contentStats.reduce((a, c) => a + c.planejados, 0))], ["", ""]] },
    { label: "Plataformas", icon: Globe, color: "#8B5CF6", stats: [["Ativas", String(platformStats.ativas)], ["Usuários", String(platformStats.usuarios)], ["MRR", `R$ ${platformStats.mrr.toLocaleString("pt-BR")}`]] },
  ] : [];

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      {loading && !data && (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" /> Carregando relatórios...
        </div>
      )}
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
                  {projectsByStatus.map((s: any, i: number) => <Cell key={i} fill={statusColorMap[s.name] ?? statusChartColors[i % statusChartColors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {projectsByStatus.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: statusColorMap[s.name] ?? statusChartColors[i % statusChartColors.length] }} />{s.name}</span>
                  <span className="font-bold" style={{ color: "var(--foreground)" }}>{s.value}</span>
                </div>
              ))}
              {projectsByStatus.length === 0 && (
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum projeto cadastrado</div>
              )}
            </div>
          </div>
        </div>

        {/* Content by platform */}
        <div className="rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Conteúdo por Plataforma</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contentStats}>
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
