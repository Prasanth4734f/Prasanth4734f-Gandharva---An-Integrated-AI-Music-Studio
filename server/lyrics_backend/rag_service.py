import os
import json
import logging

_logger = logging.getLogger(__name__)

def get_cultural_context(language: str) -> dict:
    """
    Retrieves the cultural knowledge base for the specified language.
    Defaults to global_kb if the language is not found.
    """
    base_dir = os.path.dirname(__file__)
    kb_dir = os.path.join(base_dir, "cultural_kb")
    
    lang_key = language.lower().strip()
    filename = f"{lang_key}_kb.json"
    filepath = os.path.join(kb_dir, filename)
    
    if not os.path.exists(filepath):
        _logger.warning("No specific KB found for %s. Using global fallback.", language)
        filepath = os.path.join(kb_dir, "global_kb.json")
        
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        _logger.error("Failed to load KB from %s: %s", filepath, e)
        return {
            "language": language,
            "structures": ["Verse", "Chorus", "Bridge"],
            "instruments": [],
            "cultural_idioms": [],
            "rules": ""
        }

def inject_cultural_prompt(base_prompt: str, language: str) -> str:
    """
    Retrieves cultural context and formats it into instructions for the LLM.
    """
    kb = get_cultural_context(language)
    
    structures = ", ".join(kb.get("structures", []))
    instruments = ", ".join(kb.get("instruments", []))
    idioms = ", ".join(kb.get("cultural_idioms", []))
    rules = kb.get("rules", "")
    
    cultural_instructions = f"""
CULTURAL INTELLIGENCE (RAG):
You are generating music/lyrics for the {kb.get('language')} cultural context.
Please strictly adhere to these regional traits:
- Required Song Structures: {structures}
- Regional Instruments to Reference: {instruments}
- Cultural Idioms to Weave In: {idioms}
- Specific Cultural Rules: {rules}
"""
    
    return base_prompt + "\n\n" + cultural_instructions
