import os
import numpy as np
from scipy.io import wavfile

SAMPLE_RATE = 44100
DURATION = 1.0  # 1 second

def save_wav(filename, audio_data):
    # Normalize to 16-bit
    audio_data = np.int16(audio_data / np.max(np.abs(audio_data)) * 32767)
    wavfile.write(filename, SAMPLE_RATE, audio_data)

def generate_piano():
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)
    freq = 261.63
    envelope = np.exp(-3 * t)
    wave = np.sin(2 * np.pi * freq * t) * envelope
    return wave

def generate_violin():
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)
    freq = 440 + 2 * np.sin(2 * np.pi * 5 * t)
    wave = 2 * (t * freq - np.floor(0.5 + t * freq))
    envelope = np.minimum(t * 5, 1.0) * np.exp(-0.5 * t)
    return wave * envelope

def generate_drums():
    t = np.linspace(0, 0.3, int(SAMPLE_RATE * 0.3), False)
    freq = 150 * np.exp(-15 * t)
    wave = np.sin(2 * np.pi * freq * t)
    envelope = np.exp(-10 * t)
    return np.pad(wave * envelope, (0, int(SAMPLE_RATE * 0.7)))

def generate_guitar():
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)
    freq = 82.41
    wave = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * 2 * freq * t)
    envelope = np.exp(-4 * t)
    return wave * envelope

def generate_flute():
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)
    freq = 523.25
    noise = np.random.normal(0, 0.1, len(t))
    wave = np.sin(2 * np.pi * freq * t) + 0.05 * noise
    envelope = np.minimum(t * 10, 1.0) * np.exp(-0.5 * t)
    return wave * envelope

def generate_synth():
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)
    freq = 130.81
    wave = np.sign(np.sin(2 * np.pi * freq * t))
    envelope = np.exp(-1 * t)
    return wave * envelope

def generate_cello():
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)
    freq = 65.41
    wave = 2 * (t * freq - np.floor(0.5 + t * freq)) + 0.5 * np.sin(2 * np.pi * freq * t)
    envelope = np.minimum(t * 3, 1.0) * np.exp(-0.2 * t)
    return wave * envelope

os.makedirs('public/instruments', exist_ok=True)
save_wav('public/instruments/piano.wav', generate_piano())
save_wav('public/instruments/violin.wav', generate_violin())
save_wav('public/instruments/drums.wav', generate_drums())
save_wav('public/instruments/guitar.wav', generate_guitar())
save_wav('public/instruments/flute.wav', generate_flute())
save_wav('public/instruments/synth.wav', generate_synth())
save_wav('public/instruments/cello.wav', generate_cello())

print("Instruments generated.")
