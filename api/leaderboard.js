import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    try {
      const scores = (await redis.get('leaderboard')) || []
      return res.status(200).json(scores)
    } catch (_) {
      return res.status(500).json({ error: 'failed to load' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, money, creations, toppings } = req.body
      if (!name || typeof money !== 'number') return res.status(400).json({ error: 'invalid' })
      const scores = (await redis.get('leaderboard')) || []
      scores.push({
        name: String(name).slice(0, 16),
        money: Math.round(money),
        creations: Math.round(creations || 0),
        toppings: Math.round(toppings || 0),
        date: Date.now(),
      })
      scores.sort((a, b) => b.money - a.money)
      if (scores.length > 100) scores.length = 100
      await redis.set('leaderboard', scores)
      return res.status(200).json({ ok: true })
    } catch (_) {
      return res.status(500).json({ error: 'failed to save' })
    }
  }

  return res.status(405).json({ error: 'method not allowed' })
}
