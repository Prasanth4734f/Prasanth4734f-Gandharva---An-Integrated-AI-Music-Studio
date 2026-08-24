import wave
import struct
import math
import os

class WaveParams:
    def __init__(self, nchannels, sampwidth, framerate):
        self.nchannels = nchannels
        self.sampwidth = sampwidth
        self.framerate = framerate

def load_wav_samples(file_path):
    """
    Reads a WAV file and returns samples normalized to float [-1.0, 1.0] and wave parameters.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")
        
    with wave.open(file_path, "rb") as w:
        params = w.getparams()
        nchannels = params.nchannels
        sampwidth = params.sampwidth
        framerate = params.framerate
        nframes = params.nframes
        frames = w.readframes(nframes)
        
    if sampwidth == 2:
        num_samples = nframes * nchannels
        samples = list(struct.unpack(f"<{num_samples}h", frames))
        float_samples = [float(x) / 32768.0 for x in samples]
    elif sampwidth == 1:
        num_samples = nframes * nchannels
        samples = list(struct.unpack(f"<{num_samples}B", frames))
        float_samples = [(float(x) - 128.0) / 128.0 for x in samples]
    else:
        # Fallback/Error for unsupported bit depths
        raise ValueError(f"Bit depth of {sampwidth * 8} bits is not supported. Only 16-bit or 8-bit WAV files supported.")
        
    return float_samples, WaveParams(nchannels, sampwidth, framerate)

def save_wav_samples(file_path, float_samples, params):
    """
    Saves a float sample list back to a 16-bit PCM WAV file.
    """
    int_samples = []
    for x in float_samples:
        val = int(x * 32768.0)
        if val > 32767:
            val = 32767
        elif val < -32768:
            val = -32768
        int_samples.append(val)
        
    raw_bytes = struct.pack(f"<{len(int_samples)}h", *int_samples)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    
    with wave.open(file_path, "wb") as w:
        w.setnchannels(params.nchannels)
        w.setsampwidth(2) # Force 16-bit output
        w.setframerate(params.framerate)
        w.writeframes(raw_bytes)

def trim_audio(samples, params, start_time, end_time):
    """
    Keeps only the segment between start_time and end_time (in seconds).
    """
    nchannels = params.nchannels
    framerate = params.framerate
    
    start_frame = int(start_time * framerate)
    end_frame = int(end_time * framerate)
    
    start_sample = max(0, start_frame * nchannels)
    end_sample = min(len(samples), end_frame * nchannels)
    
    return samples[start_sample:end_sample]

def cut_audio(samples, params, start_time, end_time):
    """
    Removes the segment between start_time and end_time (in seconds) and joins outer parts.
    """
    nchannels = params.nchannels
    framerate = params.framerate
    
    start_frame = int(start_time * framerate)
    end_frame = int(end_time * framerate)
    
    start_sample = max(0, start_frame * nchannels)
    end_sample = min(len(samples), end_frame * nchannels)
    
    return samples[:start_sample] + samples[end_sample:]

def change_volume(samples, volume_factor):
    """
    Scales audio samples linearly by volume_factor.
    """
    return [s * volume_factor for s in samples]

def apply_fades(samples, params, fade_in_sec, fade_out_sec):
    """
    Applies linear fade-in and fade-out envelopes to the samples.
    """
    nchannels = params.nchannels
    framerate = params.framerate
    total_samples = len(samples)
    
    output = list(samples)
    
    # 1. Apply Fade In
    if fade_in_sec > 0:
        fade_in_samples = int(fade_in_sec * framerate) * nchannels
        limit = min(fade_in_samples, total_samples)
        for i in range(limit):
            # Frame index is i // nchannels
            frame_idx = i // nchannels
            total_fade_frames = fade_in_samples // nchannels
            factor = float(frame_idx) / float(total_fade_frames) if total_fade_frames > 0 else 1.0
            output[i] *= factor
            
    # 2. Apply Fade Out
    if fade_out_sec > 0:
        fade_out_samples = int(fade_out_sec * framerate) * nchannels
        limit = min(fade_out_samples, total_samples)
        for i in range(limit):
            idx = total_samples - 1 - i
            frame_idx = i // nchannels
            total_fade_frames = fade_out_samples // nchannels
            factor = float(frame_idx) / float(total_fade_frames) if total_fade_frames > 0 else 1.0
            output[idx] *= factor
            
    return output

def merge_audios(samples_a, params_a, samples_b, params_b):
    """
    Concatenates samples_b onto samples_a.
    """
    # Simply concatenate the list of float samples
    # In a production system we'd resample if samplerate or channels differ,
    # but for matching Gandharva tracks, they share identical 44.1kHz stereo format.
    return samples_a + samples_b

def loop_and_extend(samples, params, target_duration):
    """
    Loops a track to target_duration using linear overlap-add crossfading.
    """
    nchannels = params.nchannels
    framerate = params.framerate
    
    single_len_sec = len(samples) / (nchannels * framerate)
    if single_len_sec >= target_duration:
        return trim_audio(samples, params, 0, target_duration)
        
    # Apply a 1-second crossfade (or 20% of track length if track is too short)
    crossfade_duration = min(1.0, single_len_sec * 0.2)
    crossfade_samples = int(crossfade_duration * framerate) * nchannels
    
    result = list(samples)
    current_len = len(result)
    target_samples = int(target_duration * framerate) * nchannels
    
    while current_len < target_samples:
        overlap_start = current_len - crossfade_samples
        next_part = samples[crossfade_samples:]
        
        # Apply crossfade blend in the overlap window
        for i in range(crossfade_samples):
            t_idx = overlap_start + i
            s_idx = i
            factor = float(i) / float(crossfade_samples) if crossfade_samples > 0 else 1.0
            
            if t_idx < len(result) and s_idx < len(samples):
                result[t_idx] = result[t_idx] * (1.0 - factor) + samples[s_idx] * factor
                
        result.extend(next_part)
        current_len = len(result)
        
    return result[:target_samples]

# ============================================================
# ADVANCED DSP EFFECTS (Phase 2 & 3 Integration)
# ============================================================

def change_tempo(samples, params, tempo_factor):
    """
    Resamples sample length to speed up or slow down tempo (affects pitch as tape-pitch).
    """
    if tempo_factor == 1.0 or tempo_factor <= 0.0:
        return samples
        
    nchannels = params.nchannels
    total_frames = len(samples) // nchannels
    
    new_frames = int(total_frames / tempo_factor)
    new_samples = [0.0] * (new_frames * nchannels)
    
    for c in range(nchannels):
        for f in range(new_frames):
            orig_f = f * tempo_factor
            idx1 = int(orig_f)
            idx2 = min(idx1 + 1, total_frames - 1)
            alpha = orig_f - idx1
            
            val1 = samples[idx1 * nchannels + c]
            val2 = samples[idx2 * nchannels + c]
            
            new_samples[f * nchannels + c] = val1 * (1.0 - alpha) + val2 * alpha
            
    return new_samples

def change_pitch(samples, params, pitch_semitones):
    """
    Shifts pitch using resampler factor.
    """
    if pitch_semitones == 0:
        return samples
        
    # Varispeed factor: 2 ** (semitones / 12)
    factor = 2.0 ** (pitch_semitones / 12.0)
    # Pitch shift changes samplerate play rates, but keeping sampling rate header constant
    return change_tempo(samples, params, factor)

def apply_bass_boost(samples, params, boost_level):
    """
    Applies low shelf boosting to low frequencies (<200Hz).
    """
    if boost_level == 'low':
        gain = 1.41 # +3dB
    elif boost_level == 'medium':
        gain = 2.0  # +6dB
    elif boost_level == 'high':
        gain = 3.16 # +10dB
    else:
        return samples
        
    nchannels = params.nchannels
    framerate = params.framerate
    
    # 1st-order IIR LPF (Cutoff 180Hz)
    alpha = 2.0 * math.pi * 180.0 / framerate
    alpha = min(max(alpha, 0.0), 1.0)
    
    output = [0.0] * len(samples)
    y = [0.0] * nchannels
    
    for i in range(0, len(samples), nchannels):
        for c in range(nchannels):
            x = samples[i + c]
            # y holds the low pass filter component
            y[c] = x * alpha + y[c] * (1.0 - alpha)
            # Add amplified low frequencies back to full-spectrum signal
            output[i + c] = x + y[c] * (gain - 1.0)
            
    return output

def apply_equalizer(samples, params, bass_db, mid_db, treble_db):
    """
    Applies a 3-band crossover EQ (Bass <250Hz, Treble >4000Hz, Mids 250Hz-4000Hz).
    """
    # Convert dB gains to linear scales
    b_gain = 10.0 ** (bass_db / 20.0)
    m_gain = 10.0 ** (mid_db / 20.0)
    t_gain = 10.0 ** (treble_db / 20.0)
    
    nchannels = params.nchannels
    framerate = params.framerate
    
    alpha_bass = 2.0 * math.pi * 250.0 / framerate
    alpha_treble = 2.0 * math.pi * 4000.0 / framerate
    
    alpha_bass = min(max(alpha_bass, 0.0), 1.0)
    alpha_treble = min(max(alpha_treble, 0.0), 1.0)
    
    output = [0.0] * len(samples)
    y_bass = [0.0] * nchannels
    y_treb = [0.0] * nchannels
    
    for i in range(0, len(samples), nchannels):
        for c in range(nchannels):
            x = samples[i + c]
            
            # Simple digital filters
            y_bass[c] = x * alpha_bass + y_bass[c] * (1.0 - alpha_bass)
            y_treb[c] = x * alpha_treble + y_treb[c] * (1.0 - alpha_treble)
            
            s_bass = y_bass[c]
            s_mid = y_treb[c] - y_bass[c]
            s_treble = x - y_treb[c]
            
            output[i + c] = s_bass * b_gain + s_mid * m_gain + s_treble * t_gain
            
    return output

def apply_reverb(samples, params, reverb_type):
    """
    Adds ambient depth using parallel delay line echoes.
    """
    nchannels = params.nchannels
    framerate = params.framerate
    
    if reverb_type == 'studio':
        delays_ms = [15, 22, 27]
        decay = 0.35
        mix = 0.25
    elif reverb_type == 'hall':
        delays_ms = [45, 57, 73]
        decay = 0.5
        mix = 0.4
    elif reverb_type == 'concert':
        delays_ms = [83, 107, 139]
        decay = 0.65
        mix = 0.5
    else:
        return samples
        
    delay_samples = [int(ms * framerate / 1000) * nchannels for ms in delays_ms]
    output = list(samples)
    
    for ds in delay_samples:
        if ds <= 0 or ds >= len(samples):
            continue
        temp = [0.0] * len(samples)
        for i in range(ds, len(samples)):
            temp[i] = samples[i - ds] + temp[i - ds] * decay
        for i in range(len(samples)):
            output[i] += temp[i] * mix
            
    # Clip protection normalization
    max_val = max(abs(x) for x in output) if output else 0
    if max_val > 1.0:
        output = [x / max_val for x in output]
        
    return output

def apply_echo(samples, params, echo_percentage):
    """
    Adds delay line echo with feedback.
    """
    if echo_percentage <= 0.0:
        return samples
        
    nchannels = params.nchannels
    framerate = params.framerate
    
    # 350ms echo delay
    delay_samples = int(0.35 * framerate) * nchannels
    feedback = echo_percentage * 0.65
    mix = echo_percentage * 0.5
    
    output = list(samples)
    buffer = [0.0] * len(samples)
    
    for i in range(delay_samples, len(samples)):
        buffer[i] = samples[i - delay_samples] + buffer[i - delay_samples] * feedback
        output[i] += buffer[i] * mix
        
    # Clip protection normalization
    max_val = max(abs(x) for x in output) if output else 0
    if max_val > 1.0:
        output = [x / max_val for x in output]
        
    return output

def mix_audios_with_volume(samples_vocal, params_vocal, samples_bgm, params_bgm, vol_vocal, vol_bgm):
    """
    Mixes vocal and BGM with specific volumes. Ensures both tracks are the same length by trimming/padding the BGM.
    Assume both are 44.1kHz stereo (or adapt).
    """
    out_samples = []
    
    len_vocal = len(samples_vocal)
    len_bgm = len(samples_bgm)
    
    # We want the final track to be the length of the vocal
    for i in range(len_vocal):
        v = samples_vocal[i] * vol_vocal
        b = samples_bgm[i] * vol_bgm if i < len_bgm else 0.0
        
        mixed = v + b
        
        # Hard clipping protection
        if mixed > 1.0: mixed = 1.0
        elif mixed < -1.0: mixed = -1.0
        
        out_samples.append(mixed)
        
    return out_samples, params_vocal
