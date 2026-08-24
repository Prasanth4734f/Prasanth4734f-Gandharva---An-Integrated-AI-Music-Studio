import requests
import os

url = "https://audition-roamer-darling.ngrok-free.dev/generate_vocal"

# Create a dummy valid wav file (e.g. 1 second of silence)
import wave
import struct

filename = "dummy.wav"
with wave.open(filename, 'w') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(44100)
    # Write 1 second of silence
    for i in range(44100):
        w.writeframesraw(struct.pack('<h', 0))

with open(filename, "rb") as f:
    files = {"vocal_file": ("dummy.wav", f, "audio/wav")}
    data = {
        "prompt": "[Genre: Pop] [Mood: Sad]",
        "duration": "5",
        "seed": "42"
    }
    print(f"Testing {url}...")
    headers = {"ngrok-skip-browser-warning": "1"}
    try:
        r = requests.post(url, data=data, files=files, headers=headers, timeout=30)
        print("Status:", r.status_code)
        if r.status_code == 200:
            print("SUCCESS! Output length:", len(r.content))
        else:
            print("ERROR response:", r.text)
    except Exception as e:
        print("EXCEPTION:", str(e))
