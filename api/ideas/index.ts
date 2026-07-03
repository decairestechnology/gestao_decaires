import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const ideas = await sql`
      SELECT id, title, description, category, author_name, priority, revenue_potential,
             complexity, target_audience, status, score_viability, score_commercial,
             score_innovation, score_cost, score_time, created_at
      FROM ideas ORDER BY created_at DESC
    `;
    return res.status(200).json(ideas);
  }

  if (req.method === "POST") {
    const { title, description, category, priority, revenue_potential, complexity, target_audience } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "Título é obrigatório" });

    const authorName = niceName(user);
    const [idea] = await sql`
      INSERT INTO ideas (title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status)
      VALUES (${title}, ${description ?? null}, ${category ?? null}, ${authorName}, ${priority || "Média"}, ${revenue_potential ?? null}, ${complexity ?? null}, ${target_audience ?? null}, 'Nova')
      RETURNING id, title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status, score_viability, score_commercial, score_innovation, score_cost, score_time, created_at
    `;
    return res.status(201).json(idea);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
