import asyncio
import sys
sys.path.append('c:/nusic_gen/server/lyrics_backend')
from inference import generate_lyrics_variations

async def main():
    print('Starting')
    res = await generate_lyrics_variations('test', 'Pop', 'Happy', 'English', 'auto')
    print('Done', res)

if __name__ == "__main__":
    asyncio.run(main())
