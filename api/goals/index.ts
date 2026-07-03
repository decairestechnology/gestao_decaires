import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const goals = await sql`
      SELECT g.id, g.title, g.description, g.responsible_name, g.deadline, g.progress,
             g.priority, g.status, g.category, g.created_at,
             COALESCE(
               (SELECT json_agg(json_build_object('id', kr.id, 'description', kr.description, 'progress', kr.progress))
                FROM goal_key_results kr WHERE kr.goal_id = g.id),
               '[]'
             ) AS okrs
      FROM goals g
      ORDER BY g.created_at DESC
    `;
    return res.status(200).json(goals);
  }

  if (req.method === "POST") {
    const { title, description, deadline, priority, category, okrs } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "Título é obrigatório" });

    const responsibleName = niceName(user);
    const [goal] = await sql`
      INSERT INTO goals (title, description, responsible_name, deadline, progress, priority, status, category)
      VALUES (${title}, ${description ?? null}, ${responsibleName}, ${deadline || null}, 0, ${priority || "Média"}, 'Em andamento', ${category ?? null})
      RETURNING id
    `;

    if (Array.isArray(okrs)) {
      for (const kr of okrs) {
        if (kr?.description) {
          await sql`INSERT INTO goal_key_results (goal_id, description, progress) VALUES (${goal.id}, ${kr.description}, 0)`;
        }
      }
    }

    const [full] = await sql`
      SELECT g.id, g.title, g.description, g.responsible_name, g.deadline, g.progress,
             g.priority, g.status, g.category, g.created_at,
             COALESCE(
               (SELECT json_agg(json_build_object('id', kr.id, 'description', kr.description, 'progress', kr.progress))
                FROM goal_key_results kr WHERE kr.goal_id = g.id),
               '[]'
             ) AS okrs
      FROM goals g WHERE g.id = ${goal.id}
    `;
    return res.status(201).json(full);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
