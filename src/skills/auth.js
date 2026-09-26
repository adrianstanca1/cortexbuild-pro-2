// ── Auth Skill ──────────────────────────────────────────────────────────────
import { db } from '../db.js'
import bcrypt from 'bcrypt'
import * as schema from '../schema.js'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  company: z.string().max(200).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})



export default function authPlugin(f) {
  // ── Register ─────────────────────────────────────────────────────────────
  f.post('/api/auth/register', {
    validation: { body: registerSchema },
    handler: async (req) => {
      const { name, email, password, company } = req.body
      const hash = await bcrypt.hash(password, 12)
      const userId = createId()
      const workspaceId = createId()

      const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).get()
      if (existing) return { error: 'Email already registered', status: 409 }

      await db.insert(schema.workspaces).values({
        id: workspaceId,
        name: `${name}'s Workspace`,
        company: company || name,
        plan: 'free',
      })

      await db.insert(schema.users).values({
        id: userId,
        workspace_id: workspaceId,
        name,
        email,
        password_hash: hash,
        role: 'director',
      })

      const token = f.jwt.sign({
        userId,
        workspace_id: workspaceId,
        role: 'director',
        email,
        name,
      })

      return {
        user: { id: userId, name, email, role: 'director', workspace_id: workspaceId },
        token,
      }
    },
  })

  // ── Login ────────────────────────────────────────────────────────────────
  f.post('/api/auth/login', {
    validation: { body: loginSchema },
    handler: async (req) => {
      const { email, password } = req.body
      const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get()

      if (!user) return { error: 'Invalid credentials', status: 401 }
      if (!await bcrypt.compare(password, user.password_hash))
        return { error: 'Invalid credentials', status: 401 }

      const token = f.jwt.sign({
        userId: user.id,
        workspace_id: user.workspace_id,
        role: user.role,
        email: user.email,
        name: user.name,
      })

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspace_id: user.workspace_id,
          cscs: user.cscs,
          safety_score: user.safety_score,
          phone: user.phone,
          avatar_url: user.avatar_url,
        },
        token,
      }
    },
  })

  // ── Me ────────────────────────────────────────────────────────────────────
  f.get('/api/auth/me', {
    onRequest: [f.authenticate],
    handler: async (req) => {
      const user = await db.select().from(schema.users).where(eq(schema.users.id, req.user.userId)).get()
      if (!user) return { error: 'User not found', status: 404 }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspace_id: user.workspace_id,
        cscs: user.cscs,
        safety_score: user.safety_score,
        phone: user.phone,
        avatar_url: user.avatar_url,
      }
    },
  })

  // ── Logout ────────────────────────────────────────────────────────────────
  f.post('/api/auth/logout', async () => ({ ok: true }))
}
