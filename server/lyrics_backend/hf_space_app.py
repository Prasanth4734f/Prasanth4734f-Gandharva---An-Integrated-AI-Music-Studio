import spaces
import os
import sys
import torch
import huggingface_hub

# Monkey-patch HfFolder for compatibility with newer huggingface_hub versions
if not hasattr(huggingface_hub, "HfFolder"):
    class HfFolder:
        @classmethod
        def get_token(cls): return None
        @classmethod
        def save_token(cls, token): pass
    huggingface_hub.HfFolder = HfFolder

import gradio as gr
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
ADAPTER_REPO = "Prasanthm4734f/gandharva-lyrics-v1"
LOCAL_ADAPTER_PATH = os.path.join(os.path.dirname(__file__), "gandharva_lyrics_v1")

target_adapter = ADAPTER_REPO
if os.path.exists(LOCAL_ADAPTER_PATH):
    target_adapter = LOCAL_ADAPTER_PATH
elif os.path.exists("gandharva_lyrics_v1"):
    target_adapter = "gandharva_lyrics_v1"

print(f"🚀 Initializing Tokenizer ({BASE_MODEL_ID})...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID, trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

_model_cache = None

def get_model(device):
    global _model_cache
    if _model_cache is not None:
        return _model_cache
        
    print(f"🚀 Loading Base Model ({BASE_MODEL_ID}) & LoRA Adapter from '{target_adapter}' on {device}...")
    try:
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_ID,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )
    except Exception as err:
        print(f"⚠️ Base model load fallback ({err}). Using Qwen2.5-1.5B-Instruct...")
        base_model = AutoModelForCausalLM.from_pretrained(
            "Qwen/Qwen2.5-1.5B-Instruct",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )
    
    print(f"✅ Loading Gandharva LoRA Adapter from '{target_adapter}'...")
    try:
        _model_cache = PeftModel.from_pretrained(base_model, target_adapter)
    except Exception as p_err:
        print(f"⚠️ Peft note ({p_err}). Using base model.")
        _model_cache = base_model
        
    _model_cache.eval()
    if device == "cuda":
        _model_cache.to("cuda")
    return _model_cache

@spaces.GPU
def generate_lyrics(prompt, language, genre, emotion, variation):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = get_model(device)

    system_prompt = f"""<|im_start|>system
You are Gandharva Lyrics AI, a master multilingual songwriter.

CRITICAL INSTRUCTION:
Write a complete, full-length, extended song in native {language} script.
You MUST follow a full professional song structure:
[Verse 1]
[Pre-Chorus]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Outro]

Translate the input concept into rich, poetic native {language} lyrics.
DO NOT output English characters when native {language} is requested.

Language: {language}
Genre: {genre}
Emotion: {emotion}
Variation: {variation}

Use meaningful singing-performance cues when appropriate:
[hold]
[rise]
[soft]
[pause]

Do not explain the lyrics.
Return only the complete song lyrics in native {language}.
<|im_end|>
<|im_start|>user
Write a full-length, complete song in native {language} with all sections ([Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]) based on this theme:

{prompt}
<|im_end|>
<|im_start|>assistant
"""
    inputs = tokenizer([system_prompt], return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    pad_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=1024,
            min_new_tokens=256,
            temperature=0.75,
            top_p=0.9,
            repetition_penalty=1.08,
            do_sample=True,
            pad_token_id=pad_id,
            eos_token_id=tokenizer.eos_token_id
        )

    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    if "<|im_start|>assistant" in generated_text:
        lyrics = generated_text.split("<|im_start|>assistant")[-1].strip()
    elif "\nassistant\n" in generated_text:
        lyrics = generated_text.split("\nassistant\n")[-1].strip()
    elif generated_text.startswith("assistant"):
        lyrics = generated_text[len("assistant"):].strip()
    else:
        lyrics = generated_text.replace(system_prompt, "").strip()

    if lyrics.startswith("assistant"):
        lyrics = lyrics[len("assistant"):].strip()

    return lyrics

# Gradio Interface Definition
demo = gr.Interface(
    fn=generate_lyrics,
    inputs=[
        gr.Textbox(lines=3, placeholder="Enter song concept or prompt...", label="Song Concept / Prompt"),
        gr.Dropdown(["Telugu", "Hindi", "Tamil", "English", "Kannada", "Malayalam"], value="Telugu", label="Language"),
        gr.Dropdown(["Pop", "Folk", "Classical", "Melody", "Rock", "Devotional", "Hip-Hop"], value="Pop", label="Genre"),
        gr.Dropdown(["Romantic", "Melancholic", "Energetic", "Nostalgic", "Devotional", "Upbeat"], value="Romantic", label="Emotion"),
        gr.Dropdown(["Standard Verse-Chorus", "Extended Hook", "Acoustic Ballad", "Rap Verse"], value="Standard Verse-Chorus", label="Variation")
    ],
    outputs=gr.Textbox(lines=12, label="Generated Lyrics by Gandharva AI"),
    title="🎵 Gandharva Lyrics AI",
    description="Custom Fine-Tuned Songwriting Engine powered by Qwen + QLoRA Adapter.",
    api_name="generate_lyrics"
)

if __name__ == "__main__":
    demo.launch()
