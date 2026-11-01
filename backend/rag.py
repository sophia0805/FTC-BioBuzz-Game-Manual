import hashlib
import json
import os
import re
from pathlib import Path

from pypdf import PdfReader
from rank_bm25 import BM25Okapi

BASE_DIR = Path(__file__).resolve().parent
PDF_PATH = Path(os.getenv("PDF_PATH", BASE_DIR / "game_manual.pdf"))
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", BASE_DIR / "storage"))
INDEX_PATH = STORAGE_DIR / "manual_index.json"

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
TOP_K = 4

_chunks: list[dict] | None = None
_bm25: BM25Okapi | None = None


def pdf_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _chunk_page(page_number: int, text: str) -> list[dict]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    chunks = []
    start = 0
    while start < len(cleaned):
        end = min(start + CHUNK_SIZE, len(cleaned))
        piece = cleaned[start:end].strip()
        if piece:
            chunks.append({"page": page_number, "text": piece})
        if end == len(cleaned):
            break
        start = max(end - CHUNK_OVERLAP, start + 1)
    return chunks


def build_breakdown(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    chunks: list[dict] = []
    for index, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        chunks.extend(_chunk_page(index, page_text))

    for index, chunk in enumerate(chunks):
        chunk["id"] = index
    return chunks


def save_breakdown(chunks: list[dict], fingerprint: str) -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"pdf_sha256": fingerprint, "chunks": chunks}
    INDEX_PATH.write_text(json.dumps(payload), encoding="utf-8")


def load_saved_breakdown(fingerprint: str) -> list[dict] | None:
    if not INDEX_PATH.exists():
        return None
    try:
        payload = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if payload.get("pdf_sha256") != fingerprint:
        return None
    chunks = payload.get("chunks")
    if not isinstance(chunks, list) or not chunks:
        return None
    return chunks


def load_or_build_breakdown() -> list[dict]:
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"Game manual PDF not found at {PDF_PATH}")

    fingerprint = pdf_sha256(PDF_PATH)
    chunks = load_saved_breakdown(fingerprint)
    if chunks is not None:
        print(f"Loaded stored game-manual breakdown ({len(chunks)} chunks)")
        return chunks

    print("Building game-manual breakdown from PDF...")
    chunks = build_breakdown(PDF_PATH)
    save_breakdown(chunks, fingerprint)
    print(f"Stored game-manual breakdown ({len(chunks)} chunks) at {INDEX_PATH}")
    return chunks


def init_retriever() -> None:
    global _chunks, _bm25
    if _chunks is not None and _bm25 is not None:
        return
    _chunks = load_or_build_breakdown()
    _bm25 = BM25Okapi([tokenize(chunk["text"]) for chunk in _chunks])


def retrieve_context(query: str, top_k: int = TOP_K) -> str:
    init_retriever()
    assert _chunks is not None and _bm25 is not None

    scores = _bm25.get_scores(tokenize(query))
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    parts = []
    for index in ranked:
        chunk = _chunks[index]
        parts.append(f"[Page {chunk['page']}]\n{chunk['text']}")
    return "\n\n".join(parts)
