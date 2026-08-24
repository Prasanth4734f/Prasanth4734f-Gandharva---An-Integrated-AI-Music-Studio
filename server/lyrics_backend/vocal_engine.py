import numpy as np
import librosa
import logging

logger = logging.getLogger(__name__)

class VocalEngine:
    """
    Vocal Engine: Phase 1
    Strictly handles mathematical audio extraction (BPM, Key, Pitch, Duration, RMS).
    No LLM or semantic AI is used here.
    """
    
    @staticmethod
    def analyze(file_path: str) -> dict:
        logger.info(f"[VocalEngine] Starting mathematical analysis on {file_path}")
        
        try:
            # 1. Load with Librosa
            y, sr = librosa.load(file_path, sr=22050, mono=True)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # 2. Extract BPM
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
            bpm = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)
            
            # 3. Extract Energy (RMS)
            rms = librosa.feature.rms(y=y)[0]
            energy = float(np.mean(rms))
            
            # Extract basic Energy Curve
            step_size = max(1, len(rms) // 10)
            energy_curve = [round(float(r), 3) for r in rms[::step_size]]
            
            # 4. Extract Key
            key_str = VocalEngine._detect_key(y, sr)
            
            # 5. Extract Pitch Range & Contour
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y, 
                fmin=librosa.note_to_hz('C2'), 
                fmax=librosa.note_to_hz('C7'),
                frame_length=2048
            )
            
            valid_f0 = f0[~np.isnan(f0)]
            if len(valid_f0) > 0:
                midi_notes = librosa.hz_to_midi(valid_f0)
                pitch_range_obj = {
                    "min": float(round(np.min(midi_notes), 1)),
                    "max": float(round(np.max(midi_notes), 1))
                }
            else:
                pitch_range_obj = {"min": 0, "max": 0}

            result = {
                "bpm": round(bpm),
                "key": key_str,
                "energy": round(energy, 3),
                "energy_curve": energy_curve,
                "duration": round(duration, 1),
                "pitch_range": pitch_range_obj
            }
            
            logger.info(f"[VocalEngine] Math Analysis complete")
            return result
            
        except Exception as e:
            logger.error(f"[VocalEngine] Failed to analyze vocal: {str(e)}")
            return {"error": str(e)}

    @staticmethod
    def _detect_key(y, sr):
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        
        major_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        minor_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        
        major_corrs = [np.corrcoef(chroma_mean, np.roll(major_profile, i))[0, 1] for i in range(12)]
        minor_corrs = [np.corrcoef(chroma_mean, np.roll(minor_profile, i))[0, 1] for i in range(12)]
        
        max_major = max(major_corrs)
        max_minor = max(minor_corrs)
        
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        if max_major > max_minor:
            key_idx = major_corrs.index(max_major)
            return f"{notes[key_idx]} Major"
        else:
            key_idx = minor_corrs.index(max_minor)
            return f"{notes[key_idx]} Minor"
