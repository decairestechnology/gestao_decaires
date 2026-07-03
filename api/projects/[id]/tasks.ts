import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../_lib/db.js";
import { verifyAuth } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  const projectId = Number(req.query.id);
  if (!projectId || Number.isNaN(projectId)) return res.status(400).json({ error: "ID de projeto inválido" });

  if (req.method === "GET") {
    const tasks = await sql`
      SELECT id, project_id, title, priority, due_date, done, created_at
      FROM project_tasks WHERE project_id = ${projectId}
      ORDER BY done ASC, created_at ASC
    `;
    return res.status(200).json(tasks);
  }

  if (req.method === "POST") {
    const { title, priority, due_date } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "Título é obrigatório" });
    const [task] = await sql`
      INSERT INTO project_tasks (project_id, title, priority, due_date, done)
      VALUES (${projectId}, ${title}, ${priority || "Média"}, ${due_date || null}, false)
      RETURNING id, project_id, title, priority, due_date, done, created_at
    `;
    await recalcCounts(projectId);
    return res.status(201).json(task);
  }

  if (req.method === "PATCH") {
    const { taskId, title, priority, due_date, done } = req.body ?? {};
    if (!taskId) return res.status(400).json({ error: "taskId é obrigatório" });
    const [task] = await sql`
      UPDATE project_tasks SET
        title = COALESCE(${title ?? null}, title),
        priority = COALESCE(${priority ?? null}, priority),
        due_date = COALESCE(${due_date ?? null}, due_date),
        done = COALESCE(${done ?? null}, done)
      WHERE id = ${taskId} AND project_id = ${projectId}
      RETURNING id, project_id, title, priority, due_date, done, created_at
    `;
    if (!task) return res.status(404).json({ error: "Tarefa não encontrada" });
    await recalcCounts(projectId);
    return res.status(200).json(task);
  }

  if (req.method === "DELETE") {
    const taskId = Number(req.query.taskId);
    if (!taskId) return res.status(400).json({ error: "taskId é obrigatório" });
    await sql`DELETE FROM project_tasks WHERE id = ${taskId} AND project_id = ${projectId}`;
    await recalcCounts(projectId);
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Método não permitido" });
}

async function recalcCounts(projectId: number) {
  const [row] = await sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE done)::int AS done
    FROM project_tasks WHERE project_id = ${projectId}
  `;
  const progress = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
  await sql`UPDATE projects SET tasks_done = ${row.done}, tasks_total = ${row.total}, progress = ${progress} WHERE id = ${projectId}`;
}
