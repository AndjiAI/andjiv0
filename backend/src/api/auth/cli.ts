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
  const reqSchema = z.object({
    fingerprintId: z.string(),
    fingerprintHash: z.string(),
    expiresAt: z.string().transform(Number),
  })
  
  const result = reqSchema.safeParse({
    fingerprintId: req.query.fingerprintId,
    fingerprintHash: req.query.fingerprintHash,
    expiresAt: req.query.expiresAt,
  })
  
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid query parameters' })
  }

  const { fingerprintId, fingerprintHash, expiresAt } = result.data

  // Check if code has expired
  if (Date.now() > expiresAt) {
    logger.info(
      { fingerprintId, fingerprintHash, expiresAt },
      'Auth code expired'
    )
    return res.status(401).json({ error: 'Authentication failed' })
  }

  // Validate the auth code
  const expectedHash = genAuthCode(
    fingerprintId,
    expiresAt.toString(),
    env.NEXTAUTH_SECRET || 'default-secret-key'
  )
  
  if (fingerprintHash !== expectedHash) {
    logger.info(
      { fingerprintId, fingerprintHash, expectedHash },
      'Invalid auth code'
    )
    return res.status(401).json({ error: 'Authentication failed' })
  }

  try {
    // Check for active session with user
    const users = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        name: schema.user.name,
        authToken: schema.session.sessionToken,
      })
      .from(schema.user)
      .leftJoin(schema.session, eq(schema.user.id, schema.session.userId))
      .where(
        and(
          eq(schema.session.fingerprint_id, fingerprintId),
          gt(schema.session.expires, new Date())
        )
      )

    if (users.length === 0) {
      logger.info(
        { fingerprintId, fingerprintHash },
        'No active session found'
      )
      return res.status(401).json({ error: 'Authentication failed' })
    }

    const user = users[0]
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        authToken: user.authToken,
        fingerprintId,
        fingerprintHash,
      },
      message: 'Authentication successful!',
    })
  } catch (error) {
    logger.error({ error }, 'Error checking login status')
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