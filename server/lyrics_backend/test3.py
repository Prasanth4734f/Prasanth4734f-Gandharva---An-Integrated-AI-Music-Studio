import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

sys.path.append('c:/nusic_gen/server/lyrics_backend')
load_dotenv('c:/nusic_gen/server/.env')

async def test_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    
    payload = {
        "contents": [{"parts": [{"text": "Write a short 4 line poem."}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    print("Sending request to Gemini...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
