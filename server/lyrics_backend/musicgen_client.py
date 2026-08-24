import os
import httpx
import logging
import shutil
import uuid
import time
from typing import Optional

logger = logging.getLogger(__name__)

class MusicGenClient:
    """
    Handles async communication with the MusicGen API and provides local fallback
    templates if the GPU service is unavailable.
    """

    def __init__(self, api_url: str, fallback_dir: str, output_dir: str):
        self.api_url = api_url.rstrip("/")
        self.fallback_dir = fallback_dir
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_bgm(self, prompt: str, duration: int, genre: Optional[str] = None, analysis: dict = None, vocal_path: Optional[str] = None) -> str:
        """
        Attempts to generate music via API. Falls back to local templates if it fails.
        Returns the absolute local path to the generated/fallback WAV file.
        """
        seed = int(time.time() * 1000) % 1000000
        output_filename = f"bgm_{uuid.uuid4().hex}.wav"
        output_path = os.path.join(self.output_dir, output_filename)

        try:
            logger.info(f"[MusicGenClient] Requesting BGM generation from {self.api_url}")
            logger.info(f"[MusicGenClient] Prompt: '{prompt}', Duration: {duration}s")
            
            async with httpx.AsyncClient() as client:
                # Fast fail check
                await client.get(self.api_url, timeout=5.0, headers={"ngrok-skip-browser-warning": "1"})
                
                # Actual generation
                if vocal_path and os.path.exists(vocal_path):
                    logger.info(f"[MusicGenClient] Uploading vocal for Magic Box conditioning...")
                    
                    # Read the dedicated Magic Box URL from .env
                    magic_box_url = os.getenv("MAGIC_BOX_API_URL", self.api_url).rstrip("/")
                    
                    with open(vocal_path, "rb") as f:
                        files = {'vocal_file': (os.path.basename(vocal_path), f, 'audio/wav')}
                        data = {'prompt': prompt, 'duration': str(duration), 'seed': str(seed)}
                        
                        resp = await client.post(
                            f"{magic_box_url}/generate_vocal",
                            data=data,
                            files=files,
                            headers={"ngrok-skip-browser-warning": "1"},
                            timeout=600.0
                        )
                else:
                    resp = await client.post(
                        f"{self.api_url}/generate",
                        json={"prompt": prompt, "duration": duration, "seed": seed},
                        headers={"ngrok-skip-browser-warning": "1"},
                        timeout=600.0
                    )
                
                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    
                    # If the API returns raw binary audio data
                    if "audio/" in content_type or resp.content.startswith(b"RIFF"):
                        with open(output_path, "wb") as f:
                            f.write(resp.content)
                        logger.info(f"[MusicGenClient] Successfully received raw audio from API and saved to {output_path}")
                        return output_path
                        
                    # If the API returns JSON with an audio_url
                    try:
                        data = resp.json()
                        audio_url = data.get("audio_url")
                        if audio_url:
                            logger.info(f"[MusicGenClient] API returned audio_url: {audio_url}. Downloading...")
                            audio_resp = await client.get(audio_url, timeout=30.0)
                            if audio_resp.status_code == 200:
                                with open(output_path, "wb") as f:
                                    f.write(audio_resp.content)
                                logger.info(f"[MusicGenClient] Downloaded generated track to {output_path}")
                                return output_path
                    except Exception as json_err:
                        logger.warning(f"[MusicGenClient] Failed to parse API response as JSON: {json_err}. Using fallback template.")
                else:
                    logger.warning(f"[MusicGenClient] API returned status code {resp.status_code}. Using fallback.")
                    
        except Exception as e:
            logger.warning(f"[MusicGenClient] Remote API Generation failed or offline: {e}. Attempting Local GPU Generation...")

        # If we reach here, we try Jamendo fallback first for speed
        try:
            success = await self._fetch_jamendo_fallback(genre, output_path, analysis)
            if success:
                return output_path
            else:
                fallback_file = self._get_fallback_file(genre)
                if fallback_file and os.path.exists(fallback_file):
                    shutil.copy(fallback_file, output_path)
                    logger.info(f"[MusicGenClient] Used local fallback file: {fallback_file}")
                    return output_path
        except Exception as fallback_err:
            logger.error(f"[MusicGenClient] Fallback failed: {fallback_err}")
            
        raise Exception("AI model generation failed. Remote API offline and fallbacks failed.")

    async def _fetch_jamendo_fallback(self, genre: Optional[str], output_path: str, analysis: dict = None) -> bool:
        """
        Downloads a curated, studio-quality track from Jamendo based on genre and mood 
        to guarantee variety when the GPU generation API is offline.
        """
        import random
        # Target tag based on genre
        target_genre = genre if genre and genre != "undefined" else (analysis.get("classified_genre") if analysis else "pop")
        tag = target_genre.lower().split()[0]
        
        # Use a fallback working public jamendo ID if the env one is invalid
        client_id = os.getenv("JAMENDO_CLIENT_ID", "b6747d04")
        if client_id == "56d30c11": # Handle known-invalid env client_id
            client_id = "b6747d04"

        jamendo_api = f"https://api.jamendo.com/v3.0/tracks/?client_id={client_id}&format=json&limit=20&tags={tag}"
        
        try:
            logger.info(f"[MusicGenClient] GPU offline. Fetching track from Jamendo for tag: {tag}...")
            async with httpx.AsyncClient() as client:
                resp = await client.get(jamendo_api, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("results"):
                        track = random.choice(data["results"])
                        audio_url = track.get("audio")
                        if audio_url:
                            logger.info(f"[MusicGenClient] Selected Jamendo track: {track.get('name')}")
                            audio_resp = await client.get(audio_url, timeout=30.0)
                            if audio_resp.status_code == 200:
                                temp_mp3 = output_path.replace(".wav", "_premium.mp3")
                                with open(temp_mp3, "wb") as f:
                                    f.write(audio_resp.content)
                                    
                                import av
                                import numpy as np
                                import soundfile as sf
                                
                                container = av.open(temp_mp3)
                                stream = container.streams.audio[0]
                                frames = [frame.to_ndarray() for frame in container.decode(stream)]
                                if frames:
                                    audio_data = np.concatenate(frames, axis=1).T
                                    sf.write(output_path, audio_data, stream.rate)
                                    
                                try:
                                    os.remove(temp_mp3)
                                except: pass
                                
                                logger.info("[MusicGenClient] Successfully prepared Jamendo fallback BGM.")
                                return True
        except Exception as e:
            logger.warning(f"[MusicGenClient] Jamendo fallback failed: {e}")
            
        return False

    def _get_fallback_file(self, genre: Optional[str]) -> str:
        """
        Selects a random fallback track to ensure variety when generation/APIs fail.
        """
        import random
        # We know we have track1.mp3 through track5.mp3. Pick completely randomly to ensure
        # that the user gets different BGM every single time they generate.
        # The beat-matching engine will warp this random track to perfectly fit their vocal anyway!
        available_tracks = ["track1.mp3", "track2.mp3", "track3.mp3", "track4.mp3", "track5.mp3"]
        
        # If the fallback directory has actual files, we can just pick from them
        if os.path.exists(self.fallback_dir):
            # Only pick .mp3 files. The 16KB .wav files in this directory are corrupted headers
            # that cause the time-stretching engine to create a continuous "toooooot" noise!
            files = [f for f in os.listdir(self.fallback_dir) if f.endswith(".mp3")]
            if files:
                return random.choice(files)
                
        return random.choice(available_tracks)
