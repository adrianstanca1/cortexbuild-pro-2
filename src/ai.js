import { fetch as undiciFetch } from 'undici'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export async function ollamaChat({ model = 'llama3.2', messages, stream = false, system, temperature }) {
  const body = { model, messages }
  if (stream) body.stream = true
  if (system) body.system = system
  if (temperature !== undefined) body.temperature = temperature
  const res = await undiciFetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.message?.content || data.response || ''
}

export async function ollamaGenerate({ model = 'llama3.2', prompt, system }) {
  const body = { model, prompt }
  if (system) body.system = system
  const res = await undiciFetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.response || ''
}

export async function ollamaAvailable() {
  try {
    const res = await undiciFetch(`${OLLAMA_URL}/api/version`)
    return res.ok
  } catch {
    return false
  }
}

export async function ollamaVision({ model = 'llama3.2-vision', imageBase64, prompt }) {
  const body = {
    model,
    messages: [{ role: 'user', content: [{ type: 'image', image: imageBase64 }, { type: 'text', text: prompt }] }],
  }
  const res = await undiciFetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Ollama vision error ${res.status}`)
  const data = await res.json()
  return data.message?.content || ''
}

export async function ollamaEmbeddings({ model = 'nomic-embed-text', prompt }) {
  const body = { model, prompt }
  const res = await undiciFetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Ollama embeddings error ${res.status}`)
  const data = await res.json()
  return data.embedding || []
}
