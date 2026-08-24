# -*- coding: utf-8 -*-
"""
GANDHARVA LOCAL MODEL CLI RUNNER
================================
Run your fine-tuned local PyTorch model (gandharva_lyrics_v1) directly from terminal.
"""
import os
import sys
import torch
import time

def run_gandharva_local(prompt: str, language: str = "Telugu", genre: str = "Pop", mood: str = "Melancholic"):
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", "gandharva_lyrics_v1"))
    
    print("=" * 65)
    print("      🚀 GANDHARVA LOCAL MODEL INFERENCE ENGINE (v1.0)")
    print("=" * 65)
    print(f"📁 Model Path : {model_dir}")
    print(f"✍️  Prompt     : {prompt}")
    print(f"🌐 Language   : {language}")
    print(f"🎵 Style      : {genre} ({mood})")
    print("-" * 65)

    if not os.path.exists(model_dir):
        print("❌ Error: Local model directory not found at:", model_dir)
        return

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"⚙️  Compute Device: {device.upper()}")

    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        print("📦 Step 1: Loading Tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_dir, trust_remote_code=True)

        base_model_id = "unsloth/qwen3-8b-unsloth-bnb-4bit"
        print(f"🧠 Step 2: Loading Base Model ({base_model_id})...")
        
        start_time = time.time()
        
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            trust_remote_code=True
        )

        print("⚡ Step 3: Attaching Gandharva LoRA Fine-Tuned Weights...")
        model = PeftModel.from_pretrained(base_model, model_dir)
        model.eval()

        print(f"✅ Model Loaded Successfully in {time.time() - start_time:.2f}s!")
        print("\n✍️  Generating Song Lyrics...")

        formatted_input = f"Write a complete {mood} {genre} song in {language}.\nTopic: {prompt}\n\nLyrics:\n"
        inputs = tokenizer(formatted_input, return_tensors="pt").to(device)

        gen_start = time.time()
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.8,
                top_p=0.9,
                do_sample=True
            )

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print("\n" + "=" * 65)
        print("                🎵 GENERATED LYRICS OUTPUT 🎵")
        print("=" * 65)
        print(generated_text)
        print("=" * 65)
        print(f"⏱️ Generation Time: {time.time() - gen_start:.2f} seconds")

    except Exception as e:
        print("\n❌ Local Model Generation Error:", str(e))
        print("💡 Fallback Note: For high-speed production use, launch via GPU or Gemini Flash.")

if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else "create a song based on indian independence history remembering fighters sacrifices"
    language = sys.argv[2] if len(sys.argv) > 2 else "Telugu"
    run_gandharva_local(prompt, language)
