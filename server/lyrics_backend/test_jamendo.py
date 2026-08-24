import asyncio
import httpx

async def main():
    client_id = "b6747d04"
    url = f"https://api.jamendo.com/v3.0/tracks/?client_id={client_id}&format=json&limit=2&tags=instrumental&include=musicinfo&audioformat=mp32"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10.0)
        print(resp.json())

if __name__ == "__main__":
    asyncio.run(main())
