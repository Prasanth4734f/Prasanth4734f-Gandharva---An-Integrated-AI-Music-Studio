"""
database.py - SQLModel-compatible database engine for GANDHARVA AI Studio.
Uses SQLite by default. Set GANDHARVA_DB_URL env var to override.
"""
import os
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.getenv('GANDHARVA_DB_URL', 'sqlite:///./gandharva.db')

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite') else {},
    echo=False  # Set to True for SQL debugging
)


def get_db():
    """Dependency that yields a database session."""
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    """Create all SQLModel tables. Safe to call multiple times."""
    SQLModel.metadata.create_all(engine)
