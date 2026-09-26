// ── Projects Skill ──────────────────────────────────────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, or, ilike, desc, asc, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'

export default function projectsSkill(f) {
  

  // ── List ───────────────────────────────────────────────────────────────────
  f.get('/api/projects', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { status, search, limit = 100, offset = 0 } = req.query
      const conds = [eq(schema.projects.workspace_id, req.user.workspace_id)]
      if (status) conds.push(eq(schema.projects.status, status))
      if (search) conds.push(
        or(
          ilike(schema.projects.name, `%${search}%`),
          ilike(schema.projects.client, `%${search}%`),
          ilike(schema.projects.addr, `%${search}%`),
        )
      )
      return await db.select().from(schema.projects).where(conds).orderBy(sql`${schema.projects.created_at.name} DESC`).limit(limit).offset(offset)
    },
  })

  // ── Get one ────────────────────────────────────────────────────────────────
  f.get('/api/projects/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const project = await db.select().from(schema.projects)
        .where(and(eq(schema.projects.id, req.params.id), eq(schema.projects.workspace_id, req.user.workspace_id)))
        .get()
      if (!project) return { error: 'Not found', status: 404 }
      return project
    },
  })

  // ── Create ────────────────────────────────────────────────────────────────
  f.post('/api/projects', {
    onRequest: [f.authenticate],
    validation: {
      body: {
        name: z.string().min(1).max(200),
        client: z.string().max(200).optional(),
        value: z.string().optional(),
        addr: z.string().max(500).optional(),
        due: z.string().optional(),
        status: z.string().optional(),
      },
    },
    handler: async (req) => {
      const { name, client, value, addr, due, status } = req.body
      const id = createId()
      await db.insert(schema.projects).values({
        id, workspace_id: req.user.workspace_id,
        name, client: client || null,
        value: value || null,
        addr: addr || null,
        due: due ? new Date(due).toISOString() : null,
        status: status || 'quoting',
      })
      return db.select().from(schema.projects).where(eq(schema.projects.id, id)).get()
    },
  })

  // ── Update ────────────────────────────────────────────────────────────────
  f.patch('/api/projects/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['name','client','value','pct','status','addr','due','team_count','margin','risk_score','risk_factors','health_color']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      if (!fields.length) return { error: 'No valid fields' }

      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'due') v = v ? new Date(v).toISOString() : null
        return { [f]: v }
      })
      await db.update(schema.projects)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.projects.id, req.params.id), eq(schema.projects.workspace_id, req.user.workspace_id)))
        .returning()
      return await db.select().from(schema.projects).where(eq(schema.projects.id, req.params.id)).get()
    },
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  f.delete('/api/projects/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const project = await db.select().from(schema.projects)
        .where(and(eq(schema.projects.id, req.params.id), eq(schema.projects.workspace_id, req.user.workspace_id)))
        .get()
      await db.delete(schema.projects)
        .where(and(eq(schema.projects.id, req.params.id), eq(schema.projects.workspace_id, req.user.workspace_id)))
      return project
    },
  })

  // ── Tasks ──────────────────────────────────────────────────────────────────
  f.get('/api/tasks', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, done, prio } = req.query
      const conds = [eq(schema.tasks.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.tasks.project_id, project_id))
      if (done !== undefined) conds.push(eq(schema.tasks.done, done === 'true' || done === true))
      if (prio) conds.push(eq(schema.tasks.prio, prio))
      return await db.select().from(schema.tasks).where(conds).orderBy(schema.tasks.done, sql`${schema.tasks.prio} DESC`, asc(schema.tasks.due))
    },
  })

  f.post('/api/tasks', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, title, assignee, due, prio } = req.body
      const id = createId()
      await db.insert(schema.tasks).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        title, assignee: assignee || null,
        due: due ? new Date(due).toISOString() : null,
        prio: prio || 'med',
      }).returning()
      return db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get()
    },
  })

  f.patch('/api/tasks/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['title','assignee','due','prio','done']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'due') v = v ? new Date(v).toISOString() : null
        if (f === 'done') v = v === 'true' || v === true ? 1 : 0
        return { [f]: v }
      })
      await db.update(schema.tasks)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.tasks.id, req.params.id), eq(schema.tasks.workspace_id, req.user.workspace_id)))
      return db.select().from(schema.tasks).where(eq(schema.tasks.id, req.params.id)).get()
    },
  })

  f.delete('/api/tasks/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.tasks).where(and(eq(schema.tasks.id, req.params.id), eq(schema.tasks.workspace_id, req.user.workspace_id)))
      return { status: 'deleted' }
    },
  })
}
