import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const posts = await sql`
      SELECT p.id, p.title, p.caption, p.platform, p.type, p.scheduled_date, p.responsible_name,
             p.status, p.cta, p.created_at,
             COALESCE((SELECT json_agg(h.hashtag) FROM content_hashtags h WHERE h.post_id = p.id), '[]') AS hashtags
      FROM content_posts p
      ORDER BY p.created_at DESC
    `;
    return res.status(200).json(posts);
  }

  if (req.method === "POST") {
    const { title, caption, platform, type, scheduled_date, cta, hashtags } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "Título é obrigatório" });

    const responsibleName = niceName(user);
    const [post] = await sql`
      INSERT INTO content_posts (title, caption, platform, type, scheduled_date, responsible_name, status, cta)
      VALUES (${title}, ${caption ?? null}, ${platform ?? null}, ${type ?? null}, ${scheduled_date || null}, ${responsibleName}, 'Ideia', ${cta ?? null})
      RETURNING id
    `;

    if (Array.isArray(hashtags)) {
      for (const h of hashtags) {
        if (h) await sql`INSERT INTO content_hashtags (post_id, hashtag) VALUES (${post.id}, ${h}) ON CONFLICT DO NOTHING`;
      }
    }

    const [full] = await sql`
      SELECT p.id, p.title, p.caption, p.platform, p.type, p.scheduled_date, p.responsible_name,
             p.status, p.cta, p.created_at,
             COALESCE((SELECT json_agg(h.hashtag) FROM content_hashtags h WHERE h.post_id = p.id), '[]') AS hashtags
      FROM content_posts p WHERE p.id = ${post.id}
    `;
    return res.status(201).json(full);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
