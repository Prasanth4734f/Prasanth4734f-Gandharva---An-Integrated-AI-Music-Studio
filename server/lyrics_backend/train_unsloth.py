import os
import argparse
import torch
import json

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune Qwen model with Unsloth and QLoRA for Gandharva Lyrics AI.")
    parser.add_argument("--dataset", type=str, default="data/lyrics_dataset.jsonl", help="Path to JSONL dataset file.")
    parser.add_argument("--model_name", type=str, default="Qwen/Qwen3-8B", help="Base model identifier (Qwen/Qwen3-8B fine-tuned via Unsloth).")
    parser.add_argument("--output_dir", type=str, default="models/gandharva_lyrics_v1", help="Output directory for fine-tuned adapters.")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs.")
    parser.add_argument("--batch_size", type=int, default=2, help="Per-device train batch size.")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="Learning rate.")
    return parser.parse_args()

def main():
    args = parse_args()
    
    print("[INIT] Checking environment...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[INIT] Active Device: {device}")
    
    # Check imports
    try:
        from datasets import Dataset
        from transformers import TrainingArguments
    except ImportError as e:
        print(f"[ERROR] Required ML package missing: {e}")
        print("[ERROR] Datasets or Transformers packages are required for fine-tuning.")
        return
        
    # 1. Load dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, args.dataset) if not os.path.isabs(args.dataset) else args.dataset
    dataset_path = os.path.abspath(dataset_path)
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
        
    print(f"[DATA] Loading dataset from: {dataset_path}")
    records = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    print(f"[DATA] Loaded {len(records)} training examples.")
    raw_dataset = Dataset.from_list(records)
        
    # Check model loading engine
    use_unsloth = False
    try:
        from unsloth import FastLanguageModel
        use_unsloth = True
    except ImportError:
        use_unsloth = False

    if use_unsloth:
        print(f"[MODEL] Loading base model via Unsloth: {args.model_name}")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name = args.model_name,
            max_seq_length = 2048,
            dtype = None,
            load_in_4bit = torch.cuda.is_available(),
        )
        print("[PEFT] Initializing QLoRA Adapter via Unsloth...")
        model = FastLanguageModel.get_peft_model(
            model,
            r = 16,
            target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                              "gate_proj", "up_proj", "down_proj"],
            lora_alpha = 32,
            lora_dropout = 0,
            bias = "none",
            use_gradient_checkpointing = "unsloth" if torch.cuda.is_available() else False,
            random_state = 3407,
            use_rslora = False,
            loftq_config = None,
        )
    else:
        print(f"[MODEL] Loading base model via Transformers & PEFT: {args.model_name}")
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import LoraConfig, get_peft_model

        tokenizer = AutoTokenizer.from_pretrained(args.model_name, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        device_map = "auto" if torch.cuda.is_available() else None
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        base_model = AutoModelForCausalLM.from_pretrained(
            args.model_name,
            device_map=device_map,
            torch_dtype=torch_dtype,
            trust_remote_code=True
        )

        print("[PEFT] Initializing QLoRA Adapter via PEFT...")
        peft_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )
        model = get_peft_model(base_model, peft_config)
    
    prompt_template = (
        "<|im_start|>system\n"
        "You are Gandharva Lyrics AI, a professional multilingual songwriter.\n\n"
        "Write original, meaningful and singable song lyrics.\n\n"
        "Language: {language}\n"
        "Genre: {genre}\n"
        "Emotion: {mood}\n"
        "Variation: {variation}\n\n"
        "Follow the requested song structure.\n\n"
        "Use meaningful singing-performance cues when appropriate:\n"
        "[hold]\n"
        "[rise]\n"
        "[soft]\n"
        "[pause]\n\n"
        "Do not explain the lyrics.\n"
        "Return only the song lyrics.\n"
        "<|im_end|>\n"
        "<|im_start|>user\n"
        "Create original lyrics based on this idea:\n\n"
        "{prompt}\n"
        "<|im_end|>\n"
        "<|im_start|>assistant\n"
        "{lyrics}\n"
        "<|im_end|>"
    )
    
    def formatting_prompts_func(examples):
        texts = []
        for prompt, language, genre, emotion, lyrics, variation in zip(
            examples["prompt"], examples["language"], examples["genre"], examples["emotion"], examples["lyrics"], examples["variation"]
        ):
            mood = ", ".join(emotion) if isinstance(emotion, list) else emotion
            text = prompt_template.format(
                prompt=prompt,
                genre=genre,
                mood=mood,
                language=language,
                variation=variation,
                lyrics=lyrics
            ) + tokenizer.eos_token
            texts.append(text)
        return { "text" : texts }

    print("[DATA] Preparing tokenized training dataset...")
    formatted_dataset = raw_dataset.map(formatting_prompts_func, batched=True)
    
    print("[TRAIN] Setting up training engine...")
    is_cuda = torch.cuda.is_available()
    
    use_unsloth_sft = False
    try:
        from unsloth import FastLanguageModel
        from trl import SFTTrainer
        use_unsloth_sft = True
    except Exception:
        use_unsloth_sft = False

    if use_unsloth_sft:
        print("[TRAIN] Setting up SFTTrainer via Unsloth...")
        trainer = SFTTrainer(
            model = model,
            tokenizer = tokenizer,
            train_dataset = formatted_dataset,
            dataset_text_field = "text",
            max_seq_length = 2048,
            dataset_num_proc = 1,
            packing = False,
            args = TrainingArguments(
                per_device_train_batch_size = args.batch_size,
                gradient_accumulation_steps = 4,
                warmup_steps = 5,
                num_train_epochs = args.epochs,
                learning_rate = args.learning_rate,
                fp16 = is_cuda and not torch.cuda.is_bf16_supported(),
                bf16 = is_cuda and torch.cuda.is_bf16_supported(),
                logging_steps = 1,
                optim = "adamw_8bit" if is_cuda else "adamw_torch",
                weight_decay = 0.01,
                lr_scheduler_type = "linear",
                seed = 3407,
                output_dir = "outputs",
                use_cpu = not is_cuda
            ),
        )
    else:
        print("[TRAIN] Setting up Trainer via Transformers & PEFT...")
        from transformers import Trainer, DataCollatorForLanguageModeling, TrainingArguments

        def tokenize_function(examples):
            return tokenizer(examples["text"], truncation=True, max_length=2048)

        tokenized_dataset = formatted_dataset.map(tokenize_function, batched=True, remove_columns=formatted_dataset.column_names)
        data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

        trainer = Trainer(
            model = model,
            args = TrainingArguments(
                per_device_train_batch_size = args.batch_size,
                gradient_accumulation_steps = 4,
                warmup_steps = 5,
                num_train_epochs = args.epochs,
                learning_rate = args.learning_rate,
                fp16 = is_cuda and not torch.cuda.is_bf16_supported(),
                bf16 = is_cuda and torch.cuda.is_bf16_supported(),
                logging_steps = 1,
                optim = "adamw_8bit" if is_cuda else "adamw_torch",
                weight_decay = 0.01,
                lr_scheduler_type = "linear",
                seed = 3407,
                output_dir = "outputs",
                use_cpu = not is_cuda
            ),
            train_dataset = tokenized_dataset,
            data_collator = data_collator
        )
    
    print("[TRAIN] Launching fine-tuning loop...")
    trainer.train()
    print("[TRAIN] Training complete!")
    
    output_dir = os.path.join(script_dir, args.output_dir) if not os.path.isabs(args.output_dir) else args.output_dir
    output_dir = os.path.abspath(output_dir)
    print(f"[SAVE] Saving adapter weights to: {output_dir}")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print("[SAVE] Done saving weights and tokenizer configuration.")

if __name__ == "__main__":
    main()
