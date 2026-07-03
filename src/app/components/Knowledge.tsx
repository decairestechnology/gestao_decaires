import { useState } from "react";
import { Search, Plus, Star, Clock, ChevronRight, FileText, Folder, Tag, X, BookOpen } from "lucide-react";

const categories = [
  { id: "processes", label: "Processos Internos", icon: "⚙️", count: 8 },
  { id: "dev", label: "Padrões de Dev", icon: "💻", count: 12 },
  { id: "clients", label: "Clientes", icon: "👥", count: 5 },
  { id: "templates", label: "Modelos e Templates", icon: "📄", count: 7 },
  { id: "tutorials", label: "Tutoriais", icon: "📖", count: 15 },
  { id: "notes", label: "Anotações", icon: "📝", count: 9 },
  { id: "links", label: "Links Úteis", icon: "🔗", count: 23 },
];

const articles = [
  { id: 1, title: "Guia de Onboarding de Clientes", cat: "processes", catLabel: "Processos Internos", author: "Daniel", updated: "08/06/2026", tags: ["onboarding", "clientes", "processo"], content: "# Guia de Onboarding de Clientes\n\n## 1. Kickoff Meeting\nAgendar reunião inicial com o cliente para alinhamento de expectativas e apresentação da equipe.\n\n## 2. Acesso ao Projeto\nFornencer acesso ao repositório, ferramentas de gestão e canais de comunicação.\n\n## 3. Documentação\nColetar todos os documentos necessários: contratos, briefings e especificações técnicas.\n\n## 4. Acompanhamento\nEstabelecer cadência de reuniões semanais e relatórios de progresso.", starred: true },
  { id: 2, title: "Padrão de nomenclatura de branches Git", cat: "dev", catLabel: "Padrões de Dev", author: "Marcos", updated: "05/06/2026", tags: ["git", "branches", "padrao"], content: "# Padrão de Branches Git\n\n## Prefixos\n- `feature/` — novas funcionalidades\n- `fix/` — correções de bugs\n- `hotfix/` — correções urgentes em produção\n- `chore/` — manutenção e refatoração\n- `docs/` — documentação\n\n## Exemplos\n- `feature/autenticacao-oauth`\n- `fix/calculo-imposto`\n- `hotfix/crash-login`", starred: true },
  { id: 3, title: "Contrato padrão de desenvolvimento", cat: "templates", catLabel: "Modelos e Templates", author: "Fernanda", updated: "01/06/2026", tags: ["contrato", "template", "juridico"], content: "Template de contrato para projetos de desenvolvimento customizado.", starred: false },
  { id: 4, title: "Deploy em produção com Docker", cat: "tutorials", catLabel: "Tutoriais", author: "Carlos", updated: "28/05/2026", tags: ["docker", "deploy", "devops"], content: "# Deploy com Docker\n\nPasso a passo para realizar deploy seguro em produção usando Docker e Docker Compose.", starred: false },
  { id: 5, title: "Perfil – Nexus Retail", cat: "clients", catLabel: "Clientes", author: "Julia", updated: "09/06/2026", tags: ["nexus", "cliente", "retail"], content: "Informações sobre o cliente Nexus Retail: contatos, histórico de projetos e preferências.", starred: false },
  { id: 6, title: "Links úteis – APIs de pagamento", cat: "links", catLabel: "Links Úteis", author: "Rafael", updated: "06/06/2026", tags: ["apis", "pagamento", "stripe", "pix"], content: "Coleção de links para documentações de APIs de pagamento: Stripe, Pagar.me, Mercado Pago, PagSeguro.", starred: false },
];

export function Knowledge() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(articles[0]);
  const [showModal, setShowModal] = useState(false);

  const filtered = articles.filter((a) => {
    const matchCat = !activeCategory || a.cat === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const starred = articles.filter(a => a.starred);
  const recent = [...articles].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <div className="w-56 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs outline-none border" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "none" }}>
          {/* Starred */}
          <div className="mb-3">
            <div className="text-xs font-semibold px-2 py-1 mb-1" style={{ color: "var(--muted-foreground)" }}>FAVORITOS</div>
            {starred.map(a => (
              <button key={a.id} onClick={() => setSelectedArticle(a)} className="w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors hover:bg-muted" style={{ color: selectedArticle?.id === a.id ? "var(--primary)" : "var(--foreground)", background: selectedArticle?.id === a.id ? "var(--accent)" : "transparent" }}>
                <Star size={11} style={{ color: "#F59E0B", flexShrink: 0 }} />
                <span className="truncate">{a.title}</span>
              </button>
            ))}
          </div>
          {/* Categories */}
          <div className="mb-3">
            <div className="text-xs font-semibold px-2 py-1 mb-1" style={{ color: "var(--muted-foreground)" }}>CATEGORIAS</div>
            <button onClick={() => setActiveCategory(null)} className="w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors hover:bg-muted" style={{ color: !activeCategory ? "var(--primary)" : "var(--foreground)", background: !activeCategory ? "var(--accent)" : "transparent" }}>
              <span className="flex items-center gap-2"><BookOpen size={11} />Todos</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{articles.length}</span>
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors hover:bg-muted" style={{ color: activeCategory === cat.id ? "var(--primary)" : "var(--foreground)", background: activeCategory === cat.id ? "var(--accent)" : "transparent" }}>
                <span className="flex items-center gap-1.5 min-w-0"><span>{cat.icon}</span><span className="truncate">{cat.label}</span></span>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{cat.count}</span>
              </button>
            ))}
          </div>
          {/* Recent */}
          <div>
            <div className="text-xs font-semibold px-2 py-1 mb-1" style={{ color: "var(--muted-foreground)" }}>RECENTES</div>
            {recent.map(a => (
              <button key={a.id} onClick={() => setSelectedArticle(a)} className="w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors hover:bg-muted" style={{ color: "var(--foreground)" }}>
                <Clock size={11} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                <span className="truncate">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setShowModal(true)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={12} />Novo documento
          </button>
        </div>
      </div>

      {/* Article list */}
      <div className="w-56 flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--muted)", scrollbarWidth: "none" }}>
        <div className="p-3 space-y-1">
          {filtered.map(a => (
            <button key={a.id} onClick={() => setSelectedArticle(a)}
              className="w-full text-left p-3 rounded-lg transition-all"
              style={{ background: selectedArticle?.id === a.id ? "var(--card)" : "transparent", borderLeft: selectedArticle?.id === a.id ? `3px solid var(--primary)` : "3px solid transparent" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-semibold line-clamp-2 flex-1" style={{ color: "var(--foreground)" }}>{a.title}</span>
                {a.starred && <Star size={10} style={{ color: "#F59E0B", flexShrink: 0 }} />}
              </div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.catLabel}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{a.updated}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum resultado</div>
          )}
        </div>
      </div>

      {/* Article content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {selectedArticle ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{selectedArticle.catLabel}</span>
                {selectedArticle.starred && <Star size={13} style={{ color: "#F59E0B" }} />}
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{selectedArticle.title}</h2>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span>por {selectedArticle.author}</span>
                <span>·</span>
                <span>Atualizado em {selectedArticle.updated}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedArticle.tags.map((t, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    <Tag size={9} />{t}
                  </span>
                ))}
              </div>
            </div>
            <div className="prose max-w-none">
              {selectedArticle.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-bold mt-6 mb-3" style={{ color: "var(--foreground)" }}>{line.slice(2)}</h2>;
                if (line.startsWith("## ")) return <h3 key={i} className="text-sm font-bold mt-4 mb-2" style={{ color: "var(--foreground)" }}>{line.slice(3)}</h3>;
                if (line.startsWith("- ")) return <div key={i} className="flex items-start gap-2 mb-1"><span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--primary)" }} /><span className="text-sm" style={{ color: "var(--foreground)" }}>{line.slice(2)}</span></div>;
                if (line.startsWith("`") && line.endsWith("`")) return <code key={i} className="block px-3 py-2 rounded-lg text-xs mb-1 font-mono" style={{ background: "var(--muted)", color: "var(--foreground)" }}>{line.slice(1, -1)}</code>;
                if (line === "") return <div key={i} className="h-2" />;
                return <p key={i} className="text-sm mb-2" style={{ color: "var(--foreground)" }}>{line}</p>;
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: "var(--muted-foreground)" }}>
            <div className="text-center">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Selecione um documento para visualizar</div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Novo Documento</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Título</label>
                <input type="text" placeholder="Título do documento" className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Categoria</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Tags (separadas por vírgula)</label>
                <input type="text" placeholder="ex: processo, cliente, onboarding" className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
