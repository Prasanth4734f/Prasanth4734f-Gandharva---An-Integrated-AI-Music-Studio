import os
import re

filepath = "C:\\nusic_gen\\server\\lyrics_backend\\router.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(r'@router\.post\("/vocal-mix"\).*?(?=# ===+.*?# NEW: Real Track Statistics)', re.DOTALL)

clean_vocal_mix = """@router.post("/vocal-mix")
async def vocal_mix(vocalFile: UploadFile = File(...)):
    import tempfile
    from pydub import AudioSegment
    import shutil

    temp_vocal_path = os.path.join(tempfile.gettempdir(), f"vocal_dummy.m4a")
    temp_wav_path = os.path.join(tempfile.gettempdir(), f"vocal_dummy.wav")
    output_filename = f"mixed_dummy.wav"
    output_path = os.path.join(GENERATED_DIR, output_filename)

    try:
        content = await vocalFile.read()
        with open(temp_vocal_path, "wb") as f:
            f.write(content)

        # Convert uploaded file to WAV using pydub
        try:
            vocal_audio = AudioSegment.from_file(temp_vocal_path)
        except Exception as e:
            logger.warning(f"pydub failed to read {temp_vocal_path}: {e}")
            shutil.copy(os.path.join(GENERATED_DIR, "fallback.wav") if os.path.exists(os.path.join(GENERATED_DIR, "fallback.wav")) else temp_vocal_path, output_path)
            return {
                "title": "AI Vocal Mix (Fallback)",
                "duration": "0:30",
                "audioUrl": f"/static/generated/{output_filename}"
            }

        backtrack_path = os.path.join(GENERATED_DIR, "fallback.wav")
        if os.path.exists(backtrack_path):
            backtrack = AudioSegment.from_file(backtrack_path)
            
            # Match lengths
            if len(vocal_audio) > len(backtrack):
                backtrack = backtrack * (len(vocal_audio) // len(backtrack) + 1)
            backtrack = backtrack[:len(vocal_audio)]

            # Lower backtrack volume by 6dB, boost vocal by 3dB
            backtrack = backtrack - 6
            vocal_audio = vocal_audio + 3

            # Overlay
            mixed = backtrack.overlay(vocal_audio)
            mixed.export(output_path, format="wav")
            duration_str = f"{len(mixed) // 60000}m {(len(mixed) // 1000) % 60}s"
        else:
            # If no backtrack, just export vocal
            vocal_audio.export(output_path, format="wav")
            duration_str = f"{len(vocal_audio) // 60000}m {(len(vocal_audio) // 1000) % 60}s"

        return {
            "title": "Studio Vocal Mix",
            "duration": duration_str,
            "audioUrl": f"/static/generated/{output_filename}"
        }
    except Exception as e:
        logger.error(f"Error in /vocal-mix: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_vocal_path):
            os.remove(temp_vocal_path)

"""

new_content = pattern.sub(clean_vocal_mix, content)
with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Fixed router.py")
