import http from 'http'

import { setupBigQuery } from '@andji/bigquery'
import { flushAnalytics, initAnalytics } from '@andji/common/analytics'
import { env } from '@andji/internal'
import cors from 'cors'
import express from 'express'

import {
  getTracesForUserHandler,
  relabelForUserHandler,
} from './admin/relabelRuns'
import { validateAgentNameHandler } from './api/agents'
import cliAuthRouter from './api/auth/cli'
import { getLoginPageHTML } from './api/auth/login-page'
import { isRepoCoveredHandler } from './api/org'
import usageHandler from './api/usage'
import { checkAdmin } from './util/check-auth'
import { logger } from './util/logger'
import {
  sendRequestReconnect,
  waitForAllClientsDisconnected,
  listen as webSocketListen,
} from './websockets/server'

// Grace period for graceful shutdown
const SHUTDOWN_GRACE_PERIOD_MS = 30 * 60 * 1000

const app = express()
const port = env.PORT

app.use(express.json())

app.get('/', (req, res) => {
  res.send('andji Backend Server')
})

app.get('/healthz', (req, res) => {
  res.send('ok')
})

// Login page for CLI authentication
app.get('/login', async (req, res) => {
  const authCode = req.query.auth_code as string
  if (!authCode) {
    res.status(400).send('Missing auth code')
    return
  }
  
  // Parse the auth code
  const [fingerprintId, expiresAt, fingerprintHash] = authCode.split('.')
  
  // For MVP, auto-create a session when login page is accessed
  // In production, this would verify with GitHub OAuth
  try {
    const db = (await import('@andji/common/db')).default
    const schemaModule = await import('@andji/common/db/schema')
    const schema = schemaModule
    const { eq } = await import('drizzle-orm')
    const { nanoid } = await import('nanoid')
    
    // First, ensure the fingerprint exists in the database
    const existingFingerprint = await db
      .select()
      .from(schema.fingerprint)
      .where(eq(schema.fingerprint.id, fingerprintId))
      .limit(1)
    
    if (existingFingerprint.length === 0) {
      // Create the fingerprint entry
      await db.insert(schema.fingerprint).values({
        id: fingerprintId,
        sig_hash: fingerprintHash,
        created_at: new Date(),
      })
    }
    
    // Check if user exists or create a demo user
    let userId = 'demo-user-' + fingerprintId.substring(0, 8)
    
    const existingUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1)
    
    if (existingUser.length === 0) {
      // Create a demo user
      await db.insert(schema.user).values({
        id: userId,
        email: `demo-${fingerprintId.substring(0, 8)}@andji.local`,
        name: 'Demo User',
        emailVerified: new Date(),
      })
    }
    
    // Create or update session
    const sessionToken = nanoid()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    // Delete any existing sessions for this fingerprint
    await db
      .delete(schema.session)
      .where(eq(schema.session.fingerprint_id, fingerprintId))
    
    // Create new session
    await db.insert(schema.session).values({
      sessionToken,
      userId,
      expires,
      fingerprint_id: fingerprintId,
      fingerprint_hash: fingerprintHash,
    })
    
    logger.info({ fingerprintId, userId }, 'Created demo session for CLI login')
  } catch (error) {
    logger.error({ error }, 'Error creating demo session')
  }
  
  res.send(getLoginPageHTML(authCode))
})

app.post('/api/usage', usageHandler)
app.post('/api/orgs/is-repo-covered', isRepoCoveredHandler)
app.get('/api/agents/validate-name', validateAgentNameHandler)

// CLI authentication routes
app.use('/api/auth/cli', cliAuthRouter)

// Enable CORS for preflight requests to the admin relabel endpoint
app.options('/api/admin/relabel-for-user', cors())

// Add the admin routes with CORS and auth
app.get(
  '/api/admin/relabel-for-user',
  cors(),
  checkAdmin,
  getTracesForUserHandler,
)

app.post(
  '/api/admin/relabel-for-user',
  cors(),
  checkAdmin,
  relabelForUserHandler,
)

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error({ err }, 'Something broke!')
    res.status(500).send('Something broke!')
  },
)

// Initialize BigQuery before starting the server
setupBigQuery().catch((err) => {
  logger.error(
    {
      error: err,
      stack: err.stack,
      message: err.message,
      name: err.name,
      code: err.code,
      details: err.details,
    },
    'Failed to initialize BigQuery client',
  )
})

initAnalytics()

const server = http.createServer(app)

server.listen(port, () => {
  logger.debug(`🚀 Server is running on port ${port}`)
  console.log(`🚀 Server is running on port ${port}`)
})
webSocketListen(server, '/ws')

let shutdownInProgress = false
// Graceful shutdown handler for both SIGTERM and SIGINT
async function handleShutdown(signal: string) {
  flushAnalytics()
  if (env.NEXT_PUBLIC_CB_ENVIRONMENT === 'dev') {
    server.close((error) => {
      console.log('Received error closing server', { error })
    })
    process.exit(0)
  }
  if (shutdownInProgress) {
    console.log(`\nReceived ${signal}. Already shutting down...`)
    return
  }
  shutdownInProgress = true
  console.log(
    `\nReceived ${signal}. Starting ${SHUTDOWN_GRACE_PERIOD_MS / 60000} minute graceful shutdown period...`,
  )

  // Don't shutdown, instead ask clients to disconnect from us
  sendRequestReconnect()

  waitForAllClientsDisconnected().then(() => {
    console.log('All clients disconnected. Shutting down...')
    process.exit(0)
  })

  // Wait for the grace period to allow clients to switch to new instances
  await new Promise((resolve) => setTimeout(resolve, SHUTDOWN_GRACE_PERIOD_MS))

  console.log('Grace period over. Proceeding with final shutdown...')

  process.exit(1)
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))

process.on('unhandledRejection', (reason, promise) => {
  // Don't rethrow the error, just log it. Keep the server running.
  const stack = reason instanceof Error ? reason.stack : undefined
  const message = reason instanceof Error ? reason.message : undefined
  const name = reason instanceof Error ? reason.name : undefined
  console.error('unhandledRejection', message, reason, stack)
  logger.error(
    {
      reason,
      stack,
      message,
      name,
      promise,
    },
    `Unhandled promise rejection: ${reason instanceof Error ? reason.message : 'Unknown reason'}`,
  )
})

process.on('uncaughtException', (err, origin) => {
  console.error('uncaughtException', {
    error: err,
    message: err.message,
    stack: err.stack,
    name: err.name,
    origin,
  })
  logger.fatal(
    {
      err,
      stack: err.stack,
      message: err.message,
      name: err.name,
      origin,
    },
    'uncaught exception detected',
  )

  server.close(() => {
    process.exit(1)
  })

  // If a graceful shutdown is not achieved after 1 second,
  // shut down the process completely
  setTimeout(() => {
    process.abort() // exit immediately and generate a core dump file
  }, 1000).unref()
  process.exit(1)
})
