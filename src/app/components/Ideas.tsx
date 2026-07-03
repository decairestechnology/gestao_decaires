import { useState } from "react";
import { Plus, Search, Star, X, Lightbulb } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string }> = {
  Nova: { bg: "#E0F9FF", text: "#0E7490" },
  "Em análise": { bg: "#F5F3FF", text: "#7C3AED" },
  Validando: { bg: "#FFFBEB", text: "#B45309" },
  Aprovada: { bg: "#ECFDF5", text: "#065F46" },
  "Em desenvolvimento": { bg: "#EFF6FF", text: "#1D4ED8" },
  Arquivada: { bg: "#F1F5F9", text: "#475569" },
};

const ideas = [
  { id: 1, title: "Plataforma de Mentoria Tech", desc: "Conectar desenvolvedores júnior com seniors para mentoria 1:1 com sistema de pagamento por sessão.", category: "SaaS", author: "Daniel", date: "05/06/2026", priority: "Alta", revenue: "Alto", complexity: "Média", target: "Devs júnior", status: "Em análise", scores: { viabilidade: 4, comercial: 5, inovacao: 4, custo: 3, tempo: 3 } },
  { id: 2, title: "App de Controle Financeiro para MEI", desc: "Ferramenta simples de controle financeiro focada em microempreendedores individuais com emissão de nota.", category: "Fintech", author: "Julia", date: "03/06/2026", priority: "Alta", revenue: "Médio", complexity: "Baixa", target: "MEI", status: "Aprovada", scores: { viabilidade: 5, comercial: 4, inovacao: 3, custo: 4, tempo: 4 } },
  { id: 3, title: "CRM com IA para pequenas empresas", desc: "CRM com assistente de IA que sugere próximas ações baseado no comportamento do lead.", category: "CRM", author: "Marcos", date: "01/06/2026", priority: "Média", revenue: "Alto", complexity: "Alta", target: "PMEs", status: "Nova", scores: { viabilidade: 3, comercial: 5, inovacao: 5, custo: 2, tempo: 2 } },
  { id: 4, title: "Marketplace de Serviços de TI", desc: "Plataforma para contratar serviços de TI sob demanda com garantia e avaliações verificadas.", category: "Marketplace", author: "Rafael", date: "28/05/2026", priority: "Baixa", revenue: "Alto", complexity: "Alta", target: "Empresas", status: "Validando", scores: { viabilidade: 3, comercial: 5, inovacao: 4, custo: 2, tempo: 2 } },
  { id: 5, title: "Ferramenta de Onboarding Digital", desc: "Plataforma de onboarding de funcionários com trilhas de aprendizado e assinatura digital de documentos.", category: "RH Tech", author: "Fernanda", date: "25/05/2026", priority: "Média", revenue: "Médio", complexity: "Média", target: "RH corporativo", status: "Em desenvolvimento", scores: { viabilidade: 4, comercial: 4, inovacao: 3, custo: 3, tempo: 3 } },
  { id: 6, title: "Plugin de Analytics para Notion", desc: "Extensão que adiciona dashboards de analytics e relatórios automáticos dentro do Notion.", category: "Produtividade", author: "Carlos", date: "20/05/2026", priority: "Baixa", revenue: "Baixo", complexity: "Baixa", target: "Usuários Notion", status: "Arquivada", scores: { viabilidade: 4, comercial: 2, inovacao: 3, custo: 5, tempo: 5 } },
];

const priorityColors: Record<string, string> = { Alta: "#EF4444", Média: "#F59E0B", Baixa: "#10B981" };

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex-1 h-1.5 rounded-full" style={{ background: n <= value ? "var(--primary)" : "var(--muted)" }} />
        ))}
      </div>
    </div>
  );
}

export function Ideas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<typeof ideas[0] | null>(null);

  const filtered = ideas.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todas" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ideias..."
            className="w-full pl-8 pr-4 py-2 rounded-lg text-sm outline-none border"
            style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Todas", ...Object.keys(statusColors)].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={14} />Nova ideia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((idea) => {
          const s = statusColors[idea.status] ?? { bg: "#F1F5F9", text: "#475569" };
          const avgScore = Math.round((idea.scores.viabilidade + idea.scores.comercial + idea.scores.inovacao) / 3 * 10) / 10;
          return (
            <div key={idea.id} onClick={() => setSelected(idea)}
              className="rounded-xl border p-5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FFFBEB" }}>
                  <Lightbulb size={15} style={{ color: "#F59E0B" }} />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2" style={{ background: s.bg, color: s.text }}>{idea.status}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{idea.title}</h3>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{idea.desc}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{idea.category}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: `${priorityColors[idea.priority]}15`, color: priorityColors[idea.priority] }}>{idea.priority}</span>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Receita: {idea.revenue}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--muted-foreground)" }}>por {idea.author} · {idea.date}</span>
                <div className="flex items-center gap-1">
                  <Star size={11} style={{ color: "#F59E0B" }} />
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>{avgScore}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Idea Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" style={{ background: "var(--card)", scrollbarWidth: "none" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColors[selected.status]?.bg, color: statusColors[selected.status]?.text }}>{selected.status}</span>
                <h3 className="font-bold mt-1" style={{ color: "var(--foreground)" }}>{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {[["Categoria", selected.category], ["Público-alvo", selected.target], ["Potencial de receita", selected.revenue], ["Complexidade", selected.complexity], ["Autor", selected.author], ["Data", selected.date]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Avaliação</div>
                <ScoreBar label="Viabilidade" value={selected.scores.viabilidade} />
                <ScoreBar label="Potencial comercial" value={selected.scores.comercial} />
                <ScoreBar label="Inovação" value={selected.scores.inovacao} />
                <ScoreBar label="Custo estimado" value={selected.scores.custo} />
                <ScoreBar label="Tempo de desenvolvimento" value={selected.scores.tempo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Nova Ideia</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Título", "text", "Nome da ideia"], ["Categoria", "text", "Ex: SaaS, Fintech..."], ["Público-alvo", "text", "Quem vai usar?"]].map(([l, t, ph]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input type={t as string} placeholder={ph as string} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea rows={3} placeholder="Descreva a ideia..." className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Prioridade</label>
                  <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Potencial de receita</label>
                  <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    <option>Alto</option><option>Médio</option><option>Baixo</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Salvar ideia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
