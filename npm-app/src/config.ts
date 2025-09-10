export const isProduction = process.env.NEXT_PUBLIC_CB_ENVIRONMENT === 'prod'

// Default to production backend if not specified
const BACKEND_URL = process.env.NEXT_PUBLIC_andji_BACKEND_URL || 'andji-backend.onrender.com'
const APP_URL = process.env.NEXT_PUBLIC_andji_APP_URL || 'https://andji-backend.onrender.com'

export const websocketUrl =
  BACKEND_URL.includes('localhost')
    ? `ws://${BACKEND_URL}/ws`
    : `wss://${BACKEND_URL}/ws`

export const websiteUrl = APP_URL
export const backendUrl =
  BACKEND_URL.includes('localhost')
    ? `http://${BACKEND_URL}`
    : `https://${BACKEND_URL}`

export const npmAppVersion = process.env.NEXT_PUBLIC_NPM_APP_VERSION
