import { useState } from "react";
import { Plus, ExternalLink, Github, Users, X, Globe } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string }> = {
  Ideia: { bg: "#F1F5F9", text: "#475569" },
  Planejamento: { bg: "#F5F3FF", text: "#7C3AED" },
  Desenvolvimento: { bg: "#EFF6FF", text: "#1D4ED8" },
  Testes: { bg: "#FFFBEB", text: "#B45309" },
  Produção: { bg: "#ECFDF5", text: "#065F46" },
  Manutenção: { bg: "#E0F9FF", text: "#0E7490" },
  Descontinuada: { bg: "#FEF2F2", text: "#991B1B" },
};

const platforms = [
  { id: 1, name: "DeCaires HUB", logo: "🚀", desc: "Plataforma central de gestão empresarial com módulos integrados de projetos, CRM e finanças.", category: "SaaS B2B", tech: ["React", "Node.js", "PostgreSQL", "AWS"], status: "Desenvolvimento", responsible: "Daniel", launch: "Set 2026", users: 0, revenue: 0, costs: 4200, link: "hub.decaires.com.br", repo: "github.com/decaires/hub", prod: "hub.decaires.com.br", staging: "staging.decaires.com.br" },
  { id: 2, name: "OnboardPro", logo: "🎯", desc: "Sistema de onboarding digital para RH com trilhas de aprendizado e assinatura de documentos.", category: "RH Tech", tech: ["Next.js", "TypeScript", "Supabase"], status: "Produção", responsible: "Julia", launch: "Mar 2026", users: 124, revenue: 8400, costs: 1200, link: "onboardpro.com.br", repo: "github.com/decaires/onboardpro", prod: "onboardpro.com.br", staging: "staging.onboardpro.com.br" },
  { id: 3, name: "FinTrack MEI", logo: "💰", desc: "Controle financeiro simplificado para microempreendedores com emissão de nota fiscal.", category: "Fintech", tech: ["React Native", "Firebase", "Node.js"], status: "Testes", responsible: "Marcos", launch: "Ago 2026", users: 0, revenue: 0, costs: 1800, link: "—", repo: "github.com/decaires/fintrack", prod: "—", staging: "fintrack-staging.decaires.com.br" },
  { id: 4, name: "ClickMenu", logo: "🍽️", desc: "Cardápio digital com QR Code para restaurantes com sistema de pedidos integrado.", category: "Food Tech", tech: ["Vue.js", "Laravel", "MySQL"], status: "Manutenção", responsible: "Rafael", launch: "Jan 2025", users: 342, revenue: 5100, costs: 800, link: "clickmenu.com.br", repo: "github.com/decaires/clickmenu", prod: "clickmenu.com.br", staging: "dev.clickmenu.com.br" },
  { id: 5, name: "EduConnect", logo: "📚", desc: "LMS para pequenas instituições de ensino com videoaulas e avaliações automatizadas.", category: "EdTech", tech: ["React", "Django", "PostgreSQL"], status: "Descontinuada", responsible: "Fernanda", launch: "Jun 2024", users: 89, revenue: 0, costs: 200, link: "—", repo: "github.com/decaires/educonnect", prod: "—", staging: "—" },
  { id: 6, name: "PropTech Dashboard", logo: "🏠", desc: "Dashboard analítico para corretoras imobiliárias com integração com portais de anúncios.", category: "PropTech", tech: ["React", "FastAPI", "Redis"], status: "Planejamento", responsible: "Carlos", launch: "Nov 2026", users: 0, revenue: 0, costs: 0, link: "—", repo: "—", prod: "—", staging: "—" },
];

export function Platforms() {
  const [selected, setSelected] = useState<typeof platforms[0] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Todas");

  const filtered = platforms.filter(p => statusFilter === "Todas" || p.status === statusFilter);

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
          {["Todas", ...Object.keys(statusColors)].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={14} />Nova plataforma
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const s = statusColors[p.status] ?? { bg: "#F1F5F9", text: "#475569" };
          return (
            <div key={p.id} onClick={() => setSelected(p)}
              className="rounded-xl border p-5 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--muted)" }}>
                    {p.logo}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{p.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.category}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2" style={{ background: s.bg, color: s.text }}>{p.status}</span>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{p.desc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.tech.map((t, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                  <Users size={11} />{p.users} usuários
                </div>
                <div className="font-semibold" style={{ color: p.revenue > 0 ? "#10B981" : "var(--muted-foreground)" }}>
                  {p.revenue > 0 ? `R$ ${p.revenue.toLocaleString("pt-BR")}/mês` : "Sem receita"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" style={{ background: "var(--card)", scrollbarWidth: "none" }}>
            <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{selected.logo}</div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{selected.name}</h3>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{selected.category}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Status", selected.status],
                  ["Responsável", selected.responsible],
                  ["Lançamento", selected.launch],
                  ["Usuários", selected.users.toString()],
                  ["Receita", selected.revenue > 0 ? `R$ ${selected.revenue.toLocaleString("pt-BR")}/mês` : "—"],
                  ["Custos", selected.costs > 0 ? `R$ ${selected.costs.toLocaleString("pt-BR")}/mês` : "—"],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Tecnologias</div>
                <div className="flex flex-wrap gap-2">
                  {selected.tech.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded font-mono font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {[["🌐 Produção", selected.prod], ["🧪 Staging", selected.staging], ["📦 Repositório", selected.repo]].map(([label, url]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>{label as string}</span>
                    <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{url as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Nova Plataforma</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Nome", "text", "Nome da plataforma"], ["Categoria", "text", "SaaS, Fintech..."], ["Responsável", "text", "Nome do responsável"]].map(([l, t, ph]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{l as string}</label>
                  <input type={t as string} placeholder={ph as string} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Status inicial</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea rows={3} placeholder="Descreva a plataforma..." className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
