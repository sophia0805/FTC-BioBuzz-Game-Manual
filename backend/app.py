import os
from contextlib import asynccontextmanager

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import init_retriever, retrieve_context

load_dotenv()

API_KEY = os.getenv("API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()
AI_URL = os.getenv("AI_URL", "https://ai.hackclub.com/proxy/v1/chat/completions")
AI_MODEL = os.getenv("AI_MODEL", "meta-llama/llama-3.3-70b-instruct")

allowed_origins = ["*"]
if FRONTEND_URL:
    allowed_origins = [FRONTEND_URL, "http://localhost:3000"]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_retriever()
    yield


app = FastAPI(title="FTC BioBuzz Game Manual Chatbot", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@app.get("/")
def read_root():
    return {"message": "FTC BioBuzz Game Manual API is running", "status": "healthy"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    query = request.message.strip()

    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="API_KEY not found in environment variables",
        )

    try:
        context = retrieve_context(query)
        prompt = f"""You are a knowledgeable assistant for the FIRST Tech Challenge 2026-2027 BioBuzz season.

You have two sources of knowledge — use both:
1. The game manual excerpts provided below (cite page numbers when available).
2. Your general knowledge about FTC BioBuzz, including the game theme, field elements, scoring, robots, and the broader FTC program.

When answering:
- Prioritize the manual excerpts for specific rules and scoring details.
- Supplement with your general knowledge about BioBuzz when the manual doesn't cover it or when context about the game theme, field, or season is helpful.
- Clearly indicate when something comes from the manual (e.g. "According to the manual...") vs. general knowledge (e.g. "Based on what's known about BioBuzz...").
- If neither source has the answer, say so honestly.

Game Manual Excerpts:
{context}

Question: {query}
Answer:"""


        response = requests.post(
            AI_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from AI service: {response.text}",
            )

        payload = response.json()
        answer = payload["choices"][0]["message"]["content"]
        return ChatResponse(response=answer)

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error processing request: {exc}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}")
