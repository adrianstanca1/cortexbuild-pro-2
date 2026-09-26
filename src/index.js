import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { sql } from 'drizzle-orm'
import db from './db.js'
import { subscribe, publish } from './pubsub.js'
import { ollamaChat, ollamaGenerate } from './ai.js'

import auth from './skills/auth.js'
import projects from './skills/projects.js'
import risks from './skills/risks.js'
import snags from './skills/snags.js'
import rfis from './skills/rfis.js'
import subcontractors from './skills/subcontractors.js'
import dailyLogs from './skills/daily-logs.js'
import aiAgent from './skills/ai-agent.js'
import documents from './skills/documents.js'
import finance from './skills/finance.js'
import team from './skills/team.js'
import reports from './skills/reports.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = Fastify({
  logger: process.env.NODE_ENV !== 'test',
})

// ── Plugins ──────────────────────────────────────────────────────────────────
await app.register(cors, { origin: true, credentials: true })
await app.register(helmet, { contentSecurityPolicy: false })
await app.register(cookie, { secret: process.env.JWT_SECRET || 'changeme' })
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'changeme',
  sign: { expiresIn: '7d' },
})
await app.register(rateLimit, {
  max: 1000, timeWindow: '1 minute',
})

// ── Auth decorator ───────────────────────────────────────────────────────────
app.decorate('authenticate', async (req, reply) => {
  try {
    const decoded = await req.jwtVerify()
    req.user = decoded
  } catch {
    reply.code(401).send({ error: 'Unauthorized', status: 401 })
  }
})

// ── Static files ─────────────────────────────────────────────────────────────
const staticDir = join(__dirname, '..', 'static')
app.get('/favicon.svg', async () => {
  const fs = await import('fs')
  return fs.readFileSync(join(staticDir, 'favicon.svg'), 'utf-8')
})
app.get('/favicon.ico', async () => {
  const fs = await import('fs')
  return fs.readFileSync(join(staticDir, 'favicon.ico'), 'utf-8')
})

// SPA routes — serve index.html for all non-API routes
app.get('*', async (req, reply) => {
  if (req.url.startsWith('/api/')) return
  const fs = await import('fs')
  const html = fs.readFileSync(join(staticDir, 'index.html'), 'utf-8')
  return reply.type('text/html').send(html)
})

// ── Register all skills ──────────────────────────────────────────────────────
auth(app)
projects(app)
risks(app)
snags(app)
rfis(app)
subcontractors(app)
dailyLogs(app)
aiAgent(app)
documents(app)
finance(app)
team(app)
reports(app)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async () => {
  let dbOk = false
  try {
    await db.select({ v: sql`1` }).from(schema.workspaces).get()
    dbOk = true
  } catch {}

  let aiOk = false
  try {
    if (process.env.OLLAMA_BASE_URL) {
      const r = await fetch(`${process.env.OLLAMA_BASE_URL}/api/version`)
      aiOk = r.ok
    } else {
      aiOk = false
    }
  } catch {}

  return {
    status: 'ok',
    version: '3.0.0',
    env: process.env.NODE_ENV || 'development',
    db: dbOk ? 'connected' : 'disconnected',
    ai: aiOk ? 'available' : 'disabled',
    timestamp: new Date().toISOString(),
  }
})

// ── Startup ──────────────────────────────────────────────────────────────────
const port = process.env.PORT || 3000
try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`CortexBuild Pro 2.0 → http://0.0.0.0:${port}`)
  console.log(`  DB:    ${process.env.DATABASE_URL || 'sqlite:cortexbuild.db'}`)
  console.log(`  Ollama: ${process.env.OLLAMA_BASE_URL || 'not configured'}`)
  console.log(`  JWT:   ${process.env.JWT_SECRET ? 'set' : 'default (change in production!)'}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
