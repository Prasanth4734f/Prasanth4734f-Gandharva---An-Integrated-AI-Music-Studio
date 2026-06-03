import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Project(SQLModel, table=True):
    __tablename__ = "projects"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    original_prompt: str = Field(default="")
    enhanced_prompt: str = Field(default="")
    genre: Optional[str] = Field(default=None, nullable=True)
    mood: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Lyric(SQLModel, table=True):
    __tablename__ = "lyrics"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    variation_name: str = Field(description="e.g. Version 1, Version 2, Version 3")
    title: str = Field(description="Generated song title")
    lyrics_text: str = Field(description="Structured lyrics: Verse, Chorus, Bridge, Outro")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Music(SQLModel, table=True):
    __tablename__ = "music"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    variation_name: str = Field(description="e.g. Single Track, Variation A, Variation B")
    seed: int = Field(description="Random seed used")
    audio_path: str = Field(description="Local file storage path")
    audio_url: str = Field(description="Web accessible URL")
    duration: int = Field(description="Duration in seconds")
    temperature: float = Field(default=1.0)
    top_k: int = Field(default=250)
    created_at: datetime = Field(default_factory=datetime.utcnow)
