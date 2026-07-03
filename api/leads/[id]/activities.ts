import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../_lib/db.js";
import { verifyAuth, niceName } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  const leadId = Number(req.query.id);
  if (!leadId || Number.isNaN(leadId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  if (req.method === "GET") {
    const activities = await sql`
      SELECT id, note, author_name, created_at
      FROM crm_lead_activities
      WHERE lead_id = ${leadId}
      ORDER BY created_at DESC
    `;
    return res.status(200).json(activities);
  }

  if (req.method === "POST") {
    const { note } = req.body ?? {};
    if (!note || !String(note).trim()) {
      return res.status(400).json({ error: "Escreva algo pra registrar" });
    }
    const [activity] = await sql`
      INSERT INTO crm_lead_activities (lead_id, note, author_name)
      VALUES (${leadId}, ${note}, ${niceName(user)})
      RETURNING id, note, author_name, created_at
    `;
    return res.status(201).json(activity);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
