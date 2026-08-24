# ============================================================
# GANDHARVA LYRICS AI — KAGGLE GPU INFERENCE SERVER (OFFICIAL)
# ============================================================

# 1. Clear stale compiled cache and install matched stable stack
import shutil, os, zipfile
if os.path.exists("/kaggle/working/unsloth_compiled_cache"):
    shutil.rmtree("/kaggle/working/unsloth_compiled_cache", ignore_errors=True)

!pip install --quiet --no-cache-dir "transformers==4.51.3" "trl==0.18.2" "datasets>=3.4.1,<4.4.0" "torchvision>=0.27.0" bitsandbytes fastapi uvicorn pyngrok nest_asyncio
!pip install --quiet --no-cache-dir --no-deps unsloth unsloth_zoo

# 2. Auto-Unzip Adapter ZIP if available
zip_candidates = [
    "/kaggle/working/gandharva_lyrics_v1.zip",
    "/kaggle/input/gandharva-lyrics-v1/gandharva_lyrics_v1.zip",
    "/kaggle/input/gandharva_lyrics_v1/gandharva_lyrics_v1.zip"
]

for z in zip_candidates:
    if os.path.exists(z) and not os.path.exists("/kaggle/working/gandharva_lyrics_v1"):
        print(f"📦 Auto-extracting adapter from {z}...")
        os.makedirs("/kaggle/working/gandharva_lyrics_v1", exist_ok=True)
        with zipfile.ZipFile(z, 'r') as zip_ref:
            zip_ref.extractall("/kaggle/working/gandharva_lyrics_v1")
        print("✅ Adapter ZIP extracted successfully!")
        break

# 3. Imports and Environment Setup
os.environ["UNSLOTH_IS_PRESENT"] = "1"

try:
    import unsloth.import_fixes
    unsloth.import_fixes.torchvision_compatibility_check = lambda *args, **kwargs: None
except Exception:
    pass

import torch
import nest_asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from unsloth import FastLanguageModel

print("============================================================")
print("     GANDHARVA LYRICS AI — KAGGLE T4 GPU INFERENCE API     ")
print("============================================================")

# 4. GPU Hardware Verification
if not torch.cuda.is_available():
    raise RuntimeError("CUDA GPU not detected! Enable GPU Accelerator (Tesla T4) in Kaggle Notebook sidebar.")

gpu_name = torch.cuda.get_device_name(0)
print(f"✅ GPU Accelerator: {gpu_name}")

# 5. Search and Load Model Adapter
model_dir_candidates = [
    "/kaggle/working/gandharva_lyrics_v1",
    "/kaggle/input/gandharva-lyrics-v1/gandharva_lyrics_v1",
    "/kaggle/input/gandharva_lyrics_v1"
]

adapter_path = None
for p in model_dir_candidates:
    if os.path.exists(p):
        adapter_path = p
        break

if adapter_path is None:
    raise FileNotFoundError("Model adapter folder 'gandharva_lyrics_v1' not found in /kaggle/working or /kaggle/input")

print(f"✅ Found Trained Adapter Path: {adapter_path}")

# 6. Load Base Qwen + Fine-Tuned Adapter on GPU
print("\n[INFERENCE] Loading Qwen + Gandharva QLoRA Adapter on GPU...")
max_seq_length = 2048

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=adapter_path,
    max_seq_length=max_seq_length,
    dtype=None,
    load_in_4bit=True,
)

FastLanguageModel.for_inference(model)
print("✅ Gandharva Lyrics AI Loaded onto GPU for Lightning Inference!")

# 7. Define FastAPI Server & Request/Response Schemas
app = FastAPI(title="Gandharva Lyrics AI GPU Server")

class LyricsRequest(BaseModel):
    prompt: str
    language: str = "Telugu"
    genre: str = "Pop"
    emotion: str = "Romantic"
    variation: str = "Standard Verse-Chorus"

class LyricsResponse(BaseModel):
    status: str
    lyrics: str
    language: str
    genre: str
    engine: str = "gandharva-qwen-gpu"

@app.post("/generate_lyrics", response_model=LyricsResponse)
def generate_lyrics_api(req: LyricsRequest):
    try:
        system_prompt = f"""<|im_start|>system
You are Gandharva Lyrics AI, a professional multilingual songwriter.

Write original, meaningful and singable song lyrics.

Language: {req.language}
Genre: {req.genre}
Emotion: {req.emotion}
Variation: {req.variation}

Follow the requested song structure.

Use meaningful singing-performance cues when appropriate:
[hold]
[rise]
[soft]
[pause]

Do not explain the lyrics.
Return only the song lyrics.
<|im_end|>
<|im_start|>user
Create original lyrics based on this idea:

{req.prompt}
<|im_end|>
<|im_start|>assistant
"""
        inputs = tokenizer([system_prompt], return_tensors="pt").to("cuda")
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            use_cache=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.15
        )

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        if "<|im_start|>assistant" in generated_text:
            generated_lyrics = generated_text.split("<|im_start|>assistant")[-1].strip()
        else:
            generated_lyrics = generated_text.replace(system_prompt, "").strip()

        return LyricsResponse(
            status="success",
            lyrics=generated_lyrics,
            language=req.language,
            genre=req.genre
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "online", "model": "gandharva-qwen-gpu", "gpu": torch.cuda.get_device_name(0)}

# 8. Expose API via Reserved Ngrok Domain
from pyngrok import ngrok

NGROK_AUTHTOKEN = "3DLGlm1ouoHDkrk7eyHyucyJcmg_6u3N5rVavXLgfGxP7ss9m"
RESERVED_DOMAIN = "audition-roamer-darling.ngrok-free.dev"

ngrok.set_auth_token(NGROK_AUTHTOKEN)

public_url = ngrok.connect(8000, domain=RESERVED_DOMAIN).public_url

print("\n============================================================")
print(f"🚀 GANDHARVA LYRICS AI GPU API IS LIVE!")
print(f"Public API Endpoint: {public_url}/generate_lyrics")
print(f"Health Check:        {public_url}/health")
print("============================================================")

nest_asyncio.apply()
uvicorn.run(app, host="0.0.0.0", port=8000)
