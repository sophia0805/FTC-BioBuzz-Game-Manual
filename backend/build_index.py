from rag import load_or_build_breakdown, INDEX_PATH

if __name__ == "__main__":
    chunks = load_or_build_breakdown()
    print(f"Ready: {len(chunks)} chunks stored at {INDEX_PATH}")
