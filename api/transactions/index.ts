import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method === "GET") {
    const transactions = await sql`
      SELECT id, date, description, category, project_id, client, type, value, payment_method, status, created_at
      FROM financial_transactions ORDER BY date DESC, created_at DESC
    `;
    return res.status(200).json(transactions);
  }

  if (req.method === "POST") {
    const { description, category, client, type, value, payment_method, date } = req.body ?? {};
    if (!description || !type || value === undefined) {
      return res.status(400).json({ error: "Descrição, tipo e valor são obrigatórios" });
    }
    const [tx] = await sql`
      INSERT INTO financial_transactions (date, description, category, client, type, value, payment_method, status)
      VALUES (${date || new Date().toISOString().slice(0, 10)}, ${description}, ${category ?? null}, ${client ?? null}, ${type}, ${value}, ${payment_method ?? null}, 'Pendente')
      RETURNING id, date, description, category, project_id, client, type, value, payment_method, status, created_at
    `;
    return res.status(201).json(tx);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
