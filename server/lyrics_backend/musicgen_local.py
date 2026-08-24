import os
import logging
import uuid
import torch
import scipy.io.wavfile

logger = logging.getLogger(__name__)

class LocalMusicGen:
    """
    Local GPU Inference Engine for facebook/musicgen-medium
    Downloads and caches the model, running it locally via transformers.
    """
    _processor = None
    _model = None

    @classmethod
    def _load_model(cls):
        if cls._model is None:
            logger.info("[LocalMusicGen] Loading facebook/musicgen-medium into memory... This requires ~3.5GB VRAM and may take a moment.")
            try:
                from transformers import AutoProcessor, MusicgenForConditionalGeneration
                cls._processor = AutoProcessor.from_pretrained("facebook/musicgen-medium")
                cls._model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-medium")
                
                device = "cuda" if torch.cuda.is_available() else "cpu"
                cls._model.to(device)
                logger.info(f"[LocalMusicGen] Model successfully loaded to {device}!")
            except Exception as e:
                logger.error(f"[LocalMusicGen] Failed to load model: {e}")
                raise

    @classmethod
    def generate(cls, prompt: str, duration_sec: int, output_dir: str) -> str:
        """
        Generates music from a text prompt using MusicGen Medium.
        Returns the path to the generated WAV file.
        """
        cls._load_model()
        
        logger.info(f"[LocalMusicGen] Generating {duration_sec}s of audio for prompt: '{prompt}'")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # MusicGen generates 256 tokens per 5 seconds of audio (~50 tokens/sec)
        max_new_tokens = int((duration_sec / 5.0) * 256)
        
        inputs = cls._processor(
            text=[prompt],
            padding=True,
            return_tensors="pt"
        ).to(device)

        with torch.no_grad():
            audio_values = cls._model.generate(**inputs, max_new_tokens=max_new_tokens, guidance_scale=3.0)
            
        audio_data = audio_values[0, 0].cpu().numpy()
        sample_rate = cls._model.config.audio_encoder.sampling_rate
        
        filename = f"bgm_{uuid.uuid4().hex}.wav"
        filepath = os.path.join(output_dir, filename)
        
        scipy.io.wavfile.write(filepath, rate=sample_rate, data=audio_data)
        logger.info(f"[LocalMusicGen] Successfully saved generation to {filepath}")
        
        return filepath
