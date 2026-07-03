import { auth } from "./firebase";

async function authHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro na requisição (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  origin: string | null;
  interest: string | null;
  value: string; // vem como string do Postgres (NUMERIC)
  responsible_name: string | null;
  last_contact: string | null;
  next_action: string | null;
  stage: string;
  description: string | null;
  created_at: string;
}

export const leadsApi = {
  async list(): Promise<Lead[]> {
    const res = await fetch("/api/leads", { headers: await authHeaders() });
    return handleResponse(res);
  },

  async create(data: Partial<Lead>): Promise<Lead> {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async advanceStage(id: number): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "advance" }),
    });
    return handleResponse(res);
  },

  async updateStage(id: number, stage: string): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ stage }),
    });
    return handleResponse(res);
  },

  async update(id: number, fields: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ fields }),
    });
    return handleResponse(res);
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },

  async listActivities(id: number): Promise<LeadActivity[]> {
    const res = await fetch(`/api/leads/${id}/activities`, { headers: await authHeaders() });
    return handleResponse(res);
  },

  async addActivity(id: number, note: string): Promise<LeadActivity> {
    const res = await fetch(`/api/leads/${id}/activities`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ note }),
    });
    return handleResponse(res);
  },
};

export interface LeadActivity {
  id: number;
  note: string;
  author_name: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  client: string | null;
  description: string | null;
  responsible_name: string | null;
  start_date: string | null;
  deadline: string | null;
  progress: number;
  status: string;
  priority: string;
  tasks_done: number;
  tasks_total: number;
  contract_value: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string | null;
  project_id: number | null;
  client: string | null;
  type: string;
  value: string;
  payment_method: string | null;
  status: string;
  is_recurring: boolean;
  recurring_source_id: number | null;
  created_at: string;
}

export interface AgendaEvent {
  id: number;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  project_id: number | null;
  responsible_name: string | null;
  status: string;
  type: string | null;
  created_at: string;
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  responsible_name: string | null;
  deadline: string | null;
  progress: number;
  priority: string;
  status: string;
  category: string | null;
  created_at: string;
  okrs: { id: number; description: string; progress: number }[];
}

export interface Idea {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  author_name: string | null;
  priority: string;
  revenue_potential: string | null;
  complexity: string | null;
  target_audience: string | null;
  status: string;
  score_viability: number | null;
  score_commercial: number | null;
  score_innovation: number | null;
  score_cost: number | null;
  score_time: number | null;
  project_id: number | null;
  cancel_reason: string | null;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  category_id: string | null;
  author_name: string | null;
  content: string | null;
  starred: boolean;
  project_id: number | null;
  updated_at: string;
  created_at: string;
  tags: string[];
}

export interface Platform {
  id: number;
  name: string;
  logo_emoji: string | null;
  description: string | null;
  category: string | null;
  status: string;
  responsible_name: string | null;
  launch_date: string | null;
  users_count: number;
  revenue: string;
  monthly_costs: string;
  public_link: string | null;
  repo_link: string | null;
  prod_link: string | null;
  staging_link: string | null;
  created_at: string;
  tech: string[];
}

export interface ContentPost {
  id: number;
  title: string;
  caption: string | null;
  platform: string | null;
  type: string | null;
  scheduled_date: string | null;
  responsible_name: string | null;
  status: string;
  cta: string | null;
  created_at: string;
  hashtags: string[];
}

// --- Genérico: listar e criar num recurso do endpoint consolidado /api/resources/[type] ---
function makeResource<T = any>(type: string) {
  return {
    async list(): Promise<T[]> {
      const res = await fetch(`/api/resources/${type}`, { headers: await authHeaders() });
      return handleResponse(res);
    },
    async create(data: any): Promise<T> {
      const res = await fetch(`/api/resources/${type}`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  };
}

export const projectsApi = {
  async list(): Promise<Project[]> {
    const res = await fetch("/api/projects", { headers: await authHeaders() });
    return handleResponse(res);
  },
  async create(data: any): Promise<Project> {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async update(id: number, fields: Partial<Project>) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(fields),
    });
    return handleResponse(res);
  },
  async updateProgress(id: number, patch: { status?: string; progress?: number }) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(patch),
    });
    return handleResponse(res);
  },
  async remove(id: number) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  priority: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
}

export const projectTasksApi = {
  async list(projectId: number): Promise<ProjectTask[]> {
    const res = await fetch(`/api/projects/${projectId}/tasks`, { headers: await authHeaders() });
    return handleResponse(res);
  },
  async create(projectId: number, data: { title: string; priority?: string; due_date?: string }) {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async update(projectId: number, taskId: number, fields: Partial<ProjectTask>) {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ taskId, ...fields }),
    });
    return handleResponse(res);
  },
  async remove(projectId: number, taskId: number) {
    const res = await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};

export interface ProjectFile {
  id: number;
  project_id: number;
  name: string;
  url: string;
  path: string;
  size_bytes: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export const projectFilesApi = {
  async list(projectId: number): Promise<ProjectFile[]> {
    const res = await fetch(`/api/projects/${projectId}/files`, { headers: await authHeaders() });
    return handleResponse(res);
  },
  async create(projectId: number, data: { name: string; url: string; path: string; size_bytes?: number; content_type?: string }) {
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async remove(projectId: number, fileId: number) {
    const res = await fetch(`/api/projects/${projectId}/files?fileId=${fileId}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};

export interface ProjectActivity {
  id: number;
  note: string;
  author_name: string | null;
  created_at: string;
}

export const projectActivitiesApi = {
  async list(projectId: number): Promise<ProjectActivity[]> {
    const res = await fetch(`/api/projects/${projectId}/activities`, { headers: await authHeaders() });
    return handleResponse(res);
  },
  async add(projectId: number, note: string) {
    const res = await fetch(`/api/projects/${projectId}/activities`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ note }),
    });
    return handleResponse(res);
  },
};

export const transactionsApi = {
  ...makeResource<Transaction>("transactions"),
  async setStatus(id: number, status: string) {
    const res = await fetch("/api/resources/transactions", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id, status }),
    });
    return handleResponse(res);
  },
  async update(id: number, fields: Partial<Transaction>) {
    const res = await fetch("/api/resources/transactions", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id, fields }),
    });
    return handleResponse(res);
  },
  async remove(id: number) {
    const res = await fetch(`/api/resources/transactions?id=${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};
export const eventsApi = {
  ...makeResource<AgendaEvent>("events"),
  async update(id: number, fields: Partial<AgendaEvent>) {
    const res = await fetch("/api/resources/events", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id, fields }),
    });
    return handleResponse(res);
  },
  async setStatus(id: number, status: string) {
    const res = await fetch("/api/resources/events", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id, status }),
    });
    return handleResponse(res);
  },
  async remove(id: number) {
    const res = await fetch(`/api/resources/events?id=${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};
export const goalsApi = makeResource("goals");
export const ideasApi = {
  ...makeResource<Idea>("ideas"),
  async update(id: number, fields: Partial<Idea>) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ fields }),
    });
    return handleResponse(res);
  },
  async updateStatus(id: number, status: string) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
  async cancel(id: number, reason?: string) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "cancel", reason }),
    });
    return handleResponse(res);
  },
  async reactivate(id: number) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "reactivate" }),
    });
    return handleResponse(res);
  },
  async convertToProject(id: number) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "convert-to-project" }),
    });
    return handleResponse(res);
  },
  async remove(id: number) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};
export const articlesApi = {
  ...makeResource<Article>("articles"),
  async update(id: number, fields: Partial<Article> & { tags?: string[] }) {
    const res = await fetch("/api/resources/articles", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id, fields }),
    });
    return handleResponse(res);
  },
  async setStarred(id: number, starred: boolean) {
    const res = await fetch("/api/resources/articles", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id, starred }),
    });
    return handleResponse(res);
  },
  async restoreRevision(articleId: number, revisionId: number) {
    const res = await fetch("/api/resources/articles", {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ id: articleId, restoreRevisionId: revisionId }),
    });
    return handleResponse(res);
  },
  async remove(id: number) {
    const res = await fetch(`/api/resources/articles?id=${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};

export interface ArticleRevision {
  id: number;
  article_id: number;
  title: string;
  content: string | null;
  author_name: string | null;
  created_at: string;
}

export const articleRevisionsApi = {
  async list(articleId: number): Promise<ArticleRevision[]> {
    const res = await fetch(`/api/resources/article-revisions?articleId=${articleId}`, { headers: await authHeaders() });
    return handleResponse(res);
  },
};

export interface ArticleFile {
  id: number;
  article_id: number;
  name: string;
  url: string;
  path: string;
  size_bytes: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export const articleFilesApi = {
  async list(articleId: number): Promise<ArticleFile[]> {
    const res = await fetch(`/api/resources/article-files?articleId=${articleId}`, { headers: await authHeaders() });
    return handleResponse(res);
  },
  async create(data: { article_id: number; name: string; url: string; path: string; size_bytes?: number; content_type?: string }) {
    const res = await fetch("/api/resources/article-files", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async remove(id: number) {
    const res = await fetch(`/api/resources/article-files?id=${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};
export const platformsApi = makeResource("platforms");
export const contentApi = makeResource("content");

export async function fetchDashboard() {
  const res = await fetch("/api/dashboard", { headers: await authHeaders() });
  return handleResponse(res);
}
