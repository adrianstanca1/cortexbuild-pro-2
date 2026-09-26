// ── Generic Document Store Skill ────────────────────────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function documentsSkill(f) {
  

  f.get('/api/docs/:collection/:doc_id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const doc = await db.select().from(schema.documents_store)
        .where(and(
          eq(schema.documents_store.workspace_id, req.user.workspace_id),
          eq(schema.documents_store.collection, req.params.collection),
          eq(schema.documents_store.doc_id, req.params.doc_id)
        ))
        .get()
      if (!doc) return { error: 'Not found', status: 404 }
      return { id: doc.id, collection: doc.collection, doc_id: doc.doc_id, data: doc.data, updated_at: doc.updated_at }
    },
  })

  f.put('/api/docs/:collection/:doc_id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { data } = req.body
      const existing = await db.select().from(schema.documents_store)
        .where(and(
          eq(schema.documents_store.workspace_id, req.user.workspace_id),
          eq(schema.documents_store.collection, req.params.collection),
          eq(schema.documents_store.doc_id, req.params.doc_id)
        ))
        .get()

      const id = existing?.id || createId()
      if (existing) {
        await db.update(schema.documents_store).set({
          data: JSON.stringify(data), updated_at: new Date().toISOString()
        }).where(eq(schema.documents_store.id, id))
      } else {
        await db.insert(schema.documents_store).values({
          id, workspace_id: req.user.workspace_id,
          collection: req.params.collection,
          doc_id: req.params.doc_id,
          data: JSON.stringify(data),
        })
      }
      return { id, collection: req.params.collection, doc_id: req.params.doc_id, data }
    },
  })

  f.delete('/api/docs/:collection/:doc_id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.documents_store).where(and(
        eq(schema.documents_store.workspace_id, req.user.workspace_id),
        eq(schema.documents_store.collection, req.params.collection),
        eq(schema.documents_store.doc_id, req.params.doc_id)
      ))
      return { status: 'deleted' }
    },
  })
}
