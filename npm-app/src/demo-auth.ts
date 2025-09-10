import { writeFileSync } from 'fs'
import { backendUrl } from './config'
import { CREDENTIALS_PATH } from './credentials'
import type { User } from '@andji/common/util/credentials'

/**
 * Demo authentication - simplified login for MVP
 * No browser needed, instant authentication
 */
export async function demoLogin(fingerprintId: string): Promise<User | null> {
  try {
    // Use the demo auth endpoint - always succeeds
    const response = await fetch(`${backendUrl}/api/auth/demo/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprintId }),
    })

    if (!response.ok) {
      console.error('Demo login failed:', await response.text())
      return null
    }

    const data = await response.json()
    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      authToken: data.user.authToken || 'demo-token-mvp-2024',
      fingerprintId: fingerprintId,
      fingerprintHash: 'demo-hash',
    }

    // Save credentials locally
    writeFileSync(CREDENTIALS_PATH, JSON.stringify(user, null, 2))
    
    return user
  } catch (error) {
    console.error('Demo login error:', error)
    return null
  }
}

/**
 * Check demo auth status - always returns authenticated
 */
export async function checkDemoStatus(): Promise<User | null> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/demo/status`)
    
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      authToken: data.user.authToken || 'demo-token-mvp-2024',
      fingerprintId: 'demo',
      fingerprintHash: 'demo-hash',
    }
  } catch (error) {
    return null
  }
}