// ── Snags Skill — AI photo-based defect detection ──────────────────────────
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export default function snagsSkill(f) {
  

  // ── List ──────────────────────────────────────────────────────────────────
  f.get('/api/snags', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, status } = req.query
      const conds = [eq(schema.snags.workspace_id, req.user.workspace_id)]
      if (project_id) conds.push(eq(schema.snags.project_id, project_id))
      if (status) conds.push(eq(schema.snags.status, status))
      return await db.select().from(schema.snags).where(conds).orderBy(desc(schema.snags.priority), desc(schema.snags.created_at))
    },
  })

  // ── Get one ───────────────────────────────────────────────────────────────
  f.get('/api/snags/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const snag = await db.select().from(schema.snags)
        .where(and(eq(schema.snags.id, req.params.id), eq(schema.snags.workspace_id, req.user.workspace_id)))
        .get()
      if (!snag) return { error: 'Not found', status: 404 }
      return snag
    },
  })

  // ── Create (photo upload + AI analysis) ──────────────────────────────────
  f.post('/api/snags', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id, photo_url, location, priority } = req.body
      const id = createId()

      // Save original
      await db.insert(schema.snags).values({
        id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        photo_url: photo_url || null,
        location: location || null,
        priority: priority || 'med',
        status: 'open',
        ai_confidence: 0,
        created_at: new Date().toISOString(),
      })
      const saved = await db.select().from(schema.snags).where(eq(schema.snags.id, id)).get()
      if (saved && photo_url && process.env.OLLAMA_BASE_URL) {
        try {
          const analysis = await analyzePhoto(photo_url, project_id)
          await db.update(schema.snags)
            .set({
              ai_description: analysis.description,
              ai_confidence: analysis.confidence,
              snag_type: analysis.snag_type,
              location: analysis.location || saved.location,
            })
            .where(eq(schema.snags.id, id))
        } catch {}
      }

      return db.select().from(schema.snags).where(eq(schema.snags.id, id)).get()
    },
  })

  // ── Update ────────────────────────────────────────────────────────────────
  f.patch('/api/snags/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const allowed = ['priority','status','assigned_to','assignee','due','ai_description','ai_confidence','snag_type','location','photo_url']
      const fields = Object.keys(req.body).filter(k => allowed.includes(k))
      const sets = fields.map(f => {
        let v = req.body[f]
        if (f === 'due') v = v ? new Date(v).toISOString() : null
        if (f === 'status' && v === 'resolved') v = 'resolved'
        return { [f]: v }
      })
      await db.update(schema.snags)
        .set(Object.assign({}, ...sets))
        .where(and(eq(schema.snags.id, req.params.id), eq(schema.snags.workspace_id, req.user.workspace_id)))
      return db.select().from(schema.snags).where(eq(schema.snags.id, req.params.id)).get()
    },
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  f.delete('/api/snags/:id', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      await db.delete(schema.snags).where(and(eq(schema.snags.id, req.params.id), eq(schema.snags.workspace_id, req.user.workspace_id)))
      .returning()
      const deleted = await db.select().from(schema.snags).where(eq(schema.snags.id, req.params.id)).get()
      return deleted || { error: 'Snag not found', status: 404 }
    },
  })
}

// AI photo analysis via Ollama (vision-capable models)
async function analyzePhoto(photoUrl, projectId) {
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: `You are a construction site snag inspector. Analyze this photo for defects, safety issues, or non-compliance. Return ONLY a JSON object with: description (what you see), confidence (0-100), snag_type (hairline, cracks, damp, mould, structural, fire-safety, electrical, plumbing, access, housekeeping, other), location (specific if visible).

Site context: ${projectId ? `Project ID ${projectId}` : 'unknown project'}.` },
        { type: 'image_url', image_url: { url: photoUrl } },
      ],
    },
  ]

  const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2-vision',
      messages,
      stream: false,
    }),
  })

  const data = await response.json()
  let parsed = { description: 'Photo reviewed', confidence: 80, snag_type: 'unknown', location: null }
  try {
    const text = data.message?.content || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0]) || parsed
  } catch { parsed = { ...parsed, description: data.message?.content } }

  return parsed
}
