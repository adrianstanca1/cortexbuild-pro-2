const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const env = process.env
const needed = ['DATABASE_URL', 'JWT_SECRET']
const missing = needed.filter(k => !env[k] || env[k].startsWith('changeme') || env[k] === 'postgres://postgres:postgres@localhost:5432/cortexbuild')
if (missing.length && process.env.NODE_ENV === 'production') {
  console.error(`[fatal] Missing required env vars: ${missing.join(', ')}`)
  process.exit(1)
}

// Ensure upload dir exists
const uploadDir = env.UPLOAD_DIR || '/tmp/cortexbuild-uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

console.log('[config] Environment loaded')
console.log(`  DATABASE_URL: ${env.DATABASE_URL?.includes('@') ? env.DATABASE_URL.split('@')[1] || 'set' : 'not set'}`)
console.log(`  NODE_ENV: ${env.NODE_ENV || 'development'}`)
console.log(`  PORT: ${env.PORT || 3000}`)
console.log(`  Ollama: ${env.OLLAMA_BASE_URL || 'not configured'}`)
console.log(`  Upload dir: ${uploadDir}`)
