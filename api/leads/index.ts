import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.method === "GET") {
    const leads = await sql`
      SELECT id, name, company, phone, email, origin, interest, value,
             responsible_name, last_contact, next_action, stage, created_at
      FROM crm_leads
      ORDER BY created_at DESC
    `;
    return res.status(200).json(leads);
  }

  if (req.method === "POST") {
    const { name, company, phone, email, origin, interest, value, next_action } = req.body ?? {};

    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const responsibleName = user.name || user.email || "Equipe";

    const [lead] = await sql`
      INSERT INTO crm_leads (name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage)
      VALUES (${name}, ${company ?? null}, ${phone ?? null}, ${email ?? null}, ${origin ?? null}, ${interest ?? null}, ${value ?? 0}, ${responsibleName}, CURRENT_DATE, ${next_action ?? null}, 'new')
      RETURNING id, name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage, created_at
    `;
    return res.status(201).json(lead);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
