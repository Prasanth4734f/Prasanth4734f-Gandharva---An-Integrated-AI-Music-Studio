import os
import json
import logging
import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class AICritic:
    """
    AI Critic Engine (Phase 2)
    Scores the generated BGM candidates using Gemini and automatically selects the best one.
    """
    
    @staticmethod
    def score_candidates(candidates: dict, blueprint: dict) -> str:
        logger.info("[AICritic] Scoring candidates using AI...")
        
        try:
            load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            
            if not gemini_api_key:
                logger.warning("[AICritic] No Gemini API key found, falling back to mock scoring.")
                return AICritic._fallback_scoring(candidates)
                
            prompt = (
                "You are an elite music producer and A&R critic. "
                "I am providing you with the intended musical blueprint and the generated candidate styles. "
                "Analyze the candidates against the blueprint and score them out of 100 based on their fit. "
                "Output ONLY a valid JSON object matching this schema: "
                "{"
                "  \"scores\": { \"candidate_a\": integer, \"candidate_b\": integer, ... }, "
                "  \"best_candidate\": string (the key of the highest scoring candidate), "
                "  \"reasoning\": string (A 2 sentence explanation of why it won) "
                "}"
            )
            
            payload_data = {
                "blueprint": blueprint,
                "candidates": {k: {"style": v.get("style"), "instruments": v.get("instruments")} for k, v in candidates.items()}
            }
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"text": f"Scoring Data: {json.dumps(payload_data)}"}
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
                result = json.loads(text_response)
                
                best_candidate = result.get("best_candidate", "candidate_a")
                logger.info(f"[AICritic] AI Selected {best_candidate}. Reasoning: {result.get('reasoning')}")
                
                # Verify the candidate actually exists
                if best_candidate not in candidates:
                    best_candidate = list(candidates.keys())[0]
                    
                return best_candidate
            else:
                logger.warning(f"[AICritic] Gemini API failed: {resp.text}")
                return AICritic._fallback_scoring(candidates)
                
        except Exception as e:
            logger.error(f"[AICritic] Failed to score candidates: {str(e)}")
            return AICritic._fallback_scoring(candidates)
            
    @staticmethod
    def _fallback_scoring(candidates: dict) -> str:
        best_candidate = "candidate_a"
        highest_score = 0
        
        for key, cand in candidates.items():
            # Mock scoring
            score = 90 if key == "candidate_a" else 85
            if score > highest_score:
                highest_score = score
                best_candidate = key
                
        logger.info(f"[AICritic] Selected {best_candidate} with fallback score {highest_score}")
        return best_candidate
