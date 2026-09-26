// ── Daily Logs Skill — voice/photo → structured progress log ────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function dailyLogsSkill(f) {
  

  // ── List ──────────────────────────────────────────────────────────────────
  f.get('/api/daily-logs', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, log_date } = req.query
      const conds = [eq(schema.daily_logs.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.daily_logs.project_id, project_id))
      if (log_date) conds.push(eq(schema.daily_logs.log_date, log_date))
      return await db.select().from(schema.daily_logs).where(conds).orderBy(sql`${schema.daily_logs.log_date.name} DESC`)
    },
  })

  // ── Get one ───────────────────────────────────────────────────────────────
  f.get('/api/daily-logs/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const log = await db.select().from(schema.daily_logs)
        .where(and(eq(schema.daily_logs.id, req.params.id), eq(schema.daily_logs.workspace_id, req.user.workspace_id)))
        .get()
      if (!log) return { error: 'Not found', status: 404 }
      return log
    },
  })

  // ── Create (voice/photo → structured log via AI) ─────────────────────────
  f.post('/api/daily-logs', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, log_date, narrative, photos, crew_count } = req.body
      const id = createId()
      let ai_summary = ''
      let ai_extracted = {}

      // If we have narrative text or photos, summarize via AI
      if ((narrative || photos?.length) && process.env.OLLAMA_BASE_URL) {
        try {
          const summary = await summarizeLog(narrative || '', photos || [])
          ai_summary = summary.summary
          ai_extracted = summary.extracted
        } catch {}
      }

      const row = await db.insert(schema.daily_logs).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        log_date: log_date || new Date().toISOString().split('T')[0],
        crew_count: Number(crew_count) || 0,
        narrative: narrative || null,
        ai_summary,
        ai_extracted: JSON.stringify(ai_extracted),
        photos: photos ? JSON.stringify(photos) : null,
        created_by: req.user.email,
        created_at: new Date().toISOString(),
      })
      const log = await db.select().from(schema.daily_logs).where(eq(schema.daily_logs.id, id)).get()
      return { ...log, status: 'logged' }
    },
  })

  // ── Update ────────────────────────────────────────────────────────────────
  f.patch('/api/daily-logs/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['narrative','ai_summary','ai_extracted','log_date','crew_count','photos','created_by']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'log_date') v = new Date(v).toISOString()
        if (f === 'ai_extracted') v = JSON.stringify(v)
        if (f === 'photos') v = JSON.stringify(v)
        return { [f]: v }
      })
      await db.update(schema.daily_logs)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.daily_logs.id, req.params.id), eq(schema.daily_logs.workspace_id, req.user.workspace_id)))
      return db.select().from(schema.daily_logs).where(eq(schema.daily_logs.id, req.params.id)).get()
    },
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  f.delete('/api/daily-logs/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.daily_logs).where(and(eq(schema.daily_logs.id, req.params.id), eq(schema.daily_logs.workspace_id, req.user.workspace_id)))
      const deleted = await db.select().from(schema.daily_logs).where(eq(schema.daily_logs.id, req.params.id)).get()
      return deleted || { error: 'Daily log not found', status: 404 }
    },
  })
}

async function summarizeLog(narrative, photos) {
  const prompt = `
Summarize this site daily log into a concise 2-3 sentence summary and extract structured data.

Narrative: ${narrative || '(no narrative)'}
Photos: ${photos.length || 0}

Return JSON with:
{
  "summary": "2-3 sentence plain English summary of what happened today",
  "extracted": {
    "activities": ["list of activities observed"],
    "issues": ["any issues mentioned"],
    "crew_size": number,
    "weather_mentioned": boolean
  }
}
`
  const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  })
  const data = await res.json()
  let result = { summary: narrative || 'Log recorded', extracted: {} }
  try {
    const match = data.message?.content?.match(/\{[\s\S]*\}/)
    if (match) result = JSON.parse(match[0]) || result
  } catch { result = { ...result, summary: data.message?.content || narrative } }

  return result
}
