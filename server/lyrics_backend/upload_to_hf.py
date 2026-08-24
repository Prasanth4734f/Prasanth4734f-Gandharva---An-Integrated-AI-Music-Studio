import os
import sys

# Reconfigure stdout for utf-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def upload_gandharva_model(hf_token: str, username: str):
    try:
        from huggingface_hub import HfApi, create_repo
    except ImportError:
        print("❌ 'huggingface_hub' package not installed. Installing...")
        os.system(f"{sys.executable} -m pip install -q huggingface_hub")
        from huggingface_hub import HfApi, create_repo

    api = HfApi(token=hf_token)
    model_repo = f"{username}/gandharva-lyrics-v1"
    space_repo = f"{username}/gandharva-lyrics-ai"
    
    print("==========================================================")
    print("  GANDHARVA LYRICS AI — HUGGING FACE AUTOMATED DEPLOYER   ")
    print("==========================================================")
    
    print(f"\n📦 Step 1: Creating Hugging Face Model Repository: {model_repo}")
    try:
        create_repo(model_repo, repo_type="model", token=hf_token, exist_ok=True)
    except Exception as e:
        print(f"Note: {e}")
        
    adapter_path = "gandharva_lyrics_v1"
    if not os.path.exists(adapter_path):
        adapter_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", "gandharva_lyrics_v1"))
        
    if not os.path.exists(adapter_path):
        adapter_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "gandharva_lyrics_v1"))
        
    if not os.path.exists(adapter_path):
        raise FileNotFoundError("Could not locate adapter folder 'gandharva_lyrics_v1'")
        
    print(f"🚀 Uploading adapter files from '{adapter_path}' to model hub: {model_repo}...")
    api.upload_folder(
        folder_path=adapter_path,
        repo_id=model_repo,
        repo_type="model"
    )
    print("✅ Model adapter weights uploaded successfully!")
    
    space_repos = [
        f"{username}/Gandharva-lyrics-ai",
        f"{username}/gandharva-lyrics-ai"
    ]
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    space_files = {
        "app.py": os.path.join(script_dir, "hf_space_app.py"),
        "README.md": os.path.join(script_dir, "hf_space_readme.md"),
        "requirements.txt": os.path.join(script_dir, "hf_space_requirements.txt"),
    }
    
    for s_repo in space_repos:
        print(f"\n📦 Step 2: Syncing Hugging Face Space: {s_repo}")
        try:
            create_repo(s_repo, repo_type="space", space_sdk="gradio", token=hf_token, exist_ok=True)
        except Exception as e:
            print(f"Note: {e}")

        print(f"🚀 Uploading Gradio App files to Space: {s_repo}...")
        for target_name, src_path in space_files.items():
            if os.path.exists(src_path):
                print(f"  -> Uploading {target_name} to {s_repo}...")
                api.upload_file(
                    path_or_fileobj=src_path,
                    path_in_repo=target_name,
                    repo_id=s_repo,
                    repo_type="space"
                )

    print("\n==========================================================")
    print("✨ SUCCESS! Your Gandharva Lyrics AI model is deployed!")
    print(f"🔗 Hugging Face Model: https://huggingface.co/{model_repo}")
    print(f"🔗 Live Gradio Space:  https://huggingface.co/spaces/{space_repo}")
    print("==========================================================")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python upload_to_hf.py <HF_TOKEN> <HF_USERNAME>")
        sys.exit(1)
    upload_gandharva_model(sys.argv[1], sys.argv[2])
