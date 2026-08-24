import numpy as np
import wave
import os

NOTES = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50
}

MAP = {
    'C4': 'C4', 'C#4': 'Cs4', 'D4': 'D4', 'D#4': 'Ds4', 'E4': 'E4', 'F4': 'F4',
    'F#4': 'Fs4', 'G4': 'G4', 'G#4': 'Gs4', 'A4': 'A4', 'A#4': 'As4', 'B4': 'B4',
    'C5': 'C5', 'C#5': 'Cs5', 'D5': 'D5', 'D#5': 'Ds5', 'E5': 'E5', 'F5': 'F5',
    'F#5': 'Fs5', 'G5': 'G5', 'G#5': 'Gs5', 'A5': 'A5', 'A#5': 'As5', 'B5': 'B5',
    'C6': 'C6'
}

def generate_bansuri_flute_note(frequency, duration=2.2, sample_rate=44100):
    num_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    
    # 1. Indian Bansuri Breath Vibrato (5.2 Hz frequency modulation)
    vibrato_rate = 5.2
    vibrato_depth = 0.007  # 0.7% pitch modulation for natural woodwind expression
    # Delay vibrato start slightly (player starts note clean then adds vibrato)
    vibrato_env = np.clip((t - 0.2) / 0.4, 0.0, 1.0)
    inst_freq = frequency * (1.0 + vibrato_depth * vibrato_env * np.sin(2 * np.pi * vibrato_rate * t))
    
    # Phase integration for smooth pitch modulation
    phase = 2 * np.pi * np.cumsum(inst_freq) / sample_rate
    
    # 2. Harmonics of Bamboo Flute (dominated by pure fundamental + soft even/odd overtones)
    harm1 = np.sin(phase)                       # Fundamental
    harm2 = 0.22 * np.sin(2 * phase)             # Octave (bamboo body warmth)
    harm3 = 0.08 * np.sin(3 * phase + 0.5)       # 12th overtone
    harm4 = 0.03 * np.sin(4 * phase + 1.0)       # High air sparkle
    
    tone = harm1 + harm2 + harm3 + harm4
    
    # 3. Air Blow Noise / Embouchure Turbulence (Crucial for realistic blowing sound!)
    raw_air_noise = np.random.normal(0, 1, num_samples)
    
    # Simple bandpass filter for breath noise around 2kHz-4kHz
    # We use a moving average subtraction / high-pass technique
    window = 10
    smoothed_noise = np.convolve(raw_air_noise, np.ones(window)/window, mode='same')
    breath_noise = raw_air_noise - smoothed_noise  # High-frequency breath hiss
    
    # Breath noise intensity envelope (more air at initial blow, then continuous air stream)
    air_envelope = 0.15 + 0.10 * np.exp(-t / 0.15)
    air_noise_final = breath_noise * air_envelope * 0.14
    
    # Mix pure tone with air blow noise
    flute_sound = tone + air_noise_final
    
    # 4. Amplitude Tremolo (player's diaphragm breath pulse)
    tremolo = 1.0 + 0.06 * vibrato_env * np.sin(2 * np.pi * vibrato_rate * t)
    flute_sound = flute_sound * tremolo
    
    # 5. ADSR Envelope (Soft air blow attack, long sustain, gentle wind release)
    attack_sec = 0.08
    decay_sec = 0.15
    release_sec = 0.30
    sustain_sec = duration - (attack_sec + decay_sec + release_sec)
    
    att_samples = int(attack_sec * sample_rate)
    dec_samples = int(decay_sec * sample_rate)
    rel_samples = int(release_sec * sample_rate)
    sus_samples = num_samples - att_samples - dec_samples - rel_samples
    
    # Smooth quarter-sine attack for realistic breath entrance
    attack_curve = np.sin(np.linspace(0, np.pi/2, att_samples))
    decay_curve = np.linspace(1.0, 0.88, dec_samples)
    sustain_curve = np.full(sus_samples, 0.88)
    release_curve = np.linspace(0.88, 0.0, rel_samples)
    
    adsr = np.concatenate([attack_curve, decay_curve, sustain_curve, release_curve])
    if len(adsr) < num_samples:
        adsr = np.pad(adsr, (0, num_samples - len(adsr)), 'constant')
    else:
        adsr = adsr[:num_samples]
        
    flute_sound = flute_sound * adsr
    
    # 6. Subtle Ambient Chamber Reverb (Delay Feedback)
    delay_samples = int(0.045 * sample_rate) # 45ms reflection
    reverb_sound = np.zeros_like(flute_sound)
    reverb_sound[:num_samples] = flute_sound
    reverb_sound[delay_samples:] += 0.22 * flute_sound[:-delay_samples]
    reverb_sound[delay_samples*2:] += 0.08 * flute_sound[:-delay_samples*2]
    
    # Normalize to 16-bit PCM bounds cleanly
    max_val = np.max(np.abs(reverb_sound))
    if max_val > 0:
        reverb_sound = (reverb_sound / max_val) * 0.92
        
    audio_pcm = (reverb_sound * 32767).astype(np.int16)
    return audio_pcm

def save_wav(filename, audio_data, sample_rate=44100):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(audio_data.tobytes())

if __name__ == '__main__':
    out_dir = r"c:\nusic_gen\assets\sounds\flute"
    os.makedirs(out_dir, exist_ok=True)
    
    print("Generating Authentic Bansuri Flute Sound Samples...")
    for note, freq in NOTES.items():
        file_name = f"{MAP[note]}.wav"
        path = os.path.join(out_dir, file_name)
        print(f"  -> Synthesizing Bansuri Flute {note} ({freq} Hz)")
        audio = generate_bansuri_flute_note(freq)
        save_wav(path, audio)
        
    print("✨ Done generating Bansuri Flute sounds in assets/sounds/flute!")
