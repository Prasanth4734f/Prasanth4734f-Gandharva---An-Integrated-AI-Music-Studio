class PromptBuilder:
    """
    Constructs highly optimized prompts for MusicGen based on Vocal Analysis (Auto Mode) 
    or User Inputs (Custom Mode).
    """

    @staticmethod
    def _classify_style(analysis: dict) -> dict:
        # If advanced AI classification has already run, return its insights!
        if "classified_genre" in analysis and "classified_mood" in analysis and "classified_instruments" in analysis:
            return analysis["classified_genre"], analysis["classified_mood"], analysis["classified_instruments"]
            
        bpm = analysis.get("bpm", 120)
        energy = analysis.get("energy", "medium")
        bass = analysis.get("bass", "Medium")
        timbre = analysis.get("timbre", "Balanced")
        
        # Default mapping
        genre = "Pop"
        mood = "Upbeat"
        instruments = "acoustic guitar, synth, upbeat drums"

        # Complex classification based on spectral features
        if energy == "high":
            if bass == "Heavy" and bpm > 110:
                genre = "EDM"
                mood = "Energetic"
                instruments = "heavy synth bass, punchy drums, festival electronic leads"
            elif timbre == "Bright/Airy":
                genre = "Festival Pop"
                mood = "Euphoric"
                instruments = "bright synths, fast claps, modern pop arrangement"
            else:
                genre = "Rock"
                mood = "Driving"
                instruments = "distorted electric guitars, heavy drum kit, driving bassline"
        elif energy == "low":
            if timbre == "Deep/Warm" or bass == "Heavy":
                genre = "Cinematic"
                mood = "Emotional"
                instruments = "deep cello, gorgeous piano, slow lush strings"
            else:
                genre = "Acoustic LoFi"
                mood = "Chill"
                instruments = "soft acoustic guitar, ambient pads, lo-fi hip hop beat"
        else: # Medium energy
            if timbre == "Bright/Airy":
                genre = "Modern Pop"
                mood = "Radio-ready"
                instruments = "clean electric guitar, steady catchy rhythm, upbeat synths"
            elif bass == "Heavy":
                genre = "R&B"
                mood = "Groovy"
                instruments = "smooth synth bass, tight hi-hats, rhodes electric piano"
            else:
                genre = "Indie Folk"
                mood = "Mellow"
                instruments = "acoustic strumming, gentle percussion, soft piano"
                
        # Inject the classified attributes back into the analysis dict for the UI and fallback
        analysis["classified_genre"] = genre
        analysis["classified_mood"] = mood
        analysis["classified_instruments"] = instruments
        
        return genre, mood, instruments

    @staticmethod
    def build_auto_prompt(analysis: dict) -> str:
        bpm = analysis.get("bpm", 120)
        key = analysis.get("key", "C Major")
        
        genre, mood, instruments = PromptBuilder._classify_style(analysis)

        # Top-tier modifiers to drastically improve the output quality
        quality_modifiers = "award-winning Billboard hit production, pristine studio quality, multi-platinum mixing, immersive 8k audio, rich and lush sound, wide stereo spread, perfect instrumental arrangement"

        base = f"{mood} {genre} instrumental backing track in {key}, featuring {instruments}"

        return f"{base}, {bpm} BPM, {quality_modifiers}, instrumental only, no vocals, perfectly mixed"

    @staticmethod
    def build_custom_prompt(analysis: dict, genre: str, instruments: str, energy: str, custom_mood: str, era: str, custom_prompt: str) -> str:
        bpm = analysis.get("bpm", 120)
        key = analysis.get("key", "C Major")
        
        # Extract the deep semantic understanding of the vocal track
        ai_genre, ai_mood, ai_instruments = PromptBuilder._classify_style(analysis)
        
        prompt_parts = []

        # Override the AI's mood only if the user explicitly provided one
        target_mood = custom_mood if custom_mood and custom_mood != "undefined" else ai_mood

        # Override the AI's genre only if the user explicitly provided one
        target_genre = genre if genre and genre != "undefined" else ai_genre
        prompt_parts.append(f"{target_mood} {target_genre} instrumental backing track in {key}")
        
        if era and era != "undefined":
            prompt_parts.append(f"{era} style/production")

        if energy and energy != "undefined":
            prompt_parts.append(f"{energy} energy")

        # Override or merge the AI's instruments with the user's choice
        target_instruments = instruments if instruments and instruments != "undefined" else ai_instruments
        if target_instruments:
            prompt_parts.append(f"featuring {target_instruments}")

        if custom_prompt and custom_prompt != "undefined" and custom_prompt.strip():
            prompt_parts.append(custom_prompt.strip())

        quality_modifiers = "award-winning Billboard hit production, pristine studio quality, multi-platinum mixing, immersive 8k audio, rich and lush sound, wide stereo spread, perfect instrumental arrangement"
        
        base_prompt = ", ".join(prompt_parts)
        return f"{base_prompt}, {bpm} BPM, {quality_modifiers}, instrumental only, no vocals, perfectly mixed"
