# Deploy backend and frontend on Render

This repo includes a Blueprint at `render.yaml` for two web services:

- `ftc-biobuzz-backend` — FastAPI chatbot over `game_manual.pdf`
- `ftc-biobuzz-frontend` — Next.js chat UI

The backend writes a PDF breakdown to `backend/storage/manual_index.json` (or a Render disk) and reuses it instead of re-parsing the manual on every call.

## Option A: Blueprint (recommended)

1. Push this repository to GitHub.
2. In [Render](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Select the repo. Render will read `render.yaml`.
4. Set the backend secret **API_KEY** (Hack Club AI key).
5. Create the services.

After deploy:

- Backend URL looks like `https://ftc-biobuzz-backend.onrender.com`
- Frontend URL looks like `https://ftc-biobuzz-frontend.onrender.com`

Open the frontend URL to use the chatbot.

## Option B: Manual services

### Backend

- **Root Directory**: `backend`
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment**:
  - `API_KEY` — required
  - `STORAGE_DIR` — optional, default `storage`
- **Disk** (optional but recommended): mount 1 GB at `/opt/render/project/src/backend/storage` and set `STORAGE_DIR` to that path

### Frontend

- **Root Directory**: `frontend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**:
  - `BACKEND_URL` — your backend public URL, for example `https://ftc-biobuzz-backend.onrender.com`
  - `NODE_VERSION` — `20`

The frontend never calls the backend from the browser. It posts to `/api/chat`, and the Next.js server forwards that to `BACKEND_URL`.

## First boot

If `storage/manual_index.json` is missing or the PDF hash changed, the backend parses the PDF once and saves the breakdown. Later starts and `/chat` calls load that file.

## Local check before deploy

```bash
cd backend
pip install -r requirements.txt
python build_index.py
uvicorn app:app --port 8000
```

```bash
cd frontend
npm install
echo 'BACKEND_URL=http://localhost:8000' > .env.local
npm run dev
```
