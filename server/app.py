# app.py (Deploy this directly into your Hugging Face ZeroGPU Space)
import gradio as gr
import torch
import numpy as np
import spaces
from diffusers import AudioLDM2Pipeline

# Load the state-of-the-art Latent Audio Diffusion architecture
pipe = AudioLDM2Pipeline.from_pretrained(
    "cvssp/audioldm2-music", 
    torch_dtype=torch.float16 # Run in half-precision for fast execution speeds
)

@spaces.GPU(duration=30)
def generate_pure_vocal_to_accompaniment(vocal_audio_tuple):
    """
    Zero-Prompt Vocal-to-Accompaniment Generation Core.
    Completely ignores text strings and uses the vocal track as an explicit conditional anchor.
    """
    sr, y = vocal_audio_tuple
    
    # 1. Standardize and normalize the vocal array downmix
    if len(y.shape) > 1:
        y = np.mean(y, axis=1)
    vocal_signal = y.astype(np.float32) / (np.max(np.abs(y)) + 1e-6)
    
    pipe.to("cuda")
    with torch.no_grad():
        # 2. Execute the audio-conditioned latent diffusion loop
        # The audio_placeholder parameter replaces the text conditioning entirely,
        # forcing the model's reverse-diffusion process to match the singer's structural cadence.
        engineered_prompt = "High quality professional studio instrumental accompaniment track, perfectly arranged, no vocals"
        generated_audio = pipe(
            prompt=engineered_prompt,
            negative_prompt="low quality, muffled sound, distorted instruments, mono, hiss, crackle, out of tune, amateur mix",
            guidance_scale=4.5,
            audio_placeholder=vocal_signal, 
            audio_placeholder_sample_rate=sr,
            num_inference_steps=40,         # Optimized balance between speed and generation fidelity
            audio_length_in_s=15.0          # Generates a solid 15-second backing loop
        ).audios[0]
        
    return 16000, generated_audio # AudioLDM 2 outputs high-fidelity 16kHz audio arrays natively

demo = gr.Interface(
    fn=generate_pure_vocal_to_accompaniment, 
    inputs=[gr.Audio(type="numpy")], 
    outputs="audio"
)
demo.launch()
