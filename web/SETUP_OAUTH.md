# Setting Up GitHub OAuth for Andji Web

## 1. Create GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Andji (or your app name)
   - **Homepage URL**: `https://andji-web.onrender.com` (or your domain)
   - **Authorization callback URL**: `https://andji-web.onrender.com/api/auth/callback/github`
4. Click "Register application"
5. Save the **Client ID** and generate a **Client Secret**

## 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update these values in `.env.local`:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `ANDJI_GITHUB_ID`: Your GitHub OAuth App Client ID
- `ANDJI_GITHUB_SECRET`: Your GitHub OAuth App Client Secret
- `NEXTAUTH_URL`: Your web app URL (e.g., https://andji-web.onrender.com)

## 3. Deploy to Render

### Create New Web Service on Render:

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: andji-web
   - **Environment**: Node
   - **Build Command**: `cd web && npm install && npm run build`
   - **Start Command**: `cd web && npm start`
   - **Instance Type**: Free or Starter

### Add Environment Variables in Render:

Go to Environment tab and add:
- `DATABASE_URL` (same as backend)
- `NEXTAUTH_URL` (your web service URL)
- `NEXTAUTH_SECRET` (generate secure random string)
- `ANDJI_GITHUB_ID` (from GitHub OAuth app)
- `ANDJI_GITHUB_SECRET` (from GitHub OAuth app)
- `NEXT_PUBLIC_ANDJI_BACKEND_URL` (backend URL without https://)
- `NEXT_PUBLIC_ANDJI_APP_URL` (full web app URL with https://)

## 4. Update CLI Configuration

In your CLI app, update the environment variables to point to the web app:
- `NEXT_PUBLIC_ANDJI_APP_URL`: Your web app URL (for auth endpoints)
- `NEXT_PUBLIC_ANDJI_BACKEND_URL`: Keep pointing to backend (for WebSocket)

## 5. Database Setup

The web app uses the same database as the backend. Tables are already created from migrations.

## Testing

1. Run locally first:
```bash
cd web
npm install
npm run dev
```

2. Visit http://localhost:3000/login
3. Test GitHub login flow

## Architecture

- **Web App** (Next.js on Render): Handles authentication, user management, billing
  - `/api/auth/*` - NextAuth endpoints
  - `/api/auth/cli/*` - CLI authentication endpoints
  - `/login` - Login page

- **Backend** (Express on Render): Handles agent execution, WebSocket connections
  - `/ws` - WebSocket endpoint for agent communication
  - No auth endpoints (removed, now in web app)

- **CLI** (npm package): Connects to both
  - Auth requests → Web App
  - Agent requests → Backend WebSocket