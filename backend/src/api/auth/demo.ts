import express from 'express'
import { z } from 'zod'
import { logger } from '../../util/logger'

const router = express.Router()

// Simple demo auth - no database required
const DEMO_TOKEN = 'demo-token-mvp-2024'
const DEMO_USER = {
  id: 'demo-user-001',
  name: 'Demo User',
  email: 'demo@andji.ai',
  authToken: DEMO_TOKEN,
}

// POST /api/auth/demo/login
router.post('/login', async (req, res) => {
  const reqSchema = z.object({
    fingerprintId: z.string(),
  })
  
  const result = reqSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const { fingerprintId } = result.data
  
  logger.info({ fingerprintId }, 'Demo login attempt')

  // Always succeed for demo
  return res.json({
    user: {
      ...DEMO_USER,
      fingerprintId,
    },
    message: 'Demo authentication successful!',
  })
})

// GET /api/auth/demo/status
router.get('/status', async (req, res) => {
  // Always return authenticated for demo
  return res.json({
    user: DEMO_USER,
    message: 'Demo mode - always authenticated',
  })
})

// POST /api/auth/demo/logout
router.post('/logout', async (req, res) => {
  return res.json({ success: true, message: 'Demo logout successful' })
})

export default router