import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const events = await sql`
      SELECT id, title, date, start_time, end_time, location, project_id, responsible_name, status, type, created_at
      FROM agenda_events ORDER BY date ASC, start_time ASC
    `;
    return res.status(200).json(events);
  }

  if (req.method === "POST") {
    const { title, date, start_time, end_time, location, type } = req.body ?? {};
    if (!title || !date) return res.status(400).json({ error: "Título e data são obrigatórios" });

    const responsibleName = niceName(user);
    const [event] = await sql`
      INSERT INTO agenda_events (title, date, start_time, end_time, location, responsible_name, status, type)
      VALUES (${title}, ${date}, ${start_time || null}, ${end_time || null}, ${location ?? null}, ${responsibleName}, 'Pendente', ${type || "Reunião"})
      RETURNING id, title, date, start_time, end_time, location, project_id, responsible_name, status, type, created_at
    `;
    return res.status(201).json(event);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
