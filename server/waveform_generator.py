import sys
import json
import numpy as np
from pydub import AudioSegment

def generate_waveform(audio_path, output_json_path, num_bars=100):
    try:
        audio = AudioSegment.from_file(audio_path)
        # Convert to mono
        audio = audio.set_channels(1)
        samples = np.array(audio.get_array_of_samples())
        
        # Split into chunks
        chunk_size = len(samples) // num_bars
        if chunk_size == 0:
            chunk_size = 1
            
        peaks = []
        for i in range(num_bars):
            start = i * chunk_size
            end = start + chunk_size
            chunk = samples[start:end]
            if len(chunk) > 0:
                # Get max absolute amplitude in chunk
                peak = float(np.max(np.abs(chunk)))
                peaks.append(peak)
            else:
                peaks.append(0.0)
                
        # Normalize peaks to 0-1
        max_peak = max(peaks) if peaks else 1.0
        if max_peak > 0:
            peaks = [p / max_peak for p in peaks]
            
        result = {"peaks": peaks}
        with open(output_json_path, 'w') as f:
            json.dump(result, f)
            
        return True
    except Exception as e:
        print(f"Waveform Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python waveform_generator.py <audio_file> <output_json>")
        sys.exit(1)
        
    generate_waveform(sys.argv[1], sys.argv[2])
