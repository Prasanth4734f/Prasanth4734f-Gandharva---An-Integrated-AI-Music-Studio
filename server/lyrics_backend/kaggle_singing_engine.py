import os
import sys
import json
import logging
import math

logger = logging.getLogger(__name__)

def build_singing_vocal_prompt(lyrics: str, language: str = 'Telugu', genre: str = 'Pop', mood: str = 'Romantic', scale: str = 'C Major') -> str:
    """
    Constructs a SVS (Singing Voice Synthesis) prompt engineered for AI Singing Models
    (MusicGen SVS / Bark SVS / RVC Vocal Engine) with F0 pitch curves and musical cadence.
    """
    clean_text = (lyrics or "").replace("[", "").replace("]", "").replace("\n", " ").strip()
    if len(clean_text) > 180:
        clean_text = clean_text[:180] + "..."

    prompt = (
        f"♪ [singing in {language}] ♪ Professional lead vocal singer, expressive {genre} song melody in Key of {scale}. "
        f"Melodic vocal performance with pitch vibrato, chorus hook, and rhythmic singing cadence: \"{clean_text}\". "
        f"Pure singing vocal performance, high pitch precision, no speech."
    )
    return prompt

if __name__ == "__main__":
    test_lyrics = "కరిగే కొవ్వొత్తి వెలుగుల్లో నీ రూపాన్ని చూశాను"
    p = build_singing_vocal_prompt(test_lyrics, "Telugu", "Pop", "Romantic", "C Major")
    print(f"Generated SVS Prompt:\n{p}")
