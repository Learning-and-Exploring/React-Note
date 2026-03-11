# Note Frontend

## Running locally

1. Copy the env example and adjust if your API is not on port 4000:
   ```bash
   cp .env.example .env
   # VITE_API_URL defaults to /api; keep it when using nginx or dev proxy
   ```
2. Start the backend (Docker compose under `infra/` or your own process) on port 4000.
3. Start the client:
   ```bash
   npm install
   npm run dev
   ```

The dev server proxies `/api` to `http://localhost:4000`, matching the nginx setup in `infra/nginx` that will sit in front of both services in production.
