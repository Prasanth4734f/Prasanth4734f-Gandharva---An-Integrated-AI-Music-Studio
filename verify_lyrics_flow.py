import sys
import os

# Add server/lyrics_backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'server', 'lyrics_backend')))

import inference

def safe_print(label, ok, expected, msg):
    text = f"{label}: {ok} (Expected: {expected}) - {msg}"
    print(text.encode('ascii', 'backslashreplace').decode('ascii'))

def test_validator():
    print("Testing Telugu validation rules...")
    valid_telugu = "పల్లవి:\nఈ నల్లని మబ్బులలో దాగిన నీవు\nఎక్కడున్నావమ్మా నా గుండెల్లో దాచుకుంటా."
    ok, msg = inference.validate_forbidden_content(valid_telugu, "Telugu", "")
    safe_print("Valid Telugu check", ok, True, msg)
    
    invalid_telugu_roman = "పల్లవి:\nఈ నల్లని cloud లో దాగిన నీవు"
    ok, msg = inference.validate_forbidden_content(invalid_telugu_roman, "Telugu", "")
    safe_print("Telugu with English letters check", ok, False, msg)
    
    invalid_telugu_hindi = "పల్లవి:\nఈ నల్లని बादल లో దాగిన నీవు"
    ok, msg = inference.validate_forbidden_content(invalid_telugu_hindi, "Telugu", "")
    safe_print("Telugu with Hindi script check", ok, False, msg)
    
    invalid_telugu_leakage = "పల్లవి:\nనేను నిన్ను ప్రేమిస్తున్నా లవ్"
    ok, msg = inference.validate_forbidden_content(invalid_telugu_leakage, "Telugu", "")
    safe_print("Telugu with English leakage check", ok, False, msg)

    print("\nTesting Hindi validation rules...")
    valid_hindi = "मुखड़ा:\nरात के इस अंधेरे में, ढूंढूं मैं तेरा साया"
    ok, msg = inference.validate_forbidden_content(valid_hindi, "Hindi", "")
    safe_print("Valid Hindi check", ok, True, msg)
    
    invalid_hindi_roman = "मुखड़ा:\nरात के इस night में, ढूंढूं मैं तेरा साया"
    ok, msg = inference.validate_forbidden_content(invalid_hindi_roman, "Hindi", "")
    safe_print("Hindi with English letters check", ok, False, msg)
    
    invalid_hindi_telugu = "मुखड़ा:\nरात के ఈ రోజులో, ढूंढूं मैं तेरा साया"
    ok, msg = inference.validate_forbidden_content(invalid_hindi_telugu, "Hindi", "")
    safe_print("Hindi with Telugu script check", ok, False, msg)
    
    invalid_hindi_leakage = "मुखड़ा:\nमुझे तुमसे लव है"
    ok, msg = inference.validate_forbidden_content(invalid_hindi_leakage, "Hindi", "")
    safe_print("Hindi with English leakage check", ok, False, msg)

    print("\nTesting English validation rules...")
    valid_english = "Verse 1:\nWalking down the railway station platform\nThinking about the goodbye."
    ok, msg = inference.validate_forbidden_content(valid_english, "English", "")
    safe_print("Valid English check", ok, True, msg)
    
    invalid_english_leak = "Verse 1:\nఈ నల్లని మబ్బులలో దాగిన నీవు\nఎక్కడున్నావమ్మా"
    ok, msg = inference.validate_forbidden_content(invalid_english_leak, "English", "")
    safe_print("English with dominant Indic check", ok, False, msg)

if __name__ == '__main__':
    test_validator()
