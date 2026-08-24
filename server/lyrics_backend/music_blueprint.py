import logging
import random

logger = logging.getLogger(__name__)

# Controlled Style Pool
STYLE_POOL = [
    {"style": "romantic", "instruments": ["violin", "piano"]},
    {"style": "cinematic", "instruments": ["lush strings", "cello", "french horn"]},
    {"style": "acoustic", "instruments": ["acoustic guitar", "cajon"]},
    {"style": "orchestral", "instruments": ["full orchestra", "timpani"]},
    {"style": "festival", "instruments": ["heavy synth", "four-on-the-floor kick", "bass drop"]},
    {"style": "lofi chill", "instruments": ["rhodes piano", "lofi drum loop", "warm sub bass"]},
    {"style": "devotional", "instruments": ["flute", "tabla", "harmonium"]},
    {"style": "synthwave", "instruments": ["analog synth", "retro drum machine", "arpeggiator"]},
    {"style": "indie folk", "instruments": ["ukulele", "upright bass", "light percussion"]}
]

class BlueprintBuilder:
    """
    AI Music Blueprint Builder
    Translates technical vocal metadata into 3 distinct generative music blueprints.
    """
    
    @staticmethod
    def build_candidates(analysis_data: dict) -> dict:
        """
        Takes the output from VocalAnalyzer and generates 3 diverse candidates.
        """
        bpm = analysis_data.get("bpm", 120)
        key = analysis_data.get("key", "C Major")
        density = analysis_data.get("vocal_density", "medium")
        
        # Determine density arrangement
        arrangement_instruction = "sparse arrangement, minimal accompaniment" if density == "high" else "full arrangement, rhythmic"

        # Select 3 totally distinct styles randomly to ensure variety
        selected_styles = random.sample(STYLE_POOL, 3)

        candidates = {}
        labels = ["candidate_a", "candidate_b", "candidate_c"]
        
        for idx, style_obj in enumerate(selected_styles):
            candidates[labels[idx]] = {
                "style": style_obj["style"],
                "instruments": style_obj["instruments"],
                "bpm": bpm,
                "key": key,
                "arrangement": arrangement_instruction,
                "generation_seed": random.randint(1000, 99999)
            }

        logger.info(f"[BlueprintBuilder] Generated candidates: {[c['style'] for c in candidates.values()]}")

        return candidates

if __name__ == "__main__":
    # Test
    sample_data = {
      "bpm": 144,
      "key": "D# Minor",
      "energy": 0.167,
      "vocal_density": "high",
      "melody_features": {
        "ascending_ratio": 0.62,
        "descending_ratio": 0.38,
        "note_variance": 0.71,
        "average_interval": 2.4
      }
    }
    
    import json
    print(json.dumps(BlueprintBuilder.build_candidates(sample_data), indent=2))
