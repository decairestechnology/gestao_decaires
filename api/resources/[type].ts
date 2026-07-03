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
          SELECT id, date, description, category, project_id, client, type, value, payment_method, status,
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
              category = ${f.category ?? null},
              client = ${f.client ?? null},
              type = COALESCE(${f.type ?? null}, type),
              value = COALESCE(${f.value ?? null}, value),
              payment_method = ${f.payment_method ?? null},
              date = COALESCE(${f.date ?? null}, date),
              is_recurring = COALESCE(${f.is_recurring ?? null}, is_recurring)
            WHERE id = ${body.id}
            RETURNING id, date, description, category, project_id, client, type, value, payment_method, status, is_recurring, recurring_source_id, created_at
          `;
          if (!updated) return res.status(404).json({ error: "Lançamento não encontrado" });
          return res.status(200).json(updated);
        }

        const { id: txId, status: newStatus } = body;
        if (!txId || !newStatus) return res.status(400).json({ error: "id e status são obrigatórios" });
        const [updated] = await sql`
          UPDATE financial_transactions SET status = ${newStatus}
          WHERE id = ${txId}
          RETURNING id, date, description, category, project_id, client, type, value, payment_method, status, is_recurring, recurring_source_id, created_at
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
      const { description, category, client, type: txType, value, payment_method, date, project_id, status: txStatus, is_recurring, recurring_source_id } = req.body ?? {};
      if (!description || !txType || value === undefined) {
        return res.status(400).json({ error: "Descrição, tipo e valor são obrigatórios" });
      }
      const [tx] = await sql`
        INSERT INTO financial_transactions (date, description, category, client, type, value, payment_method, status, project_id, is_recurring, recurring_source_id)
        VALUES (${date || new Date().toISOString().slice(0, 10)}, ${description}, ${category ?? null}, ${client ?? null}, ${txType}, ${value}, ${payment_method ?? null}, ${txStatus || "Pendente"}, ${project_id ?? null}, ${is_recurring ?? false}, ${recurring_source_id ?? null})
        RETURNING id, date, description, category, project_id, client, type, value, payment_method, status, is_recurring, recurring_source_id, created_at
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
              start_time = ${f.start_time ?? null},
              end_time = ${f.end_time ?? null},
              location = ${f.location ?? null},
              description = ${f.description ?? null},
              type = COALESCE(${f.type ?? null}, type),
              project_id = ${f.project_id ?? null}
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
                 g.priority, g.status, g.category, g.created_at,
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
                 g.priority, g.status, g.category, g.created_at,
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
              description = ${f.description ?? null},
              deadline = ${f.deadline ?? null},
              priority = COALESCE(${f.priority ?? null}, priority),
              category = ${f.category ?? null},
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
              content = ${f.content ?? null},
              category_id = ${f.category_id ?? null},
              project_id = ${f.project_id ?? null},
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
      if (req.method === "GET") {
        const rows = await sql`
          SELECT p.id, p.name, p.logo_emoji, p.description, p.category, p.status, p.responsible_name,
                 p.launch_date, p.users_count, p.revenue, p.monthly_costs, p.public_link, p.repo_link,
                 p.prod_link, p.staging_link, p.created_at,
                 COALESCE((SELECT json_agg(t.tech) FROM platform_tech_stack t WHERE t.platform_id = p.id), '[]') AS tech
          FROM platforms p ORDER BY p.created_at DESC
        `;
        return res.status(200).json(rows);
      }
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

    case "content": {
      if (req.method === "GET") {
        const rows = await sql`
          SELECT p.id, p.title, p.caption, p.platform, p.type, p.scheduled_date, p.responsible_name,
                 p.status, p.cta, p.created_at,
                 COALESCE((SELECT json_agg(h.hashtag) FROM content_hashtags h WHERE h.post_id = p.id), '[]') AS hashtags
          FROM content_posts p ORDER BY p.created_at DESC
        `;
        return res.status(200).json(rows);
      }
      const { title, caption, platform, type: postType, scheduled_date, cta, hashtags } = req.body ?? {};
      if (!title) return res.status(400).json({ error: "Título é obrigatório" });
      const responsibleName = niceName(user);
      const [post] = await sql`
        INSERT INTO content_posts (title, caption, platform, type, scheduled_date, responsible_name, status, cta)
        VALUES (${title}, ${caption ?? null}, ${platform ?? null}, ${postType ?? null}, ${scheduled_date || null}, ${responsibleName}, 'Ideia', ${cta ?? null})
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

    default:
      return res.status(404).json({ error: `Recurso "${type}" não existe` });
  }
}
