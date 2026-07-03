import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, LayoutGrid, List, Columns3, X, ArrowRight, Clock, CheckSquare, User, Calendar,
  ChevronDown, Loader2, Pencil, Trash2, Paperclip, Download, Send, DollarSign, CheckCircle2,
} from "lucide-react";
import {
  projectsApi, projectTasksApi, projectFilesApi, projectActivitiesApi, transactionsApi,
  type Project as ApiProject, type ProjectTask, type ProjectFile, type ProjectActivity, type Transaction,
} from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import { supabase, PROJECT_FILES_BUCKET } from "../../lib/supabase";

type ViewMode = "cards" | "list" | "kanban";

const STATUS_LIST = ["Novo", "Planejamento", "Desenvolvimento", "Revisão", "Concluído", "Pausado", "Atrasado", "Cancelado"];

const statusMeta: Record<string, { bg: string; text: string; dot: string }> = {
  Novo: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  Planejamento: { bg: "#F5F3FF", text: "#6D28D9", dot: "#7C3AED" },
  Desenvolvimento: { bg: "#E0F9FF", text: "#0E7490", dot: "#06B6D4" },
  Revisão: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  Concluído: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  Pausado: { bg: "#F8FAFC", text: "#334155", dot: "#64748B" },
  Atrasado: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  Cancelado: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
};

const priorityColors: Record<string, string> = { Alta: "#EF4444", Média: "#F59E0B", Baixa: "#10B981" };

interface UiProject {
  id: number;
  name: string;
  client: string;
  desc: string;
  responsible: string;
  start: string;
  deadline: string;
  progress: number;
  status: string;
  priority: string;
  tasksDone: number;
  tasksTotal: number;
  contractValue: number;
  delayed: boolean;
}

function toUiProject(p: ApiProject): UiProject {
  return {
    id: p.id,
    name: p.name,
    client: p.client ?? "",
    desc: p.description ?? "",
    responsible: p.responsible_name ?? "",
    start: p.start_date ? new Date(p.start_date).toLocaleDateString("pt-BR") : "—",
    deadline: p.deadline ? new Date(p.deadline).toLocaleDateString("pt-BR") : "—",
    progress: p.progress ?? 0,
    status: p.status,
    priority: p.priority,
    tasksDone: p.tasks_done ?? 0,
    tasksTotal: p.tasks_total ?? 0,
    contractValue: Number(p.contract_value) || 0,
    delayed: p.status === "Atrasado",
  };
}

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? statusMeta["Novo"];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0" style={{ background: meta.bg, color: meta.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
      {status}
    </span>
  );
}

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface ProjectDetailProps {
  project: UiProject;
  onClose: () => void;
  onUpdated: (p: UiProject) => void;
  onDeleted: () => void;
}

const editEmptyForm = { name: "", client: "", description: "", deadline: "", priority: "Média", contract_value: "" };

function ProjectDetail({ project, onClose, onUpdated, onDeleted }: ProjectDetailProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState("visão geral");
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(editEmptyForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", priority: "Média", due_date: "" });
  const [savingTask, setSavingTask] = useState(false);

  const [savingResponsible, setSavingResponsible] = useState(false);

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm] = useState({ description: "", value: "", type: "receita", category: "", payment_method: "Transferência", status: "Pendente" });
  const [savingTx, setSavingTx] = useState(false);

  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const innerTabs = ["visão geral", "tarefas", "equipe", "arquivos", "financeiro", "comentários"];
  const pct = project.progress;
  const progressColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#06B6D4" : pct >= 25 ? "#F59E0B" : "#EF4444";

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try { setTasks(await projectTasksApi.list(project.id)); }
    catch (e: any) { setError(e?.message ?? "Não foi possível carregar as tarefas."); }
    finally { setTasksLoading(false); }
  }, [project.id]);

  const loadFiles = useCallback(async () => {
    setFilesLoading(true);
    try { setFiles(await projectFilesApi.list(project.id)); }
    catch (e: any) { setError(e?.message ?? "Não foi possível carregar os arquivos."); }
    finally { setFilesLoading(false); }
  }, [project.id]);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const all = await transactionsApi.list();
      setTransactions(all.filter((t) => t.project_id === project.id));
    } catch (e: any) { setError(e?.message ?? "Não foi possível carregar o financeiro."); }
    finally { setTxLoading(false); }
  }, [project.id]);

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try { setActivities(await projectActivitiesApi.list(project.id)); }
    catch (e: any) { setError(e?.message ?? "Não foi possível carregar o histórico."); }
    finally { setActivitiesLoading(false); }
  }, [project.id]);

  useEffect(() => {
    loadTasks(); loadFiles(); loadTransactions(); loadActivities();
  }, [loadTasks, loadFiles, loadTransactions, loadActivities]);

  function openEdit() {
    setEditForm({
      name: project.name, client: project.client, description: project.desc,
      deadline: "", priority: project.priority, contract_value: String(project.contractValue || ""),
    });
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await projectsApi.update(project.id, editForm as any);
      onUpdated(toUiProject(updated));
      setEditing(false);
    } catch (e: any) { setError(e?.message ?? "Não foi possível salvar as alterações."); }
    finally { setSavingEdit(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try { await projectsApi.remove(project.id); onDeleted(); }
    catch (e: any) { setError(e?.message ?? "Não foi possível excluir o projeto."); }
    finally { setDeleting(false); }
  }

  async function handleStatusChange(status: string) {
    setChangingStatus(true);
    try {
      const updated = await projectsApi.update(project.id, { status } as any);
      onUpdated(toUiProject(updated));
    } catch (e: any) { setError(e?.message ?? "Não foi possível mudar o status."); }
    finally { setChangingStatus(false); }
  }

  async function handleAddTask() {
    if (!newTask.title.trim()) return;
    setSavingTask(true);
    try {
      await projectTasksApi.create(project.id, newTask);
      setNewTask({ title: "", priority: "Média", due_date: "" });
      await loadTasks();
      const fresh = await projectsApi.list();
      const p = fresh.find((x) => x.id === project.id);
      if (p) onUpdated(toUiProject(p));
    } catch (e: any) { setError(e?.message ?? "Não foi possível criar a tarefa."); }
    finally { setSavingTask(false); }
  }

  async function handleToggleTask(task: ProjectTask) {
    try {
      await projectTasksApi.update(project.id, task.id, { done: !task.done });
      await loadTasks();
      const fresh = await projectsApi.list();
      const p = fresh.find((x) => x.id === project.id);
      if (p) onUpdated(toUiProject(p));
    } catch (e: any) { setError(e?.message ?? "Não foi possível atualizar a tarefa."); }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      await projectTasksApi.remove(project.id, taskId);
      await loadTasks();
      const fresh = await projectsApi.list();
      const p = fresh.find((x) => x.id === project.id);
      if (p) onUpdated(toUiProject(p));
    } catch (e: any) { setError(e?.message ?? "Não foi possível excluir a tarefa."); }
  }

  async function handleSetResponsible(name: string) {
    setSavingResponsible(true);
    try {
      const updated = await projectsApi.update(project.id, { responsible_name: name } as any);
      onUpdated(toUiProject(updated));
    } catch (e: any) { setError(e?.message ?? "Não foi possível mudar o responsável."); }
    finally { setSavingResponsible(false); }
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = `${project.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(PROJECT_FILES_BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(PROJECT_FILES_BUCKET).getPublicUrl(path);
      await projectFilesApi.create(project.id, {
        name: file.name, url: data.publicUrl, path, size_bytes: file.size, content_type: file.type,
      });
      await loadFiles();
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível enviar o arquivo. Confirme se o Supabase Storage está configurado.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(file: ProjectFile) {
    try {
      await supabase.storage.from(PROJECT_FILES_BUCKET).remove([file.path]);
      await projectFilesApi.remove(project.id, file.id);
      await loadFiles();
    } catch (e: any) { setError(e?.message ?? "Não foi possível excluir o arquivo."); }
  }

  async function handleSaveTx() {
    if (!txForm.description.trim() || !txForm.value) return;
    setSavingTx(true);
    try {
      await transactionsApi.create({ ...txForm, value: Number(txForm.value), project_id: project.id, client: project.client });
      setTxForm({ description: "", value: "", type: "receita", category: "", payment_method: "Transferência", status: "Pendente" });
      setShowTxForm(false);
      await loadTransactions();
    } catch (e: any) { setError(e?.message ?? "Não foi possível registrar o lançamento."); }
    finally { setSavingTx(false); }
  }

  async function handleConfirmTx(txId: number) {
    try {
      await transactionsApi.setStatus(txId, "Confirmado");
      await loadTransactions();
    } catch (e: any) { setError(e?.message ?? "Não foi possível confirmar o pagamento."); }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await projectActivitiesApi.add(project.id, newNote.trim());
      setNewNote("");
      await loadActivities();
    } catch (e: any) { setError(e?.message ?? "Não foi possível salvar a nota."); }
    finally { setAddingNote(false); }
  }

  const totalRecebido = transactions.filter((t) => t.type === "receita" && t.status === "Confirmado").reduce((a, t) => a + Number(t.value), 0);
  const totalAConfirmar = transactions.filter((t) => t.type === "receita" && t.status !== "Confirmado").reduce((a, t) => a + Number(t.value), 0);
  const totalDespesas = transactions.filter((t) => t.type === "despesa").reduce((a, t) => a + Number(t.value), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-0 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge status={project.status} />
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${priorityColors[project.priority]}15`, color: priorityColors[project.priority] }}>
                  {project.priority}
                </span>
              </div>
              <h3 className="font-extrabold text-lg leading-tight" style={{ color: "var(--foreground)" }}>{project.name}</h3>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Cliente: {project.client || "—"}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              <button onClick={openEdit} title="Editar" className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}>
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmDelete(true)} title="Excluir" className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "#EF4444" }}>
                <Trash2 size={14} />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-muted" style={{ color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "var(--muted-foreground)" }}>{project.tasksDone}/{project.tasksTotal} tarefas</span>
              <span className="font-bold" style={{ color: progressColor }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: progressColor }} />
            </div>
          </div>

          <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {innerTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px flex-shrink-0"
                style={{ borderColor: tab === t ? "var(--primary)" : "transparent", color: tab === t ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
          {error && (
            <div className="mb-4 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between gap-2" style={{ background: "#FEF2F2", color: "#991B1B" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {confirmDelete && (
            <div className="mb-4 rounded-lg px-4 py-3 flex items-center justify-between gap-3" style={{ background: "#FEF2F2" }}>
              <span className="text-xs font-medium" style={{ color: "#991B1B" }}>Excluir esse projeto? Não dá pra desfazer.</span>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "white", color: "var(--foreground)" }}>Cancelar</button>
                <button onClick={handleDelete} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60" style={{ background: "#EF4444", color: "white" }}>
                  {deleting && <Loader2 size={11} className="animate-spin" />}Excluir
                </button>
              </div>
            </div>
          )}

          {editing && (
            <div className="mb-5 rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>Nome</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>Cliente</label>
                  <input value={editForm.client} onChange={(e) => setEditForm({ ...editForm, client: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>Prazo</label>
                  <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>Prioridade</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>Valor do contrato (R$)</label>
                  <input type="number" value={editForm.contract_value} onChange={(e) => setEditForm({ ...editForm, contract_value: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>Descrição</label>
                <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-xs font-bold border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
                <button onClick={handleSaveEdit} disabled={savingEdit || !editForm.name.trim()} className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {savingEdit && <Loader2 size={11} className="animate-spin" />}Salvar
                </button>
              </div>
            </div>
          )}

          {tab === "visão geral" && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{project.desc || "Sem descrição."}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[["Responsável", project.responsible || "—"], ["Cliente", project.client || "—"], ["Início", project.start], ["Prazo", project.deadline], ["Valor do contrato", fmtMoney(project.contractValue)]].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{k as string}</div>
                    <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{v as string}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold mb-2" style={{ color: "var(--foreground)" }}>Status do projeto</div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_LIST.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={changingStatus || project.status === s}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:cursor-default"
                      style={{ background: project.status === s ? statusMeta[s].bg : "var(--muted)", color: project.status === s ? statusMeta[s].text : "var(--muted-foreground)", opacity: changingStatus ? 0.6 : 1 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow" style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)" }}>
                  {initials(project.responsible || "?")}
                </div>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Equipe do projeto</span>
              </div>
            </div>
          )}

          {tab === "tarefas" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                  placeholder="Nova tarefa..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  <option>Alta</option><option>Média</option><option>Baixa</option>
                </select>
                <button onClick={handleAddTask} disabled={savingTask || !newTask.title.trim()} className="px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {savingTask ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>

              {tasksLoading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={12} className="animate-spin" />Carregando...</div>}

              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted" style={{ borderColor: "var(--border)" }}>
                    <input type="checkbox" checked={t.done} onChange={() => handleToggleTask(t)} className="w-4 h-4 rounded flex-shrink-0" style={{ accentColor: "var(--primary)" }} />
                    <span className="flex-1 text-sm" style={{ color: t.done ? "var(--muted-foreground)" : "var(--foreground)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
                    {t.due_date && <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0" style={{ background: `${priorityColors[t.priority]}15`, color: priorityColors[t.priority] }}>{t.priority}</span>
                    <button onClick={() => handleDeleteTask(t.id)} className="flex-shrink-0" style={{ color: "var(--muted-foreground)" }}><Trash2 size={13} /></button>
                  </div>
                ))}
                {!tasksLoading && tasks.length === 0 && (
                  <div className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>Nenhuma tarefa ainda. Adicione a primeira acima.</div>
                )}
              </div>
            </div>
          )}

          {tab === "equipe" && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--foreground)" }}>Responsável pelo projeto</label>
                <div className="flex items-center gap-3">
                  <select
                    value={project.responsible || ""}
                    onChange={(e) => handleSetResponsible(e.target.value)}
                    disabled={savingResponsible}
                    className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    {project.responsible && <option value={project.responsible}>{project.responsible}</option>}
                    {user?.displayName && user.displayName !== project.responsible && <option value={user.displayName}>{user.displayName}</option>}
                  </select>
                  {savingResponsible && <Loader2 size={14} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                  Por enquanto só aparece quem já está cadastrado no sistema. Conforme a equipe crescer (Configurações → Usuários), mais nomes aparecem aqui pra escolher.
                </p>
              </div>
            </div>
          )}

          {tab === "arquivos" && (
            <div className="space-y-4">
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-muted" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                <span className="text-sm font-medium">{uploading ? "Enviando..." : "Clique pra enviar um arquivo"}</span>
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
                  <div className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>Nenhum arquivo ainda.</div>
                )}
              </div>
            </div>
          )}

          {tab === "financeiro" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Recebido</div>
                  <div className="text-sm font-extrabold" style={{ color: "#10B981" }}>{fmtMoney(totalRecebido)}</div>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>A confirmar</div>
                  <div className="text-sm font-extrabold" style={{ color: "#F59E0B" }}>{fmtMoney(totalAConfirmar)}</div>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Despesas</div>
                  <div className="text-sm font-extrabold" style={{ color: "#EF4444" }}>{fmtMoney(totalDespesas)}</div>
                </div>
              </div>

              <button onClick={() => setShowTxForm((v) => !v)} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <DollarSign size={13} />{showTxForm ? "Fechar" : "Novo lançamento"}
              </button>

              {showTxForm && (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input placeholder="Descrição" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                    <input type="number" placeholder="Valor (R$)" value={txForm.value} onChange={(e) => setTxForm({ ...txForm, value: e.target.value })} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                    <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                      <option value="receita">Receita</option><option value="despesa">Despesa</option>
                    </select>
                    <select value={txForm.status} onChange={(e) => setTxForm({ ...txForm, status: e.target.value })} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                      <option>Pendente</option><option>Confirmado</option><option>A receber</option>
                    </select>
                  </div>
                  <button onClick={handleSaveTx} disabled={savingTx || !txForm.description.trim() || !txForm.value} className="text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    {savingTx && <Loader2 size={11} className="animate-spin" />}Salvar lançamento
                  </button>
                </div>
              )}

              {txLoading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={12} className="animate-spin" />Carregando...</div>}

              <div className="space-y-2">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t.description}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{new Date(t.date).toLocaleDateString("pt-BR")} · {t.status}</div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: t.type === "receita" ? "#10B981" : "#EF4444" }}>
                      {t.type === "receita" ? "+" : "-"}{fmtMoney(Number(t.value))}
                    </span>
                    {t.status !== "Confirmado" && (
                      <button onClick={() => handleConfirmTx(t.id)} title="Marcar como confirmado" className="flex-shrink-0" style={{ color: "#10B981" }}>
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {!txLoading && transactions.length === 0 && (
                  <div className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>Nenhum lançamento vinculado a esse projeto ainda.</div>
                )}
              </div>
            </div>
          )}

          {tab === "comentários" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
                  placeholder="Escreva uma nota sobre o projeto..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                />
                <button onClick={handleAddNote} disabled={addingNote || !newNote.trim()} className="px-3 rounded-lg flex items-center justify-center disabled:opacity-50" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {addingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              {activitiesLoading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}><Loader2 size={12} className="animate-spin" />Carregando...</div>}
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--primary)" }} />
                    <div className="flex-1">
                      <div className="text-xs" style={{ color: "var(--foreground)" }}>{a.note}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{a.author_name ? `${a.author_name} · ` : ""}{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                ))}
                {!activitiesLoading && activities.length === 0 && (
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum registro ainda.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const newProjectEmptyForm = { name: "", client: "", deadline: "", priority: "Média", description: "", contract_value: "" };

export function Projects() {
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<UiProject | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projects, setProjects] = useState<UiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(newProjectEmptyForm);
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

  useEffect(() => { loadProjects(); }, [loadProjects]);

  async function handleCreateProject() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await projectsApi.create(form);
      setForm(newProjectEmptyForm);
      setShowNewProject(false);
      await loadProjects();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível criar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  function handleProjectUpdated(updated: UiProject) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  }

  function handleProjectDeleted() {
    if (selected) setProjects((prev) => prev.filter((p) => p.id !== selected.id));
    setSelected(null);
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
        <div className="mb-4 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between gap-2" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
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
            {STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
        </div>

        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          {([["cards", LayoutGrid], ["list", List], ["kanban", Columns3]] as [ViewMode, any][]).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: view === v ? "var(--primary)" : "transparent", color: view === v ? "white" : "var(--muted-foreground)" }}
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
          <Plus size={14} /><span>Novo projeto</span>
        </button>
      </div>

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {STATUS_LIST.map((status) => {
          const meta = statusMeta[status];
          const count = projects.filter((p) => p.status === status).length;
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
              {status}<span className="ml-1 font-extrabold">{count}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" />Carregando projetos...
        </div>
      )}

      {!loading && view === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const progressColor = p.delayed ? "#EF4444" : "var(--primary)";
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className="rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group"
                style={{ background: "var(--card)", borderColor: p.delayed ? "#EF444430" : "var(--border)" }}
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
                    <User size={11} /><span>{p.responsible.split(" ")[0] || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: p.delayed ? "#EF4444" : "var(--muted-foreground)" }}>
                    <Calendar size={11} /><span>{p.deadline}</span>
                    {p.delayed && <span className="font-bold" style={{ color: "#EF4444" }}>· Atrasado</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <CheckSquare size={11} /><span>{p.tasksDone}/{p.tasksTotal}</span>
                  </div>
                  <span className="text-xs font-extrabold" style={{ color: progressColor }}>{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: progressColor }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "#06B6D4" }}>
                    {initials(p.responsible || "?")}
                  </div>
                  <span className="text-xs font-bold" style={{ color: priorityColors[p.priority] }}>{p.priority}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum projeto encontrado.</div>
          )}
        </div>
      )}

      {!loading && view === "list" && (
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
                  <tr key={p.id} onClick={() => setSelected(p)} className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.client}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color: priorityColors[p.priority] }}>{p.priority}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.responsible || "—"}</td>
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
                    <td className="px-4 py-3"><ArrowRight size={14} style={{ color: "var(--muted-foreground)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum projeto encontrado.</div>
            )}
          </div>
        </div>
      )}

      {!loading && view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {STATUS_LIST.map((status) => {
            const meta = statusMeta[status];
            const cols = filtered.filter((p) => p.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-60 rounded-2xl p-3 flex flex-col" style={{ background: "var(--muted)", minHeight: 400 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-extrabold" style={{ color: meta.text }}>{status}</span>
                  <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ background: meta.bg, color: meta.text, fontSize: 10 }}>{cols.length}</span>
                </div>
                <div className="flex-1 space-y-2">
                  {cols.map((p) => (
                    <div key={p.id} onClick={() => setSelected(p)} className="rounded-xl p-3 border cursor-pointer shadow-sm hover:shadow-md transition-all" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
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
                    <div className="rounded-xl p-4 text-center text-xs border-2 border-dashed mt-2" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}>Sem projetos</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <ProjectDetail
          project={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleProjectUpdated}
          onDeleted={handleProjectDeleted}
        />
      )}

      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-extrabold" style={{ color: "var(--foreground)" }}>Novo Projeto</h3>
              <button onClick={() => { setShowNewProject(false); setForm(newProjectEmptyForm); }} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
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
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground)" }}>Valor do contrato (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={form.contract_value}
                    onChange={(e) => setForm({ ...form, contract_value: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                    style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
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
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>O projeto começa com status <strong>Novo</strong>. Depois de criado, muda o status, adiciona tarefas, arquivos e lançamentos financeiros no detalhe dele.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
              <button onClick={() => { setShowNewProject(false); setForm(newProjectEmptyForm); }} className="flex-1 py-2.5 rounded-xl text-sm border font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                Cancelar
              </button>
              <button
                onClick={handleCreateProject}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED)", color: "white" }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}Criar projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
