"""
database.py - Supabase REST API client for GANDHARVA AI Studio.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from parent server/.env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=env_path, override=True)

url: str = os.getenv("SUPABASE_URL", "").strip('"').strip("'").strip()
service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip('"').strip("'").strip()
anon_key: str = os.getenv("SUPABASE_KEY", "").strip('"').strip("'").strip()

key = service_role_key if service_role_key else anon_key

supabase: Client = None

if url and key and key != "[YOUR-ANON-API-KEY]":
    supabase = create_client(url, key)
else:
    print("[Warning] SUPABASE_URL or SUPABASE_KEY is missing or not set. Database operations will fail.")

def get_db():
    """Returns the Supabase REST client."""
    return supabase
