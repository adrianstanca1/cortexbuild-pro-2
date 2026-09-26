// ── Team Members Skill ────────────────────────────────────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function teamSkill(f) {
  

  f.get('/api/team', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { status } = req.query
      const conds = [eq(schema.team_members.workspace_id, req.user.workspace_id)]
      if (status) conds.push(eq(schema.team_members.status, status))
      return await db.select().from(schema.team_members).where(conds).orderBy(sql`${schema.team_members.created_at.name} DESC`)
    },
  })

  f.post('/api/team', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { name, role, site, email, phone, day_rate, cscs, certificates, qualifications, skills, meta, color } = req.body
      const id = createId()
      await db.insert(schema.team_members).values({
        id, workspace_id: req.user.workspace_id,
        name, role: role || null, site: site || null,
        email: email || null, phone: phone || null,
        day_rate: day_rate || null,
        cscs: cscs || null,
        certificates: certificates ? JSON.stringify(certificates) : '[]',
        qualifications: qualifications ? JSON.stringify(qualifications) : '[]',
        skills: skills ? JSON.stringify(skills) : '[]',
        meta: meta ? JSON.stringify(meta) : '{}',
        color: color || null,
      })
      return db.select().from(schema.team_members).where(eq(schema.team_members.id, id)).get()
    },
  })

  f.patch('/api/team/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['name','role','site','email','phone','day_rate','cscs','status','certificates','qualifications','skills','meta','color','hours']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'hours') v = String(v)
        if (f === 'day_rate') v = v ? String(v) : null
        if (f === 'certificates') v = v ? JSON.stringify(v) : '[]'
        if (f === 'qualifications') v = v ? JSON.stringify(v) : '[]'
        if (f === 'skills') v = v ? JSON.stringify(v) : '[]'
        if (f === 'meta') v = v ? JSON.stringify(v) : '{}'
        return { [f]: v }
      })
      await db.update(schema.team_members)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.team_members.id, req.params.id), eq(schema.team_members.workspace_id, req.user.workspace_id)))
      return await db.select().from(schema.team_members).where(eq(schema.team_members.id, req.params.id)).get()
    },
  })

  f.delete('/api/team/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.team_members).where(and(eq(schema.team_members.id, req.params.id), eq(schema.team_members.workspace_id, req.user.workspace_id)))
      const deleted = await db.select().from(schema.team_members).where(eq(schema.team_members.id, req.params.id)).get()
      return deleted || { error: 'Team member not found', status: 404 }
    },
  })
}
