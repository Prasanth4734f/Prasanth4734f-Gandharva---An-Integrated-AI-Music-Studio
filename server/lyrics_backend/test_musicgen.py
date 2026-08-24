import asyncio
import os
import sys
import logging
import httpx

logging.basicConfig(level=logging.INFO)

async def main():
    url = "https://audition-roamer-darling.ngrok-free.dev/generate"
    print("Testing MusicGen API...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                json={"prompt": "test", "duration": 5, "seed": 42},
                headers={"ngrok-skip-browser-warning": "1"},
                timeout=120.0
            )
            print(f"Status Code: {resp.status_code}")
            print(f"Headers: {resp.headers}")
            print(f"Content length: {len(resp.content)}")
            print(f"Starts with: {resp.content[:10]}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())
