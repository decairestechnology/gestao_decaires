import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Star, Clock, ChevronRight, FileText, Folder, Tag, X, BookOpen, Loader2, Pencil, Trash2, Paperclip, Download } from "lucide-react";
import { articlesApi, articleFilesApi, type Article as ApiArticle, type ArticleFile } from "../../lib/api";
import { supabase, PROJECT_FILES_BUCKET } from "../../lib/supabase";

const categories = [
  { id: "processes", label: "Processos Internos", icon: "⚙️" },
  { id: "dev", label: "Padrões de Dev", icon: "💻" },
  { id: "clients", label: "Clientes", icon: "👥" },
  { id: "templates", label: "Modelos e Templates", icon: "📄" },
  { id: "tutorials", label: "Tutoriais", icon: "📖" },
  { id: "notes", label: "Anotações", icon: "📝" },
  { id: "links", label: "Links Úteis", icon: "🔗" },
];

interface UiArticle {
  id: number;
  title: string;
  cat: string | null;
  catLabel: string;
  author: string;
  updated: string;
  tags: string[];
  content: string;
  starred: boolean;
}

function toUiArticle(a: ApiArticle): UiArticle {
  return {
    id: a.id,
    title: a.title,
    cat: a.category_id,
    catLabel: categories.find((c) => c.id === a.category_id)?.label ?? "Sem categoria",
    author: a.author_name ?? "—",
    updated: a.updated_at ? new Date(a.updated_at).toLocaleDateString("pt-BR") : "—",
    tags: a.tags ?? [],
    content: a.content ?? "",
    starred: a.starred,
  };
}

const emptyForm = { title: "", content: "", tagsRaw: "", category_id: "" };

export function Knowledge() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<UiArticle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [articles, setArticles] = useState<UiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingStar, setTogglingStar] = useState(false);
  const [files, setFiles] = useState<ArticleFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await articlesApi.list();
      const mapped = data.map(toUiArticle);
      setArticles(mapped);
      setSelectedArticle((prev) => prev ?? mapped[0] ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar a base de conhecimento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const loadFiles = useCallback(async (articleId: number) => {
    setFilesLoading(true);
    try {
      setFiles(await articleFilesApi.list(articleId));
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível carregar os arquivos.");
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedArticle) loadFiles(selectedArticle.id);
    else setFiles([]);
  }, [selectedArticle?.id, loadFiles]);

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedArticle) return;
    setUploading(true);
    setError(null);
    try {
      const path = `knowledge/${selectedArticle.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(PROJECT_FILES_BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(PROJECT_FILES_BUCKET).getPublicUrl(path);
      await articleFilesApi.create({
        article_id: selectedArticle.id, name: file.name, url: data.publicUrl, path,
        size_bytes: file.size, content_type: file.type,
      });
      await loadFiles(selectedArticle.id);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(f: ArticleFile) {
    try {
      await supabase.storage.from(PROJECT_FILES_BUCKET).remove([f.path]);
      await articleFilesApi.remove(f.id);
      if (selectedArticle) await loadFiles(selectedArticle.id);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o arquivo.");
    }
  }

  function fmtBytes(n: number | null) {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSaveArticle() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const tags = form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
      if (editingId) {
        const updated = await articlesApi.update(editingId, { title: form.title, content: form.content, category_id: form.category_id || null, tags });
        if (selectedArticle?.id === editingId) setSelectedArticle(toUiArticle(updated));
      } else {
        await articlesApi.create({ title: form.title, content: form.content, tags, category_id: form.category_id || null });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await loadArticles();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível salvar o documento.");
    } finally {
      setSaving(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(a: UiArticle) {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, tagsRaw: a.tags.join(", "), category_id: a.cat ?? "" });
    setShowModal(true);
  }

  async function handleDeleteArticle() {
    if (!selectedArticle) return;
    setDeleting(true);
    try {
      await articlesApi.remove(selectedArticle.id);
      setSelectedArticle(null);
      setConfirmDelete(false);
      await loadArticles();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível excluir o documento.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStar() {
    if (!selectedArticle) return;
    setTogglingStar(true);
    try {
      const updated = await articlesApi.setStarred(selectedArticle.id, !selectedArticle.starred);
      setSelectedArticle(toUiArticle(updated));
      await loadArticles();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível favoritar o documento.");
    } finally {
      setTogglingStar(false);
    }
  }

  const filtered = articles.filter((a) => {
    const matchCat = !activeCategory || a.cat === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const starred = articles.filter(a => a.starred);
  const recent = [...articles].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);

  return (
    <div className="flex h-full overflow-hidden">
      {error && (
        <div className="absolute top-2 left-2 right-2 z-20 text-sm rounded-lg px-4 py-2.5" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
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
              <button key={a.id} onClick={() => { setSelectedArticle(a); setConfirmDelete(false); }} className="w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors hover:bg-muted" style={{ color: selectedArticle?.id === a.id ? "var(--primary)" : "var(--foreground)", background: selectedArticle?.id === a.id ? "var(--accent)" : "transparent" }}>
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
                <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{articles.filter(a => a.cat === cat.id).length}</span>
              </button>
            ))}
          </div>
          {/* Recent */}
          <div>
            <div className="text-xs font-semibold px-2 py-1 mb-1" style={{ color: "var(--muted-foreground)" }}>RECENTES</div>
            {recent.map(a => (
              <button key={a.id} onClick={() => { setSelectedArticle(a); setConfirmDelete(false); }} className="w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors hover:bg-muted" style={{ color: "var(--foreground)" }}>
                <Clock size={11} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                <span className="truncate">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={openCreateModal} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={12} />Novo documento
          </button>
        </div>
      </div>

      {/* Article list */}
      <div className="w-56 flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--muted)", scrollbarWidth: "none" }}>
        <div className="p-3 space-y-1">
          {filtered.map(a => (
            <button key={a.id} onClick={() => { setSelectedArticle(a); setConfirmDelete(false); }}
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{selectedArticle.catLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleToggleStar} disabled={togglingStar} title={selectedArticle.starred ? "Remover dos favoritos" : "Favoritar"} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted">
                    <Star size={15} style={{ color: selectedArticle.starred ? "#F59E0B" : "var(--muted-foreground)" }} fill={selectedArticle.starred ? "#F59E0B" : "none"} />
                  </button>
                  <button onClick={() => openEditModal(selectedArticle)} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(true)} title="Excluir" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "#EF4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {confirmDelete && (
                <div className="mb-3 rounded-lg px-4 py-3 flex items-center justify-between gap-3" style={{ background: "#FEF2F2" }}>
                  <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir esse documento?</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                    <button onClick={handleDeleteArticle} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                      {deleting && <Loader2 size={11} className="animate-spin" />}
                      Excluir
                    </button>
                  </div>
                </div>
              )}

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

            <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Arquivos anexados</div>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-muted mb-3" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
                <span className="text-sm font-medium">{uploading ? "Enviando..." : "Clique pra anexar um arquivo"}</span>
                <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
              </label>
              {filesLoading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={12} className="animate-spin" />Carregando...</div>}
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                    <Paperclip size={14} style={{ color: "var(--muted-foreground)" }} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{f.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{fmtBytes(f.size_bytes)} · {f.uploaded_by} · {new Date(f.created_at).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-shrink-0" style={{ color: "var(--primary)" }}><Download size={14} /></a>
                    <button onClick={() => handleDeleteFile(f)} className="flex-shrink-0" style={{ color: "#EF4444" }}><Trash2 size={13} /></button>
                  </div>
                ))}
                {!filesLoading && files.length === 0 && (
                  <div className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>Nenhum arquivo anexado ainda.</div>
                )}
              </div>
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
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar Documento" : "Novo Documento"}</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Título</label>
                <input
                  type="text"
                  placeholder="Título do documento"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Categoria</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Conteúdo</label>
                <textarea
                  rows={4}
                  placeholder="Escreva o conteúdo (aceita # títulos e - listas)"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: processo, cliente, onboarding"
                  value={form.tagsRaw}
                  onChange={(e) => setForm({ ...form, tagsRaw: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }} className="flex-1 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
              <button
                onClick={handleSaveArticle}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? "Salvar alterações" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
