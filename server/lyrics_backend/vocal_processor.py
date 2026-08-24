import librosa
import numpy as np

def extract_vocal_structural_matrix(local_vocal_path: str):
    """
    Decodes the raw vocal recording into mathematical features 
    to guide the generation engine.
    """
    # 1. Load the vocal track at standard sampling rate
    y, sr = librosa.load(local_vocal_path, sr=22050)
    
    # 2. Extract precise microtonal pitch movements (Fundamental Frequency)
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y, 
        fmin=librosa.note_to_hz('C2'), 
        fmax=librosa.note_to_hz('C7'),
        sr=sr
    )
    # Replace NaN data spaces with zero to keep the tracking matrix clean
    clean_f0 = np.nan_to_num(f0)
    
    # 3. Extract the temporal energy map (Volume Envelope)
    rms_energy = librosa.feature.rms(y=y)[0]
    normalized_energy = (rms_energy - np.min(rms_energy)) / (np.max(rms_energy) + 1e-6)
    
    # 4. Detect the dominant musical scale using a Chromagram
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_map = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    detected_key = chroma_map[np.argmax(np.mean(chroma, axis=1))]

    return {
        "pitch_contour": clean_f0.tolist()[::4], # Downsample vectors to optimize payload delivery
        "energy_envelope": normalized_energy.tolist()[::4],
        "explicit_key": detected_key
    }
