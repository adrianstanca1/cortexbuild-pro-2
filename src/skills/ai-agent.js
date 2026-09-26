// ── AI Agent Skill — Natural language dispatch, parallel skill invocation ──
import { db } from '../db.js'
import * as schema from '../schema.js'
import { eq, and, desc, sql } from 'drizzle-orm'
import { ollamaChat } from '../ai.js'
import { createId } from '@paralleldrive/cuid2'
import { subscribe, publish } from '../pubsub.js'

export default function aiAgentSkill(f) {
  

  // ── Chat endpoint — NL dispatch ──────────────────────────────────────────
  f.post('/api/ai/agent', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { message, project_id, ctx } = req.body

      // Save user message
      await db.insert(schema.ai_conversations).values({
        id: createId(), user_id: req.user.userId || req.user.id, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      })

      // Load conversation history for this project
      const history = await db.select().from(schema.ai_conversations)
        .where(and(eq(schema.ai_conversations.workspace_id, req.user.workspace_id), eq(schema.ai_conversations.project_id, project_id || null)))
        .orderBy(asc(schema.ai_conversations.created_at))
        .limit(20)

      const system = `You are Cortex — the AI Site Agent for a construction management platform. You help construction professionals manage their projects.

Available actions you can suggest or perform:
- **Projects**: list, create, update, delete projects and tasks
- **Risks**: analyze project risks, create risk entries, track mitigation
- **Snags**: report site defects from photos, track resolution
- **RFIs**: create RFIs, auto-generate from snags, track answers
- **Daily Logs**: record daily progress, crew counts, weather
- **Subcontractors**: manage sub network, list bids, award opportunities
- **Bid Opportunities**: create scope, publish for bids, award to subs

When the user asks you to do something, respond conversationally with what you're doing, then return a structured JSON object.

Example: "I've analyzed Project X for risks. Here are the top 3 risks I found..." then return JSON.

Respond in a helpful, professional construction-expert tone. Mention specific project details when relevant.`


      const messages = [
        { role: 'system', content: system },
        ...history.filter(h => h.role === 'assistant').slice(-10).map(h => ({ role: 'assistant', content: h.content })),
        ...history.filter(h => h.role === 'user').slice(-10).map(h => ({ role: 'user', content: h.content })),
        { role: 'user', content: message },
      ]

      const response = await ollamaChat(messages, {
        temperature: 0.7,
        maxTokens: 1000,
      })

      // Save assistant response
      const assistantId = createId()
      await db.insert(schema.ai_conversations).values({
        id: assistantId, workspace_id: req.user.workspace_id,
        project_id: project_id || null,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      })

      // Try to extract actionable JSON from response
      let action = null
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) action = JSON.parse(jsonMatch[0])
      } catch {}

      // Publish event for other skills to react
      publish('ai.message.received', { userId: req.user.userId, message, response, action, project_id })

      return { response, action, conversation_id: assistantId }
    },
  })

  // ── Get conversation history ──────────────────────────────────────────────
  f.get('/api/ai/conversations', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { project_id } = req.query
      return await db.select().from(schema.ai_conversations)
        .where(and(eq(schema.ai_conversations.workspace_id, req.user.workspace_id),
          project_id ? eq(schema.ai_conversations.project_id, project_id) : undefined))
        .orderBy(asc(schema.ai_conversations.created_at))
    },
  })

  // ── AI Chat ────────────────────────────────────────────────────────────────
  f.post('/api/ai/chat', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { message, conversation_id } = req.body
      if (!message) return { error: 'Message required', status: 400 }

      const userId = req.user.userId || req.user.id
      const workspaceId = req.user.workspace_id
      console.error('[ai-chat] user:', JSON.stringify({ userId, workspaceId, full: req.user }))
      if (!userId) return { error: 'Auth required', status: 401 }

      // Get or create conversation
      let conv = null
      if (conversation_id) {
        conv = await db.select().from(schema.ai_conversations)
          .where(and(eq(schema.ai_conversations.id, conversation_id), eq(schema.ai_conversations.workspace_id, workspaceId)))
          .get()
      }
      if (!conv) {
        const id = createId()
        await db.insert(schema.ai_conversations).values({
          id, user_id: userId, workspace_id: workspaceId,
          project_id: null,
          role: 'user',
          content: message.slice(0, 200),
          title: message.slice(0, 50),
          created_at: new Date().toISOString(),
        })
        conv = await db.select().from(schema.ai_conversations).where(eq(schema.ai_conversations.id, id)).get()
        if (!conv) { conv = { id, user_id: userId, workspace_id: workspaceId, project_id: null, content: message.slice(0,200), role: "user" } }
      }

      // Build message history from conversation (use content as fallback)
      const ollamaMessages = [{ role: 'user', content: message }]

      // Call Ollama
      let reply = 'AI agent is not available (Ollama not running).'
      try {
        reply = await ollamaChat({ messages: ollamaMessages, model: 'llama3.2' })
      } catch {}

        await db.update(schema.ai_conversations)
          .set({ content: reply.slice(0, 5000), role: 'assistant' })
          .where(eq(schema.ai_conversations.id, conv.id))

      return {
        conversation_id: conv.id,
        reply: reply,
      }
    },
  })

  f.get('/api/ai/jobs', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const { status } = req.query
      const conds = [eq(schema.ai_jobs.workspace_id, req.user.workspace_id)]
      if (status) conds.push(eq(schema.ai_jobs.status, status))
      return await db.select().from(schema.ai_jobs).where(conds).orderBy(desc(schema.ai_jobs.created_at))
    },
  })

  // ── Subscribe to pubsub events ────────────────────────────────────────────
  // rfis.js already handles 'rfi.auto_created' — this is intentionally blank
  // preserve hook point for future extensions
}

function asc(col) { return col }
