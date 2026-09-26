// ── Invoices & Quotes Skill ──────────────────────────────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function financeSkill(f) {
  

  // ── Invoices ────────────────────────────────────────────────────────────────
  f.get('/api/invoices', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, status } = req.query
      const conds = [eq(schema.invoices.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.invoices.project_id, project_id))
      if (status) conds.push(eq(schema.invoices.status, status))
      return await db.select().from(schema.invoices).where(conds).orderBy(desc(schema.invoices.issued))
    },
  })

  f.post('/api/invoices', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, client, amount, status, issued, due } = req.body
      const id = `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`
      await db.insert(schema.invoices).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null, client, amount: amount || null,
        status: status || 'due', issued: issued ? new Date(issued).toISOString() : null,
        due: due ? new Date(due).toISOString() : null,
      }).returning()
      const invoice = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get()
      if (!invoice) return { error: 'Invoice not found', status: 404 }
      return invoice
    },
  })

  f.patch('/api/invoices/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['client','amount','status','issued','due','paid']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'due') v = v ? new Date(v).toISOString() : null
        if (f === 'paid') v = v ? new Date(v).toISOString() : null
        if (f === 'issued') v = v ? new Date(v).toISOString() : null
        return { [f]: v }
      })
      await db.update(schema.invoices)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.invoices.id, req.params.id), eq(schema.invoices.workspace_id, req.user.workspace_id)))
        .returning()
      const invoice = await db.select().from(schema.invoices).where(eq(schema.invoices.id, req.params.id)).get()
      if (!invoice) return { error: 'Invoice not found', status: 404 }
      return invoice
    },
  })

  // ── Quotes ──────────────────────────────────────────────────────────────────
  f.get('/api/quotes', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, status } = req.query
      const conds = [eq(schema.quotes.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.quotes.project_id, project_id))
      if (status) conds.push(eq(schema.quotes.status, status))
      return await db.select().from(schema.quotes).where(conds).orderBy(desc(schema.quotes.issued))
    },
  })

  f.post('/api/quotes', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, client, title, total, status, issued, valid_until, items } = req.body
      const id = `QT-${Date.now().toString(36).toUpperCase().slice(-6)}`
      await db.insert(schema.quotes).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null, client, title: title || null,
        total: total || null,
        status: status || 'draft', issued: issued ? new Date(issued).toISOString() : null,
        valid_until: valid_until ? new Date(valid_until).toISOString() : null,
        items: items ? JSON.stringify(items) : null,
      }).returning()
      const quote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id)).get()
      if (!quote) return { error: 'Quote not found', status: 404 }
      return quote
    },
  })

  f.patch('/api/quotes/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['client','title','total','status','issued','valid_until','items']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'total') v = v ? String(v) : null
        if (f === 'issued') v = v ? new Date(v).toISOString() : null
        if (f === 'valid_until') v = v ? new Date(v).toISOString() : null
        if (f === 'items') v = v ? JSON.stringify(v) : null
        return { [f]: v }
      })
      await db.update(schema.quotes)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.quotes.id, req.params.id), eq(schema.quotes.workspace_id, req.user.workspace_id)))
        .returning()
      const quote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, req.params.id)).get()
      if (!quote) return { error: 'Quote not found', status: 404 }
      return quote
    },
  })
}
