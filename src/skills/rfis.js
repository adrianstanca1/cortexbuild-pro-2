// ── RFIs Skill — Auto-generation from snags & events ────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { subscribe, publish } from '../pubsub.js'

export default function rfisSkill(f) {
  // ── Subscribe to pubsub events ─────────────────────────────────────────────
  subscribe('snag.found', async (data) => {
    if (!data.project_id) return
    try {
      const id = createId()
      await db.insert(schema.rfis).values({
        id, workspace_id: data.workspace_id,
        project_id: data.project_id,
        question: `Snag found: ${data.description || 'Site defect reported'}. Please clarify or provide instruction.`,
        ref_location: data.location,
        priority: 'high', status: 'open', submitted_to: 'designer',
        ai_generated: 1, ai_trigger: 'snag_auto_rfi',
        ai_context: JSON.stringify(data),
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      publish('rfi.auto_created', { from_snag_id: data.id, rfi_id: id })
    } catch (e) { console.error('RFI sub:', e) }
  })

  // ── List ────────────────────────────────────────────────────────────────────
  f.get('/api/rfis', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, status, priority, ai_generated } = req.query
      const conds = [eq(schema.rfis.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.rfis.project_id, project_id))
      if (status) conds.push(eq(schema.rfis.status, status))
      if (priority) conds.push(eq(schema.rfis.priority, priority))
      if (ai_generated !== undefined) conds.push(eq(schema.rfis.ai_generated, ai_generated === 'true' ? 1 : 0))
      return await db.select().from(schema.rfis).where(conds).orderBy(sql`${schema.rfis.created_at.name} DESC`)
    },
  })

  // ── Get one ───────────────────────────────────────────────────────────────
  f.get('/api/rfis/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const rfi = await db.select().from(schema.rfis)
        .where(and(eq(schema.rfis.id, req.params.id), eq(schema.rfis.workspace_id, req.user.workspace_id)))
        .get()
      if (!rfi) return { error: 'Not found', status: 404 }
      return rfi
    },
  })

  // ── Create ────────────────────────────────────────────────────────────────
  f.post('/api/rfis', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, question, ref_drawing, ref_location, priority, submitted_to } = req.body
      if (!question) return { error: 'Question required', status: 400 }
      const id = createId()
      await db.insert(schema.rfis).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        question,
        ref_drawing: ref_drawing || null,
        ref_location: ref_location || null,
        priority: priority || 'med',
        status: 'open',
        submitted_to: submitted_to || null,
        ai_generated: 0,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      return db.select().from(schema.rfis).where(eq(schema.rfis.id, id)).get()
    },
  })

  // ── Update / Answer ───────────────────────────────────────────────────────
  f.patch('/api/rfis/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['question','ref_drawing','ref_location','priority','status','submitted_to','answered_by','answer']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        return { [f]: v }
      })
      await db.update(schema.rfis)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.rfis.id, req.params.id), eq(schema.rfis.workspace_id, req.user.workspace_id)))
      return db.select().from(schema.rfis).where(eq(schema.rfis.id, req.params.id)).get()
    },
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  f.delete('/api/rfis/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.rfis).where(and(eq(schema.rfis.id, req.params.id), eq(schema.rfis.workspace_id, req.user.workspace_id)))
      const deleted = await db.select().from(schema.rfis).where(eq(schema.rfis.id, req.params.id)).get()
      return deleted || { error: 'RFI not found', status: 404 }
    },
  })

  // ── AI Auto-Generate RFI from a snag ─────────────────────────────────────
  f.post('/api/rfis/auto', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { snag_id } = req.body
      if (!snag_id) return { error: 'snag_id required', status: 400 }

      const snag = await db.select().from(schema.snags).where(eq(schema.snags.id, snag_id)).get()
      if (!snag) return { error: 'Snag not found', status: 404 }

      const id = createId()
      await db.insert(schema.rfis).values({
        id, workspace_id: req.user.workspace_id,
        project_id: snag.project_id,
        question: `Snag detected: ${snag.ai_description || snag.location || 'unspecified'}. Please clarify or provide instruction on how to proceed.`,
        ref_location: snag.photo_url || snag.location || null,
        priority: 'high',
        status: 'open',
        submitted_to: 'designer',
        ai_generated: 1,
        ai_trigger: 'snag_auto_rfi',
        ai_context: JSON.stringify({
          snag_id: snag.id,
          snag_type: snag.snag_type,
          location: snag.photo_url || snag.location || null,
          description: snag.ai_description || null,
        }),
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

      return { rfi: db.select().from(schema.rfis).where(eq(schema.rfis.id, id)).get(), action: 'auto_generated_from_snag' }
    },
  })
}