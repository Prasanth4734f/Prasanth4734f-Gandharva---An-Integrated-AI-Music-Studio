import json
import os
import re

def validate_dataset(filepath):
    print(f"[INFO] Validating lyrics dataset: {filepath}")
    
    if not os.path.exists(filepath):
        print(f"[ERROR] File not found: {filepath}")
        return False
        
    required_keys = {
        "prompt", "language", "genre", "emotion", "theme", 
        "energy", "structure", "lyrics", "singing_expression", "variation"
    }
    
    # Unicode ranges for scripts
    telugu_regex = re.compile(r"[\u0c00-\u0c7f]")
    hindi_regex = re.compile(r"[\u0900-\u097f]")
    tamil_regex = re.compile(r"[\u0b80-\u0bff]")
    
    errors = 0
    passed = 0
    
    with open(filepath, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            line_num = idx + 1
            line = line.strip()
            if not line:
                continue
                
            try:
                data = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"[ERROR] Line {line_num}: Invalid JSON format - {e}")
                errors += 1
                continue
                
            # 1. Check required keys
            missing_keys = required_keys - set(data.keys())
            if missing_keys:
                print(f"[ERROR] Line {line_num}: Missing required fields: {missing_keys}")
                errors += 1
                continue
                
            lang = data["language"]
            lyrics = data["lyrics"]
            variation = data["variation"]
            
            # 2. Check variation values
            if variation not in {"A", "B"}:
                print(f"[ERROR] Line {line_num}: Invalid variation '{variation}' (must be 'A' or 'B')")
                errors += 1
                
            # 3. Check language script purity
            if lang == "Telugu" and not telugu_regex.search(lyrics):
                print(f"[WARNING] Line {line_num}: Telugu record has no Telugu script characters!")
                errors += 1
            elif lang == "Hindi" and not hindi_regex.search(lyrics):
                print(f"[WARNING] Line {line_num}: Hindi record has no Devanagari script characters!")
                errors += 1
            elif lang == "Tamil" and not tamil_regex.search(lyrics):
                print(f"[WARNING] Line {line_num}: Tamil record has no Tamil script characters!")
                errors += 1
                
            # 4. Check singability format presence
            structure_tags = re.findall(r"\[(Verse|Chorus|Pre-Chorus|Bridge|Outro|Intro)[\s0-9]*\]", lyrics, re.I)
            if not structure_tags:
                print(f"[WARNING] Line {line_num}: Lyrics has no structure tags (e.g., [Verse 1], [Chorus])")
                errors += 1
                
            expression_tags = ["hold", "rise", "soft", "belt", "pause", "vibrato"]
            expression_found = False
            for exp in expression_tags:
                if exp in lyrics.lower():
                    expression_found = True
                    break
            if not expression_found:
                print(f"[WARNING] Line {line_num}: Lyrics has no visible singing expressions (e.g. hold, rise, soft)")
                errors += 1
                
            passed += 1
            
    print(f"\n[SUMMARY] Validation finished. Total records: {passed + errors}")
    if errors > 0:
        print(f"[RESULT] Validation failed with {errors} issues.")
        return False
    else:
        print("[RESULT] Validation passed successfully!")
        return True

if __name__ == "__main__":
    dataset_path = os.path.join(os.path.dirname(__file__), "data", "lyrics_dataset.jsonl")
    validate_dataset(dataset_path)
