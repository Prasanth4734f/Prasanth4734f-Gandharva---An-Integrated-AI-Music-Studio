import sys
import os
from pydub import AudioSegment

def mix_vocal_and_bgm(vocal_path, bgm_path, output_path, vocal_vol=1.0, bgm_vol=0.85):
    try:
        print(f"Loading vocal: {vocal_path}")
        vocal = AudioSegment.from_file(vocal_path)
        
        print(f"Loading bgm: {bgm_path}")
        bgm = AudioSegment.from_file(bgm_path)
        
        # Adjust volume in dB (pydub uses dB offset)
        # vol 1.0 = 0dB, vol 0.5 = -6dB, vol 0.0 = -60dB
        if vocal_vol < 0.01:
            vocal = vocal - 60
        else:
            import math
            vocal_db = 20 * math.log10(vocal_vol)
            vocal = vocal + vocal_db

        if bgm_vol < 0.01:
            bgm = bgm - 60
        else:
            import math
            bgm_db = 20 * math.log10(bgm_vol)
            bgm = bgm + bgm_db

        # Overlay vocal onto bgm (or vice versa depending on which is longer)
        if len(vocal) > len(bgm):
            # Loop or extend bgm to match vocal length
            loops = math.ceil(len(vocal) / len(bgm))
            bgm = (bgm * loops)[:len(vocal)]

        mixed = bgm.overlay(vocal, position=0)

        # Export as MP3 or WAV
        print(f"Exporting mixed song to: {output_path}")
        mixed.export(output_path, format="mp3", bitrate="192k")
        return True
    except Exception as e:
        print(f"Error during mixing: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python vocal_bgm_mixer.py <vocal_path> <bgm_path> <output_path> [vocal_vol] [bgm_vol]")
        sys.exit(1)

    v_path = sys.argv[1]
    b_path = sys.argv[2]
    out_path = sys.argv[3]
    v_vol = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    b_vol = float(sys.argv[5]) if len(sys.argv) > 5 else 0.85

    if mix_vocal_and_bgm(v_path, b_path, out_path, v_vol, b_vol):
        print("SUCCESS_MIX")
    else:
        print("FAILED_MIX")
