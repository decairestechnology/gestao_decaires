import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const articles = await sql`
      SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.updated_at, a.created_at,
             COALESCE(
               (SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id),
               '[]'
             ) AS tags
      FROM knowledge_articles a
      ORDER BY a.updated_at DESC
    `;
    return res.status(200).json(articles);
  }

  if (req.method === "POST") {
    const { title, content, tags } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "Título é obrigatório" });

    const authorName = user.name || user.email || "Equipe";
    const [article] = await sql`
      INSERT INTO knowledge_articles (title, author_name, content, starred)
      VALUES (${title}, ${authorName}, ${content ?? null}, false)
      RETURNING id
    `;

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (tag) await sql`INSERT INTO knowledge_article_tags (article_id, tag) VALUES (${article.id}, ${tag}) ON CONFLICT DO NOTHING`;
      }
    }

    const [full] = await sql`
      SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.updated_at, a.created_at,
             COALESCE((SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id), '[]') AS tags
      FROM knowledge_articles a WHERE a.id = ${article.id}
    `;
    return res.status(201).json(full);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
