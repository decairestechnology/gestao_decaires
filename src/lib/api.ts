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

  async remove(id: number): Promise<void> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    await handleResponse(res);
  },
};
