import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

def butter_bandpass(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def butter_bandpass_filter(data, lowcut, highcut, fs, order=5):
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    y = lfilter(b, a, data)
    return y

def denoise_audio(input_path, output_path):
    try:
        fs, data = wavfile.read(input_path)
        
        # Determine if stereo or mono
        if len(data.shape) > 1:
            channels = data.shape[1]
            out_data = np.zeros_like(data)
            for i in range(channels):
                # Apply bandpass from 80Hz to 12kHz to remove rumble and extreme hiss
                filtered = butter_bandpass_filter(data[:, i], 80.0, 12000.0, fs, order=4)
                out_data[:, i] = filtered
        else:
            out_data = butter_bandpass_filter(data, 80.0, 12000.0, fs, order=4)
            
        out_data = np.int16(out_data)
        wavfile.write(output_path, fs, out_data)
        return True
    except Exception as e:
        print(f"Denoise Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python denoise.py <input_wav> <output_wav>")
        sys.exit(1)
        
    if denoise_audio(sys.argv[1], sys.argv[2]):
        print("Success")
    else:
        print("Failed")
