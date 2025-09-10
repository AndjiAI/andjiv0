import db from '@andji/common/db'
import * as schema from '@andji/common/db/schema'
import { genAuthCode } from '@andji/common/util/credentials'
import { env } from '@andji/internal'
import { and, eq, gt } from 'drizzle-orm'
import express from 'express'
import { z } from 'zod'

import { logger } from '../../util/logger'

const router = express.Router()

// POST /api/auth/cli/code
router.post('/code', async (req, res) => {
  const reqSchema = z.object({
    fingerprintId: z.string(),
    referralCode: z.string().optional(),
  })
  
  const result = reqSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const { fingerprintId, referralCode } = result.data

  try {
    const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour
    const fingerprintHash = genAuthCode(
      fingerprintId,
      expiresAt.toString(),
      env.NEXTAUTH_SECRET || 'default-secret-key'
    )

    // Check if this fingerprint has any active sessions
    const existingSession = await db
      .select({
        userId: schema.session.userId,
        expires: schema.session.expires,
      })
      .from(schema.session)
      .where(
        and(
          eq(schema.session.fingerprint_id, fingerprintId),
          gt(schema.session.expires, new Date())
        )
      )
      .limit(1)

    if (existingSession.length > 0) {
      // There's an active session - log this for monitoring
      logger.info(
        {
          fingerprintId,
          existingUserId: existingSession[0].userId,
          event: 'relogin_attempt_with_active_session',
        },
        'Login attempt for fingerprint with active session'
      )
    }

    // Generate login URL
    const APP_URL = env.NEXT_PUBLIC_andji_APP_URL || 'https://andji-backend.onrender.com'
    const loginUrl = `${APP_URL}/login?auth_code=${fingerprintId}.${expiresAt}.${fingerprintHash}${
      referralCode ? `&referral_code=${referralCode}` : ''
    }`

    return res.json({
      fingerprintId,
      fingerprintHash,
      loginUrl,
      expiresAt,
    })
  } catch (error) {
    logger.error({ error }, 'Error generating login code')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/cli/status
router.get('/status', async (req, res) => {
  const fingerprintId = req.query.fingerprintId as string

  if (!fingerprintId) {
    return res.status(400).json({ error: 'Missing fingerprintId' })
  }

  try {
    const session = await db
      .select({
        userId: schema.session.userId,
        expires: schema.session.expires,
      })
      .from(schema.session)
      .where(
        and(
          eq(schema.session.fingerprint_id, fingerprintId),
          gt(schema.session.expires, new Date())
        )
      )
      .limit(1)

    if (session.length === 0) {
      return res.json({ authenticated: false })
    }

    const user = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        name: schema.user.name,
      })
      .from(schema.user)
      .where(eq(schema.user.id, session[0].userId))
      .limit(1)

    if (user.length === 0) {
      return res.json({ authenticated: false })
    }

    return res.json({
      authenticated: true,
      user: user[0],
      expiresAt: session[0].expires,
    })
  } catch (error) {
    logger.error({ error }, 'Error checking auth status')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/cli/logout
router.post('/logout', async (req, res) => {
  const reqSchema = z.object({
    fingerprintId: z.string(),
  })
  
  const result = reqSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const { fingerprintId } = result.data

  try {
    await db
      .delete(schema.session)
      .where(eq(schema.session.fingerprint_id, fingerprintId))

    return res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error logging out')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router