// ── Reports Skill ────────────────────────────────────────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function reportsSkill(f) {
  

  f.get('/api/reports', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, report_type } = req.query
      const conds = [eq(schema.reports.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.reports.project_id, project_id))
      if (report_type) conds.push(eq(schema.reports.report_type, report_type))
      return await db.select().from(schema.reports).where(conds).orderBy(desc(schema.reports.generated_at))
    },
  })

  f.post('/api/reports', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, report_type, title, content } = req.body
      const id = createId()
      await db.insert(schema.reports).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        report_type, title, content,
        generated_by: req.user.email,
        generated_at: new Date().toISOString(),
      })
      return await db.select().from(schema.reports).where(eq(schema.reports.id, id)).get()
    },
  })

  f.delete('/api/reports/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.reports).where(and(eq(schema.reports.id, req.params.id), eq(schema.reports.workspace_id, req.user.workspace_id)))
      return { status: 'deleted' }
    },
  })
}
