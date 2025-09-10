import type { Request } from 'express'

/**
 * Extract auth token from x-andji-api-key header
 */
export function extractAuthTokenFromHeader(req: Request): string | undefined {
  const token = req.headers['x-andji-api-key'] as string | undefined
  // Trim any whitespace that might be present
  return token?.trim()
}