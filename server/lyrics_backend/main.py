import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel

# Add current folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from router import router
from database import engine
import models

# Automatically create SQLModel database tables at startup
print("[Startup] Creating SQLite database tables...")
SQLModel.metadata.create_all(engine)
print("[Startup] Database tables verified and ready!")

app = FastAPI(
    title="GANDHARVA – AI Music Studio Backend",
    description="Stateful project manager and AI generation backend.",
    version="1.0.0"
)

# Enable CORS for cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated static files
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount fallback audio assets
fallback_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "fallback"))
if os.path.exists(fallback_dir):
    app.mount("/fallback", StaticFiles(directory=fallback_dir), name="fallback")
else:
    # Safe fallback if run from a different subfolder
    os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), "fallback")), exist_ok=True)
    app.mount("/fallback", StaticFiles(directory=os.path.abspath(os.path.join(os.path.dirname(__file__), "fallback"))), name="fallback")

# Include the lyrics and music router
app.include_router(router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "online", "service": "lyrics-music-gandharva-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
