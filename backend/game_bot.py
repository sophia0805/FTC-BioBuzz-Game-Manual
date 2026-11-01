from rag import retrieve_context
from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY = os.getenv("API_KEY")
AI_URL = os.getenv("AI_URL", "https://ai.hackclub.com/proxy/v1/chat/completions")
AI_MODEL = os.getenv("AI_MODEL", "meta-llama/llama-3.3-70b-instruct")


def ask_question(query: str) -> str:
    context = retrieve_context(query)
    prompt = f"""Use the following game rules to answer the question.
Game Rules:
{context}
Question: {query}
Answer based only on the rules provided:"""

    if not API_KEY:
        raise ValueError("API_KEY not found in environment variables. Please set it in .env file.")

    response = requests.post(
        AI_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": AI_MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
    )
    response.raise_for_status()
    answer = response.json()["choices"][0]["message"]["content"]
    print(f"\n Answer: {answer}\n")
    print("-" * 60)
    return answer


if __name__ == "__main__":
    print("\n Ask your own questions (type 'quit' to exit):")
    while True:
        user_query = input("\nYour question: ")
        if user_query.lower() in ["quit", "exit", "q"]:
            break
        ask_question(user_query)
