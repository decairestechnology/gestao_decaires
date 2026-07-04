import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

const STAGE_ORDER = ["new", "contact", "qualify", "proposal", "negotiation", "won"];
const STAGE_LABELS: Record<string, string> = {
  new: "Novo lead", contact: "Primeiro contato", qualify: "Qualificação",
  proposal: "Proposta enviada", negotiation: "Negociação", won: "Cliente conquistado", lost: "Lead perdido",
};


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
        RETURNING id, name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage, description, created_at
      `;
      if (nextStage !== current.stage) {
        await sql`INSERT INTO crm_lead_activities (lead_id, note, author_name) VALUES (${id}, ${`Movido para "${STAGE_LABELS[nextStage] ?? nextStage}"`}, ${niceName(user)})`;
      }
      return res.status(200).json(updated);
    }

    // Atualização direta de estágio (ex: mover manualmente no kanban)
    if (body.stage) {
      const [updated] = await sql`
        UPDATE crm_leads SET stage = ${body.stage}, updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage, description, created_at
      `;
      if (!updated) return res.status(404).json({ error: "Lead não encontrado" });
      await sql`INSERT INTO crm_lead_activities (lead_id, note, author_name) VALUES (${id}, ${`Movido para "${STAGE_LABELS[body.stage] ?? body.stage}"`}, ${niceName(user)})`;
      return res.status(200).json(updated);
    }

    // Edição geral dos campos do lead
    if (body.fields) {
      const f = body.fields;
      const [updated] = await sql`
        UPDATE crm_leads SET
          name = COALESCE(${f.name ?? null}, name),
          company = COALESCE(${f.company ?? null}, company),
          phone = COALESCE(${f.phone ?? null}, phone),
          email = COALESCE(${f.email ?? null}, email),
          origin = COALESCE(${f.origin ?? null}, origin),
          interest = COALESCE(${f.interest ?? null}, interest),
          value = COALESCE(${f.value ?? null}, value),
          next_action = COALESCE(${f.next_action ?? null}, next_action),
          description = COALESCE(${f.description ?? null}, description),
          updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, company, phone, email, origin, interest, value, responsible_name, last_contact, next_action, stage, description, created_at
      `;
      if (!updated) return res.status(404).json({ error: "Lead não encontrado" });
      await sql`INSERT INTO crm_lead_activities (lead_id, note, author_name) VALUES (${id}, 'Dados do lead atualizados', ${niceName(user)})`;
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
