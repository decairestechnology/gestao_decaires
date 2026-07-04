import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const [projectStats] = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'Em andamento')::int AS em_andamento,
           COUNT(*) FILTER (WHERE status = 'Concluído')::int AS concluidos,
           COUNT(*) FILTER (WHERE status = 'Atrasado')::int AS atrasados
    FROM projects
  `;

  const [leadStats] = await sql`
    SELECT COUNT(*)::int AS total,
           COALESCE(SUM(value), 0)::float AS potencial,
           COUNT(*) FILTER (WHERE stage = 'won')::int AS ganhos,
           COUNT(*) FILTER (WHERE stage = 'negotiation')::int AS negociacao
    FROM crm_leads
  `;

  const [goalStats] = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'Em andamento')::int AS em_andamento
    FROM goals
  `;

  const [eventStats] = await sql`
    SELECT COUNT(*)::int AS proxima_semana
    FROM agenda_events
    WHERE date >= CURRENT_DATE AND date < CURRENT_DATE + INTERVAL '7 days'
  `;

  const [financialStats] = await sql`
    SELECT COALESCE(SUM(value) FILTER (WHERE type = 'receita'), 0)::float AS receita,
           COALESCE(SUM(value) FILTER (WHERE type = 'despesa'), 0)::float AS despesa
    FROM financial_transactions
    WHERE date >= date_trunc('month', CURRENT_DATE)
  `;

  const funnelRows = await sql`
    SELECT stage, COUNT(*)::int AS total
    FROM crm_leads
    WHERE stage != 'lost'
    GROUP BY stage
  `;

  const projectStatusRows = await sql`
    SELECT status, COUNT(*)::int AS total
    FROM projects
    GROUP BY status
  `;
  const recentProjects = await sql`
    SELECT id, name, client, progress, status FROM projects ORDER BY created_at DESC LIMIT 5
  `;

  const upcomingEvents = await sql`
    SELECT id, title, date, start_time, type FROM agenda_events
    WHERE date >= CURRENT_DATE ORDER BY date ASC, start_time ASC LIMIT 5
  `;

  // Últimos 24 meses de receita/despesa, pra comparar o período atual com o anterior
  const monthlyFinancialRows = await sql`
    SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month,
           COALESCE(SUM(value) FILTER (WHERE type = 'receita'), 0)::float AS receita,
           COALESCE(SUM(value) FILTER (WHERE type = 'despesa'), 0)::float AS despesa
    FROM financial_transactions
    WHERE date >= date_trunc('month', CURRENT_DATE) - INTERVAL '23 months'
    GROUP BY 1 ORDER BY 1 ASC
  `;

  const monthlyLeadsRows = await sql`
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS total
    FROM crm_leads
    WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '23 months'
    GROUP BY 1 ORDER BY 1 ASC
  `;

  const monthlyProjectsRows = await sql`
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS total
    FROM projects
    WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '23 months'
    GROUP BY 1 ORDER BY 1 ASC
  `;

  return res.status(200).json({
    projects: projectStats,
    projectStatusRows,
    leads: leadStats,
    funnelRows,
    financial: financialStats,
    monthlyFinancialRows,
    monthlyLeadsRows,
    monthlyProjectsRows,
    goals: goalStats,
    events: eventStats,
    recentProjects,
    upcomingEvents,
  });
}
