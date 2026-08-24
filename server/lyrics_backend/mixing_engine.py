# server/lyrics_backend/mixing_engine.py
import librosa
import soundfile as sf
import numpy as np
from pedalboard import Pedalboard, HighpassFilter, HighShelfFilter, PeakFilter, Compressor, Gain, Chorus, Limiter, Reverb, Distortion

async def execute_studio_mixdown(local_vocal_path: str, local_bgm_path: str, output_mixed_path: str, vocal_volume: float = 1.0, bgm_volume: float = 1.0):
    # 1. Uniformly resample both stems to a standard studio rate (44.1kHz)
    vocal_y, vocal_sr = librosa.load(local_vocal_path, sr=44100)
    bgm_y, bgm_sr = librosa.load(local_bgm_path, sr=44100)
    
    # Apply volume levels directly
    vocal_y = vocal_y * vocal_volume
    bgm_y = bgm_y * bgm_volume
    
    # Ensure matching array sizes on the timeline grid
    min_len = min(len(vocal_y), len(bgm_y))
    vocal_y, bgm_y = vocal_y[:min_len], bgm_y[:min_len]
    
    # 1. ENHANCED FREQUENCY CARVING WITH WIDENING FOR THE BGM
    bgm_eq_board = Pedalboard([
        HighpassFilter(cutoff_frequency_hz=45),                      # Clean up low-end sub mud
        Distortion(drive_db=3.0),                                    # Add saturation to make the drums punch and hit much harder
        HighShelfFilter(cutoff_frequency_hz=8000, gain_db=2.5),      # Add expensive "studio sparkle" to the high end
        Gain(gain_db=-1.5),                                          # Reduced to exactly 85% volume (baseline)
        Chorus(rate_hz=1.0, depth=0.4, mix=0.5)                      # Widen the backing track heavily to surround the vocal
    ])
    processed_bgm = bgm_eq_board(bgm_y, 44100)
    
    # 2. CLEAR FOCUS COMPRESSION & PROFESSIONAL REVERB FOR VOCALS
    vocal_board = Pedalboard([
        HighShelfFilter(cutoff_frequency_hz=10000, gain_db=3.0),    # Advanced Vocal Exciter (adds air)
        Compressor(threshold_db=-16, ratio=3.5, attack_ms=10),      # Tighten vocal transients
        Reverb(room_size=0.6, damping=0.5, wet_level=0.25, dry_level=0.9), # Glue the vocal into the track beautifully
        Gain(gain_db=0.0)                                           # Kept at 100% volume (baseline)
    ])
    processed_vocal = vocal_board(vocal_y, 44100)
    
    # ADVANCED TRUE SIDECHAIN (AUTO-DUCKING)
    # Calculate the RMS envelope of the processed vocal track
    hop_length = 512
    vocal_rms = librosa.feature.rms(y=processed_vocal, frame_length=2048, hop_length=hop_length)[0]
    
    # Normalize the envelope between 0 and 1
    max_rms = np.max(vocal_rms) if np.max(vocal_rms) > 0 else 1
    normalized_envelope = vocal_rms / max_rms
    
    # Smooth the envelope heavily so the ducking sounds natural (no clicking)
    import scipy.ndimage
    smoothed_envelope = scipy.ndimage.gaussian_filter1d(normalized_envelope, sigma=5)
    
    # Create the Ducking Curve: When vocal is loud (envelope near 1), duck multiplier drops to duck_amount
    duck_amount = 0.6  # BGM drops to 60% volume during heavy vocals
    ducking_curve = 1.0 - (smoothed_envelope * (1.0 - duck_amount))
    
    # Interpolate the ducking curve back to audio sample rate resolution
    target_len = len(processed_bgm)
    x_old = np.linspace(0, 1, len(ducking_curve))
    x_new = np.linspace(0, 1, target_len)
    full_res_ducking_curve = np.interp(x_new, x_old, ducking_curve)
    
    # Apply the mathematical sidechain directly to the BGM waveform!
    ducked_bgm = processed_bgm * full_res_ducking_curve
    
    # 3. COMBINE AND MASTER THROUGH A PEAK LIMITER
    final_mastered_mix = ducked_bgm + processed_vocal
    
    # Clean up clipping distortion using a brickwall mastering limiter
    final_master_board = Pedalboard([
        Limiter(threshold_db=-0.5)                                  # Maximizes overall track loudness safely
    ])
    final_output_signal = final_master_board(final_mastered_mix, 44100)
    
    # Write output file securely to disk
    sf.write(output_mixed_path, final_output_signal, 44100)
