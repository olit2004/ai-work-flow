import os
import sys
from dotenv import load_dotenv

# Try to load environment variables
backend_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(backend_dir, ".env")
root_dotenv_path = os.path.join(os.path.dirname(backend_dir), ".env")

print("Checking environment files...")
print(f"Checking backend .env at: {dotenv_path} (exists: {os.path.exists(dotenv_path)})")
print(f"Checking root .env at: {root_dotenv_path} (exists: {os.path.exists(root_dotenv_path)})")

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
elif os.path.exists(root_dotenv_path):
    load_dotenv(root_dotenv_path)

# Print current environment variables related to Groq
groq_api = os.getenv("groq_api")
groq_api_key = os.getenv("GROQ_API_KEY")

print("\n--- Environment Variable Status ---")
print(f"groq_api: {'SET (hidden)' if groq_api else 'NOT SET'}")
print(f"GROQ_API_KEY: {'SET (hidden)' if groq_api_key else 'NOT SET'}")

# Use whichever variable is set
api_key = groq_api or groq_api_key

if not api_key:
    print("\n[Warning] No Groq API key found in 'groq_api' or 'GROQ_API_KEY' environment variables.")
    print("The backend will fall back to using static placeholder mock content.")
    sys.exit(1)

try:
    from groq import Groq
    print("\nInitializing Groq client...")
    client = Groq(api_key=api_key)
    
    print("Sending test request to Groq (model: llama-3.1-8b-instant)...")
    completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a brief assistant."},
            {"role": "user", "content": "Hello, write a single paragraph (2 sentences) about artificial intelligence."}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_tokens=100
    )
    
    response_text = completion.choices[0].message.content.strip()
    print("\n--- Successful AI Response ---")
    print(response_text)
    print("------------------------------")
    
except Exception as e:
    print("\n--- Groq API Connection Failed ---")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {e}")
    print("----------------------------------")
