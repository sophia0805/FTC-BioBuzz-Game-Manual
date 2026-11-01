# FTC BioBuzz Game Manual Chatbot

Ask questions about the 2025-2026 FTC game manual. The backend stores a PDF breakdown on disk so it is not rebuilt on every request or restart.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set API_KEY
python build_index.py  # optional: create storage/manual_index.json
uvicorn app:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The Next.js app proxies `/api/chat` to the FastAPI backend.

## Render deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). The root `render.yaml` defines both the Python API and the Next.js UI.
