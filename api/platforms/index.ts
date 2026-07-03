import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const platforms = await sql`
      SELECT p.id, p.name, p.logo_emoji, p.description, p.category, p.status, p.responsible_name,
             p.launch_date, p.users_count, p.revenue, p.monthly_costs, p.public_link, p.repo_link,
             p.prod_link, p.staging_link, p.created_at,
             COALESCE((SELECT json_agg(t.tech) FROM platform_tech_stack t WHERE t.platform_id = p.id), '[]') AS tech
      FROM platforms p
      ORDER BY p.created_at DESC
    `;
    return res.status(200).json(platforms);
  }

  if (req.method === "POST") {
    const { name, description, category, tech } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

    const responsibleName = niceName(user);
    const [platform] = await sql`
      INSERT INTO platforms (name, description, category, status, responsible_name, users_count, revenue, monthly_costs)
      VALUES (${name}, ${description ?? null}, ${category ?? null}, 'Ideia', ${responsibleName}, 0, 0, 0)
      RETURNING id
    `;

    if (Array.isArray(tech)) {
      for (const t of tech) {
        if (t) await sql`INSERT INTO platform_tech_stack (platform_id, tech) VALUES (${platform.id}, ${t}) ON CONFLICT DO NOTHING`;
      }
    }

    const [full] = await sql`
      SELECT p.id, p.name, p.logo_emoji, p.description, p.category, p.status, p.responsible_name,
             p.launch_date, p.users_count, p.revenue, p.monthly_costs, p.public_link, p.repo_link,
             p.prod_link, p.staging_link, p.created_at,
             COALESCE((SELECT json_agg(t.tech) FROM platform_tech_stack t WHERE t.platform_id = p.id), '[]') AS tech
      FROM platforms p WHERE p.id = ${platform.id}
    `;
    return res.status(201).json(full);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
