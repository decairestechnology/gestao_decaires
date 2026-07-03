import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const projects = await sql`
      SELECT id, name, client, description, responsible_name, start_date, deadline,
             progress, status, priority, tasks_done, tasks_total, contract_value, created_at
      FROM projects ORDER BY created_at DESC
    `;
    return res.status(200).json(projects);
  }

  if (req.method === "POST") {
    const { name, client, description, deadline, priority, contract_value, responsible_name } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

    const responsibleName = responsible_name || niceName(user);
    const [project] = await sql`
      INSERT INTO projects (name, client, description, responsible_name, start_date, deadline, progress, status, priority, tasks_done, tasks_total, contract_value)
      VALUES (${name}, ${client ?? null}, ${description ?? null}, ${responsibleName}, CURRENT_DATE, ${deadline || null}, 0, 'Novo', ${priority || "Média"}, 0, 0, ${contract_value ?? 0})
      RETURNING id, name, client, description, responsible_name, start_date, deadline, progress, status, priority, tasks_done, tasks_total, contract_value, created_at
    `;
    return res.status(201).json(project);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
