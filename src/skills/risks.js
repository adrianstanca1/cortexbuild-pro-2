// ── Predictive Risk Skill ──────────────────────────────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { ollamaChat } from '../ai.js'
import { createId } from '@paralleldrive/cuid2'

export default function risksSkill(f) {
  

  // ── List risks ────────────────────────────────────────────────────────────
  f.get('/api/risks', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, status, min_score } = req.query
      const conds = [eq(schema.risks.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.risks.project_id, project_id))
      if (status) conds.push(eq(schema.risks.status, status))
      if (min_score) conds.push(gt(schema.risks.risk_score, parseInt(min_score)))
      return await db.select().from(schema.risks).where(conds).orderBy(sql`${schema.risks.risk_score} DESC`)
    },
  })

  // ── Create risk ───────────────────────────────────────────────────────────
  f.post('/api/risks', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, type, title, probability, impact, predicted_date, mitigation } = req.body
      const id = createId()
      const prob = probability ?? 50
      const imp = impact ?? 50
      await db.insert(schema.risks).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        type, title,
        probability: prob, impact: imp,
        risk_score: Math.round((prob * imp * 4) / 10),
        status: 'open',
        predicted_date: predicted_date ? new Date(predicted_date).toISOString() : null,
        mitigation: mitigation || null,
        ai_source: JSON.stringify({ manual: true }),
      })
      return db.select().from(schema.risks).where(eq(schema.risks.id, id)).get()
    },
  })

  // ── Update risk ───────────────────────────────────────────────────────────
  f.patch('/api/risks/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['type','title','probability','impact','status','predicted_date','mitigation','rsi','cp_70_30','cp_60_40','moisture_regulation','euronorm_minimum','safety','cost','weather']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'risk_score') return { risk_score: Math.round(((req.body.probability ?? 50) * (req.body.impact ?? 50) * 4) / 10) }
        if (f === 'predicted_date') v = v ? new Date(v).toISOString() : null
        return { [f]: v }
      })
      await db.update(schema.risks)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.risks.id, req.params.id), eq(schema.risks.workspace_id, req.user.workspace_id)))
      const updated = await db.select().from(schema.risks).where(eq(schema.risks.id, req.params.id)).get()
      if (!updated) return { error: 'Risk not found', status: 404 }
      return updated
    },
  })

  // ── Delete risk ───────────────────────────────────────────────────────────
  f.delete('/api/risks/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const risk = await db.select().from(schema.risks)
        .where(and(eq(schema.risks.id, req.params.id), eq(schema.risks.workspace_id, req.user.workspace_id)))
        .get()
      await db.delete(schema.risks).where(and(eq(schema.risks.id, req.params.id), eq(schema.risks.workspace_id, req.user.workspace_id)))
      return risk
    },
  })

  // ── AI Risk Scan ──────────────────────────────────────────────────────────
  f.post('/api/risks/ai-scan', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const projectId = req.body.project_id || req.query.project_id
      if (!projectId) return { error: 'Project ID required', status: 400 }

      const project = await db.select().from(schema.projects).where(and(eq(schema.projects.id, projectId), eq(schema.projects.workspace_id, req.user.workspace_id))).get()
      if (!project) return { error: 'Project not found', status: 404 }

      const existingRisks = await db.select().from(schema.risks)
        .where(and(eq(schema.risks.project_id, projectId), eq(schema.risks.workspace_id, req.user.workspace_id)))

      const messages = [
        { role: 'system', content: `You are a senior construction project risk analyst. Analyze this project for realistic risks and return a JSON array.

Project: name="${project.name}", value=£${project.value || 0}, status="${project.status}", progress=${project.pct || 0}%, due=${project.due || 'not set'}, addr="${project.addr || 'not set'}".

Existing risks: ${existingRisks.length > 0 ? existingRisks.map(r => `${r.type}: ${r.title} (score: ${r.risk_score})`).join('\n') : 'none'}.

Return a JSON array of risk objects, each with: type, title, probability (0-100), impact (0-100), predicted_date (ISO date string or null), mitigation (string or null).

Focus on real, data-grounded risks — be specific and concrete.` },
        { role: 'user', content: 'Analyze and return ONLY the JSON array.' },
      ]

      const analysis = await ollamaChat(messages, { temperature: 0.4 })
      let parsed = []
      try { parsed = JSON.parse(analysis || '[]') } catch { parsed = [] }

      const inserted = []
      for (const risk of parsed) {
        const key = `${risk.type}|${risk.title.toLowerCase().trim()}`
        const existing = existingRisks.find(r => `${r.type}|${r.title.toLowerCase().trim()}` === key)
        const id = createId()
        const prob = risk.probability ?? 50
        const imp = risk.impact ?? 50

        if (existing) {
          await db.update(schema.risks)
            .set({
              probability: prob, impact: imp,
              risk_score: Math.round((prob * imp * 4) / 10),
              predicted_date: risk.predicted_date ? new Date(risk.predicted_date).toISOString() : null,
              mitigation: risk.mitigation || existing.mitigation,
              ai_source: JSON.stringify({ model: 'llama3.2', agent: 'risk_scanner' }),
              updated_at: new Date().toISOString(),
            }).where(eq(schema.risks.id, existing.id))
        } else {
          await db.insert(schema.risks).values({
            id, workspace_id: req.user.workspace_id,
            project_id: projectId,
            type: risk.type || 'general',
            title: risk.title,
            probability: prob, impact: imp,
        risk_score: Math.round((prob * imp * 4) / 10),
            status: 'open',
            predicted_date: risk.predicted_date ? new Date(risk.predicted_date).toISOString() : null,
            mitigation: risk.mitigation || null,
            ai_source: JSON.stringify({ model: 'llama3.2', agent: 'risk_scanner', confidence: 85 }),
          })
        }
        inserted.push(id)
      }

      // Recalculate project risk score
      const totalScore = await db.select({ s: sql<string>`COALESCE(SUM(risk_score), 0)` })
        .from(schema.risks)
        .where(and(eq(schema.risks.project_id, projectId), eq(schema.risks.workspace_id, req.user.workspace_id)))
        .get()

      const avgScore = parseFloat(totalScore?.s || '0') / (parsed.length || 1)
      await db.update(schema.projects)
        .set({
          risk_score: Math.min(100, avgScore),
          health_color: avgScore > 60 ? 'red' : avgScore > 30 ? 'yellow' : 'green',
        })
        .where(eq(schema.projects.id, projectId))

      const risks = await db.select().from(schema.risks)
        .where(and(eq(schema.risks.project_id, projectId), eq(schema.risks.workspace_id, req.user.workspace_id)))
        .orderBy(desc(schema.risks.risk_score))

      return { risks, analysis, project_risk: { risk_score: avgScore, health_color: avgScore > 60 ? 'red' : avgScore > 30 ? 'yellow' : 'green' } }
    },
  })
}
