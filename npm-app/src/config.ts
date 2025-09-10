export const isProduction = process.env.NEXT_PUBLIC_CB_ENVIRONMENT === 'prod'

// Separate URLs for backend (WebSocket) and web app (auth/UI)
const BACKEND_URL = process.env.NEXT_PUBLIC_ANDJI_BACKEND_URL || 'andji-backend.onrender.com'
const APP_URL = process.env.NEXT_PUBLIC_ANDJI_APP_URL || 'https://andji-web.onrender.com'

// WebSocket URL points to backend
export const websocketUrl =
  BACKEND_URL.includes('localhost')
    ? `ws://${BACKEND_URL}/ws`
    : `wss://${BACKEND_URL}/ws`

// Website URL points to web app (for auth endpoints)
export const websiteUrl = APP_URL

// Backend URL for direct API calls
export const backendUrl =
  BACKEND_URL.includes('localhost')
    ? `http://${BACKEND_URL}`
    : `https://${BACKEND_URL}`

export const npmAppVersion = process.env.NEXT_PUBLIC_NPM_APP_VERSION
