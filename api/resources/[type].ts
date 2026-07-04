import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db.js";
import { verifyAuth, niceName } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Não autenticado" });

  const type = String(req.query.type ?? "");

  if (req.method !== "GET" && req.method !== "POST" && req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Método não permitido" });
  }

  switch (type) {
    case "transactions": {
      if (req.method === "GET") {
        const rows = await sql`
          SELECT id, date, description, category, project_id, platform_id, client, type, value, payment_method, status,
                 is_recurring, recurring_source_id, created_at
          FROM financial_transactions ORDER BY date DESC, created_at DESC
        `;
        return res.status(200).json(rows);
      }
      if (req.method === "PATCH") {
        const body = req.body ?? {};

        if (body.fields) {
          const f = body.fields;
          if (!body.id) return res.status(400).json({ error: "id é obrigatório" });
          const [updated] = await sql`
            UPDATE financial_transactions SET
              description = COALESCE(${f.description ?? null}, description),
              category = COALESCE(${f.category ?? null}, category),
              client = COALESCE(${f.client ?? null}, client),
              type = COALESCE(${f.type ?? null}, type),
              value = COALESCE(${f.value ?? null}, value),
              payment_method = COALESCE(${f.payment_method ?? null}, payment_method),
              date = COALESCE(${f.date ?? null}, date),
              project_id = COALESCE(${f.project_id ?? null}, project_id),
              platform_id = COALESCE(${f.platform_id ?? null}, platform_id),
              is_recurring = COALESCE(${f.is_recurring ?? null}, is_recurring)
            WHERE id = ${body.id}
            RETURNING id, date, description, category, project_id, platform_id, client, type, value, payment_method, status, is_recurring, recurring_source_id, created_at
          `;
          if (!updated) return res.status(404).json({ error: "Lançamento não encontrado" });
          return res.status(200).json(updated);
        }

        const { id: txId, status: newStatus } = body;
        if (!txId || !newStatus) return res.status(400).json({ error: "id e status são obrigatórios" });
        const [updated] = await sql`
          UPDATE financial_transactions SET status = ${newStatus}
          WHERE id = ${txId}
          RETURNING id, date, description, category, project_id, platform_id, client, type, value, payment_method, status, is_recurring, recurring_source_id, created_at
        `;
        if (!updated) return res.status(404).json({ error: "Lançamento não encontrado" });
        return res.status(200).json(updated);
      }
      if (req.method === "DELETE") {
        const txId = Number(req.query.id);
        if (!txId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM financial_transactions WHERE id = ${txId}`;
        return res.status(204).end();
      }
      const { description, category, client, type: txType, value, payment_method, date, project_id, platform_id, status: txStatus, is_recurring, recurring_source_id } = req.body ?? {};
      if (!description || !txType || value === undefined) {
        return res.status(400).json({ error: "Descrição, tipo e valor são obrigatórios" });
      }
      const [tx] = await sql`
        INSERT INTO financial_transactions (date, description, category, client, type, value, payment_method, status, project_id, platform_id, is_recurring, recurring_source_id)
        VALUES (${date || new Date().toISOString().slice(0, 10)}, ${description}, ${category ?? null}, ${client ?? null}, ${txType}, ${value}, ${payment_method ?? null}, ${txStatus || "Pendente"}, ${project_id ?? null}, ${platform_id ?? null}, ${is_recurring ?? false}, ${recurring_source_id ?? null})
        RETURNING id, date, description, category, project_id, platform_id, client, type, value, payment_method, status, is_recurring, recurring_source_id, created_at
      `;
      return res.status(201).json(tx);
    }

    case "events": {
      if (req.method === "GET") {
        const rows = await sql`
          SELECT id, title, date, start_time, end_time, location, description, project_id, responsible_name, status, type, created_at
          FROM agenda_events ORDER BY date ASC, start_time ASC
        `;
        return res.status(200).json(rows);
      }
      if (req.method === "PATCH") {
        const body = req.body ?? {};
        if (!body.id) return res.status(400).json({ error: "id é obrigatório" });
        if (body.fields) {
          const f = body.fields;
          const [updated] = await sql`
            UPDATE agenda_events SET
              title = COALESCE(${f.title ?? null}, title),
              date = COALESCE(${f.date ?? null}, date),
              start_time = COALESCE(${f.start_time ?? null}, start_time),
              end_time = COALESCE(${f.end_time ?? null}, end_time),
              location = COALESCE(${f.location ?? null}, location),
              description = COALESCE(${f.description ?? null}, description),
              type = COALESCE(${f.type ?? null}, type),
              project_id = COALESCE(${f.project_id ?? null}, project_id)
            WHERE id = ${body.id}
            RETURNING id, title, date, start_time, end_time, location, description, project_id, responsible_name, status, type, created_at
          `;
          if (!updated) return res.status(404).json({ error: "Evento não encontrado" });
          return res.status(200).json(updated);
        }
        if (body.status) {
          const [updated] = await sql`
            UPDATE agenda_events SET status = ${body.status} WHERE id = ${body.id}
            RETURNING id, title, date, start_time, end_time, location, description, project_id, responsible_name, status, type, created_at
          `;
          if (!updated) return res.status(404).json({ error: "Evento não encontrado" });
          return res.status(200).json(updated);
        }
        return res.status(400).json({ error: "Nada para atualizar" });
      }
      if (req.method === "DELETE") {
        const evId = Number(req.query.id);
        if (!evId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM agenda_events WHERE id = ${evId}`;
        return res.status(204).end();
      }
      const { title, date, start_time, end_time, location, type: evType, project_id, description } = req.body ?? {};
      if (!title || !date) return res.status(400).json({ error: "Título e data são obrigatórios" });
      const responsibleName = niceName(user);
      const [event] = await sql`
        INSERT INTO agenda_events (title, date, start_time, end_time, location, description, responsible_name, status, type, project_id)
        VALUES (${title}, ${date}, ${start_time || null}, ${end_time || null}, ${location ?? null}, ${description ?? null}, ${responsibleName}, 'Pendente', ${evType || "Reunião"}, ${project_id ?? null})
        RETURNING id, title, date, start_time, end_time, location, description, project_id, responsible_name, status, type, created_at
      `;
      return res.status(201).json(event);
    }

    case "goals": {
      async function recalcGoalProgress(goalId: number) {
        const [row] = await sql`SELECT COALESCE(AVG(progress), 0)::int AS avg FROM goal_key_results WHERE goal_id = ${goalId}`;
        await sql`UPDATE goals SET progress = ${row.avg} WHERE id = ${goalId}`;
      }

      async function fetchFullGoal(goalId: number) {
        const [full] = await sql`
          SELECT g.id, g.title, g.description, g.responsible_name, g.deadline, g.progress,
                 g.priority, g.status, g.category, g.project_id, g.created_at,
                 COALESCE(
                   (SELECT json_agg(json_build_object('id', kr.id, 'description', kr.description, 'progress', kr.progress) ORDER BY kr.id)
                    FROM goal_key_results kr WHERE kr.goal_id = g.id),
                   '[]'
                 ) AS okrs
          FROM goals g WHERE g.id = ${goalId}
        `;
        return full;
      }

      if (req.method === "GET") {
        const rows = await sql`
          SELECT g.id, g.title, g.description, g.responsible_name, g.deadline, g.progress,
                 g.priority, g.status, g.category, g.project_id, g.created_at,
                 COALESCE(
                   (SELECT json_agg(json_build_object('id', kr.id, 'description', kr.description, 'progress', kr.progress) ORDER BY kr.id)
                    FROM goal_key_results kr WHERE kr.goal_id = g.id),
                   '[]'
                 ) AS okrs
          FROM goals g ORDER BY g.created_at DESC
        `;
        return res.status(200).json(rows);
      }

      if (req.method === "PATCH") {
        const body = req.body ?? {};
        if (!body.id) return res.status(400).json({ error: "id é obrigatório" });
        const goalId = body.id;

        if (body.fields) {
          const f = body.fields;
          const found = await sql`
            UPDATE goals SET
              title = COALESCE(${f.title ?? null}, title),
              description = COALESCE(${f.description ?? null}, description),
              deadline = COALESCE(${f.deadline ?? null}, deadline),
              priority = COALESCE(${f.priority ?? null}, priority),
              category = COALESCE(${f.category ?? null}, category),
              project_id = COALESCE(${f.project_id ?? null}, project_id),
              status = COALESCE(${f.status ?? null}, status)
            WHERE id = ${goalId} RETURNING id
          `;
          if (found.length === 0) return res.status(404).json({ error: "Meta não encontrada" });
          return res.status(200).json(await fetchFullGoal(goalId));
        }

        if (body.addOkr) {
          if (!body.addOkr.description) return res.status(400).json({ error: "Descrição do resultado-chave é obrigatória" });
          await sql`INSERT INTO goal_key_results (goal_id, description, progress) VALUES (${goalId}, ${body.addOkr.description}, 0)`;
          await recalcGoalProgress(goalId);
          return res.status(200).json(await fetchFullGoal(goalId));
        }

        if (body.updateOkr) {
          const { krId, progress } = body.updateOkr;
          if (!krId || progress === undefined) return res.status(400).json({ error: "krId e progress são obrigatórios" });
          await sql`UPDATE goal_key_results SET progress = ${progress} WHERE id = ${krId} AND goal_id = ${goalId}`;
          await recalcGoalProgress(goalId);
          return res.status(200).json(await fetchFullGoal(goalId));
        }

        if (body.removeOkr) {
          await sql`DELETE FROM goal_key_results WHERE id = ${body.removeOkr} AND goal_id = ${goalId}`;
          await recalcGoalProgress(goalId);
          return res.status(200).json(await fetchFullGoal(goalId));
        }

        return res.status(400).json({ error: "Nada para atualizar" });
      }

      if (req.method === "DELETE") {
        const goalId = Number(req.query.id);
        if (!goalId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM goals WHERE id = ${goalId}`;
        return res.status(204).end();
      }

      const { title, description, deadline, priority, category, okrs, project_id } = req.body ?? {};
      if (!title) return res.status(400).json({ error: "Título é obrigatório" });
      const responsibleName = niceName(user);
      const [goal] = await sql`
        INSERT INTO goals (title, description, responsible_name, deadline, progress, priority, status, category, project_id)
        VALUES (${title}, ${description ?? null}, ${responsibleName}, ${deadline || null}, 0, ${priority || "Média"}, 'Em andamento', ${category ?? null}, ${project_id ?? null})
        RETURNING id
      `;
      if (Array.isArray(okrs)) {
        for (const kr of okrs) {
          if (kr?.description) {
            await sql`INSERT INTO goal_key_results (goal_id, description, progress) VALUES (${goal.id}, ${kr.description}, 0)`;
          }
        }
      }
      return res.status(201).json(await fetchFullGoal(goal.id));
    }

    case "ideas": {
      if (req.method === "GET") {
        const rows = await sql`
          SELECT id, title, description, category, author_name, priority, revenue_potential,
                 complexity, target_audience, status, score_viability, score_commercial,
                 score_innovation, score_cost, score_time, project_id, cancel_reason, created_at
          FROM ideas ORDER BY created_at DESC
        `;
        return res.status(200).json(rows);
      }
      const { title, description, category, priority, revenue_potential, complexity, target_audience } = req.body ?? {};
      if (!title) return res.status(400).json({ error: "Título é obrigatório" });
      const authorName = niceName(user);
      const [idea] = await sql`
        INSERT INTO ideas (title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status)
        VALUES (${title}, ${description ?? null}, ${category ?? null}, ${authorName}, ${priority || "Média"}, ${revenue_potential ?? null}, ${complexity ?? null}, ${target_audience ?? null}, 'Nova')
        RETURNING id, title, description, category, author_name, priority, revenue_potential, complexity, target_audience, status, score_viability, score_commercial, score_innovation, score_cost, score_time, project_id, cancel_reason, created_at
      `;
      return res.status(201).json(idea);
    }

    case "articles": {
      if (req.method === "GET") {
        const rows = await sql`
          SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.project_id, a.updated_at, a.created_at,
                 COALESCE((SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id), '[]') AS tags
          FROM knowledge_articles a ORDER BY a.updated_at DESC
        `;
        return res.status(200).json(rows);
      }
      if (req.method === "PATCH") {
        const body = req.body ?? {};
        if (!body.id) return res.status(400).json({ error: "id é obrigatório" });

        if (body.fields) {
          const f = body.fields;
          const authorName = niceName(user);

          // Guarda uma cópia do estado atual antes de sobrescrever (histórico de versões)
          const [current] = await sql`SELECT title, content FROM knowledge_articles WHERE id = ${body.id}`;
          if (!current) return res.status(404).json({ error: "Artigo não encontrado" });
          await sql`
            INSERT INTO knowledge_article_revisions (article_id, title, content, author_name)
            VALUES (${body.id}, ${current.title}, ${current.content}, ${authorName})
          `;

          const [updated] = await sql`
            UPDATE knowledge_articles SET
              title = COALESCE(${f.title ?? null}, title),
              content = COALESCE(${f.content ?? null}, content),
              category_id = COALESCE(${f.category_id ?? null}, category_id),
              project_id = COALESCE(${f.project_id ?? null}, project_id),
              updated_at = now()
            WHERE id = ${body.id}
            RETURNING id
          `;

          if (Array.isArray(f.tags)) {
            await sql`DELETE FROM knowledge_article_tags WHERE article_id = ${body.id}`;
            for (const tag of f.tags) {
              if (tag) await sql`INSERT INTO knowledge_article_tags (article_id, tag) VALUES (${body.id}, ${tag}) ON CONFLICT DO NOTHING`;
            }
          }
          const [full] = await sql`
            SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.project_id, a.updated_at, a.created_at,
                   COALESCE((SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id), '[]') AS tags
            FROM knowledge_articles a WHERE a.id = ${body.id}
          `;
          return res.status(200).json(full);
        }

        if (body.restoreRevisionId) {
          const [rev] = await sql`SELECT title, content FROM knowledge_article_revisions WHERE id = ${body.restoreRevisionId} AND article_id = ${body.id}`;
          if (!rev) return res.status(404).json({ error: "Versão não encontrada" });
          const authorName = niceName(user);
          const [current] = await sql`SELECT title, content FROM knowledge_articles WHERE id = ${body.id}`;
          if (!current) return res.status(404).json({ error: "Artigo não encontrado" });
          await sql`
            INSERT INTO knowledge_article_revisions (article_id, title, content, author_name)
            VALUES (${body.id}, ${current.title}, ${current.content}, ${authorName})
          `;
          const [updated] = await sql`
            UPDATE knowledge_articles SET title = ${rev.title}, content = ${rev.content}, updated_at = now()
            WHERE id = ${body.id} RETURNING id
          `;
          const [full] = await sql`
            SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.project_id, a.updated_at, a.created_at,
                   COALESCE((SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id), '[]') AS tags
            FROM knowledge_articles a WHERE a.id = ${body.id}
          `;
          return res.status(200).json(full);
        }

        if (body.starred !== undefined) {
          const [updated] = await sql`
            UPDATE knowledge_articles SET starred = ${body.starred}, updated_at = now() WHERE id = ${body.id}
            RETURNING id, title, category_id, author_name, content, starred, project_id, updated_at, created_at
          `;
          if (!updated) return res.status(404).json({ error: "Artigo não encontrado" });
          const [full] = await sql`
            SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.project_id, a.updated_at, a.created_at,
                   COALESCE((SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id), '[]') AS tags
            FROM knowledge_articles a WHERE a.id = ${body.id}
          `;
          return res.status(200).json(full);
        }
        return res.status(400).json({ error: "Nada para atualizar" });
      }
      if (req.method === "DELETE") {
        const artId = Number(req.query.id);
        if (!artId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM knowledge_articles WHERE id = ${artId}`;
        return res.status(204).end();
      }
      const { title, content, tags, category_id, project_id } = req.body ?? {};
      if (!title) return res.status(400).json({ error: "Título é obrigatório" });
      const authorName = niceName(user);
      const [article] = await sql`
        INSERT INTO knowledge_articles (title, author_name, content, starred, category_id, project_id)
        VALUES (${title}, ${authorName}, ${content ?? null}, false, ${category_id ?? null}, ${project_id ?? null})
        RETURNING id
      `;
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          if (tag) await sql`INSERT INTO knowledge_article_tags (article_id, tag) VALUES (${article.id}, ${tag}) ON CONFLICT DO NOTHING`;
        }
      }
      const [full] = await sql`
        SELECT a.id, a.title, a.category_id, a.author_name, a.content, a.starred, a.project_id, a.updated_at, a.created_at,
               COALESCE((SELECT json_agg(t.tag) FROM knowledge_article_tags t WHERE t.article_id = a.id), '[]') AS tags
        FROM knowledge_articles a WHERE a.id = ${article.id}
      `;
      return res.status(201).json(full);
    }

    case "platforms": {
      async function fetchFullPlatform(id: number) {
        const [full] = await sql`
          SELECT p.id, p.name, p.logo_emoji, p.description, p.category, p.status, p.responsible_name,
                 p.launch_date, p.users_count, p.revenue, p.monthly_costs, p.pricing_model, p.price_per_user, p.paying_users_count, p.public_link, p.repo_link,
                 p.prod_link, p.staging_link, p.created_at,
                 COALESCE((SELECT json_agg(t.tech) FROM platform_tech_stack t WHERE t.platform_id = p.id), '[]') AS tech
          FROM platforms p WHERE p.id = ${id}
        `;
        return full;
      }

      if (req.method === "GET") {
        const rows = await sql`
          SELECT p.id, p.name, p.logo_emoji, p.description, p.category, p.status, p.responsible_name,
                 p.launch_date, p.users_count, p.revenue, p.monthly_costs, p.pricing_model, p.price_per_user, p.paying_users_count, p.public_link, p.repo_link,
                 p.prod_link, p.staging_link, p.created_at,
                 COALESCE((SELECT json_agg(t.tech) FROM platform_tech_stack t WHERE t.platform_id = p.id), '[]') AS tech
          FROM platforms p ORDER BY p.created_at DESC
        `;
        return res.status(200).json(rows);
      }

      if (req.method === "PATCH") {
        const body = req.body ?? {};
        if (!body.id) return res.status(400).json({ error: "id é obrigatório" });

        if (body.fields) {
          const f = body.fields;
          const nextPricingModel = f.pricing_model ?? null;
          const nextPricePerUser = f.price_per_user ?? null;
          const nextPayingUsers = f.paying_users_count ?? null;
          // Se o modelo for Assinatura, a receita é sempre preço x assinantes (calculada aqui,
          // ignorando qualquer valor de "revenue" enviado direto pra esse caso).
          const [currentP] = await sql`SELECT pricing_model, price_per_user, paying_users_count FROM platforms WHERE id = ${body.id}`;
          const effectiveModel = nextPricingModel ?? currentP?.pricing_model ?? "Não monetizado";
          const effectivePrice = nextPricePerUser ?? currentP?.price_per_user ?? 0;
          const effectivePaying = nextPayingUsers ?? currentP?.paying_users_count ?? 0;
          const computedRevenue = effectiveModel === "Assinatura" ? Number(effectivePrice) * Number(effectivePaying) : (f.revenue ?? null);

          const found = await sql`
            UPDATE platforms SET
              name = COALESCE(${f.name ?? null}, name),
              logo_emoji = COALESCE(${f.logo_emoji ?? null}, logo_emoji),
              description = COALESCE(${f.description ?? null}, description),
              category = COALESCE(${f.category ?? null}, category),
              status = COALESCE(${f.status ?? null}, status),
              launch_date = COALESCE(${f.launch_date ?? null}, launch_date),
              users_count = COALESCE(${f.users_count ?? null}, users_count),
              pricing_model = COALESCE(${nextPricingModel}, pricing_model),
              price_per_user = COALESCE(${nextPricePerUser}, price_per_user),
              paying_users_count = COALESCE(${nextPayingUsers}, paying_users_count),
              revenue = COALESCE(${computedRevenue}, revenue),
              monthly_costs = COALESCE(${f.monthly_costs ?? null}, monthly_costs),
              public_link = COALESCE(${f.public_link ?? null}, public_link),
              repo_link = COALESCE(${f.repo_link ?? null}, repo_link),
              prod_link = COALESCE(${f.prod_link ?? null}, prod_link),
              staging_link = COALESCE(${f.staging_link ?? null}, staging_link)
            WHERE id = ${body.id} RETURNING id
          `;
          if (found.length === 0) return res.status(404).json({ error: "Plataforma não encontrada" });

          if (Array.isArray(f.tech)) {
            await sql`DELETE FROM platform_tech_stack WHERE platform_id = ${body.id}`;
            for (const t of f.tech) {
              if (t) await sql`INSERT INTO platform_tech_stack (platform_id, tech) VALUES (${body.id}, ${t}) ON CONFLICT DO NOTHING`;
            }
          }
          return res.status(200).json(await fetchFullPlatform(body.id));
        }
        return res.status(400).json({ error: "Nada para atualizar" });
      }

      if (req.method === "DELETE") {
        const platId = Number(req.query.id);
        if (!platId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM platforms WHERE id = ${platId}`;
        return res.status(204).end();
      }

      const {
        name, description, category, tech, logo_emoji, status, launch_date,
        users_count, revenue, monthly_costs, public_link, repo_link, prod_link, staging_link,
        pricing_model, price_per_user, paying_users_count,
      } = req.body ?? {};
      if (!name) return res.status(400).json({ error: "Nome é obrigatório" });
      const responsibleName = niceName(user);
      const model = pricing_model || "Não monetizado";
      const finalRevenue = model === "Assinatura" ? Number(price_per_user ?? 0) * Number(paying_users_count ?? 0) : (revenue ?? 0);
      const [platform] = await sql`
        INSERT INTO platforms (name, description, category, status, responsible_name, logo_emoji, launch_date, users_count, revenue, monthly_costs, public_link, repo_link, prod_link, staging_link, pricing_model, price_per_user, paying_users_count)
        VALUES (${name}, ${description ?? null}, ${category ?? null}, ${status || "Ideia"}, ${responsibleName}, ${logo_emoji ?? null}, ${launch_date ?? null}, ${users_count ?? 0}, ${finalRevenue}, ${monthly_costs ?? 0}, ${public_link ?? null}, ${repo_link ?? null}, ${prod_link ?? null}, ${staging_link ?? null}, ${model}, ${price_per_user ?? 0}, ${paying_users_count ?? 0})
        RETURNING id
      `;
      if (Array.isArray(tech)) {
        for (const t of tech) {
          if (t) await sql`INSERT INTO platform_tech_stack (platform_id, tech) VALUES (${platform.id}, ${t}) ON CONFLICT DO NOTHING`;
        }
      }
      return res.status(201).json(await fetchFullPlatform(platform.id));
    }

    case "content": {
      async function fetchFullContent(id: number) {
        const [full] = await sql`
          SELECT p.id, p.title, p.caption, p.platform, p.type, p.scheduled_date, p.responsible_name,
                 p.status, p.cta, p.created_at,
                 COALESCE((SELECT json_agg(h.hashtag) FROM content_hashtags h WHERE h.post_id = p.id), '[]') AS hashtags
          FROM content_posts p WHERE p.id = ${id}
        `;
        return full;
      }

      if (req.method === "GET") {
        const rows = await sql`
          SELECT p.id, p.title, p.caption, p.platform, p.type, p.scheduled_date, p.responsible_name,
                 p.status, p.cta, p.created_at,
                 COALESCE((SELECT json_agg(h.hashtag) FROM content_hashtags h WHERE h.post_id = p.id), '[]') AS hashtags
          FROM content_posts p ORDER BY p.created_at DESC
        `;
        return res.status(200).json(rows);
      }

      if (req.method === "PATCH") {
        const body = req.body ?? {};
        if (!body.id) return res.status(400).json({ error: "id é obrigatório" });

        if (body.fields) {
          const f = body.fields;
          const found = await sql`
            UPDATE content_posts SET
              title = COALESCE(${f.title ?? null}, title),
              caption = COALESCE(${f.caption ?? null}, caption),
              platform = COALESCE(${f.platform ?? null}, platform),
              type = COALESCE(${f.type ?? null}, type),
              scheduled_date = COALESCE(${f.scheduled_date ?? null}, scheduled_date),
              status = COALESCE(${f.status ?? null}, status),
              cta = COALESCE(${f.cta ?? null}, cta)
            WHERE id = ${body.id} RETURNING id
          `;
          if (found.length === 0) return res.status(404).json({ error: "Conteúdo não encontrado" });

          if (Array.isArray(f.hashtags)) {
            await sql`DELETE FROM content_hashtags WHERE post_id = ${body.id}`;
            for (const h of f.hashtags) {
              if (h) await sql`INSERT INTO content_hashtags (post_id, hashtag) VALUES (${body.id}, ${h}) ON CONFLICT DO NOTHING`;
            }
          }
          return res.status(200).json(await fetchFullContent(body.id));
        }
        return res.status(400).json({ error: "Nada para atualizar" });
      }

      if (req.method === "DELETE") {
        const postId = Number(req.query.id);
        if (!postId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM content_posts WHERE id = ${postId}`;
        return res.status(204).end();
      }

      const { title, caption, platform, type: postType, scheduled_date, cta, hashtags, status } = req.body ?? {};
      if (!title) return res.status(400).json({ error: "Título é obrigatório" });
      const responsibleName = niceName(user);
      const [post] = await sql`
        INSERT INTO content_posts (title, caption, platform, type, scheduled_date, responsible_name, status, cta)
        VALUES (${title}, ${caption ?? null}, ${platform ?? null}, ${postType ?? null}, ${scheduled_date || null}, ${responsibleName}, ${status || "Ideia"}, ${cta ?? null})
        RETURNING id
      `;
      if (Array.isArray(hashtags)) {
        for (const h of hashtags) {
          if (h) await sql`INSERT INTO content_hashtags (post_id, hashtag) VALUES (${post.id}, ${h}) ON CONFLICT DO NOTHING`;
        }
      }
      return res.status(201).json(await fetchFullContent(post.id));
    }

    case "article-revisions": {
      if (req.method === "GET") {
        const articleId = Number(req.query.articleId);
        if (!articleId) return res.status(400).json({ error: "articleId é obrigatório" });
        const rows = await sql`
          SELECT id, article_id, title, content, author_name, created_at
          FROM knowledge_article_revisions WHERE article_id = ${articleId} ORDER BY created_at DESC
        `;
        return res.status(200).json(rows);
      }
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Método não permitido" });
    }

    case "article-files": {
      if (req.method === "GET") {
        const articleId = Number(req.query.articleId);
        if (!articleId) return res.status(400).json({ error: "articleId é obrigatório" });
        const rows = await sql`
          SELECT id, article_id, name, url, path, size_bytes, content_type, uploaded_by, created_at
          FROM knowledge_article_files WHERE article_id = ${articleId} ORDER BY created_at DESC
        `;
        return res.status(200).json(rows);
      }
      if (req.method === "POST") {
        const { article_id, name, url, path, size_bytes, content_type } = req.body ?? {};
        if (!article_id || !name || !url || !path) return res.status(400).json({ error: "Dados do arquivo incompletos" });
        const [file] = await sql`
          INSERT INTO knowledge_article_files (article_id, name, url, path, size_bytes, content_type, uploaded_by)
          VALUES (${article_id}, ${name}, ${url}, ${path}, ${size_bytes ?? null}, ${content_type ?? null}, ${niceName(user)})
          RETURNING id, article_id, name, url, path, size_bytes, content_type, uploaded_by, created_at
        `;
        return res.status(201).json(file);
      }
      if (req.method === "DELETE") {
        const fileId = Number(req.query.id);
        if (!fileId) return res.status(400).json({ error: "id é obrigatório" });
        await sql`DELETE FROM knowledge_article_files WHERE id = ${fileId}`;
        return res.status(204).end();
      }
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).json({ error: "Método não permitido" });
    }

    case "project-files-all": {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método não permitido" });
      }
      const rows = await sql`
        SELECT f.id, f.project_id, p.name AS project_name, p.client AS project_client,
               f.name, f.url, f.path, f.size_bytes, f.content_type, f.uploaded_by, f.created_at
        FROM project_files f
        JOIN projects p ON p.id = f.project_id
        ORDER BY p.name ASC, f.created_at DESC
      `;
      return res.status(200).json(rows);
    }

    case "company-settings": {
      if (req.method === "GET") {
        const [row] = await sql`SELECT name, cnpj, sector, email, website, address, logo_url FROM company_settings WHERE id = 1`;
        return res.status(200).json(row ?? { name: "", cnpj: "", sector: "", email: "", website: "", address: "", logo_url: "" });
      }
      if (req.method === "PATCH") {
        const { name, cnpj, sector, email, website, address, logo_url } = req.body ?? {};
        await sql`
          INSERT INTO company_settings (id, name, cnpj, sector, email, website, address, logo_url, updated_at)
          VALUES (1, ${name ?? null}, ${cnpj ?? null}, ${sector ?? null}, ${email ?? null}, ${website ?? null}, ${address ?? null}, ${logo_url ?? null}, now())
          ON CONFLICT (id) DO UPDATE SET
            name = ${name ?? null}, cnpj = ${cnpj ?? null}, sector = ${sector ?? null},
            email = ${email ?? null}, website = ${website ?? null}, address = ${address ?? null},
            logo_url = COALESCE(${logo_url ?? null}, company_settings.logo_url), updated_at = now()
        `;
        const [row] = await sql`SELECT name, cnpj, sector, email, website, address, logo_url FROM company_settings WHERE id = 1`;
        return res.status(200).json(row);
      }
      res.setHeader("Allow", "GET, PATCH");
      return res.status(405).json({ error: "Método não permitido" });
    }

    case "user-settings": {
      if (req.method === "GET") {
        const [row] = await sql`SELECT dark_mode, accent_color, notifications FROM user_settings WHERE firebase_uid = ${user.uid}`;
        return res.status(200).json(row ?? { dark_mode: false, accent_color: "#06B6D4", notifications: {} });
      }
      if (req.method === "PATCH") {
        const { dark_mode, accent_color, notifications } = req.body ?? {};
        const [current] = await sql`SELECT dark_mode, accent_color, notifications FROM user_settings WHERE firebase_uid = ${user.uid}`;
        const merged = {
          dark_mode: dark_mode !== undefined ? dark_mode : (current?.dark_mode ?? false),
          accent_color: accent_color ?? current?.accent_color ?? "#06B6D4",
          notifications: notifications ? { ...(current?.notifications ?? {}), ...notifications } : (current?.notifications ?? {}),
        };
        await sql`
          INSERT INTO user_settings (firebase_uid, dark_mode, accent_color, notifications, updated_at)
          VALUES (${user.uid}, ${merged.dark_mode}, ${merged.accent_color}, ${JSON.stringify(merged.notifications)}, now())
          ON CONFLICT (firebase_uid) DO UPDATE SET
            dark_mode = ${merged.dark_mode}, accent_color = ${merged.accent_color},
            notifications = ${JSON.stringify(merged.notifications)}, updated_at = now()
        `;
        return res.status(200).json(merged);
      }
      res.setHeader("Allow", "GET, PATCH");
      return res.status(405).json({ error: "Método não permitido" });
    }

    case "all-deadlines": {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método não permitido" });
      }
      const projectDeadlines = await sql`
        SELECT id, name AS title, deadline AS date, status FROM projects
        WHERE deadline IS NOT NULL AND status NOT IN ('Concluído', 'Cancelado')
      `;
      const goalDeadlines = await sql`
        SELECT id, title, deadline AS date, status FROM goals
        WHERE deadline IS NOT NULL AND status NOT IN ('Concluída', 'Cancelada')
      `;
      const contentDeadlines = await sql`
        SELECT id, title, scheduled_date AS date, status FROM content_posts
        WHERE scheduled_date IS NOT NULL AND status NOT IN ('Publicado', 'Cancelado')
      `;
      return res.status(200).json({
        projects: projectDeadlines,
        goals: goalDeadlines,
        content: contentDeadlines,
      });
    }

    case "global-search": {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método não permitido" });
      }
      const q = String(req.query.q ?? "").trim();
      if (q.length < 2) return res.status(200).json([]);
      const like = `%${q}%`;

      const [projects, leads, ideas, content, platforms, articles] = await Promise.all([
        sql`SELECT id, name AS title, client AS subtitle FROM projects WHERE name ILIKE ${like} LIMIT 5`,
        sql`SELECT id, name AS title, company AS subtitle FROM crm_leads WHERE name ILIKE ${like} OR company ILIKE ${like} LIMIT 5`,
        sql`SELECT id, title, category AS subtitle FROM ideas WHERE title ILIKE ${like} LIMIT 5`,
        sql`SELECT id, title, platform AS subtitle FROM content_posts WHERE title ILIKE ${like} LIMIT 5`,
        sql`SELECT id, name AS title, category AS subtitle FROM platforms WHERE name ILIKE ${like} LIMIT 5`,
        sql`SELECT id, title, author_name AS subtitle FROM knowledge_articles WHERE title ILIKE ${like} LIMIT 5`,
      ]);

      const mk = (rows: any[], page: string, icon: string) => rows.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle ?? "", page, icon }));

      return res.status(200).json([
        ...mk(projects, "projects", "📁"),
        ...mk(leads, "crm", "👤"),
        ...mk(ideas, "ideas", "💡"),
        ...mk(content, "content", "📝"),
        ...mk(platforms, "platforms", "🌐"),
        ...mk(articles, "knowledge", "📖"),
      ]);
    }

    case "notifications": {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método não permitido" });
      }
      const overdueProjects = await sql`
        SELECT id, name, deadline FROM projects
        WHERE deadline IS NOT NULL AND deadline < CURRENT_DATE AND status NOT IN ('Concluído', 'Cancelado')
        ORDER BY deadline ASC LIMIT 5
      `;
      const soonGoals = await sql`
        SELECT id, title, deadline FROM goals
        WHERE deadline IS NOT NULL AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days' AND status NOT IN ('Concluída', 'Cancelada')
        ORDER BY deadline ASC LIMIT 5
      `;
      const overdueFinance = await sql`
        SELECT id, description, date, type FROM financial_transactions
        WHERE status != 'Confirmado' AND date < CURRENT_DATE
        ORDER BY date ASC LIMIT 5
      `;
      const todayEvents = await sql`
        SELECT id, title, start_time FROM agenda_events
        WHERE date = CURRENT_DATE AND status = 'Pendente'
        ORDER BY start_time ASC LIMIT 5
      `;

      const items = [
        ...overdueProjects.map((p: any) => ({ id: `proj-${p.id}`, text: `Projeto "${p.name}" está com o prazo vencido`, color: "#EF4444", page: "projects" })),
        ...soonGoals.map((g: any) => ({ id: `goal-${g.id}`, text: `Meta "${g.title}" vence em breve`, color: "#F59E0B", page: "goals" })),
        ...overdueFinance.map((f: any) => ({ id: `fin-${f.id}`, text: `Lançamento "${f.description}" está pendente e vencido`, color: "#EF4444", page: "financial" })),
        ...todayEvents.map((e: any) => ({ id: `ev-${e.id}`, text: `Compromisso hoje: "${e.title}"${e.start_time ? ` às ${String(e.start_time).slice(0, 5)}` : ""}`, color: "#06B6D4", page: "agenda" })),
      ];
      return res.status(200).json(items);
    }

    default:
      return res.status(404).json({ error: `Recurso "${type}" não existe` });
  }
}
