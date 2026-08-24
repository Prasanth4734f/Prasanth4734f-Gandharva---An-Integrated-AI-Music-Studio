from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ============================================================
# Music Generation Schemas
# ============================================================
class MusicRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="User's original music generation prompt.")
    duration: int = Field(default=10, ge=5, le=30, description="Duration in seconds (5-30s).")
    num_variations: Optional[int] = Field(default=1, ge=1, le=3, description="Number of variations to generate (1 to 3).")
    cultural_vibe: Optional[str] = Field(default="Global", description="Regional or cultural context for instruments and styles.")

class MusicVariationResponse(BaseModel):
    id: str
    variation_name: str
    seed: int
    audio_url: str
    duration: int
    created_at: datetime

class MusicResponse(BaseModel):
    project_id: str
    prompt: str
    enhanced_prompt: str
    variations: List[MusicVariationResponse]

class PromptEnhanceRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Basic prompt to enhance.")

class PromptEnhanceResponse(BaseModel):
    enhanced_prompt: str

# ============================================================
# Lyrics Generation Schemas
# ============================================================
class LyricRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Theme or topic for the lyrics.")
    genre: Optional[str] = Field(default="Pop", description="Music genre, e.g. Lofi, Rock, Pop.")
    mood: Optional[str] = Field(default="Melancholic", description="Desired lyric emotion, e.g. Happy, Sad.")
    language: Optional[str] = Field(default="English", description="Language of lyrics.")
    model_preference: Optional[str] = Field(default="auto", description="AI routing model preference (auto, gemini, openai, anthropic, local).")

    model_config = {"protected_namespaces": ()}

class LyricVariationResponse(BaseModel):
    id: str
    version_name: str
    title: str
    lyrics_text: str
    engine: Optional[str] = None
    fallback_used: Optional[bool] = False
    fallback_reason: Optional[str] = None
    created_at: datetime

class LyricResponse(BaseModel):
    project_id: str
    title: str
    variations: List[LyricVariationResponse]

# ============================================================
# Project Manager Schemas
# ============================================================
class ProjectLyricResponse(BaseModel):
    id: str
    version_name: str
    title: str
    lyrics_text: str
    created_at: datetime

class ProjectMusicResponse(BaseModel):
    id: str
    variation_name: str
    seed: int
    audio_url: str
    duration: int
    created_at: datetime

class ProjectResponse(BaseModel):
    id: str
    name: str
    original_prompt: str
    enhanced_prompt: str
    genre: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime
    lyrics: List[ProjectLyricResponse] = []
    music: List[ProjectMusicResponse] = []

    class Config:
        from_attributes = True

class ProjectSaveRequest(BaseModel):
    name: str
    original_prompt: Optional[str] = ""
    enhanced_prompt: Optional[str] = ""
    genre: Optional[str] = None
    mood: Optional[str] = None

# ============================================================
# Vocal Studio Job Schemas
# ============================================================
class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    step: str
    result: Optional[dict] = None
    error: Optional[str] = None
