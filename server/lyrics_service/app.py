import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Literal
import logging

# Local inference module
from inference import generate_lyrics

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gandharva-lyrics")

app = FastAPI(
    title="GANDHARVA – Lyrics Generator",
    description="Generate structured song lyrics using an open‑source LLM.",
    version="0.1.0",
)

# CORS – allow Android emulator/device origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LyricRequest(BaseModel):
    prompt: str = Field(..., description="Core idea or seed for the song")
    genre: str = Field(..., description="Music genre, e.g., Pop, Rock, Jazz")
    mood: str = Field(..., description="Emotional tone, e.g., Happy, Sad")
    language: str = Field(..., description="Language of the lyrics, e.g., English")

    @validator("prompt", "genre", "mood", "language")
    def not_empty(cls, v, field):
        if not v or not v.strip():
            raise ValueError(f"{field.name} must not be empty")
        return v.strip()

class LyricResponse(BaseModel):
    title: str = Field(..., description="Generated song title")
    lyrics: str = Field(..., description="Full lyrics with sections")

@app.get("/health", tags=["Health"])
async def health_check():
    """Simple health‑check endpoint used by orchestration tools."""
    return {"status": "ok"}

@app.post("/generate-lyrics", response_model=LyricResponse, tags=["Lyrics"])
async def generate_lyrics_endpoint(request: LyricRequest):
    """Generate a structured lyric block.
    The function returns a title and a single string containing the sections:
    Title, Verse 1, Chorus, Verse 2, Outro.
    """
    try:
        logger.info("Received lyric request: %s", request.dict())
        title, lyrics = generate_lyrics(
            prompt=request.prompt,
            genre=request.genre,
            mood=request.mood,
            language=request.language,
        )
        return LyricResponse(title=title, lyrics=lyrics)
    except Exception as e:
        logger.exception("Lyric generation failed")
        raise HTTPException(status_code=500, detail="Failed to generate lyrics")
