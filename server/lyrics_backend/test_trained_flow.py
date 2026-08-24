import asyncio
import os
import sys
import zipfile

# Auto-unzip adapter if on Kaggle
zip_candidates = [
    "/kaggle/working/gandharva_lyrics_v1.zip",
    "/kaggle/input/gandharva-lyrics-v1/gandharva_lyrics_v1.zip",
    "/kaggle/input/gandharva_lyrics_v1/gandharva_lyrics_v1.zip"
]
for z in zip_candidates:
    if os.path.exists(z) and not os.path.exists("/kaggle/working/gandharva_lyrics_v1"):
        print(f"📦 Extracting adapter from {z}...")
        os.makedirs("/kaggle/working/gandharva_lyrics_v1", exist_ok=True)
        with zipfile.ZipFile(z, 'r') as zip_ref:
            zip_ref.extractall("/kaggle/working/gandharva_lyrics_v1")
        print("✅ Extracted adapter successfully!")
        break

# Reconfigure stdout for utf-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure folder is in python path
try:
    _script_dir = os.path.dirname(os.path.abspath(__file__))
except NameError:
    _script_dir = os.path.abspath(".")

if _script_dir not in sys.path:
    sys.path.append(_script_dir)

from inference import generate_lyrics_variations

async def main():
    print("====================================================")
    print("  GANDHARVA LYRICS AI — KAGGLE T4 GPU TEST SUITE   ")
    print("====================================================")
    
    test_cases = [
        {"language": "English", "prompt": "Nostalgic song about meeting an old friend at sunset", "genre": "Pop", "mood": "Nostalgic"},
        {"language": "Telugu", "prompt": "ఎన్నాళ్లకో కలిసిన ఒక పాత స్నేహితుని జ్ఞాపకం", "genre": "Cinematic Melody", "mood": "Nostalgic"},
        {"language": "Hindi", "prompt": "बरसों बाद पुराने दोस्त से मुलाकात की याद", "genre": "Romantic", "mood": "Nostalgic"},
        {"language": "Tamil", "prompt": "நீண்ட நாட்களுக்குப் பிறகு ஒரு பழைய நண்பனைச் சந்தித்த நினைவுகள்", "genre": "Acoustic", "mood": "Nostalgic"}
    ]
    
    for tc in test_cases:
        lang = tc["language"]
        print(f"\n====================================================")
        print(f"[TEST] Testing Language: {lang}")
        print(f"[TEST] Prompt: {tc['prompt']}")
        print(f"====================================================")
        
        try:
            results = await generate_lyrics_variations(
                prompt=tc["prompt"],
                genre=tc["genre"],
                mood=tc["mood"],
                language=lang,
                model_preference="trained_local"
            )
            print(f"[TEST] Success for {lang}! Received {len(results)} variations.")
            for var in results:
                print(f"\n--- {var['version_name']} (Engine: {var.get('engine', 'local')}) ---")
                print(f"Title: {var.get('title', 'Untitled')}")
                print(f"Fallback Used: {var.get('fallback_used', False)}")
                print(f"Fallback Reason: {var.get('fallback_reason', 'N/A')}")
                print("Lyrics Snippet:")
                snippet = "\n".join(var.get('lyrics_text', '').split("\n")[:8])
                print(snippet)
                print("...")
        except Exception as e:
            print(f"[TEST] Error testing {lang}: {e}")

if __name__ == "__main__":
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
        
    if loop and loop.is_running():
        # Running inside Jupyter / IPython notebook cell
        import nest_asyncio
        nest_asyncio.apply()
        asyncio.run(main())
    else:
        asyncio.run(main())
