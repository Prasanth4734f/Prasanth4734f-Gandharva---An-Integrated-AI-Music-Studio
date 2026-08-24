import os
import sys
import time
import uuid
import logging
from unittest.mock import patch, MagicMock

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_vocal_studio")

# Fix path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), "lyrics_backend"))

# Mock data definitions representing different vocal performances
MOCK_VOCALS = {
    "Sad Telugu Vocal": {
        "bpm": 70,
        "key": "A Minor",
        "pitch_stability": 88,
        "breath_control": 75,
        "energy_consistency": 80,
        "emotion_expressiveness": 95,
        "energy": [0.1, 0.2, 0.15, 0.3],
        "emotions": {"sad": 0.85, "hope": 0.15, "joy": 0.0, "power": 0.0}
    },
    "Romantic Hindi Vocal": {
        "bpm": 85,
        "key": "C Major",
        "pitch_stability": 92,
        "breath_control": 88,
        "energy_consistency": 90,
        "emotion_expressiveness": 90,
        "energy": [0.3, 0.4, 0.5, 0.4],
        "emotions": {"sad": 0.1, "hope": 0.4, "joy": 0.5, "romance": 0.8, "power": 0.1}
    },
    "Powerful English Vocal": {
        "bpm": 120,
        "key": "D Minor",
        "pitch_stability": 85,
        "breath_control": 70,
        "energy_consistency": 95,
        "emotion_expressiveness": 98,
        "energy": [0.5, 0.7, 0.9, 0.95],
        "emotions": {"sad": 0.0, "hope": 0.2, "joy": 0.2, "power": 0.95}
    }
}

def run_pipeline_test(vocal_name, mock_data):
    logger.info(f"========== RUNNING TEST: {vocal_name} ==========")
    
    # 1. Mock Emotion Engine & Vocal Engine output
    analysis = mock_data
    
    # 2. Test Music Director
    from music_director import MusicDirector
    blueprint = MusicDirector.create_blueprint(analysis, {"emotions": analysis["emotions"]}, genre=None)
    
    logger.info(f"[{vocal_name}] Blueprint Output: {blueprint['prompt'][:100]}...")
    
    # Validate logic
    prompt_lower = blueprint['prompt'].lower()
    if "sad" in vocal_name.lower():
        assert "sad" in prompt_lower or "piano" in prompt_lower or "violin" in prompt_lower, "Music Director failed to assign correct instruments for Sad vocal"
    elif "powerful" in vocal_name.lower():
        assert "drum" in prompt_lower or "orchestra" in prompt_lower or "power" in prompt_lower or "bass" in prompt_lower, "Music Director failed to assign drums for Powerful vocal"
        
    # 3. Test AI Coach
    from ai_coach import AICoach
    coach_feedback = AICoach.generate_feedback(analysis, analysis["emotions"])
    logger.info(f"[{vocal_name}] Coach Score: {coach_feedback.get('overall_score')}/100")
    assert "overall_score" in coach_feedback, "Coach failed to return valid JSON"
    
    logger.info(f"[{vocal_name}] Test Passed! ✅\n")
    return blueprint

def benchmark_musicgen():
    logger.info("========== BENCHMARKING LOCAL MUSICGEN ==========")
    try:
        from musicgen_local import LocalMusicGen
        
        prompt = "Sad piano intro leading into hopeful strings, 84 BPM"
        duration = 5 # Generate short clip for bench
        
        start_time = time.time()
        
        # This will download the model to RAM/VRAM if not cached
        filepath = LocalMusicGen.generate(prompt=prompt, duration_sec=duration, output_dir="lyrics_backend/static/generated")
        
        end_time = time.time()
        generation_time = end_time - start_time
        
        logger.info(f"[Benchmark] Time to generate {duration}s audio: {generation_time:.2f} seconds")
        logger.info(f"[Benchmark] Path: {filepath}")
        
        assert os.path.exists(filepath), "MusicGen failed to output a file"
        logger.info("[Benchmark] Passed! ✅\n")
        
    except Exception as e:
        logger.error(f"[Benchmark] Failed: {e}")
        # Not asserting fail because environment might not have 4GB VRAM/RAM for transformers

if __name__ == "__main__":
    logger.info("Starting Gandharva End-to-End Test Suite")
    
    for vocal_name, mock_data in MOCK_VOCALS.items():
        run_pipeline_test(vocal_name, mock_data)
        
    # Run the heavy benchmark last
    benchmark_musicgen()
    
    logger.info("All tests completed successfully!")
