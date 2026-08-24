# 1. Clear stale compiled cache and install matched stable Unsloth stack
import shutil, os
if os.path.exists("/kaggle/working/unsloth_compiled_cache"):
    shutil.rmtree("/kaggle/working/unsloth_compiled_cache", ignore_errors=True)

!pip install --quiet --no-cache-dir "transformers==4.51.3" "trl==0.18.2" "datasets>=3.4.1,<4.4.0" "torchvision>=0.27.0" bitsandbytes
!pip install --quiet --no-cache-dir --no-deps unsloth unsloth_zoo

# 2. Imports and Environment Setup
os.environ["UNSLOTH_IS_PRESENT"] = "1"

# Import unsloth first as recommended by Unsloth
try:
    import unsloth.import_fixes
    unsloth.import_fixes.torchvision_compatibility_check = lambda *args, **kwargs: None
except Exception:
    pass

from unsloth import FastLanguageModel

import glob
import json
import torch

print("============================================================")
print("     GANDHARVA OWN LYRICS AI — QLoRA TRAINING ENGINE       ")
print("============================================================")

# 3. GPU Hardware Check
print("\n[1/6] Checking GPU...")
if not torch.cuda.is_available():
    raise RuntimeError("CUDA GPU not detected! Please enable GPU Accelerator in Kaggle (Tesla T4).")

gpu_name = torch.cuda.get_device_name(0)
vram = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
print(f"✅ GPU: {gpu_name} ({vram:.2f} GB VRAM)")

# 4. Search and Load Dataset
print("\n[2/6] Loading Gandharva dataset...")
dataset_candidates = [
    "/kaggle/working/lyrics_dataset.jsonl",
    "lyrics_dataset.jsonl",
    "/kaggle/input/gandharva-lyrics-dataset/lyrics_dataset.jsonl"
]
input_matches = glob.glob("/kaggle/input/**/lyrics_dataset.jsonl", recursive=True)
dataset_candidates = input_matches + dataset_candidates

dataset_path = None
for path in dataset_candidates:
    if os.path.exists(path):
        dataset_path = os.path.abspath(path)
        break

if dataset_path is None:
    raise FileNotFoundError("lyrics_dataset.jsonl was not found in Kaggle input or working directory.")

print(f"✅ Dataset Path: {dataset_path}")
records = []
with open(dataset_path, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            records.append(json.loads(line))

print(f"✅ Successfully loaded {len(records)} verified training records.")

# 5. Load Base Model Qwen3-8B via Unsloth
print("\n[3/6] Loading Base Model (Qwen/Qwen3-8B)...")
from unsloth import FastLanguageModel

model_name = "Qwen/Qwen3-8B"
max_seq_length = 2048

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=model_name,
    max_seq_length=max_seq_length,
    dtype=None,
    load_in_4bit=True,
    device_map="cuda:0",
)
print("✅ Qwen3-8B loaded with 4-bit quantization.")

# 6. Apply QLoRA Configuration
print("\n[4/6] Configuring Gandharva QLoRA Adapter...")
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=32,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
    use_rslora=False,
    loftq_config=None,
)
print("✅ QLoRA adapter initialized.")

# 7. Dataset Formatting
print("\n[5/6] Formatting songwriting dataset...")
from datasets import Dataset
raw_dataset = Dataset.from_list(records)

def formatting_prompts_func(examples):
    texts = []
    for prompt, language, genre, emotion, lyrics, variation in zip(
        examples["prompt"], examples["language"], examples["genre"],
        examples["emotion"], examples["lyrics"], examples["variation"]
    ):
        mood = ", ".join(emotion) if isinstance(emotion, list) else str(emotion)
        text = f'''<|im_start|>system
You are Gandharva Lyrics AI, a professional multilingual songwriter.

Write original, meaningful and singable song lyrics.

Language: {language}
Genre: {genre}
Emotion: {mood}
Variation: {variation}

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

{prompt}
<|im_end|>
<|im_start|>assistant
{lyrics}
<|im_end|>'''
        texts.append(text + tokenizer.eos_token)
    return {"text": texts}

formatted_dataset = raw_dataset.map(formatting_prompts_func, batched=True)
print("✅ Dataset formatted successfully.")

# 8. Fine-Tuning SFT Loop
print("\n[6/6] Launching Gandharva SFT Training Loop (3 Epochs)...")
from unsloth import FastLanguageModel, is_bfloat16_supported
from trl import SFTTrainer
from transformers import TrainingArguments

trainer_kwargs = dict(
    model=model,
    train_dataset=formatted_dataset,
    dataset_text_field="text",
    max_seq_length=max_seq_length,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="/kaggle/working/gandharva_training_output",
        report_to="none",
    ),
)

try:
    trainer = SFTTrainer(processing_class=tokenizer, **trainer_kwargs)
except TypeError:
    trainer = SFTTrainer(tokenizer=tokenizer, **trainer_kwargs)

trainer.train()
print("\n✅ Training complete!")

# 9. Save & Package Adapter
output_dir = "/kaggle/working/gandharva_lyrics_v1"
print(f"\nSaving trained adapter weights to: {output_dir}")
model.save_pretrained(output_dir)
tokenizer.save_pretrained(output_dir)
print("✅ Gandharva adapter saved.")

zip_path = shutil.make_archive("/kaggle/working/gandharva_lyrics_v1", "zip", output_dir)
print("\n============================================================")
print("🎉 GANDHARVA OWN LYRICS AI TRAINING COMPLETE")
print("============================================================")
print(f"Adapter ZIP created at: {zip_path}")

