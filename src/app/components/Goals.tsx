import { useState } from "react";
import { Plus, X, Target, ChevronDown, ChevronUp } from "lucide-react";

const categories = ["Financeiras", "Comerciais", "Marketing", "Desenvolvimento", "Operacionais", "Crescimento", "Clientes"];

const categoryColors: Record<string, string> = {
  Financeiras: "#10B981", Comerciais: "#06B6D4", Marketing: "#7C3AED",
  Desenvolvimento: "#3B82F6", Operacionais: "#F59E0B", Crescimento: "#EF4444", Clientes: "#8B5CF6",
};

const goals = [
  { id: 1, title: "Atingir R$ 200k de receita no Q2", desc: "Crescer a receita mensal para superar a meta trimestral estabelecida no planejamento estratégico.", responsible: "Daniel", deadline: "30/06/2026", progress: 73, priority: "Alta", status: "Em andamento", category: "Financeiras", okrs: [{ kr: "Fechar 3 novos contratos de desenvolvimento", progress: 67 }, { kr: "Aumentar ticket médio em 15%", progress: 80 }, { kr: "Renovar 100% dos contratos vigentes", progress: 75 }] },
  { id: 2, title: "Conquistar 20 novos clientes em 2026", desc: "Expandir a base de clientes ativos através de prospecção ativa e marketing de conteúdo.", responsible: "Julia", deadline: "31/12/2026", progress: 55, priority: "Alta", status: "Em andamento", category: "Comerciais", okrs: [{ kr: "Gerar 50 leads qualificados por mês", progress: 60 }, { kr: "Taxa de conversão acima de 20%", progress: 45 }, { kr: "NPS acima de 8 com novos clientes", progress: 70 }] },
  { id: 3, title: "Lançar DeCaires HUB em produção", desc: "Concluir o desenvolvimento e lançar a plataforma SaaS principal da empresa.", responsible: "Marcos", deadline: "30/09/2026", progress: 88, priority: "Alta", status: "Em andamento", category: "Desenvolvimento", okrs: [{ kr: "Completar todos os módulos core", progress: 90 }, { kr: "Atingir 99.9% de uptime nos testes", progress: 95 }, { kr: "Onboarding dos primeiros 10 clientes beta", progress: 70 }] },
  { id: 4, title: "Crescer seguidores LinkedIn para 5k", desc: "Fortalecer a presença digital da empresa no LinkedIn como canal de geração de leads.", responsible: "Fernanda", deadline: "31/12/2026", progress: 38, priority: "Média", status: "Em andamento", category: "Marketing", okrs: [{ kr: "Publicar 3 conteúdos por semana", progress: 55 }, { kr: "Taxa de engajamento acima de 5%", progress: 30 }, { kr: "10 artigos técnicos publicados", progress: 20 }] },
  { id: 5, title: "Contratar 3 desenvolvedores sênior", desc: "Expandir a equipe técnica para suportar o crescimento dos projetos.", responsible: "Daniel", deadline: "31/08/2026", progress: 33, priority: "Média", status: "Em andamento", category: "Crescimento", okrs: [{ kr: "Realizar 20 entrevistas técnicas", progress: 50 }, { kr: "Aprovação de 3 candidatos", progress: 33 }, { kr: "Onboarding concluído em menos de 2 semanas", progress: 0 }] },
  { id: 6, title: "Implementar suporte 24/7 para clientes Premium", desc: "Criar uma estrutura de suporte contínuo para clientes de maior valor.", responsible: "Rafael", deadline: "30/07/2026", progress: 60, priority: "Baixa", status: "Em andamento", category: "Clientes", okrs: [{ kr: "Contratar 2 analistas de suporte", progress: 50 }, { kr: "SLA de resposta em menos de 1h", progress: 70 }, { kr: "Satisfação do cliente acima de 9/10", progress: 65 }] },
];

const priorityColors: Record<string, string> = { Alta: "#EF4444", Média: "#F59E0B", Baixa: "#10B981" };
const statusColors: Record<string, { bg: string; text: string }> = {
  "Em andamento": { bg: "#E0F9FF", text: "#0E7490" },
  Concluída: { bg: "#ECFDF5", text: "#065F46" },
  Pausada: { bg: "#F1F5F9", text: "#475569" },
  Atrasada: { bg: "#FEF2F2", text: "#991B1B" },
};

function GoalCard({ goal }: { goal: typeof goals[0] }) {
  const [expanded, setExpanded] = useState(false);
  const s = statusColors[goal.status] ?? { bg: "#F1F5F9", text: "#475569" };
  const catColor = categoryColors[goal.category] ?? "#06B6D4";

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${catColor}15`, color: catColor }}>{goal.category}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{goal.status}</span>
            <span className="text-xs font-semibold" style={{ color: priorityColors[goal.priority] }}>{goal.priority}</span>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="transition-colors" style={{ color: "var(--muted-foreground)" }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>{goal.title}</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{goal.desc}</p>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>👤 {goal.responsible}</span>
            <span>📅 {goal.deadline}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: goal.progress >= 75 ? "#10B981" : goal.progress >= 50 ? "#F59E0B" : "var(--primary)" }}>{goal.progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${goal.progress}%`, background: goal.progress >= 75 ? "#10B981" : goal.progress >= 50 ? "#F59E0B" : "var(--primary)" }} />
        </div>
      </div>

      {expanded && (
        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--foreground)" }}>Resultados-Chave (OKRs)</div>
          <div className="space-y-3">
            {goal.okrs.map((okr, i) => (
              <div key={i}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>{okr.kr}</span>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: okr.progress >= 75 ? "#10B981" : okr.progress >= 50 ? "#F59E0B" : "var(--muted-foreground)" }}>{okr.progress}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${okr.progress}%`, background: okr.progress >= 75 ? "#10B981" : okr.progress >= 50 ? "#F59E0B" : "var(--primary)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Goals() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = activeCat ? goals.filter(g => g.category === activeCat) : goals;
  const avgProgress = Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length);

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de metas", value: goals.length.toString(), color: "var(--primary)" },
          { label: "Em andamento", value: goals.filter(g => g.status === "Em andamento").length.toString(), color: "#06B6D4" },
          { label: "Progresso médio", value: `${avgProgress}%`, color: avgProgress >= 70 ? "#10B981" : "#F59E0B" },
          { label: "Alta prioridade", value: goals.filter(g => g.priority === "Alta").length.toString(), color: "#EF4444" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveCat(null)}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
          style={{ background: !activeCat ? "var(--primary)" : "var(--muted)", color: !activeCat ? "white" : "var(--muted-foreground)" }}>
          Todas
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCat(activeCat === cat ? null : cat)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{ background: activeCat === cat ? `${categoryColors[cat]}20` : "var(--muted)", color: activeCat === cat ? categoryColors[cat] : "var(--muted-foreground)", border: activeCat === cat ? `1px solid ${categoryColors[cat]}40` : "1px solid transparent" }}>
            {cat}
          </button>
        ))}
        <button onClick={() => setShowModal(true)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Nova meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(goal => <GoalCard key={goal.id} goal={goal} />)}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Nova Meta</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Título", "text", "Descreva a meta"], ["Responsável", "text", "Nome"], ["Prazo", "date", ""]].map(([l, t, ph]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input type={t as string} placeholder={ph as string} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea rows={2} placeholder="Detalhes da meta..." className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Categoria</label>
                  <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Prioridade</label>
                  <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Criar meta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
