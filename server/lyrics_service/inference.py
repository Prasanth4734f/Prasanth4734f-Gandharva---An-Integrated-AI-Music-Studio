import os
import torch
from typing import Tuple
import logging

from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

# Load model once at import time – respects GPU availability
_logger = logging.getLogger("lyrics_inference")
_logger.setLevel(logging.INFO)

_MODEL_NAME = os.getenv("LYRICS_MODEL", "google/gemma-2b-it")
_device = "cuda" if torch.cuda.is_available() else "cpu"

_tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME)
_model = AutoModelForCausalLM.from_pretrained(
    _MODEL_NAME,
    torch_dtype=torch.float16 if _device == "cuda" else torch.float32,
    device_map="auto",
)
_generator = pipeline(
    "text-generation",
    model=_model,
    tokenizer=_tokenizer,
    device=0 if _device == "cuda" else -1,
    max_new_tokens=350,
    temperature=0.9,
    top_p=0.95,
    do_sample=True,
)

def _build_prompt(prompt: str, genre: str | None, mood: str | None, language: str | None) -> str:
    """Create a detailed instruction for the LLM.
    We embed any optional metadata to guide generation.
    """
    parts = []
    if genre:
        parts.append(f"Genre: {genre}")
    if mood:
        parts.append(f"Mood: {mood}")
    if language:
        parts.append(f"Language: {language}")
    meta = ", ".join(parts)
    if meta:
        meta = f" ({meta})"
    return (
        f"Write a song{meta} based on the following idea: '{prompt}'. \n"
        "Provide the output in the exact sections: Title, Verse 1, Chorus, Verse 2, Outro. "
        "Return ONLY the formatted text, no extra explanations."
    )

def _clean_output(raw: str) -> Tuple[str, str]:
    """Extract the title line and the rest of the lyrics.
    Expected format:
        Title: <title>\nVerse 1: ...\nChorus: ...\n...
    """
    # Ensure consistent line endings
    cleaned = raw.replace("\r\n", "\n").strip()
    lines = cleaned.split("\n")
    title_line = next((l for l in lines if l.lower().startswith("title:")), "Title: Untitled")
    title = title_line.split(":", 1)[1].strip() or "Untitled"
    # Remove the title line from the rest
    lyric_body = "\n".join(l for l in lines if not l.lower().startswith("title:"))
    return title, lyric_body.strip()

def generate_lyrics(prompt: str, genre: str | None = None, mood: str | None = None, language: str | None = None) -> Tuple[str, str]:
    """Public API used by the router.
    Returns a tuple `(title, full_lyrics_string)`.
    """
    _logger.info("Generating lyrics for prompt: %s", prompt)
    full_prompt = _build_prompt(prompt, genre, mood, language)
    raw_output = _generator(full_prompt, return_full_text=False)[0]["generated_text"]
    title, lyrics = _clean_output(raw_output)
    return title, lyrics
