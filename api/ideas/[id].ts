import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  const id = Number(req.query.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  if (req.method === "PATCH") {
    const body = req.body ?? {};

    // Editar campos gerais (inclui as notas de avaliação)
    if (body.fields) {
      const f = body.fields;
      const [updated] = await sql`
        UPDATE ideas SET
          title = COALESCE(${f.title ?? null}, title),
          description = ${f.description ?? null},
          category = ${f.category ?? null},
          priority = COALESCE(${f.priority ?? null}, priority),
          revenue_potential = ${f.revenue_potential ?? null},
          complexity = ${f.complexity ?? null},
          target_audience = ${f.target_audience ?? null},
          score_viability = ${f.score_viability ?? null},
          score_commercial = ${f.score_commercial ?? null},
          score_innovation = ${f.score_innovation ?? null},
          score_cost = ${f.score_cost ?? null},
          score_time = ${f.score_time ?? null}
        WHERE id = ${id}
        RETURNING id, title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status, score_viability, score_commercial, score_innovation, score_cost, score_time, project_id, cancel_reason, created_at
      `;
      if (!updated) return res.status(404).json({ error: "Ideia não encontrada" });
      return res.status(200).json(updated);
    }

    // Cancelar
    if (body.action === "cancel") {
      const [updated] = await sql`
        UPDATE ideas SET status = 'Cancelada', cancel_reason = ${body.reason ?? null}
        WHERE id = ${id}
        RETURNING id, title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status, score_viability, score_commercial, score_innovation, score_cost, score_time, project_id, cancel_reason, created_at
      `;
      if (!updated) return res.status(404).json({ error: "Ideia não encontrada" });
      return res.status(200).json(updated);
    }

    // Reativar (volta pra "Nova")
    if (body.action === "reactivate") {
      const [updated] = await sql`
        UPDATE ideas SET status = 'Nova', cancel_reason = NULL
        WHERE id = ${id}
        RETURNING id, title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status, score_viability, score_commercial, score_innovation, score_cost, score_time, project_id, cancel_reason, created_at
      `;
      if (!updated) return res.status(404).json({ error: "Ideia não encontrada" });
      return res.status(200).json(updated);
    }

    // Enviar pra Projetos: cria um projeto de verdade a partir da ideia
    if (body.action === "convert-to-project") {
      const [idea] = await sql`SELECT * FROM ideas WHERE id = ${id}`;
      if (!idea) return res.status(404).json({ error: "Ideia não encontrada" });
      if (idea.project_id) return res.status(400).json({ error: "Essa ideia já foi enviada pra um projeto" });

      const responsibleName = niceName(user);
      const [project] = await sql`
        INSERT INTO projects (name, description, responsible_name, start_date, progress, status, priority, tasks_done, tasks_total)
        VALUES (${idea.title}, ${idea.description}, ${responsibleName}, CURRENT_DATE, 0, 'Planejamento', ${idea.priority || "Média"}, 0, 0)
        RETURNING id
      `;

      const [updated] = await sql`
        UPDATE ideas SET status = 'Em desenvolvimento', project_id = ${project.id}
        WHERE id = ${id}
        RETURNING id, title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status, score_viability, score_commercial, score_innovation, score_cost, score_time, project_id, cancel_reason, created_at
      `;
      return res.status(200).json(updated);
    }

    return res.status(400).json({ error: "Nada para atualizar" });
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM ideas WHERE id = ${id}`;
    return res.status(204).end();
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Método não permitido" });
}
