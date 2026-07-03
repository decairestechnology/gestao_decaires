import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth } from "../_lib/auth.js";

const STAGE_ORDER = ["new", "contact", "qualify", "proposal", "negotiation", "won"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const id = Number(req.query.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  if (req.method === "PATCH") {
    const body = req.body ?? {};

    // Ação especial: avançar pra próxima etapa do funil
    if (body.action === "advance") {
      const [current] = await sql`SELECT stage FROM crm_leads WHERE id = ${id}`;
      if (!current) return res.status(404).json({ error: "Lead não encontrado" });

      const currentIdx = STAGE_ORDER.indexOf(current.stage);
      const nextStage = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1
        ? STAGE_ORDER[currentIdx + 1]
        : current.stage;

      const [updated] = await sql`
        UPDATE crm_leads SET stage = ${nextStage}, updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage, created_at
      `;
      return res.status(200).json(updated);
    }

    // Atualização direta de estágio (ex: mover manualmente no kanban)
    if (body.stage) {
      const [updated] = await sql`
        UPDATE crm_leads SET stage = ${body.stage}, updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage, created_at
      `;
      if (!updated) return res.status(404).json({ error: "Lead não encontrado" });
      return res.status(200).json(updated);
    }

    return res.status(400).json({ error: "Nada para atualizar" });
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM crm_leads WHERE id = ${id}`;
    return res.status(204).end();
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Método não permitido" });
}
