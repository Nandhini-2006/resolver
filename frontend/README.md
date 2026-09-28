# AWS Error Resolver – Frontend

Single-page React (Vite) UI for the FastAPI backend in `Aws_Resolver/backend`.

## Run

1. Start the backend (from `Aws_Resolver/backend`):
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```
2. Start the frontend (from this folder):
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

In development, Vite proxies `/api/*` to `http://localhost:8000`, so no CORS setup is needed.

## Deploying / calling the backend directly

Copy `.env.example` to `.env`, set `VITE_API_URL=https://your-backend`, run `npm run build`,
and add CORS to `app.py`:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```
