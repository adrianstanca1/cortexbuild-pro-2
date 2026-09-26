// ── Subcontractors Skill — management + AI matching ─────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function subcontractorsSkill(f) {
  

  // ── List ──────────────────────────────────────────────────────────────────
  f.get('/api/subcontractors', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { trade } = req.query
      const conds = [eq(schema.subcontractors.workspace_id, req.user.workspace_id)]
      if (trade) conds.push(eq(schema.subcontractors.trade, trade))
      return await db.select().from(schema.subcontractors).where(conds).orderBy(desc(schema.subcontractors.rating))
    },
  })

  // ── Get one ───────────────────────────────────────────────────────────────
  f.get('/api/subcontractors/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const sub = await db.select().from(schema.subcontractors)
        .where(and(eq(schema.subcontractors.id, req.params.id), eq(schema.subcontractors.workspace_id, req.user.workspace_id)))
        .get()
      if (!sub) return { error: 'Not found', status: 404 }
      return sub
    },
  })

  // ── Create ────────────────────────────────────────────────────────────────
  f.post('/api/subcontractors', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { name, trade, contact, email, phone } = req.body
      const id = createId()
      await db.insert(schema.subcontractors).values({
        id, workspace_id: req.user.workspace_id,
        name, trade, contact: contact || null,
        email: email || null, phone: phone || null,
        rating: 0, completed_jobs: 0, reliability: 50,
      })
      return db.select().from(schema.subcontractors).where(eq(schema.subcontractors.id, id)).get()
    },
  })

  // ── Update ────────────────────────────────────────────────────────────────
  f.patch('/api/subcontractors/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['name','trade','contact','email','phone','rating','completed_jobs','avg_days','reliability','specializations','metadata']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      await db.update(schema.subcontractors)
        .set(Object.fromEntries(fields.map(f => [f, req.body[f]])))
        .where(and(eq(schema.subcontractors.id, req.params.id), eq(schema.subcontractors.workspace_id, req.user.workspace_id)))
      return db.select().from(schema.subcontractors).where(eq(schema.subcontractors.id, req.params.id)).get()
    },
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  f.delete('/api/subcontractors/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.subcontractors).where(and(eq(schema.subcontractors.id, req.params.id), eq(schema.subcontractors.workspace_id, req.user.workspace_id)))
      return { status: 'deleted' }
    },
  })

  // ── Bid Opportunities ─────────────────────────────────────────────────────
  f.get('/api/bid-opportunities', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, status } = req.query
      const conds = [eq(schema.bid_opportunities.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.bid_opportunities.project_id, project_id))
      if (status) conds.push(eq(schema.bid_opportunities.status, status))
      return await db.select().from(schema.bid_opportunities).where(conds).orderBy(desc(schema.bid_opportunities.created_at))
    },
  })

  f.post('/api/bid-opportunities', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, scope_desc, estimated_value, trade } = req.body
      const id = createId()
      await db.insert(schema.bid_opportunities).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        scope_desc, estimated_value: estimated_value || null,
        trade: trade || null,
        status: 'draft',
      })
      return db.select().from(schema.bid_opportunities).where(eq(schema.bid_opportunities.id, id)).get()
    },
  })

  f.patch('/api/bid-opportunities/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['scope_desc','estimated_value','trade','status','awarded_to','published_at','awarded_at']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'estimated_value') v = v ? String(v) : null
        if (f === 'published_at') v = v ? new Date(v).toISOString() : null
        if (f === 'awarded_at') v = v ? new Date(v).toISOString() : null
        return { [f]: v }
      })
      await db.update(schema.bid_opportunities)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.bid_opportunities.id, req.params.id), eq(schema.bid_opportunities.workspace_id, req.user.workspace_id)))
      return db.select().from(schema.bid_opportunities).where(eq(schema.bid_opportunities.id, req.params.id)).get()
    },
  })

  f.delete('/api/bid-opportunities/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.bid_opportunities).where(and(eq(schema.bid_opportunities.id, req.params.id), eq(schema.bid_opportunities.workspace_id, req.user.workspace_id)))
      return { status: 'deleted' }
    },
  })

  // ── Bids ──────────────────────────────────────────────────────────────────
  f.get('/api/subcontractor-bids', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { opportunity_id, status } = req.query
      const conds = [eq(schema.subcontractor_bids.workspace_id, req.user.workspace_id)]
      if (opportunity_id) conds.push(eq(schema.subcontractor_bids.bid_id, opportunity_id))
      if (status) conds.push(eq(schema.subcontractor_bids.status, status))
      return await db.select().from(schema.subcontractor_bids).where(conds.length ? and(...conds) : undefined).orderBy(desc(schema.subcontractor_bids.submitted_at))
    },
  })

  f.post('/api/subcontractor-bids', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { opportunity_id, subcontractor_id, amount, currency, duration_days, notes } = req.body
      const id = createId()
      await db.insert(schema.subcontractor_bids).values({
        id, opportunity_id, subcontractor_id, amount: amount || null,
        currency: currency || 'GBP', duration_days: duration_days || null,
        notes: notes || null, submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      return db.select().from(schema.subcontractor_bids).where(eq(schema.subcontractor_bids.id, id)).get()
    },
  })

  // ── AI Subcontractor Matching ─────────────────────────────────────────────
  f.post('/api/subcontractors/match', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { trade, scope_desc, project_id } = req.body
      if (!trade && !scope_desc) return { error: 'trade or scope_desc required', status: 400 }

      const candidates = await db.select().from(schema.subcontractors)
        .where(and(eq(schema.subcontractors.workspace_id, req.user.workspace_id)))
        .orderBy(desc(schema.subcontractors.rating), desc(schema.subcontractors.completed_jobs))

      const scored = candidates
        .filter(c => c.trade === trade || (c.specializations && JSON.parse(c.specializations || '[]').includes(trade)))
        .map(c => ({
          ...c,
          score: c.rating * 0.4 + (c.completed_jobs / 100) * 0.3 + c.reliability * 0.3,
        }))
        .sort((a, b) => b.score - a.score)

      return { matches: scored, scope: { trade, scope_desc, project_id } }
    },
  })
}
