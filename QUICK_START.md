# Quick start

## Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Chat at http://localhost:3000. Deploy both services with the steps in `DEPLOYMENT.md`.
