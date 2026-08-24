import sys
import json
import os
from pydub import AudioSegment

def mix_instruments(base_audio_path, sequence_json, output_path, fade_in_ms=0, fade_out_ms=0):
    try:
        base_audio = AudioSegment.from_file(base_audio_path)
    except Exception as e:
        print(f"Error loading base audio: {e}")
        return False

    sequence = json.loads(sequence_json)
    
    mixed_audio = base_audio

    instruments_dir = os.path.join(os.path.dirname(__file__), "public", "instruments")

    for tap in sequence:
        instrument_id = tap.get("instrument")
        time_ms = tap.get("timeMs")

        instrument_path = os.path.join(instruments_dir, f"{instrument_id}.wav")
        if os.path.exists(instrument_path):
            try:
                instrument_audio = AudioSegment.from_file(instrument_path)
                mixed_audio = mixed_audio.overlay(instrument_audio, position=time_ms)
            except Exception as e:
                print(f"Error loading instrument {instrument_id}: {e}")

    if fade_in_ms > 0:
        mixed_audio = mixed_audio.fade_in(fade_in_ms)
    
    if fade_out_ms > 0:
        mixed_audio = mixed_audio.fade_out(fade_out_ms)

    try:
        mixed_audio.export(output_path, format="wav")
        return True
    except Exception as e:
        print(f"Error exporting mixed audio: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python instrument_mixer.py <base_audio_path> <sequence_json> <output_path> [fade_in_ms] [fade_out_ms]")
        sys.exit(1)
        
    base_path = sys.argv[1]
    seq_json = sys.argv[2]
    out_path = sys.argv[3]
    
    fade_in = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    fade_out = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    
    if mix_instruments(base_path, seq_json, out_path, fade_in, fade_out):
        print("Success")
    else:
        print("Failed")

