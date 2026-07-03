import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Download, TrendingUp, TrendingDown, Wallet, AlertCircle, X, Loader2, Trash2, BarChart3, LineChart as LineChartIcon, CheckCircle2, Pencil } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { transactionsApi, type Transaction as ApiTransaction } from "../../lib/api";

const EXPENSE_COLORS = ["#7C3AED", "#06B6D4", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#94A3B8"];
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface UiTransaction {
  id: number;
  date: string;
  rawDate: string;
  desc: string;
  cat: string;
  project: string;
  type: string;
  value: number;
  payment: string;
  status: string;
  isRecurring: boolean;
  recurringSourceId: number | null;
}

function toUiTransaction(t: ApiTransaction): UiTransaction {
  return {
    id: t.id,
    date: t.date ? new Date(t.date).toLocaleDateString("pt-BR") : "—",
    rawDate: t.date,
    desc: t.description,
    cat: t.category ?? "—",
    project: t.client ?? "—",
    type: t.type,
    value: Number(t.value) || 0,
    payment: t.payment_method ?? "—",
    status: t.status,
    isRecurring: !!t.is_recurring,
    recurringSourceId: t.recurring_source_id,
  };
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Confirmado: { bg: "#ECFDF5", text: "#065F46" },
  Pendente: { bg: "#FFFBEB", text: "#B45309" },
  "A receber": { bg: "#EFF6FF", text: "#1D4ED8" },
};

function PieBreakdown({ title, data, emptyText }: { title: string; data: { name: string; value: number; color: string }[]; emptyText: string }) {
  return (
    <div className="rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>{title}</div>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: e.color }} /><span style={{ color: "var(--muted-foreground)" }}>{e.name}</span></span>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>{e.value}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-10 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
          {emptyText}
        </div>
      )}
    </div>
  );
}

const emptyForm = { description: "", value: "", category: "", date: "", payment_method: "Transferência", is_recurring: false };

export function Financial() {
  const [showModal, setShowModal] = useState<"receita" | "despesa" | null>(null);
  const [period, setPeriod] = useState("Este mês");
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.list();
      setTransactions(data.map(toUiTransaction));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar os lançamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleSaveTransaction() {
    if (!showModal || !form.description.trim() || !form.value) return;
    setSaving(true);
    try {
      if (editingId) {
        await transactionsApi.update(editingId, { ...form, type: showModal, value: Number(form.value) } as any);
      } else {
        await transactionsApi.create({ ...form, type: showModal, value: Number(form.value) });
      }
      setForm(emptyForm);
      setShowModal(null);
      setEditingId(null);
      await loadTransactions();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar o lançamento.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(t: UiTransaction) {
    setEditingId(t.id);
    setForm({
      description: t.desc,
      value: String(t.value),
      category: t.cat === "—" ? "" : t.cat,
      date: t.rawDate ? t.rawDate.slice(0, 10) : "",
      payment_method: t.payment === "—" ? "Transferência" : t.payment,
      is_recurring: t.isRecurring,
    });
    setShowModal(t.type as "receita" | "despesa");
  }

  // Modelos recorrentes: lançamentos marcados como "repete todo mês" que ainda
  // não têm uma cópia gerada pro mês atual. (calculado mais abaixo, depois de isThisMonth)

  async function handleGenerateRecurring() {
    setGeneratingRecurring(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      for (const tpl of pendingRecurringTemplates) {
        await transactionsApi.create({
          description: tpl.desc,
          value: tpl.value,
          category: tpl.cat === "—" ? "" : tpl.cat,
          date: today,
          payment_method: tpl.payment === "—" ? "Transferência" : tpl.payment,
          type: tpl.type,
          status: "Pendente",
          is_recurring: false,
          recurring_source_id: tpl.id,
        });
      }
      await loadTransactions();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível gerar os lançamentos recorrentes.");
    } finally {
      setGeneratingRecurring(false);
    }
  }

  async function handleConfirmTransaction(id: number) {
    setConfirmingId(id);
    try {
      await transactionsApi.setStatus(id, "Confirmado");
      await loadTransactions();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível confirmar o lançamento.");
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleDeleteTransaction(id: number) {
    setDeletingId(id);
    try {
      await transactionsApi.remove(id);
      setConfirmDeleteId(null);
      await loadTransactions();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o lançamento.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCsv() {
    const header = ["Data", "Descrição", "Categoria", "Projeto", "Tipo", "Valor", "Status"];
    const rows = visibleTransactions.map((t) => [
      t.date, t.desc, t.cat, t.project,
      t.type === "receita" ? "Receita" : "Despesa",
      t.value.toFixed(2).replace(".", ","),
      t.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Extrai ano/mês de forma segura, não importa se a data vem como "2026-07-02"
  // ou "2026-07-02T00:00:00.000Z" (formatos diferentes conforme a origem do dado).
  function yearMonth(rawDate: string): [number, number] | null {
    if (!rawDate) return null;
    const [y, m] = rawDate.slice(0, 10).split("-").map(Number);
    if (!y || !m) return null;
    return [y, m - 1]; // mês 0-indexado, igual ao Date do JS
  }

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; month: string; receita: number; despesa: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_LABELS[d.getMonth()], receita: 0, despesa: 0 });
    }
    for (const t of transactions) {
      const ym = yearMonth(t.rawDate);
      if (!ym) continue;
      const key = `${ym[0]}-${ym[1]}`;
      const bucket = months.find((m) => m.key === key);
      if (!bucket) continue;
      if (t.type === "receita") bucket.receita += t.value;
      else bucket.despesa += t.value;
    }
    return months;
  }, [transactions]);

  function categoryBreakdown(kind: "receita" | "despesa") {
    const byCategory = new Map<string, number>();
    let total = 0;
    for (const t of transactions) {
      if (t.type !== kind) continue;
      const cat = t.cat && t.cat !== "—" ? t.cat : "Outros";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + t.value);
      total += t.value;
    }
    if (total === 0) return [];
    return Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value: Math.round((value / total) * 100), color: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }));
  }

  const expenseTypes = useMemo(() => categoryBreakdown("despesa"), [transactions]);
  const revenueTypes = useMemo(() => categoryBreakdown("receita"), [transactions]);

  const now = new Date();
  const isThisMonth = (t: UiTransaction) => {
    const ym = yearMonth(t.rawDate);
    return !!ym && ym[0] === now.getFullYear() && ym[1] === now.getMonth();
  };
  const isInPeriod = (t: UiTransaction) => {
    const ym = yearMonth(t.rawDate);
    if (!ym) return false;
    const [y, m] = ym;
    const monthsAgo = (now.getFullYear() - y) * 12 + (now.getMonth() - m);
    if (period === "Este mês") return monthsAgo === 0;
    if (period === "Último mês") return monthsAgo === 1;
    if (period === "Este trimestre") return monthsAgo >= 0 && monthsAgo < 3;
    if (period === "Este ano") return y === now.getFullYear();
    return true;
  };
  const totalReceita = transactions.filter(t => t.type === "receita" && isThisMonth(t)).reduce((a, t) => a + t.value, 0);
  const totalDespesa = transactions.filter(t => t.type === "despesa" && isThisMonth(t)).reduce((a, t) => a + t.value, 0);
  const totalReceitaGeral = transactions.filter(t => t.type === "receita").reduce((a, t) => a + t.value, 0);
  const totalDespesaGeral = transactions.filter(t => t.type === "despesa").reduce((a, t) => a + t.value, 0);
  const saldo = totalReceitaGeral - totalDespesaGeral;
  const aReceber = transactions.filter(t => t.status === "A receber").reduce((a, t) => a + t.value, 0);
  const aPagar = transactions.filter(t => t.status === "Pendente").reduce((a, t) => a + t.value, 0);
  const visibleTransactions = transactions.filter(isInPeriod);

  const pendingRecurringTemplates = transactions.filter((t) => {
    if (!t.isRecurring || t.recurringSourceId) return false;
    const hasThisMonthCopy = transactions.some((x) => x.recurringSourceId === t.id && isThisMonth(x));
    return !hasThisMonthCopy;
  });

  // Vencimentos: lançamentos ainda não confirmados, vencidos ou vencendo nos próximos 7 dias.
  function daysUntil(rawDate: string): number | null {
    const ym = yearMonth(rawDate);
    if (!ym) return null;
    const due = new Date(rawDate.slice(0, 10) + "T00:00:00");
    const diffMs = due.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
  const dueSoonOrOverdue = transactions
    .filter((t) => t.status !== "Confirmado")
    .map((t) => ({ t, days: daysUntil(t.rawDate) }))
    .filter((x) => x.days !== null && x.days <= 7)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  const overdueIds = new Set(dueSoonOrOverdue.filter((x) => (x.days ?? 0) < 0).map((x) => x.t.id));

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {pendingRecurringTemplates.length > 0 && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#F5F3FF", color: "#6D28D9" }}>
          <span>Você tem {pendingRecurringTemplates.length} lançamento{pendingRecurringTemplates.length > 1 ? "s" : ""} recorrente{pendingRecurringTemplates.length > 1 ? "s" : ""} pra gerar esse mês.</span>
          <button
            onClick={handleGenerateRecurring}
            disabled={generatingRecurring}
            className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-60"
            style={{ background: "#7C3AED", color: "white" }}
          >
            {generatingRecurring && <Loader2 size={11} className="animate-spin" />}
            Gerar agora
          </button>
        </div>
      )}

      {dueSoonOrOverdue.length > 0 && (
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FFFBEB", color: "#92400E" }}>
          <div className="font-semibold mb-1">⚠️ {dueSoonOrOverdue.length} lançamento{dueSoonOrOverdue.length > 1 ? "s" : ""} vencido{dueSoonOrOverdue.length > 1 ? "s" : ""} ou vencendo em breve</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {dueSoonOrOverdue.slice(0, 6).map(({ t, days }) => (
              <span key={t.id}>
                {t.desc} — {days! < 0 ? `venceu há ${Math.abs(days!)}d` : days === 0 ? "vence hoje" : `vence em ${days}d`}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Este mês", "Último mês", "Este trimestre", "Este ano"].map(p => <option key={p}>{p}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={handleExportCsv} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border font-medium transition-colors hover:bg-muted" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            <Download size={14} />Exportar
          </button>
          <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowModal("despesa"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition hover:opacity-90"
            style={{ borderColor: "#EF4444", color: "#EF4444", background: "#FEF2F2" }}>
            <TrendingDown size={14} />Nova despesa
          </button>
          <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowModal("receita"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <TrendingUp size={14} />Nova receita
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Saldo atual", value: `R$ ${saldo.toLocaleString("pt-BR")}`, icon: Wallet, color: "#06B6D4", bg: "#E0F9FF" },
          { label: `Receitas (${MONTH_LABELS[new Date().getMonth()]})`, value: `R$ ${totalReceita.toLocaleString("pt-BR")}`, icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" },
          { label: `Despesas (${MONTH_LABELS[new Date().getMonth()]})`, value: `R$ ${totalDespesa.toLocaleString("pt-BR")}`, icon: TrendingDown, color: "#EF4444", bg: "#FEF2F2" },
          { label: "A receber", value: `R$ ${aReceber.toLocaleString("pt-BR")}`, icon: AlertCircle, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "A pagar", value: `R$ ${aPagar.toLocaleString("pt-BR")}`, icon: AlertCircle, color: "#F59E0B", bg: "#FFFBEB" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                  <Icon size={13} style={{ color: k.color }} />
                </div>
              </div>
              <div className="text-base font-bold" style={{ color: "var(--foreground)" }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 rounded-xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Fluxo de Caixa Mensal</div>
            <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setChartType("bar")}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                style={{ background: chartType === "bar" ? "var(--primary)" : "transparent", color: chartType === "bar" ? "white" : "var(--muted-foreground)" }}
                title="Gráfico de barras"
              >
                <BarChart3 size={12} />
              </button>
              <button
                onClick={() => setChartType("line")}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                style={{ background: chartType === "line" ? "var(--primary)" : "transparent", color: chartType === "line" ? "white" : "var(--muted-foreground)" }}
                title="Gráfico de linha"
              >
                <LineChartIcon size={12} />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {chartType === "bar" ? (
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="receita" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} name="Despesa" />
              </BarChart>
            ) : (
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="receita" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} name="Receita" />
                <Line type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Despesa" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        <PieBreakdown title="Distribuição Despesas" data={expenseTypes} emptyText="Nenhuma despesa com categoria registrada ainda." />
        <PieBreakdown title="Distribuição Receitas" data={revenueTypes} emptyText="Nenhuma receita com categoria registrada ainda." />
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Lançamentos</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                {["Data", "Descrição", "Categoria", "Projeto", "Tipo", "Valor", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((t) => {
                const s = statusColors[t.status] ?? { bg: "#F1F5F9", text: "#475569" };
                const confirmingDelete = confirmDeleteId === t.id;
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: overdueIds.has(t.id) ? "#EF4444" : "var(--muted-foreground)", fontWeight: overdueIds.has(t.id) ? 700 : 400 }}>
                      {t.date}{t.isRecurring && <span title="Recorrente"> 🔁</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--foreground)" }}>{t.desc}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{t.cat}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{t.project}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: t.type === "receita" ? "#ECFDF5" : "#FEF2F2", color: t.type === "receita" ? "#065F46" : "#991B1B" }}>
                        {t.type === "receita" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: t.type === "receita" ? "#10B981" : "#EF4444" }}>
                      {t.type === "receita" ? "+" : "-"}R$ {t.value.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {confirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            disabled={deletingId === t.id}
                            className="text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1 disabled:opacity-60"
                            style={{ background: "#EF4444", color: "white" }}
                          >
                            {deletingId === t.id && <Loader2 size={10} className="animate-spin" />}
                            Excluir
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          {t.status !== "Confirmado" && (
                            <button
                              onClick={() => handleConfirmTransaction(t.id)}
                              disabled={confirmingId === t.id}
                              title="Marcar como confirmado"
                              style={{ color: "#10B981" }}
                            >
                              {confirmingId === t.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            </button>
                          )}
                          <button onClick={() => openEdit(t)} title="Editar" style={{ color: "var(--muted-foreground)" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(t.id)} title="Excluir" style={{ color: "var(--muted-foreground)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>
                {editingId ? "Editar Lançamento" : showModal === "receita" ? "Nova Receita" : "Nova Despesa"}
              </h3>
              <button onClick={() => { setShowModal(null); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Descrição", "text", "Ex: Pagamento Projeto X", "description"], ["Valor (R$)", "number", "0,00", "value"], ["Categoria", "text", "Ex: Serviços, Pessoal...", "category"], ["Data", "date", "", "date"]].map(([l, t, ph, key]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input
                    type={t as string}
                    placeholder={ph as string}
                    value={(form as any)[key as string]}
                    onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                    list={key === "category" ? "category-suggestions" : undefined}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>
              ))}
              <datalist id="category-suggestions">
                {Array.from(new Set([
                  "Serviços", "Pessoal", "Infraestrutura", "Marketing", "Ferramentas", "Impostos", "Equipamentos", "Assinaturas", "Outros",
                  ...transactions.map((t) => t.cat).filter((c) => c && c !== "—"),
                ])).map((c) => <option key={c} value={c} />)}
              </datalist>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Forma de pagamento</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  {["Transferência", "Pix", "Cartão", "Boleto", "Dinheiro"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--foreground)" }}>
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--primary)" }}
                />
                Recorrente (repete todo mês)
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowModal(null); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSaveTransaction}
                disabled={saving || !form.description.trim() || !form.value}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: showModal === "receita" ? "#10B981" : "#EF4444", color: "white" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : `Registrar ${showModal === "receita" ? "receita" : "despesa"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
