import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel
from database import engine
import models  # Must import models to register tables in metadata

def init_database():
    print("[DB] Initializing Gandharva AI SQLite database...")
    SQLModel.metadata.create_all(engine)
    print("[DB] Database tables created successfully!")

if __name__ == "__main__":
    init_database()
