// ── PubSub Plugin — in-memory event bus for skill-to-skill coordination ────

const listeners = new Map()
let counter = 0

export function subscribe(event, handler) {
  if (!listeners.has(event)) listeners.set(event, [])
  const id = ++counter
  listeners.get(event).push({ id, handler })
  return id
}

export function unsubscribe(id) {
  for (const [event, subs] of listeners) {
    const idx = subs.findIndex(s => s.id === id)
    if (idx !== -1) {
      subs.splice(idx, 1)
      if (subs.length === 0) listeners.delete(event)
      return true
    }
  }
  return false
}

export async function publish(event, payload = {}) {
  const subs = listeners.get(event) || []
  const results = []
  for (const { handler } of subs) {
    try {
      const result = await handler(payload)
      if (result !== undefined) results.push(result)
    } catch (err) {
      // Silently skip listener errors — one bad handler shouldn't kill the event
    }
  }
  return results
}

export function eventNames() {
  return Array.from(listeners.keys())
}

export { subscribe as on, publish as emit }
