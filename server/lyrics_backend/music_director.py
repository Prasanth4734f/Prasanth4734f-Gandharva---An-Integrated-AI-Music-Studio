import os
import json
import logging
import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class MusicDirector:
    """
    Music Director Engine (Phase 2)
    Ingests the Acoustic Emotion Probability Matrix and the Math data.
    Uses Gemini 2.5 Flash to generate a highly detailed, evolving musical blueprint.
    """
    
    @staticmethod
    def create_blueprint(vocal_data: dict, emotion_data: dict, user_genre: str = None, genre: str = None) -> dict:
        logger.info("[MusicDirector] Crafting intelligent music blueprint...")
        target_genre = user_genre or genre
        
        try:
            load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            
            if not gemini_api_key:
                logger.warning("[MusicDirector] No Gemini API key found, falling back to basic planning.")
                return MusicDirector._fallback_blueprint(vocal_data, emotion_data, target_genre)
                
            prompt = (
                "You are an elite music director and composer. I will provide you with the mathematical and acoustic emotional data of a vocal performance. "
                "The 'emotion_timeline' contains acoustic probability curves for each emotion over time. "
                "Analyze how the emotion transitions (e.g., from Sad to Hopeful) and the energy levels. "
                "Output ONLY a valid JSON object representing the music blueprint to guide the AI Generator. "
                "The JSON must have: "
                "'genre' (The best fit genre), "
                "'bpm' (The exact BPM provided), "
                "'primary_mood' (The overarching mood), "
                "'arrangement_plan' (A 2-3 sentence description of how the instruments evolve), "
                "'prompt' (A strictly formatted comma-separated global prompt for generative audio. MUST end with 'award-winning Billboard hit production, pristine studio quality, multi-platinum mixing, immersive 8k audio, perfectly mixed'), "
                "'sections' (An object with exactly four keys: 'intro', 'verse', 'chorus', 'outro'. Each value is an object containing 'start' (float seconds), 'end' (float seconds), 'emotion' (string), and 'instruments' (array of strings))"
            )
            
            payload_data = {
                "user_requested_genre": target_genre,
                "vocal_math": vocal_data,
                "emotion_curves": emotion_data
            }
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"text": f"Vocal Data: {json.dumps(payload_data)}"}
                    ]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
            resp = requests.post(url, json=payload, timeout=20.0)
            
            if resp.status_code == 200:
                data = resp.json()
                text_response = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                blueprint = json.loads(text_response)
                
                logger.info(f"[MusicDirector] AI Blueprint created successfully!")
                return blueprint
            else:
                logger.warning(f"[MusicDirector] Gemini API failed: {resp.text}")
                return MusicDirector._fallback_blueprint(vocal_data, emotion_data, target_genre)
                
        except Exception as e:
            logger.error(f"[MusicDirector] Failed to generate AI blueprint: {str(e)}")
            return MusicDirector._fallback_blueprint(vocal_data, emotion_data, target_genre)

    @staticmethod
    def _fallback_blueprint(vocal_data, emotion_data, user_genre):
        bpm = vocal_data.get("bpm", 120)
        primary_emotion = emotion_data.get("primary_emotion")
        if not primary_emotion and "emotions" in emotion_data and isinstance(emotion_data["emotions"], dict):
            emotions_dict = emotion_data["emotions"]
            if emotions_dict:
                primary_emotion = max(emotions_dict, key=emotions_dict.get).capitalize()
        if not primary_emotion:
            primary_emotion = "Neutral"

        target_genre = user_genre if user_genre else "Cinematic Pop"
        
        return {
            "genre": target_genre,
            "bpm": bpm,
            "primary_mood": primary_emotion,
            "arrangement_plan": f"Standard arrangement matching the primary emotion of {primary_emotion}.",
            "prompt": f"{target_genre}, {primary_emotion} mood, Piano, Strings, Drums, award-winning Billboard hit production, pristine studio quality, multi-platinum mixing, immersive 8k audio, perfectly mixed",
            "sections": {
                "intro": { "start": 0, "end": 15, "emotion": primary_emotion, "instruments": ["Piano"] },
                "verse": { "start": 15, "end": 45, "emotion": primary_emotion, "instruments": ["Piano", "Strings"] },
                "chorus": { "start": 45, "end": 75, "emotion": primary_emotion, "instruments": ["Piano", "Strings", "Drums"] },
                "outro": { "start": 75, "end": 90, "emotion": primary_emotion, "instruments": ["Piano"] }
            }
        }
