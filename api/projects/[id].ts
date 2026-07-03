import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  const id = Number(req.query.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  if (req.method === "PATCH") {
    const { status, progress, name, client, description, deadline, priority, contract_value, responsible_name } = req.body ?? {};
    const [updated] = await sql`
      UPDATE projects SET
        status = COALESCE(${status ?? null}, status),
        progress = COALESCE(${progress ?? null}, progress),
        name = COALESCE(${name ?? null}, name),
        client = COALESCE(${client ?? null}, client),
        description = COALESCE(${description ?? null}, description),
        deadline = COALESCE(${deadline ?? null}, deadline),
        priority = COALESCE(${priority ?? null}, priority),
        contract_value = COALESCE(${contract_value ?? null}, contract_value),
        responsible_name = COALESCE(${responsible_name ?? null}, responsible_name)
      WHERE id = ${id}
      RETURNING id, name, client, description, responsible_name, start_date, deadline, progress, status, priority, tasks_done, tasks_total, contract_value, created_at
    `;
    if (!updated) return res.status(404).json({ error: "Projeto não encontrado" });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM projects WHERE id = ${id}`;
    return res.status(204).end();
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Método não permitido" });
}
