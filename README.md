<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5dac8ae4-88e8-4630-9fa8-d7740220c217

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend Infrastructure

The backend now includes a dedicated infrastructure layer in `src/server/infrastructure` with:

- Environment-driven runtime config
- Request and security middleware
- Structured JSON request logging
- Health endpoints (`/health`, `/health/live`, `/health/ready`)
- Centralized RBAC permissions
- Graceful shutdown on `SIGINT`/`SIGTERM`

### Backend Environment Variables

Use `.env.example` as reference for:

- `APP_NAME`, `HOST`, `PORT`
- `REQUEST_BODY_LIMIT`
- `PUBLIC_API_CORS_ORIGIN`
- `LOG_REQUESTS`
- `GRACEFUL_SHUTDOWN_TIMEOUT_MS`

### Start Backend

`npm run dev`

The Express server runs with both API and frontend middleware from `server.ts`.
