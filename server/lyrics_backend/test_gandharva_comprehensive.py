import asyncio
import os
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure backend directory is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import inference

async def test_lyrics_generation_full():
    print("==================================================================")
    print("      GANDHARVA AI MODEL FULL CAPABILITY & PURITY TEST SUITE      ")
    print("==================================================================")

    test_prompts = [
        {
            "lang": "Telugu",
            "prompt": "గోదారి తీరంలో సాగే ప్రయాణం మరియు పాత జ్ఞాపకాలు",
            "genre": "Folk Melody",
            "mood": "Nostalgic"
        },
        {
            "lang": "Hindi",
            "prompt": "बचपन के गलियों की यादें और शाम का सूरज",
            "genre": "Acoustic Pop",
            "mood": "Melancholic"
        },
        {
            "lang": "Tamil",
            "prompt": "கடற்கரையோரத்தில் வீசும் அமைதியான தென்றல் காற்று",
            "genre": "Melody",
            "mood": "Peaceful"
        },
        {
            "lang": "Kannada",
            "prompt": "ಮಳೆಯ ಸುಂದರ ದಿನದ ನೆನಪುಗಳು ಮತ್ತು ಪ್ರೀತಿಯ ರಾಗ",
            "genre": "Romantic Melody",
            "mood": "Romantic"
        },
        {
            "lang": "Malayalam",
            "prompt": "ഗ്രാമത്തിലെ പഴയ വഴികളും മഴയുടെ രാഗവും",
            "genre": "Folk",
            "mood": "Nostalgic"
        },
        {
            "lang": "English",
            "prompt": "Standing at the edge of the ocean watching the stars ignite",
            "genre": "Cinematic Rock",
            "mood": "Epic"
        }
    ]

    all_passed = True

    for test in test_prompts:
        lang = test["lang"]
        prompt = test["prompt"]
        print(f"\n------------------------------------------------------------------")
        print(f"[TEST] Testing Language: {lang}")
        print(f"[TEST] Prompt: {prompt}")
        print(f"------------------------------------------------------------------")

        try:
            results = await inference.generate_lyrics_variations(
                prompt=prompt,
                genre=test["genre"],
                mood=test["mood"],
                language=lang,
                model_preference="auto"
            )

            print(f"✅ Generated {len(results)} variations for {lang}.")
            for idx, var in enumerate(results):
                engine = var.get("engine", "Unknown")
                fallback_used = var.get("fallback_used", False)
                fallback_reason = var.get("fallback_reason", None)
                lyrics = var.get("lyrics_text", "")
                title = var.get("title", "Untitled")

                print(f"\n  -- {var.get('version_name', f'Variation {idx+1}')} --")
                print(f"  Title          : {title}")
                print(f"  Engine Used    : {engine}")
                print(f"  Fallback Used  : {fallback_used}")
                if fallback_reason:
                    print(f"  Fallback Reason: {fallback_reason}")

                # Validate content with forbidden validator
                valid, val_msg = inference.validate_forbidden_content(lyrics, lang, prompt)
                if valid:
                    print(f"  Script Purity  : PASS ✅ ({val_msg})")
                else:
                    print(f"  Script Purity  : FAIL ❌ ({val_msg})")
                    all_passed = False

                snippet = "\n".join(lyrics.split("\n")[:6])
                print(f"  Lyrics Snippet :\n{snippet}\n  ...")

        except Exception as e:
            print(f"❌ Error testing {lang}: {e}")
            all_passed = False

    print("\n==================================================================")
    if all_passed:
        print("🎉 ALL GANDHARVA MODEL TESTS PASSED FULLY WITH NATIVE PURITY!")
    else:
        print("⚠️ SOME TESTS ENCOUNTERED ISSUES. CHECK DETAILED LOG ABOVE.")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(test_lyrics_generation_full())
