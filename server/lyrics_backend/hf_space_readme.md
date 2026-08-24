---
title: Gandharva Lyrics AI
emoji: 🎵
colorFrom: purple
colorTo: indigo
sdk: gradio
sdk_version: 5.16.0
app_file: app.py
pinned: false
license: mit
---

# Gandharva Lyrics AI

Multilingual AI Songwriting Engine trained with QLoRA on Qwen2.5/Qwen3.

## API Usage

You can generate lyrics programmatically via Python `gradio_client` or HTTP API:

```python
from gradio_client import Client

client = Client("Prasanthm4734f/Gandharva-lyrics-ai")
result = client.predict(
    prompt="A soulful melody about rain and nostalgic memories",
    language="Telugu",
    genre="Melody",
    emotion="Nostalgic",
    variation="Standard Verse-Chorus",
    api_name="/generate_lyrics"
)
print(result)
```
