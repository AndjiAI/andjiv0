import path from 'path'
import { fileURLToPath } from 'url'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

import { env } from '@andji/internal'

/**
 * Runs Drizzle migrations using the SQL files in common/src/db/migrations.
 * Designed to be called at service startup so platforms without shell access
 * (e.g., Render free tier) can still apply schema changes.
 */
export async function runMigrations(): Promise<void> {
  // Use a dedicated, single-connection client for migrator
  const client = postgres(env.DATABASE_URL, { max: 1 })
  const db = drizzle(client)

  // Resolve the migrations folder relative to this file
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.join(__dirname, 'migrations')

  await migrate(db, { migrationsFolder })

  await client.end()
}

export default runMigrations

