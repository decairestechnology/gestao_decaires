import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../_lib/db.js";
import { verifyAuth, niceName } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  const projectId = Number(req.query.id);
  if (!projectId || Number.isNaN(projectId)) return res.status(400).json({ error: "ID de projeto inválido" });

  if (req.method === "GET") {
    const files = await sql`
      SELECT id, project_id, name, url, path, size_bytes, content_type, uploaded_by, created_at
      FROM project_files WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `;
    return res.status(200).json(files);
  }

  // O upload em si acontece no navegador (direto pro Supabase Storage).
  // Aqui só salvamos os metadados depois que o upload já terminou.
  if (req.method === "POST") {
    const { name, url, path, size_bytes, content_type } = req.body ?? {};
    if (!name || !url || !path) return res.status(400).json({ error: "Dados do arquivo incompletos" });
    const [file] = await sql`
      INSERT INTO project_files (project_id, name, url, path, size_bytes, content_type, uploaded_by)
      VALUES (${projectId}, ${name}, ${url}, ${path}, ${size_bytes ?? null}, ${content_type ?? null}, ${niceName(user)})
      RETURNING id, project_id, name, url, path, size_bytes, content_type, uploaded_by, created_at
    `;
    return res.status(201).json(file);
  }

  if (req.method === "DELETE") {
    const fileId = Number(req.query.fileId);
    if (!fileId) return res.status(400).json({ error: "fileId é obrigatório" });
    await sql`DELETE FROM project_files WHERE id = ${fileId} AND project_id = ${projectId}`;
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Método não permitido" });
}
