import numpy as np
import wave
import struct
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

def generate_tone(frequency, duration=1.5, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    # Simple piano-like synthesis: fundamental + some harmonics
    tone = (np.sin(frequency * t * 2 * np.pi) +
            0.5 * np.sin(2 * frequency * t * 2 * np.pi) +
            0.25 * np.sin(3 * frequency * t * 2 * np.pi) +
            0.1 * np.sin(4 * frequency * t * 2 * np.pi))
            
    # Apply ADSR envelope to make it sound like a piano (percussive strike + decay)
    attack = int(0.01 * sample_rate)
    decay = int(duration * sample_rate) - attack
    envelope = np.concatenate([
        np.linspace(0, 1, attack),
        np.exp(-np.linspace(0, 4, decay))
    ])
    
    tone = tone * envelope
    # Normalize to 16-bit range
    tone = tone / np.max(np.abs(tone))
    audio = tone * 32767
    
    return audio.astype(np.int16)

def save_wav(filename, audio_data, sample_rate=44100):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(audio_data.tobytes())

out_dir = r"c:\nusic_gen\assets\sounds\piano"
os.makedirs(out_dir, exist_ok=True)

for note, freq in NOTES.items():
    file_name = f"{MAP[note]}.wav"
    path = os.path.join(out_dir, file_name)
    print(f"Generating {file_name} ({freq} Hz)")
    audio = generate_tone(freq)
    save_wav(path, audio)

print("Done generating piano notes.")
