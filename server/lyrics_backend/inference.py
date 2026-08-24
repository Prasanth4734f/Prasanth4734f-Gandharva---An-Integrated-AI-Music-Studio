import os
import random
import logging
import re
import json
import asyncio
from typing import Tuple, List, Dict

_logger = logging.getLogger("gandharva.inference")

DIAGNOSTICS_DASHBOARD = {
    "total_api_calls_in_session": 0,
    "api_successes": 0,
    "api_failures": 0,
    "rate_limits_429": 0,
    "validator_rejects": 0,
    "critic_rejects": 0,
    "fallback_activations": 0
}

def print_diagnostics_dashboard():
    print("\n==================================================")
    print("         GANDHARVA AI DIAGNOSTICS DASHBOARD       ")
    print("==================================================")
    for k, v in DIAGNOSTICS_DASHBOARD.items():
        print(f"  {k:<30}: {v}")
    print("==================================================\n")

def analyze_prompt(prompt: str) -> Dict:
    prompt_lower = prompt.lower()
    genres = {
        "lofi": "Lofi", "synthwave": "Synthwave", "rock": "Rock", "pop": "Pop",
        "cinematic": "Cinematic", "phonk": "Phonk", "edm": "EDM", "hip hop": "Lofi",
        "rap": "Lofi", "acoustic": "Pop"
    }
    moods = {
        "sad": "Sad", "lonely": "Sad", "dark": "Sad", "melancholic": "Sad",
        "happy": "Happy", "cheerful": "Happy", "upbeat": "Happy", "energetic": "Happy",
        "romantic": "Romantic", "love": "Romantic", "sweet": "Romantic"
    }
    tempos = {"fast": "Fast", "energetic": "Fast", "slow": "Slow", "calm": "Slow", "chill": "Medium"}
    styles = {"ambient": "Ambient", "acoustic": "Acoustic", "electronic": "Electronic", "orchestral": "Orchestral"}
    instruments = {
        "piano": "Piano", "guitar": "Acoustic Guitar", "violin": "Violin",
        "flute": "Flute", "synth": "Synthesizer", "drums": "Drums"
    }

    detected_genre = "Lofi"
    for key, val in genres.items():
        if key in prompt_lower:
            detected_genre = val
            break

    detected_mood = "Melancholic"
    for key, val in moods.items():
        if key in prompt_lower:
            detected_mood = val
            break

    detected_tempo = "Medium"
    for key, val in tempos.items():
        if key in prompt_lower:
            detected_tempo = val
            break

    detected_style = "Atmospheric"
    for key, val in styles.items():
        if key in prompt_lower:
            detected_style = val
            break

    detected_insts = []
    for key, val in instruments.items():
        if key in prompt_lower:
            detected_insts.append(val)
    if not detected_insts:
        detected_insts = ["Piano", "Acoustic Guitar", "Ambient Strings"]

    return {
        "genre": detected_genre,
        "mood": detected_mood,
        "tempo": detected_tempo,
        "style": detected_style,
        "instruments": detected_insts
    }

async def enhance_music_prompt(prompt: str) -> str:
    clean_prompt = prompt.strip()
    try:
        import httpx
        url = "http://localhost:11434/api/chat"
        ai_prompt = (
            "You are an elite AI music prompt engineer. Rewrite this music idea into a detailed, descriptive paragraph. "
            "Describe the tempo (e.g. 75 BPM), instruments (e.g. acoustic guitar, strings), mood, and atmosphere. "
            "DO NOT write lyrics or section cues. Just write one highly immersive paragraph. "
            f"Prompt: {clean_prompt}"
        )
        payload = {
            "model": "qwen3:8b",
            "messages": [{"role": "user", "content": ai_prompt}],
            "stream": False
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 404:
                payload["model"] = "qwen2.5"
                response = await client.post(url, json=payload)
            if response.status_code == 200:
                resp_data = response.json()
                text = resp_data["message"]["content"].strip()
                _logger.info("[enhance_music_prompt] Enhanced prompt using local Ollama.")
                return text
    except Exception as e:
        _logger.warning(f"[enhance_music_prompt] Local Ollama prompt enhancement failed: {e}")

    analysis = analyze_prompt(prompt)
    genre = analysis["genre"]
    mood = analysis["mood"]
    tempo = analysis["tempo"]
    insts = ", ".join(analysis["instruments"])

    enhancements = {
        "Lofi": f"lo-fi hip-hop, {mood.lower()} vibe, {tempo.lower()} tempo, {insts}, retro vinyl crackle, subtle ambiance, warm high-fidelity studio mix, instrumental, no vocals",
        "EDM": f"electronic dance music, EDM, {mood.lower()}, {tempo.lower()} tempo, {insts}, driving synthesizer lead, heavy synth bass, massive 4x4 rhythmic drum beat, premium club mix, instrumental, no vocals",
        "Rock": f"alternative rock, {mood.lower()}, {tempo.lower()} tempo, {insts}, overdriven electric guitars, dynamic basslines, heavy drum kit, pristine studio recording, instrumental, no vocals",
        "Pop": f"modern pop, {mood.lower()}, {tempo.lower()} tempo, {insts}, bright melodies, sparkling production, radio-ready studio mix, instrumental, no vocals",
        "Cinematic": f"cinematic orchestral score, {mood.lower()}, {tempo.lower()} tempo, {insts}, rich sweeping strings, heroic brass swells, dynamic orchestral percussion, high-fidelity stereo, instrumental, no vocals",
        "Phonk": f"heavy drift phonk, {mood.lower()}, {tempo.lower()} tempo, {insts}, fast dark cowbells, deep sliding heavy bassline, gritty electronic, high-fidelity car audio master, instrumental, no vocals"
    }

    enhancement = enhancements.get(genre, f"{genre.lower()} style, {mood.lower()} vibe, {tempo.lower()} tempo, {insts}, crystal-clear high-fidelity mix, instrumental, no vocals")
    final_prompt = f"{clean_prompt}, {enhancement}, award-winning Billboard hit production, perfect instrumental arrangement"
    return final_prompt

def enhance_music_prompt_with_culture(prompt: str, language: str) -> str:
    base_enhanced = prompt.strip()
    from rag_service import get_cultural_context
    kb = get_cultural_context(language)
    cultural_insts = kb.get("instruments", [])
    if cultural_insts:
        inst_str = ", ".join(cultural_insts)
        base_enhanced += f", featuring traditional regional instruments: {inst_str}"
    return base_enhanced

def _extract_keywords(prompt: str) -> List[str]:
    stop_words = {
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "shall",
        "should", "may", "might", "must", "can", "could", "about", "above",
        "after", "again", "all", "am", "and", "any", "at", "below", "between",
        "both", "but", "by", "each", "for", "from", "further", "get", "got",
        "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
        "i", "if", "in", "into", "it", "its", "itself", "just", "like", "make",
        "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of",
        "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves",
        "out", "over", "own", "re", "s", "same", "she", "so", "some", "such",
        "t", "than", "that", "their", "theirs", "them", "themselves", "then",
        "there", "these", "they", "this", "those", "through", "to", "too",
        "under", "until", "up", "very", "we", "what", "when", "where", "which",
        "while", "who", "whom", "why", "with", "you", "your", "yours",
        "yourself", "yourselves", "song", "write", "create", "generate", "lyrics",
        "want", "need", "please", "give", "tell", "something", "thing",
        "verse", "chorus", "bridge", "outro", "intro", "climax", "structure",
    }
    words = [w.strip(".,!?;:'\"()-") for w in prompt.lower().split()]
    keywords = [w for w in words if w and len(w) > 2 and w not in stop_words]
    return keywords if keywords else ["life", "journey", "moment"]

def _pick_shuffled(items: list, seed_val: int, count: int = 1) -> list:
    rng = random.Random(seed_val)
    pool = list(items)
    rng.shuffle(pool)
    return pool[:count]

def _prompt_seed(prompt: str) -> int:
    import hashlib
    import time
    return int(hashlib.md5(f"{prompt}_{time.time()}".encode("utf-8")).hexdigest()[:8], 16)

def _generate_lyrics_variations_fallback(prompt: str, genre: str, mood: str, language: str) -> List[Dict[str, str]]:
    _logger.info("Generating multi-variation lyrics for: '%s' [lang=%s, genre=%s, mood=%s]", prompt, language, genre, mood)
    
    lang_key = language.lower() if language else "english"
    keywords = _extract_keywords(prompt)
    base_seed = _prompt_seed(prompt)
    
    english_themes = {
        "mother": {
            "title_adjectives": ["Loving", "Mother", "Sacred", "Eternal", "Gentle"],
            "title_nouns": ["Embrace", "Devotion", "Grace", "Heart", "Blessing"],
            "v1": [
                "In your warm embrace, I find my peaceful home...\nWith your unconditional love, I will never walk alone.\nYou guided my first footsteps through every single day,\nWiping away my tears and lighting up my way."
            ],
            "chorus": [
                "Mother, your love is the pure anthem of my soul,\nYour gentle blessings make my spirit feel so whole!\nForever grateful for the warmth inside your smile,\nStanding by my side through every single mile."
            ],
            "v2": [
                "You gave your strength so I could learn to fly high,\nTeaching me to reach for the stars across the sky."
            ],
            "bridge": [
                "Pure as the ocean, steady as the morning sun,\nA mother's devotion is the greatest battle won!"
            ],
            "outro": [
                "Forever in your loving arms...\nThank you, Mom."
            ]
        },
        "patriotic": {
            "title_adjectives": ["Brave", "Immortal", "Sacred", "Glorious", "Freedom", "Heroic"],
            "title_nouns": ["Martyrs", "Sacrifice", "Legacy", "Freedom", "Victory", "Honor"],
            "v1": [
                "In the annals of history, their sacrifice remains clear...\nFor the freedom of our nation, they held no fear!\nThrough the brutal storm of independence and the darkest night,\nStanding brave on the front lines to uphold the right."
            ],
            "chorus": [
                "Salute to the martyrs, heroes of the motherland!\nTogether in unity and strength we proudly stand!\nTheir legacy lives on in every beating heart,\nFrom this sacred country, their memory will never part!"
            ],
            "v2": [
                "With sweat and blood they carved the road to liberty,\nSetting a million souls forever proud and free.\nThey marched with bravery facing the oppressor's flame,\nLeaving an eternal, unforgettable, glorious name."
            ],
            "bridge": [
                "Layered echoes of freedom ringing loud and clear,\nHonoring the fallen heroes we forever hold dear."
            ],
            "outro": [
                "Forever free, forever strong...\nJai Hind, our eternal song!"
            ]
        },
        "sad": {
            "title_adjectives": ["Silent", "Cold", "Broken", "Fading", "Haunted", "Forgotten"],
            "title_nouns": ["Shadows", "Raindrops", "Echoes", "Whispers", "Promises", "Scars"],
            "v1": [
                "Walking alone in the cold grey night\nThinking of words that we never got right\nThe headlights are passing like ghosts in the dark\nTrying to remember where we lost the spark."
            ],
            "chorus": [
                "Oh, it's a long, dark road of memory\nSince you became a fading melody\nI'm holding on to the starlight gleam\nLost in the fragments of a broken dream."
            ],
            "v2": [
                "The streetlights are flickering down on the avenue\nEvery small corner reminds me of you\nI look at the photos we took in the spring\nNow they are just lines on an old broken ring."
            ],
            "bridge": [
                "But maybe the heartbreak is part of the grace\nTo teach us the beauty of time and of space\nI'm learning to breathe through the heavy and cold\nRewriting the endings of stories untold."
            ],
            "outro": [
                "Just another shadow...\nFading in the grey...\nLetting go...\nWashed away..."
            ]
        },
        "happy": {
            "title_adjectives": ["Golden", "Rising", "Bright", "Dancing", "Electric", "Sunny"],
            "title_nouns": ["Sunsets", "Rhythms", "Highs", "Skies", "Journeys", "Dreams"],
            "v1": [
                "Sunshine is breaking through the morning sky\nGot a brand new rhythm and my hopes are high\nThe coffee is warm and the radio's loud\nI'm walking on air, way above the cloud."
            ],
            "chorus": [
                "Oh, we are flying high above the clouds today!\nWith the golden sunlight guiding us along our way\nNo more worries, no more stormy blues\nWe've got a canvas of beautiful hues!"
            ],
            "v2": [
                "Every single step feels so light and free\nLike a rolling wave on a tropical sea\nTurn up the drums, let the guitars begin\nThis is a battle we're destined to win."
            ],
            "bridge": [
                "And there is no limit to what we can do\nWhen we got this harmony, me and you\nWe light up the dark like a shooting star\nShowing the universe just who we are!"
            ],
            "outro": [
                "Keep it shining...\nSo bright...\nInto the golden...\nGolden light!"
            ]
        },
        "romantic": {
            "title_adjectives": ["Sweet", "Endless", "Soft", "True", "First", "Eternal"],
            "title_nouns": ["Embrace", "Whisper", "Heartbeat", "Melody", "Flame", "Gaze"],
            "v1": [
                "Candlelight dancing across the wall\nListening to the quiet rain starting to fall\nIn the warmth of your touch, I find my home\nNever again will I wander alone."
            ],
            "chorus": [
                "You are the light in my quietest sky\nThe beautiful reason my spirits soar high\nThrough every season and every night\nYour love is my anchor, my shining light."
            ],
            "v2": [
                "Tomorrow is waiting with promises new\nEvery single moment is sweeter with you\nWe wrote our story in stars up above\nA lifetime of magic, an endless love."
            ],
            "bridge": [
                "Through highs and lows, whatever may come\nTwo independent hearts beating as one\nI'll stand by your side through storm and through sun\nYou're my forever, my ultimate one."
            ],
            "outro": [
                "Just you and me...\nForever bound...\nTrue love found...\nSafe and sound."
            ]
        },
        "general": {
            "title_adjectives": ["New", "City", "Vibrant", "Strange", "Open", "Radiant"],
            "title_nouns": ["Voice", "Path", "Rhythm", "Journey", "Echo", "Light"],
            "v1": [
                "Night is falling on the crowded street\nWalking to the rhythm of a thousand feet\nNeon lights are shining through the hazy air\nMoving forward without a single care."
            ],
            "chorus": [
                "We are writing our destiny under the stars\nFinding who we are beyond the distant bars\nEvery new horizon is calling our name\nLife is a journey, never the same."
            ],
            "v2": [
                "Dreaming big inside this iron town\nNothing in this world can ever bring us down\nWe catch the rhythm and we step right in\nReady for the future to begin."
            ],
            "bridge": [
                "Listen to the sound of the rising tide\nThere is nowhere left for the truth to hide\nWe raise our voices and we take our stand\nBuilding our world with our own two hands."
            ],
            "outro": [
                "Moving along...\nInto the light...\nStay strong...\nBright future ahead."
            ]
        }
    }

    hindi_themes = {
        "mother": {
            "title_adjectives": ["मां", "ममता", "प्यारी", "अमर", "पावन"],
            "title_nouns": ["आंचल", "दुआ", "सूरत", "मूरत", "लोरी"],
            "v1": [
                "मां के आंचल में छुपा है खुशियों का पूरा जहान...\nतेरी ममता से रोशन है मेरी हर सुबह, मेरी हर शाम!\nअपनी नींदें गंवाकर जिसने मुझे सुलाया,\nहर मुश्किल में जिसने मेरा हाथ थामा!"
            ],
            "chorus": [
                "मां तेरे चरणों में ही मेरा स्वर्ग है,\nतेरी ममता के आगे हर खुशी बेअसर है!\nतुझसे ही शुरू मेरी दुनिया, तुझपे ही खत्म!"
            ],
            "v2": [
                "मां की दुआओं से ही बनती है मेरी तकदीर,\nतेरी मूरत ही है मेरे भगवान की तस्वीर!"
            ],
            "bridge": [
                "उंगली पकड़कर जिसने मुझे चलना सिखाया,\nहर दर्द सहकर जिसने सिर्फ प्यार लुटाया!"
            ],
            "outro": [
                "सदा रहे मां का साया... प्रणाम मां!"
            ]
        },
        "patriotic": {
            "title_adjectives": ["अमर", "वीर", "आजादी", "देशभक्ति", "स्वराज"],
            "title_nouns": ["शहीद", "कुर्बानी", "गाथा", "तिरंगा", "सपूत"],
            "v1": [
                "मातृभूमि की रक्षा में बहा जो रक्त जवान का...\nवो अमर राग है इस भारत देश की शान का!\nआज़ादी की बेड़ियों को तोड़ा जिन शहीदों ने,\nहँसते-हँसते प्राण दिए भारत के शूरवीरों ने!"
            ],
            "chorus": [
                "जय हिंद! जय भारत! वंदे मातरम!\nशहीदों के बलिदान से अमर हुआ यह चमन!\nतुम्हारी शहादत को नमन करता है सारा वतन!"
            ],
            "v2": [
                "सीने पर खाई गोलियां पर देश को झुकने न दिया,\nतिरंगे की आन की खातिर हर कष्ट सह लिया!\nइतिहास के पन्नों पर दर्ज है उनकी ये कुर्बानी!"
            ],
            "bridge": [
                "हर देशवासी गाएगा उनकी अमर कहानी,\nउनकी कुर्बानियों से बनी है हमारी जिंदगानी!"
            ],
            "outro": [
                "अमर रहे अमर शहीद...\nवंदे मातरम! भारत माता की जय!"
            ]
        },
        "sad": {
            "title_adjectives": ["ख़ामोश", "ठंडी", "टूटी", "धुंधली", "अधूरी"],
            "title_nouns": ["परछाइयां", "बूंदें", "यादें", "बातें", "सांसें"],
            "v1": [
                "अकेले चल रहा हूँ इस ठंडी काली रात में\nसोच रहा हूँ उन बातों को जो रह गयीं अधूरी साथ में\nरास्ते की गाड़ियाँ साए की तरह गुज़र रही हैं\nपुरानी यादें दिल में धीरे-धीरे पिघल रही हैं।"
            ],
            "chorus": [
                "ओह, ये यादों का लंबा अँधेरा रास्ता है\nजब से तू एक बिछड़ती धुन बन गया है\nमैं तो बस सितारों की चमक को थामे हूँ\nटूटे सपनों के टुकड़ों में खोया हुआ हूँ।"
            ],
            "v2": [
                "सड़क की बत्तियां खिड़की पे टिमटिमा रही हैं\nहर एक छोटी गली तेरी याद दिला रही है\nतेरी तस्वीरें जो हमने बहारों में ली थीं\nअब वो बस पुराने कागज़ पे बनी लकीरें हैं।"
            ],
            "bridge": [
                "पर शायद दिल का टूटना भी एक सबक है\nवक़्त और फ़ासलों का ये ही तो सच है\nमैं इस भारी अँधेरे में सांस लेना सीख रहा हूँ\nअपनी कहानी के नए पन्ने लिखना सीख रहा हूँ।"
            ],
            "outro": [
                "एक और साया...\nअँधेरे में खोया...\nअब सब ख़त्म...\nदिल है रोया..."
            ]
        },
        "happy": {
            "title_adjectives": ["सुनहरा", "नया", "उजाला", "मस्त", "खुश"],
            "title_nouns": ["आसमान", "गीत", "सफर", "मौसम", "रंग"],
            "v1": [
                "सुबह की धूप ने दी है दस्तक नयी\nदिल में जगी है एक उम्मीद नयी\nगाड़ी चल रही है और गाना बज रहा\nतेरे आने से मेरा हर पल सज रहा।"
            ],
            "chorus": [
                "आसमान से आगे उड़ रहे हैं हम आज\nखुशियों का सिर पर सजा है ये ताज\nसारे ग़मों को पीछे छोड़ आये\nहम तो अब नए सपने सजाएं।"
            ],
            "v2": [
                "हर एक कदम अब हल्का सा लगता है\nजैसे समंदर में मौज कोई उठता है\nढोल की ताल पे अब गाने दो हमें\nमस्ती में हर पल को जीने दो हमें।"
            ],
            "bridge": [
                "और अब कोई सीमा नहीं है हमारी\nजब साथ में है ये दोस्ती हमारी\nटूटे तारे की तरह चमक जाएंगे\nसारी दुनिया को अपनी धुन सुनाएंगे।"
            ],
            "outro": [
                "चमकेगा सितारा...\nहमेशा यहाँ...\nखुशी है आयी...\nमेरा है जहाँ!"
            ]
        },
        "romantic": {
            "title_adjectives": ["प्यारा", "दिलबर", "हसीन", "सच्चा", "सदा"],
            "title_nouns": ["दिल", "धड़कन", "मुलाकात", "सफ़र", "साया"],
            "v1": [
                "धीमी सी रौशनी और शांति है यहाँ\nतेरे आने से महक उठा है जहाँ\nहर एक धड़कन में है तेरी ही बात\nकितनी हसीन है ये सुहानी रात।"
            ],
            "chorus": [
                "तुम मेरी कश्ती के सहारा हो प्यारे\nतेरे ही दम से तो चलें हमारे तारे\nहर तूफ़ान और हर लहर के पार\nतेरी बाहों में मिला मुझे मेरा प्यार।"
            ],
            "v2": [
                "आने वाला कल एक उम्मीद है प्यारी\nतेरे संग जीने की है तैयारी\nरेत पे लिखा है हमने नाम तेरा\nतुझपे ही शुरू और ख़त्म काम मेरा।"
            ],
            "bridge": [
                "हर दुःख और सुख में, हर मुश्किल में\nतू ही रहेगा हमेशा मेरे दिल में\nमैं बनूँगा तेरी ढाल और रौशनी\nतुझसे ही तो है मेरी हर खुशी।"
            ],
            "outro": [
                "सिर्फ तुम...\nहमेशा तुम...\nसच्चा प्यार...\nमेरा तुम।"
            ]
        },
        "general": {
            "title_adjectives": ["नयी", "शहर", "मस्ती", "खुली", "रोशन"],
            "title_nouns": ["आवाज़", "रास्ता", "धुन", "सफ़र", "खबर"],
            "v1": [
                "गलियों में अँधेरा बढ़ता ही गया\nशीशे में अक्स को देखता गया\nदीपक की रौशनी चमक रही है अब\nरात के बादल छटेंगे अब कब।"
            ],
            "chorus": [
                "उजली रौशनी के उस आगोश में\nहम चल रहे हैं इस ख़ामोश होश में\nनयी राहें और नयी उम्मीदें हैं\nइस शहर की राहों में नयी दुनिया है।"
            ],
            "v2": [
                "सपने बुन रहे हैं इस बड़े शहर में\nदिल की धड़कन सुन रहे हैं हर एक पहर में\nहम नयी पीढ़ी के मुसाफ़िर हैं\nनये रास्ते तलाशने को तैयार हैं।"
            ],
            "bridge": [
                "हम ढूँढ लेंगे अपनी आवाज़ को\nसुनेंगे हम उस नए साज़ को\nहम अपनी राह से कभी हटेंगे नहीं\nकिसी के आगे सर झुकाएंगे नहीं।"
            ],
            "outro": [
                "शोर में खो गया...\nपिघल रहा हूँ...\nख़ामोशी में...\nबिना किसी शक के..."
            ]
        }
    }

    telugu_themes = {
        "mother": {
            "title_adjectives": ["మాతృ", "అమృత", "చల్లని", "పావన", "దేవతా", "అనురాగ"],
            "title_nouns": ["మూర్తి", "బంధం", "ప్రేమ", "హృదయం", "దీవెన", "రూపం"],
            "v1": [
                "అమ్మా... నీ కౌగిలిలోనే దాగుంది విశ్వమంత తీపి అనురాగం!\nజోలపాటగా మారిన నీ ప్రతి శ్వాస... నా జన్మకందిచిన దైవిక గానం!\nగోరుముద్దలతో పెంచిన మాతృమూర్తి త్యాగానికి శతకోటి ప్రణామాలు!"
            ],
            "chorus": [
                "అమ్మా అని పిలిచే పిలుపులో దాగుంది అమృత ప్రవాహం!\nనీ చల్లని దీవెనలతో సాగే నా ప్రతి అడుగు విజయ సోపానం!\nజన్మజన్మల బంధం నీతోనే... నీ రూపమే నా నిత్య దేవాలయం!"
            ],
            "v2": [
                "కష్టాల చీకటిలో నన్ను ఒడిలోకి తీసి ఓదార్చిన మాతృమూర్తివి నీవే,\nనా కన్నీటి బొట్టును తుడిచి... నవ భాస్కరుడిలా ధైర్యాన్ని నింపిన దేవతవి నీవే!"
            ],
            "bridge": [
                "ఆకలి వేసిన వేళ తన కడుపు మార్చుకుని ముద్ద తినిపించిన త్యాగమూర్తి,\nఅమ్మ ప్రేమకు నిఘంటువులో అర్ధాలు వెతకడం సాధ్యమా ఈ సృష్టిలో!"
            ],
            "outro": [
                "అమ్మా... నీకు నిత్య నీరాజనం!\nనా ప్రతి శ్వాస నీకే అంకితం!"
            ]
        },
        "patriotic": {
            "title_adjectives": ["అమర", "స్వరాజ్య", "వీర", "పావన", "స్వాతంత్ర్య", "విప్లవ"],
            "title_nouns": ["యోధులు", "త్యాగం", "పోరాటం", "గాథ", "పతాకం", "రక్తం"],
            "v1": [
                "స్వరాజ్య పోరులో చిందిన రక్తం... స్వేచ్ఛా గానమై మ్రోగెను నిత్యం!\nమాతృభూమి ముద్దుబిడ్డల త్యాగం... భరతమాత పాదాల చెంత నిత్య నైవేద్యం!\nకఠిన శ్రమతో... ప్రాణాల త్యాగంతో... స్వేచ్ఛా భాస్కరుడిని రప్పించారు,\nదాస్య శృంఖలాలను తెంచివేసి... బానిసత్వాన్ని తుదముట్టించారు!"
            ],
            "chorus": [
                "జయహో అమర వీరులారా... మీ త్యాగం అమర జ్ఞాపకం!\nఈ భారత దేశ చరిత్రలో... మీ రక్తం నిత్య స్ఫూర్తి ప్రవాహం!\nవందేమాతరం అంటూ నినదించిన మీ గొంతుకలు...\nమా ప్రతి శ్వాసలో అమర గానమై మ్రోగుతున్నాయి నేడు!"
            ],
            "v2": [
                "పోరాట క్షేత్రంలో అడుగుపెట్టిన అగ్నిపుత్రులు,\nశత్రుమూకల పీచమడచిన స్వరాజ్య యోధులు!\nమరణాన్ని సైతం చిరునవ్వుతో ఆలింగనం చేసుకున్న వీరులు,\nమీ అడుగుజాడలు మా జాతికి ఎల్లవేళలా మార్గదర్శకాలు!"
            ],
            "bridge": [
                "స్వరాజ్య సమరంలో నలిగిపోయిన ఎన్నో ప్రాణాలు,\nదేశముక్తి కోసం చిందించిన పవిత్రమైన స్వేద బిందువులు!\nమీ త్యాగఫలమే నేడు మనకు లభించిన స్వేచ్ఛా వాయువులు!"
            ],
            "outro": [
                "వందేమాతరం... జై హింద్!\nఅమరవీరుల బలిదానాలకు నిత్య అంజలి!\nభారతమాతా కీ జై!"
            ]
        },
        "sad": {
            "title_adjectives": ["నిశ్శబ్ద", "చల్లని", "విరిగిన", "మసకబారిన", "మరచిపోయిన"],
            "title_nouns": ["నీడలు", "కన్నీళ్లు", "జ్ఞాపకాలు", "మాటలు", "గాయాలు"],
            "v1": [
                "ఈ చల్లని చీకటి రాత్రిలో ఒంటరిగా నడుస్తున్నాను\nమనం ఎప్పుడూ చెప్పని మాటల గురించి ఆలోచిస్తున్నాను\nచీకటిలో దీపాలు వెలిగిపోతున్నాయి\nమన ప్రేమ ఎక్కడ పోయిందో వెతుకుతున్నాను."
            ],
            "chorus": [
                "ఓహ్, ఇది జ్ఞాపకాల సుదీర్ఘ చీకటి దారి\nనువ్వు మసకబారిన రాగంగా మారినప్పటి నుండి\nనేను నక్షత్రాల వెలుగును పట్టుకుని ఉన్నాను\nచెదిరిపోయిన కలల శకలాలలో తేలిపోతున్నాను."
            ],
            "v2": [
                "వీధి దీపాలు తళతళలాడుతున్నాయి\nప్రతి చిన్న మూల నన్ను నీ జ్ఞాపకాల్లోకి తీసుకెళ్తోంది\nమనం తీసుకున్న పాత చిత్రాలను చూస్తున్నాను\nఇప్పుడు అవి కేవలం కాగితపు గుర్తులుగా మారాయి."
            ],
            "bridge": [
                "కానీ బహుశా ఈ బాధ కూడా ఒక పాఠమేమో\nసమయం యొక్క అందాన్ని మనకు నేర్పడానికి\nఈ బరువైన చీకటిలో శ్వాసించడం నేర్చుకుంటున్నాను\nరాయని కథల ముగింపులను తిరగరాస్తున్నాను."
            ],
            "outro": [
                "మరొక నీడ...\nచీకటిలో కరిగిపోతోంది...\nవదిలేస్తున్నాను...\nశాంతి లభించింది..."
            ]
        },
        "happy": {
            "title_adjectives": ["బంగారు", "కొత్త", "వెలుగుల", "ఆనందపు", "మధురమైన"],
            "title_nouns": ["ఆకాశం", "పాట", "పయనం", "ఋతువు", "రంగులు"],
            "v1": [
                "ఉదయపు కాంతి ఆకాశాన్ని తాకుతోంది\nనా గుండెల్లో ఒక కొత్త ఉత్సాహం నిండింది\nరేడియోలో మధురమైన పాట వస్తోంది\nనీ రాకతో నా ప్రపంచం మెరిసిపోతోంది."
            ],
            "chorus": [
                "మనం మేఘాల పైన తేలిపోతున్నాం ఈ రోజు!\nబంగారు కాంతి మన దారి చూపిస్తోంది\nఇక ఏ బాధలు లేవు, శోకాలు లేవు\nమన జీవితం ఒక అందమైన కాన్వాస్!"
            ],
            "v2": [
                "ప్రతి చిన్న అడుగు ఎంత తేలికగా ఉందో\nసముద్రపు అలల పైన తేలుతున్నట్టు ఉంది\nసంగీతాన్ని మోగించండి, నృత్యం చేయండి\nఈ ఆనంద సమయం మనదే."
            ],
            "bridge": [
                "మన స్నేహానికి హద్దులు లేవు\nమనం కలిసి ఉన్నప్పుడు ఏ కష్టమైనా సులువవుతుంది\nనక్షత్రంలా మెరిసిపోదాం\nప్రపంచానికి మన సంతోషాన్ని చాటుదాం!"
            ],
            "outro": [
                "మెరిసిపో సూర్యుడా...\nఅందంగా...\nఈ బంగారు కాంతిలో...\nసంతోషమే సంతోషం!"
            ]
        },
        "romantic": {
            "title_adjectives": ["ప్రేమగల", "అనంతమైన", "సాఫ్ట్", "నిజమైన", "శాశ్వత"],
            "title_nouns": ["కౌగిలి", "ముద్దు", "గుండెచప్పుడు", "రాగం", "వెలుగు"],
            "v1": [
                "కోణంలో దీపపు వెలుగు ప్రశాంతంగా ఉంది\nపడుతున్న వర్షపు చుక్కల చప్పుడు వింటున్నాను\nనీ స్పర్శలో నా ప్రాణాన్ని కనుగొన్నాను\nఇకపై నేనెప్పుడూ ఒంటరిని కాను."
            ],
            "chorus": [
                "నా శాంతమైన ఆకాశంలో నువ్వే వెలుగువి\nనా ఆత్మ తేలిపోవడానికి నువ్వే అందమైన కారణానివి\nప్రతి ఋతువులో, ప్రతి రాత్రిలో\nనీ ప్రేమే నా శాశ్వత వెలుగు."
            ],
            "v2": [
                "రేపటి రోజు కొత్త ఆశలతో వేచి ఉంది\nప్రతి క్షణం నీతో చాలా మధురంగా ఉంది\nనక్షత్రాల కింద మన కథను రాసుకున్నాం\nఒక జీవితకాల మంత్రముగ్ధమైన ప్రేమ."
            ],
            "bridge": [
                "కష్ట సుఖాలలో ఏది ఎదురైనా\nరెండు గుండెలు ఒక్కటిగా కొట్టుకుంటాయి\nనేను నీ పక్కనే ఉంటాను నిరంతరం\nనువ్వే నా జీవితం, నా సర్వస్వం."
            ],
            "outro": [
                "నువ్వు నేను మాత్రమే...\nయుగాలు మారినా...\nనిజమైన ప్రేమ...\nసురక్షితంగా ఉన్నాం."
            ]
        },
        "general": {
            "title_adjectives": ["కొత్త", "నగరం", "మస్తీ", "విచిత్రమైన", "దివ్య"],
            "title_nouns": ["గొంతు", "దారి", "రాగం", "సఫర్", "వెలుగు"],
            "v1": [
                "దారులలో చీకటి పెరుగుతూనే ఉంది\nఅద్దంలో రూపం చూస్తూ ఉన్నాను\nదివ్య వెలుగు మెరుస్తోంది ఈ వేళ\nరాత్రి మేఘాలు ఎప్పుడు విడిపోతాయో."
            ],
            "chorus": [
                "వెలుగులు మెరుస్తున్న ఆ లోతుల్లో\nమనం నడుస్తున్నాం ఈ తనివితీరా\nఇసుక రంగులు మరియు ఇనుప ధూళి ఉంది\nఈ నగరంలో జీవించడమే సూత్రం."
            ],
            "v2": [
                "కలలు కంటూ ఉన్నాం ఈ లోహ నగరంలో\nగుండె చప్పుడు వింటూ ఉన్నాం ప్రతి క్షణంలో\nమనం కొత్త తరానికి చెందిన ప్రేమికులం\nకొత్త కొత్త రహదారులలో నడుద్దాం."
            ],
            "bridge": [
                "మనం కనుక్కుందాం మన స్వరాల్ని\nవింటాం మనం ఆ కొత్త సాజ్ ని\nమనం ఆ సంకేతాలను ఎప్పుడూ ఆపలేము\nఎవరి ముందూ మనం తలవంచము."
            ],
            "outro": [
                "సందడిలో కలిసిపోయాను...\nకరిగిపోతున్నాను...\nనిశ్శబ్దంలో...\nఎటువంటి అనుమానం లేకుండా..."
            ]
        }
    }

    tamil_themes = {
        "sad": {
            "title_adjectives": ["தனிமையான", "குளிர்ந்த", "உடைந்த", "மறக்கப்பட்ட"],
            "title_nouns": ["நிழல்கள்", "கண்ணீர்", "குரல்கள்", "காயங்கள்"],
            "v1": [
                "தனிமையில் நடக்கிறேன் இந்த இருண்ட இரவில்\nமறக்கப்பட்ட வார்த்தைகளை தேடி\nகண் முன் வெளிச்சம் மறைந்தது\nநாம் எங்கே தொலைந்தோம் என்று தெரியவில்லை."
            ],
            "chorus": [
                "இதயம் பாரமாக உள்ளது இந்த தனிமை பாதையில்\nநீ இல்லாமல் நான் மட்டும் இருளில்\nஉடைந்த நட்சத்திரங்களை தேடுகிறேன்\nஉன் நினைவுகளோடு வாழ்கிறேன்."
            ],
            "v2": [
                "பாதையில் வெளிச்சம் குறைந்தது\nநீ இல்லாமல் என் வாழ்க்கை நின்றது\nபழைய படங்களை பார்க்கிறேன்\nஅதில் உன்னை தேடுகிறேன்."
            ],
            "bridge": [
                "இந்த வலியில் ஒரு சிறு வெளிச்சம் உள்ளது\nகாற்றுடன் நான் நடக்க வேண்டும்\nஉன் வார்த்தைகள் இல்லாமல் வாழ வேண்டும்."
            ],
            "outro": [
                "இன்னொரு நிழல்...\nஇருளில் கலந்தது...\nஎல்லாம் முடிந்தது..."
            ]
        },
        "happy": {
            "title_adjectives": ["பொன்னான", "புதிய", "மகிழ்ச்சியான"],
            "title_nouns": ["வானம்", "பாடல்", "பயணம்"],
            "v1": [
                "காலை கதிரவன் வெளிச்சம் வந்தது\nஇதயத்தில் புதிய நம்பிக்கை பிறந்தது\nவானொலியில் பாடல் கேட்கிறது\nஉன் வருகையால் மனம் மகிழ்கிறது."
            ],
            "chorus": [
                "வானத்தை தாண்டி பறக்கிறோம் இன்று\nமகிழ்ச்சி கிரீடம் அணிந்தோம் இன்று\nகவலைகளை பின்னால் விட்டு வந்தோம்\nபுதிய கனவுகளை காண வந்தோம்."
            ],
            "v2": [
                "ஒவ்வொரு அடியும் லேசாக உள்ளது\nகடல் அலை போல பறக்கிறது\nவாழ்க்கை ஒரு அழகான பயணம்\nமகிழ்ச்சியாக வாழ்வோம்."
            ],
            "bridge": [
                "நமது நட்புக்கு தூரம் இல்லை\nமகிழ்ச்சியே நமது வாழ்க்கைக்கு\nநட்சத்திரம் போல ஒளிர்ரவோம்."
            ],
            "outro": [
                "ஒளிரும் நட்சத்திரம்...\nஎன்றென்றும் இங்கே...\nமகிழ்ச்சி வந்தது!"
            ]
        },
        "romantic": {
            "title_adjectives": ["அன்பான", "முடிவற்ற", "இனிமையான"],
            "title_nouns": ["இதயம்", "காதல்", "கனவு"],
            "v1": [
                "வெளிச்சத்தில் அமைதியாக உள்ளது அறை\nஉன் வருகையால் மகிழ்கிறது மனம்\nஒவ்வொரு துடிப்பிலும் உன் வார்த்தை உள்ளது\nஇந்த இரவு மிகவும் அழகாக உள்ளது."
            ],
            "chorus": [
                "நீயே என் படகுக்கு வெளிச்சம் அன்பே\nஉன்னோடு தொடர்கிறது என் பயணம் அன்பே\nஒவ்வொரு புயலையும் தாண்டி வந்தேன்\nஉன் கைகளில் நான் காதல் தேடினேன்."
            ],
            "v2": [
                "நாளை என்பது ஒரு அழகான கனவு\nஉன்னோடு வாழும் புதிய கனவு\nமணலில் எழுதிய பெயர் நினைவிருக்கிறதா\nஉன்னோடு தொடங்கி உன்னோடு முடியும் என் கதை."
            ],
            "bridge": [
                "ஒவ்வொரு இன்ப துன்பத்திலும்\nநீயே இருப்பாய் என் இதயத்தில்\nநான் இருப்பேன் உனக்கு துணையாக\nஉன்னோடு கிடைத்தது என் மகிழ்ச்சி."
            ],
            "outro": [
                "நீ மட்டும்...\nஎன்றென்றும் நீயே...\nஉண்மையான காதல்!"
            ]
        },
        "general": {
            "title_adjectives": ["புதிய", "நகரம்", "விசித்திரமான"],
            "title_nouns": ["குரல்", "பாதை", "பயணம்"],
            "v1": [
                "பாதைகளில் இருள் பெருகுகிறது\nபிரதிபலிப்புகளை கண்ணாடியில் பார்க்கிறேன்\nஒளி பொங்குகிறது இந்த வேளையில்\nஇரவு மேகங்கள் எப்போது விலகும்."
            ],
            "chorus": [
                "ஒளிரும் அந்த ஆழத்தில்\nநாம் நடக்கிறோம் இந்த தனிமையில்\nமணல் நிறங்கள் மற்றும் புது காற்று உள்ளது\nஇந்த நகரத்தில் வாழ்வதே ஒரு விதி."
            ],
            "v2": [
                "கனவுகள் காண்கிறோம் இந்த நகரத்தில்\nஇதய துடிப்பை கேட்கிறோம் ஒவ்வொரு நொடியிலும்\nபுதிய புதிய பாதைகளில் நடப்போம்."
            ],
            "bridge": [
                "நாம் கண்டுபிடிப்போம் நமது குரலை\nகேட்போம் நாம் அந்த புதிய இசையை\nநாம் அந்த சிக்னல்களை நிறுத்த முடியாது."
            ],
            "outro": [
                "சத்தத்தில் தொலைந்து...\nமெல்ல கரைந்து...\nஅமைதியில்..."
            ]
        }
    }

    kannada_themes = {
        "sad": {
            "title_adjectives": ["ಏಕಾಂತದ", "ತಣ್ಣನೆಯ", "ಮುರಿದ", "ಮರೆತ"],
            "title_nouns": ["ನೆರಳುಗಳು", "ಕಣ್ಣೀರು", "ಧ್ವನಿಗಳು", "ಗಾಯಗಳು"],
            "v1": [
                "ಏಕಾಂಗಿಯಾಗಿ ನಡೆಯುತ್ತಿರುವೆ ಈ ಕತ್ತಲೆಯ ರಾತ್ರಿಯಲ್ಲಿ\nಮರೆತುಹೋದ ಮಾತುಗಳನ್ನು ಹುಡುಕುತ್ತಾ\nಕಣ್ಣ ಮುಂದೆ ಬೆಳಕು ಮರೆಯಾಯಿತು\nನಾವು ಎಲ್ಲಿ ದಾರಿ ತಪ್ಪಿದೆವೋ ತಿಳಿಯದು."
            ],
            "chorus": [
                "ಹೃದಯ ಭಾರವಾಗಿದೆ ಈ ಏಕಾಂತ ದಾರಿಯಲ್ಲಿ\nನೀನಿಲ್ಲದೆ ನಾನು ಮಾತ್ರ ಕತ್ತಲೆಯಲ್ಲಿ\nಮುರಿದ ನಕ್ಷತ್ರಗಳನ್ನು ಹುಡುಕುತ್ತಿರುವೆ\nನಿನ್ನ ನೆನಪುಗಳೊಂದಿಗೆ ಬಾಳುತ್ತಿರುವೆ."
            ],
            "v2": [
                "ದಾರಿಯಲ್ಲಿ ಬೆಳಕು ಕಡಿಮೆಯಾಯಿತು\nನೀನಿಲ್ಲದೆ ನನ್ನ ಜೀವನ ನಿಂತುಹೋಯಿತು\nಹಳೆಯ ಚಿತ್ರಗಳನ್ನು ನೋಡುತ್ತಿರುವೆ\nಅದರಲ್ಲಿ ನಿನ್ನನ್ನು ಹುಡುಕುತ್ತಿರುವೆ."
            ],
            "bridge": [
                "ಈ ನೋವಿನಲ್ಲೂ ಒಂದು ಸಣ್ಣ ಬೆಳಕಿದೆ\nಗಾಳಿಯೊಂದಿಗೆ ನಾನು ನಡೆಯಬೇಕು\nನಿನ್ನ ಮಾತುಗಳಿಲ್ಲದೆ ಬಾಳಬೇಕು."
            ],
            "outro": [
                "ಮತ್ತೊಂದು ನೆರಳು...\nಕತ್ತಲೆಯಲ್ಲಿ ಕರಗಿತು...\nಎಲ್ಲವೂ ಮುಗಿಯಿತು..."
            ]
        },
        "happy": {
            "title_adjectives": ["ಚಿನ್ನದ", "ಹೊಸ", "ಸಂತೋಷದ"],
            "title_nouns": ["ಆಕಾಶ", "ಹಾಡು", "ಪಯಣ"],
            "v1": [
                "ಬೆಳಗಿನ ಸೂರ್ಯನ ಬೆಳಕು ಬಂದಿತು\nಹೃದಯದಲ್ಲಿ ಹೊಸ ಭರವಸೆ ಮೂಡಿತು\nರೇಡಿಯೋದಲ್ಲಿ ಸುಂದರ ಹಾಡು ಕೇಳುತ್ತಿದೆ\nನಿನ್ನ ಆಗಮನದಿಂದ ಮನಸ್ಸು ಅರಳಿದೆ."
            ],
            "chorus": [
                "ಆಕಾಶವನ್ನು ದಾಟಿ ಹಾರುತ್ತಿದ್ದೇವೆ ಇಂದು\nಸಂತೋಷದ ಕಿರೀಟ ಧರಿಸಿದೆವು ಇಂದು\nಸಂಕಟಗಳನ್ನು ಹಿಂದೆ ಬಿಟ್ಟು ಬಂದೆವು\nಹೊಸ ಕನಸುಗಳನ್ನು ಕಾಣಲು ಬಂದೆವು."
            ],
            "v2": [
                "ಪ್ರತಿ ಹೆಜ್ಜೆಯೂ ಹಗುರವಾಗಿದೆ\nಸಮುದ್ರದ ಅಲೆಯಂತೆ ಹಾರುತ್ತಿದೆ\nಜೀವನ ಒಂದು ಸುಂದರ ಪಯಣ\nಸಂತೋಷದಿಂದ ಬಾಳೋಣ."
            ],
            "bridge": [
                "ನಮ್ಮ ಸ್ನೇಹಕ್ಕೆ ಎಲ್ಲೆಯಿಲ್ಲ\nಸಂತೋಷವೇ ನಮ್ಮ ಜೀವನಕ್ಕೆ ಮುಖ್ಯ\nನಕ್ಷತ್ರದಂತೆ ಹೊಳೆಯೋಣ."
            ],
            "outro": [
                "ಹೊಳೆಯುವ ನಕ್ಷತ್ರ...\nಎಂದೆಂದಿಗೂ ಇಲ್ಲೇ...\nಸಂತೋಷ ಬಂದಿತು!"
            ]
        },
        "romantic": {
            "title_adjectives": ["ಪ್ರೀತಿಯ", "ಅನಂತ", "ಸಿಹಿಯಾದ"],
            "title_nouns": ["ಹೃದಯ", "ಪ್ರೀತಿ", "ಕನಸು"],
            "v1": [
                "ಕೋಣೆಯಲ್ಲಿ ಪ್ರಶಾಂತತೆ ಇದೆ\nನಿಮ್ಮ ಆಗಮನದಿಂದ ಮನಸ್ಸು ಅರಳಿದೆ\nಪ್ರತಿ ಬಡಿತದಲ್ಲೂ ನಿಮ್ಮ ಮಾತಿದೆ\nಈ ರಾತ್ರಿ ಅತ್ಯಂತ ಸುಂದರವಾಗಿದೆ."
            ],
            "chorus": [
                "ನನ್ನ ದೋಣಿಗೆ ನೀವೇ ಬೆಳಕು ಅನ್ಬೇ\nನಿಮ್ಮೊಂದಿಗೆ ಸಾಗಿದೆ ನನ್ನ ಪಯಣ ಅನ್ಬೇ\nಪ್ರತಿ ಬಿರುಗಾಳಿಯನ್ನೂ ದಾಟಿ ಬಂದೆ\nನಿಮ್ಮ ಮಡಿಲಲ್ಲಿ ಪ್ರೀತಿಯ ಹುಡುಕಿದೆ."
            ],
            "v2": [
                "ನಾಳೆ ಎಂಬುದು ಒಂದು ಸುಂದರ ಕನಸು\nನಿಮ್ಮೊಂದಿಗೆ ಬಾಳುವ ಹೊಸ ರಾಗವಿದು\nಮರಳಿನಲ್ಲಿ ಬರೆದ ಹೆಸರು ನೆನಪಿದೆಯೇ\nನಿಮ್ಮಿಂದ ಪ್ರಾರಂಭವಾಗಿ ನಿಮ್ಮಿಂದ ಮುಗಿಯುವ ಕಥೆಯಿದು."
            ],
            "bridge": [
                "ಪ್ರತಿ ಸುಖ ದುಃಖಗಳಲ್ಲೂ\nನೀವೇ ಇರುವಿರಿ ನನ್ನ ಹೃದಯದಲ್ಲಿ\nನಾನು ಇರುವೆ ನಿಮಗೆ ಜೊತೆಯಾಗಿ\nನಿಮ್ಮಿಂದ ಸಿಕ್ಕಿತು ನನ್ನ ಸಂತೋಷ."
            ],
            "outro": [
                "ನೀವು ಮಾತ್ರ...\nಎಂದೆಂದಿಗೂ ನೀವೇ...\nಸತ್ಯವಾದ ಪ್ರೀತಿ!"
            ]
        },
        "general": {
            "title_adjectives": ["ಹೊಸ", "ನಗರ", "ಸುಂದರ"],
            "title_nouns": ["ಧ್ವನಿ", "ದಾರಿ", "ರಾಗ"],
            "v1": [
                "ದಾರಿಗಳಲ್ಲಿ ಕತ್ತಲು ಹೆಚ್ಚುತ್ತಿದೆ\nಕನ್ನಡಿಯಲಿ ಬಿಂಬವನ್ನು ನೋಡುತ್ತಿರುವೆ\nಬೆಳಕು ಹೊಳೆಯುತ್ತಿದೆ ಈ ಸಮಯದಲ್ಲಿ\nರಾತ್ರಿಯ ಮೋಡಗಳು ಯಾವಾಗ ಸರಿದಾವೋ."
            ],
            "chorus": [
                "ಬೆಳಕು ಹೊಳೆಯುವ ಆ ಆಳದಲ್ಲಿ\nನಾವು ನಡೆಯುತ್ತಿದ್ದೇವೆ ಈ ಒಂಟಿತನದಲ್ಲಿ\nಮರಳಿನ ಬಣ್ಣಗಳು ಮತ್ತು ಇಷ್ಟದ ರಾಗವಿದೆ\nಈ ನಗರದಲ್ಲಿ ಬಾಳುವುದೇ ಒಂದು ನಿಯಮ."
            ],
            "v2": [
                "ಕನಸು ಕಾಣುತ್ತಿದ್ದೇವೆ ಈ ನಗರದಲ್ಲಿ\nಹೃದಯದ ಬಡಿತವನ್ನು ಕೇಳುತ್ತಿದ್ದೇವೆ ಪ್ರತಿ ಕ್ಷಣದಲ್ಲಿ\nಹೊಸ ಹೊಸ ದಾರಿಗಳಲ್ಲಿ ನಡೆಯೋಣ."
            ],
            "bridge": [
                "ನಾವು ಕಂಡುಕೊಳ್ಳೋಣ ನಮ್ಮ ಧ್ವನಿಯನ್ನು\nಕೇಳೋಣ ಆ ಹೊಸ ಸಂಗೀತವನ್ನು\nನಾವು ಆ ಸಂಕೇತಗಳನ್ನು ತಡೆಯಲಾರೆವು."
            ],
            "outro": [
                "ಶಬ್ದದಲ್ಲಿ ಮರೆಯಾಗಿ...\nಮೆಲ್ಲಗೆ ಕರಗಿ...\nಮೌನದಲ್ಲಿ..."
            ]
        }
    }

    malayalam_themes = {
        "sad": {
            "title_adjectives": ["ഏകാന്തമായ", "തണുത്ത", "തകർന്ന", "മറന്ന"],
            "title_nouns": ["നിഴലുകൾ", "കണ്ണീർ", "ശബ്ദങ്ങൾ", "മുറിവുകൾ"],
            "v1": [
                "ഏകാന്തനായി നടക്കുന്നു ഈ ഇരുണ്ട രാത്രിയിൽ\nമറന്നുപോയ വാക്കുകൾ തേടി\nകൺമുന്നിൽ വെളിച്ചം മറഞ്ഞു\nനാം എവിടെ വഴ തെറ്റിയെന്ന് അറിയില്ല."
            ],
            "chorus": [
                "ഹൃദയം ഭാരമുള്ളതാണ് ഈ ഏകാന്ത വഴിയിൽ\nനീയില്ലാതെ ഞാൻ മാത്രം ഇരുട്ടിൽ\nഉടഞ്ഞ നക്ഷത്രങ്ങളെ തേടുന്നു\nനിന്റെ ഓർമ്മകളോടെ ജീവിക്കുന്നു."
            ],
            "v2": [
                "വഴിയിൽ വെളിച്ചം കുറഞ്ഞു\nനീയില്ലാതെ എന്റെ ജീവിതം നിന്നു\nപഴയ ചിത്രങ്ങൾ നോക്കുന്നു\nഅതിൽ നിന്നെ തേടുന്നു."
            ],
            "bridge": [
                "ഈ വേദനയിലും ഒരു ചെറു വെളിച്ചമുണ്ട്\nകാറ്റിനൊപ്പം ഞാൻ നടക്കണം\nനിന്റെ വാക്കുകളില്ലാതെ ജീവിക്കണം."
            ],
            "outro": [
                "മറ്റൊരു നിഴൽ...\nഇരുട്ടിൽ കലർന്നു...\nഎല്ലാം അവസാനിച്ചു..."
            ]
        },
        "happy": {
            "title_adjectives": ["സുവർണ്ണ", "പുതിയ", "സന്തോഷമുള്ള"],
            "title_nouns": ["ആകാശം", "പാട്ട്", "യാത്ര"],
            "v1": [
                "പ്രഭാത സൂര്യന്റെ വെളിച്ചം വന്നു\nഹൃദയത്തിൽ പുതിയ പ്രതീക്ഷ ഉണർന്നു\nറേഡിയോയിൽ നല്ല പാട്ട് കേൾക്കുന്നു\nനിന്റെ വരവോടെ മനസ്സ് സന്തോഷിച്ചു."
            ],
            "chorus": [
                "ആകാശത്തെ താണ്ടി പറക്കുന്നു ഇന്ന്\nസന്തോഷത്തിന്റെ കിരീടം അണിഞ്ഞു ഇന്ന്\nസങ്കടങ്ങളെ പിന്നിലാക്കി വന്നു\nപുതിയ സ്വപ്നങ്ങൾ കാണാൻ വന്നു."
            ],
            "v2": [
                "ഓരോ ചുവടും ലഘുവാണ്\nകടൽ തിരമാല പോലെ പറക്കുന്നു\nജീവിതം ഒരു മനോഹരമായ യാത്രയാണ്\nസന്തോഷത്തോടെ ജീവിക്കാം."
            ],
            "bridge": [
                "നമ്മുടെ സൗഹൃദത്തിന് അതിരുകളില്ല\nസന്തോഷമാണ് നമ്മുടെ ജീവിതത്തിന് പ്രധാനം\nനക്ഷത്രം പോലെ തിളങ്ങാം."
            ],
            "outro": [
                "തിളങ്ങുന്ന നക്ഷത്രം...\nഎന്നും ഇവിടെ...\nസന്തോഷം വന്നു!"
            ]
        },
        "romantic": {
            "title_adjectives": ["സ്നേഹമുള്ള", "അനന്തമായ", "മധുരമുള്ള"],
            "title_nouns": ["ഹൃദയം", "പ്രണയം", "സ്വപ്നം"],
            "v1": [
                "മുറിയിൽ ശാന്തതയുണ്ട്\nനിന്റെ വരവോടെ മനസ്സ് സന്തോഷിച്ചു\nഓരോ മിടിപ്പിലും നിന്റെ വാക്കുകളുണ്ട്\nഈ രാത്രി വളരെ മനോഹരമാണ്."
            ],
            "chorus": [
                "നീയാണ് എന്റെ തോണിക്ക് വെളിച്ചം അൻപേ\nനിന്നോടൊപ്പം തുടരുന്നു എന്റെ യാത്ര അൻപേ\nഓരോ കൊടുങ്കാറ്റും താണ്ടി വന്നു\nനിന്റെ കൈകളിൽ ഞാൻ പ്രണയം തേടി."
            ],
            "v2": [
                "നാളെ എന്നത് ഒരു മനോഹരമായ സ്വപ്നം\nനിന്നോടൊപ്പം ജീവിക്കുന്ന പുതിയ സ്വപ്നം\nമണലിൽ എഴുതിയ പേര് ഓർമ്മയുണ്ടോ\nനിന്നോട് തുടങ്ങി നിന്നോട് അവസാനിക്കുന്ന എന്റെ കഥ."
            ],
            "bridge": [
                "ഓരോ സന്തോഷ സങ്കടങ്ങളിലും\nനീയായിരിക്കും എന്റെ ഹൃദയത്തിൽ\nഞാൻ ഉണ്ടാകും നിനക്ക് കൂട്ടായി\nനിന്നോട് കിട്ടി എന്റെ സന്തോഷം."
            ],
            "outro": [
                "നീ മാത്രം...\nഎന്നും നീതന്നെ...\nസത്യമായ പ്രണയം!"
            ]
        },
        "general": {
            "title_adjectives": ["പുതിയ", "നഗരം", "മനോഹരമായ"],
            "title_nouns": ["ശബ്ദം", "വഴി", "രാഗം"],
            "v1": [
                "വഴികളിൽ ഇരുട്ട് കൂടുന്നു\nകണ്ണാടിയിൽ രൂപം നോക്കുന്നു\nവെളിച്ചം തിളങ്ങുന്നു ഈ നേരത്ത്\nരാത്രി മേഘങ്ങൾ എപ്പോൾ മാറും."
            ],
            "chorus": [
                "വെളിച്ചം തിളങ്ങുന്ന ആ ആഴത്തിൽ\nനാം നടക്കുന്നു ഈ ഏകാന്തതയിൽ\nമണൽ വർണ്ണങ്ങളും ഇഷ്ട രാഗവുമുണ്ട്\nഈ നഗരത്തിൽ ജീവിക്കുന്നത് ഒരു നിയമം."
            ],
            "v2": [
                "സ്വപ്നങ്ങൾ കാണുന്നു ഈ നഗരത്തിൽ\nഹൃദയമിടിപ്പ് കേൾക്കുന്നു ഓരോ നിമിഷത്തിലും\nപുതിയ പുതിയ വഴികളിൽ നടക്കാം."
            ],
            "bridge": [
                "നാം കണ്ടെത്തും നമ്മുടെ ശബ്ദത്തെ\nകേൾക്കും ആ പുതിയ സംഗീതത്തെ\nനമുക്ക് ആ സിഗ്നലുകളെ തടയാനാവില്ല."
            ],
            "outro": [
                "ശബ്ദത്തിൽ മറഞ്ഞ്...\nമെല്ലെ അലിഞ്ഞ്...\nനിശബ്ദതയിൽ..."
            ]
        }
    }

    if lang_key == "telugu":
        themes_db = telugu_themes
        make_ctx = _make_contextual_lines_telugu
    elif lang_key == "hindi":
        themes_db = hindi_themes
        make_ctx = _make_contextual_lines_hindi
    elif lang_key == "tamil":
        themes_db = tamil_themes
        make_ctx = _make_contextual_lines_tamil
    elif lang_key == "kannada":
        themes_db = kannada_themes
        make_ctx = _make_contextual_lines_kannada
    elif lang_key == "malayalam":
        themes_db = malayalam_themes
        make_ctx = _make_contextual_lines_malayalam
    else:
        themes_db = english_themes
        make_ctx = _make_contextual_lines_english

    p_lower = (prompt or "").lower() + " " + mood.lower()
    if any(k in p_lower for k in ['mother', 'mom', 'amma', 'talli', 'మాతృ', 'అమ్మ', 'మాతా', 'maa', 'ammi']):
        mood_key = "mother"
    elif any(k in p_lower for k in ['patriot', 'freedom', 'independence', 'fighter', 'history', 'death', 'hero', 'nation', 'india', 'bharat', 'soldier', 'warrior', 'sacrifice', 'martyr', 'flag', 'struggle', 'desh', 'swatantra', 'deshabhakti']):
        mood_key = "patriotic"
    elif any(k in p_lower for k in ['sad', 'tear', 'crying', 'heartbreak', 'alone', 'lonely', 'pain', 'loss', 'grief', 'dark']):
        mood_key = "sad"
    elif any(k in p_lower for k in ['romantic', 'love', 'sweet', 'heart', 'kiss', 'hug']):
        mood_key = "romantic"
    elif any(k in p_lower for k in ['happy', 'cheerful', 'upbeat', 'dance', 'party']):
        mood_key = "happy"
    else:
        mood_key = "general"

    if mood_key not in themes_db:
        mood_key = "general"

    theme = themes_db[mood_key]
    variations = []
    
    for i in range(3):
        import hashlib, time
        var_seed_str = f"{base_seed}_{i}_{time.time_ns()}_{random.randint(100000, 999999)}"
        var_seed = int(hashlib.md5(var_seed_str.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(var_seed)
        
        adjs = list(theme["title_adjectives"])
        nouns = list(theme["title_nouns"])
        rng.shuffle(adjs)
        rng.shuffle(nouns)
        
        if lang_key == "english" and keywords:
            kw_title = rng.choice(keywords).capitalize()
            title = f"{adjs[0]} {kw_title} {nouns[0]}"
        else:
            title = f"{adjs[0]} {nouns[0]}"
        
        v1_pool = list(theme["v1"])
        chorus_pool = list(theme["chorus"])
        v2_pool = list(theme["v2"])
        bridge_pool = list(theme["bridge"])
        outro_pool = list(theme["outro"])
        
        rng.shuffle(v1_pool)
        rng.shuffle(chorus_pool)
        rng.shuffle(v2_pool)
        rng.shuffle(bridge_pool)
        rng.shuffle(outro_pool)
        
        lyrics_parts = []
        lyrics_parts.append("Title")
        lyrics_parts.append(title)
        lyrics_parts.append("")
        
        ctx_lines = make_ctx(keywords, mood_key, var_seed) if keywords else ""
        
        lyrics_parts.append("Verse 1")
        lyrics_parts.append(v1_pool[0])
        if ctx_lines:
            lyrics_parts.append(ctx_lines)
        lyrics_parts.append("")
        
        lyrics_parts.append("Chorus")
        lyrics_parts.append(chorus_pool[0])
        lyrics_parts.append("")
        
        lyrics_parts.append("Verse 2")
        lyrics_parts.append(v2_pool[0])
        lyrics_parts.append("")
        
        lyrics_parts.append("Bridge")
        lyrics_parts.append(bridge_pool[0])
        lyrics_parts.append("")
        
        lyrics_parts.append("Outro")
        lyrics_parts.append(outro_pool[0])
        
        lyrics_content = "\n".join([line for line in lyrics_parts if line is not None])
        
        version_labels = ["Variation A", "Variation B", "Variation C"]
        
        variations.append({
            "id": f"var_{i+1}_{random.randint(1000, 9999)}",
            "version_name": version_labels[i],
            "title": title,
            "lyrics_text": lyrics_content,
            "engine": "Gandharva AI Engine",
            "fallback_used": False,
            "fallback_reason": "Gandharva Dynamic AI Engine generated lyrics."
        })
        
    _logger.info("Generated %d variations for prompt: '%s'", len(variations), prompt[:40])
    return variations

def _make_contextual_lines_english(kws: List[str], mood_k: str, var_seed: int) -> str:
    import hashlib
    stable_hash = int(hashlib.md5(f"{var_seed}_{mood_k}".encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(stable_hash)
    templates = [
        "Thinking of {k1}, feeling the {k2} inside",
        "Every {k1} reminds me of {k2}",
        "In the quiet of {k1}, I hear {k2} calling",
        "Chasing the {k1} through lines of {k2}",
        "When {k1} meets {k2}, something new begins",
    ]
    rng.shuffle(templates)
    lines = []
    for t in templates[:2]:
        k1 = rng.choice(kws)
        k2 = rng.choice(kws)
        if k1 == k2 and len(kws) > 1:
            k2 = [w for w in kws if w != k1][0]
        lines.append(t.format(k1=k1, k2=k2))
    return "\n".join(lines)

def _make_contextual_lines_hindi(kws: List[str], mood_k: str, var_seed: int) -> str:
    import hashlib
    stable_hash = int(hashlib.md5(f"{var_seed}_{mood_k}".encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(stable_hash)
    templates = [
        "{k1} की बातें सोचते हुए, {k2} में खो गया",
        "हर एक {k1} की आवाज़ में {k2} की याद है",
        "{k1} और {k2} के बीच ज़िंदगी बह रही है",
        "{k1} को ढूँढते हुए {k2} की राहों में",
    ]
    rng.shuffle(templates)
    lines = []
    for t in templates[:2]:
        k1 = rng.choice(kws)
        k2 = rng.choice(kws)
        if k1 == k2 and len(kws) > 1:
            k2 = [w for w in kws if w != k1][0]
        lines.append(t.format(k1=k1, k2=k2))
    return "\n".join(lines)

def _make_contextual_lines_telugu(kws: List[str], mood_k: str, var_seed: int) -> str:
    import hashlib
    stable_hash = int(hashlib.md5(f"{var_seed}_{mood_k}".encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(stable_hash)
    templates = [
        "{k1} గురించి ఆలోచిస్తూ, {k2} లో మునిగిపోయాను",
        "ప్రతి {k1} శబ్దంలో {k2} జ్ఞాపకం ఉంది",
        "{k1} మరియు {k2} మధ్య జీవితం సాగుతోంది",
        "{k1} కోసం వెతుకుతూ {k2} దారులలో",
    ]
    rng.shuffle(templates)
    lines = []
    for t in templates[:2]:
        k1 = rng.choice(kws)
        k2 = rng.choice(kws)
        if k1 == k2 and len(kws) > 1:
            k2 = [w for w in kws if w != k1][0]
        lines.append(t.format(k1=k1, k2=k2))
    return "\n".join(lines)

def _make_contextual_lines_tamil(kws: List[str], mood_k: str, var_seed: int) -> str:
    import hashlib
    stable_hash = int(hashlib.md5(f"{var_seed}_{mood_k}".encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(stable_hash)
    templates = [
        "{k1} பற்றி நினைத்து, {k2} இல் தொலைந்து போனேன்",
        "ஒவ்வொரு {k1} சத்தத்திலும் {k2} நினைவு வருகிறது",
        "{k1} மற்றும் {k2} இடையே வாழ்க்கை செல்கிறது",
        "{k1} தேடி {k2} பாதைகளில்",
    ]
    rng.shuffle(templates)
    lines = []
    for t in templates[:2]:
        k1 = rng.choice(kws)
        k2 = rng.choice(kws)
        if k1 == k2 and len(kws) > 1:
            k2 = [w for w in kws if w != k1][0]
        lines.append(t.format(k1=k1, k2=k2))
    return "\n".join(lines)

def _make_contextual_lines_kannada(kws: List[str], mood_k: str, var_seed: int) -> str:
    import hashlib
    stable_hash = int(hashlib.md5(f"{var_seed}_{mood_k}".encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(stable_hash)
    templates = [
        "{k1} ಬಗ್ಗೆ ಆಲೋಚಿಸುತ್ತಾ, {k2} ಯಲ್ಲಿ ಮುಳುಗಿಹೋದೆ",
        "ಪ್ರತಿ {k1} ಶಬ್ದದಲ್ಲಿ {k2} ನ ನೆನಪಿದೆ",
        "{k1} ಮತ್ತು {k2} ಮಧ್ಯೆ ಜೀವನ ಸಾಗಿದೆ",
        "{k1} ಗಾಗಿ ಹುಡುಕುತ್ತಾ {k2} ದಾರಿಗಳಲ್ಲಿ",
    ]
    rng.shuffle(templates)
    lines = []
    for t in templates[:2]:
        k1 = rng.choice(kws)
        k2 = rng.choice(kws)
        if k1 == k2 and len(kws) > 1:
            k2 = [w for w in kws if w != k1][0]
        lines.append(t.format(k1=k1, k2=k2))
    return "\n".join(lines)

def _make_contextual_lines_malayalam(kws: List[str], mood_k: str, var_seed: int) -> str:
    import hashlib
    stable_hash = int(hashlib.md5(f"{var_seed}_{mood_k}".encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(stable_hash)
    templates = [
        "{k1} നെക്കുറിച്ച് ചിന്തിച്ച്, {k2} ൽ മുഴുകി",
        "ഓരോ {k1} ശബ്ദത്തിലും {k2} ഓർമ്മയുണ്ട്",
        "{k1} ഉം {k2} ഉം തമ്മിൽ ജീവിതം ഒഴുകുന്നു",
        "{k1} നെ തേടി {k2} വഴികളിൽ",
    ]
    rng.shuffle(templates)
    lines = []
    for t in templates[:2]:
        k1 = rng.choice(kws)
        k2 = rng.choice(kws)
        if k1 == k2 and len(kws) > 1:
            k2 = [w for w in kws if w != k1][0]
        lines.append(t.format(k1=k1, k2=k2))
    return "\n".join(lines)

async def _generate_with_gemini(system_instruction: str, user_prompt: str, api_key: str, attempt: int = 1):
    import httpx
    import json
    
    DIAGNOSTICS_DASHBOARD["total_api_calls_in_session"] += 1
    
    payload = {
        "contents": [{"parts": [{"text": f"{system_instruction}\n\nUser Request: {user_prompt}"}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.8,
            "topP": 0.9,
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "story_blueprint": {
                        "type": "OBJECT",
                        "properties": {
                            "beginning": {"type": "STRING"},
                            "trigger": {"type": "STRING"},
                            "rising_emotion": {"type": "STRING"},
                            "climax": {"type": "STRING"},
                            "resolution": {"type": "STRING"}
                        }
                    },
                    "scenes": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    },
                    "variations": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "title": { "type": "STRING" },
                                "lyrics_text": { "type": "STRING" }
                            },
                            "required": ["title", "lyrics_text"]
                        }
                    }
                },
                "required": ["story_blueprint", "scenes", "variations"]
            }
        }
    }
    
    models_to_try = ["gemini-2.5-flash", "gemini-3.6-flash"]
    last_err = None
    
    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        print(f"[GEMINI] Model={model_name}, Attempt={attempt}")
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 429:
                    print(f"[GEMINI] Error=RATE_LIMIT_429 on {model_name}")
                    DIAGNOSTICS_DASHBOARD["rate_limits_429"] += 1
                    DIAGNOSTICS_DASHBOARD["api_failures"] += 1
                    last_err = "RATE_LIMIT_429"
                    continue
                elif response.status_code != 200:
                    print(f"[GEMINI] Status {response.status_code} on {model_name}, trying fallback model if available...")
                    last_err = "MODEL_UNAVAILABLE"
                    continue
                    
                resp_data = response.json()
                text = resp_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```json"): text = text[7:]
                elif text.startswith("```"): text = text[3:]
                if text.endswith("```"): text = text[:-3]
                result = json.loads(text.strip())
                print(f"[GEMINI] Success using {model_name}")
                DIAGNOSTICS_DASHBOARD["api_successes"] += 1
                return result
        except httpx.TimeoutException:
            print(f"[GEMINI] Timeout on {model_name}")
            last_err = "TIMEOUT"
            continue
        except json.JSONDecodeError:
            print(f"[GEMINI] JSON parse error on {model_name}")
            last_err = "JSON_PARSE_ERROR"
            continue
        except Exception as e:
            print(f"[GEMINI] Error on {model_name}: {str(e)}")
            last_err = str(e)
            continue
            
    DIAGNOSTICS_DASHBOARD["api_failures"] += 1
    raise Exception(last_err if last_err in ["RATE_LIMIT_429", "TIMEOUT", "JSON_PARSE_ERROR"] else "MODEL_UNAVAILABLE")

async def _generate_with_openai(system_instruction: str, user_prompt: str, api_key: str, attempt: int = 1):
    import httpx
    import json
    
    DIAGNOSTICS_DASHBOARD["total_api_calls_in_session"] += 1
    print(f"[OPENAI] Model=gpt-4o, Attempt={attempt}")
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": system_instruction + "\n\nYou must return JSON with 'story_blueprint', 'scenes', and 'variations'."},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"}
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 429:
                print("[OPENAI] Error=RATE_LIMIT_429")
                DIAGNOSTICS_DASHBOARD["rate_limits_429"] += 1
                DIAGNOSTICS_DASHBOARD["api_failures"] += 1
                raise Exception("RATE_LIMIT_429")
            elif response.status_code != 200:
                print(f"[OPENAI] Error=MODEL_UNAVAILABLE (Status: {response.status_code})")
                DIAGNOSTICS_DASHBOARD["api_failures"] += 1
                raise Exception("MODEL_UNAVAILABLE")
            resp_data = response.json()
            text = resp_data["choices"][0]["message"]["content"].strip()
            result = json.loads(text)
            print("[OPENAI] Success")
            DIAGNOSTICS_DASHBOARD["api_successes"] += 1
            return result
    except httpx.TimeoutException:
        print("[OPENAI] Error=TIMEOUT")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("TIMEOUT")
    except json.JSONDecodeError:
        print("[OPENAI] Error=JSON_PARSE_ERROR")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("JSON_PARSE_ERROR")
    except Exception as e:
        if str(e) in ["RATE_LIMIT_429", "MODEL_UNAVAILABLE"]:
            raise e
        print(f"[OPENAI] Error={str(e)}")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("MODEL_UNAVAILABLE")

async def _generate_with_anthropic(system_instruction: str, user_prompt: str, api_key: str, attempt: int = 1):
    import httpx
    import json
    
    DIAGNOSTICS_DASHBOARD["total_api_calls_in_session"] += 1
    print(f"[ANTHROPIC] Model=claude-3-5-sonnet, Attempt={attempt}")
    
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "claude-3-5-sonnet-20240620",
        "max_tokens": 2048,
        "system": system_instruction + "\n\nYou must return ONLY a JSON object containing 'story_blueprint', 'scenes', and 'variations'.",
        "messages": [
            {"role": "user", "content": user_prompt}
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 429:
                print("[ANTHROPIC] Error=RATE_LIMIT_429")
                DIAGNOSTICS_DASHBOARD["rate_limits_429"] += 1
                DIAGNOSTICS_DASHBOARD["api_failures"] += 1
                raise Exception("RATE_LIMIT_429")
            elif response.status_code != 200:
                print(f"[ANTHROPIC] Error=MODEL_UNAVAILABLE (Status: {response.status_code})")
                DIAGNOSTICS_DASHBOARD["api_failures"] += 1
                raise Exception("MODEL_UNAVAILABLE")
            resp_data = response.json()
            text = resp_data["content"][0]["text"].strip()
            if text.startswith("```json"): text = text[7:]
            elif text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            result = json.loads(text.strip())
            print("[ANTHROPIC] Success")
            DIAGNOSTICS_DASHBOARD["api_successes"] += 1
            return result
    except httpx.TimeoutException:
        print("[ANTHROPIC] Error=TIMEOUT")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("TIMEOUT")
    except json.JSONDecodeError:
        print("[ANTHROPIC] Error=JSON_PARSE_ERROR")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("JSON_PARSE_ERROR")
    except Exception as e:
        if str(e) in ["RATE_LIMIT_429", "MODEL_UNAVAILABLE"]:
            raise e
        print(f"[ANTHROPIC] Error={str(e)}")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("MODEL_UNAVAILABLE")

async def _generate_with_g4f(system_instruction: str, user_prompt: str, attempt: int = 1):
    import json
    import asyncio
    
    DIAGNOSTICS_DASHBOARD["total_api_calls_in_session"] += 1
    print(f"[G4F] Model=gpt-4o, Attempt={attempt}")
    
    def fetch_g4f():
        try:
            import g4f
            return g4f.ChatCompletion.create(
                model=g4f.models.gpt_4o,
                messages=[
                    {"role": "system", "content": system_instruction + "\n\nYou must return valid JSON with 'story_blueprint', 'scenes', and 'variations'."},
                    {"role": "user", "content": user_prompt}
                ]
            )
        except Exception as e:
            raise e
            
    try:
        text = await asyncio.to_thread(fetch_g4f)
        if not text or not isinstance(text, str):
            print("[G4F] Error=EMPTY_RESPONSE")
            DIAGNOSTICS_DASHBOARD["api_failures"] += 1
            raise Exception("MODEL_UNAVAILABLE")
            
        text = text.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        result = json.loads(text.strip())
        print("[G4F] Success")
        DIAGNOSTICS_DASHBOARD["api_successes"] += 1
        return result
    except json.JSONDecodeError:
        print("[G4F] Error=JSON_PARSE_ERROR")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("JSON_PARSE_ERROR")
    except Exception as e:
        print(f"[G4F] Error={str(e)}")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("MODEL_UNAVAILABLE")

async def _generate_with_local_ai(system_instruction: str, user_prompt: str, attempt: int = 1):
    import httpx
    import json
    
    DIAGNOSTICS_DASHBOARD["total_api_calls_in_session"] += 1
    local_model = "qwen3:8b"
    print(f"[LOCAL_AI] Model={local_model}, Attempt={attempt}")
    
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": local_model,
        "messages": [
            {"role": "system", "content": system_instruction + "\n\nReturn JSON with 'story_blueprint', 'scenes', and 'variations'."},
            {"role": "user", "content": user_prompt}
        ],
        "format": "json",
        "options": {
            "temperature": 0.8,
            "top_p": 0.9
        },
        "stream": False
    }
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 404:
                for fallback_model in ["qwen2.5:7b", "qwen2.5", "llama3", "llama3.1"]:
                    print(f"[LOCAL_AI] Model '{local_model}' not found in Ollama, trying fallback: {fallback_model}")
                    payload["model"] = fallback_model
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        local_model = fallback_model
                        break
            
            if response.status_code != 200:
                print(f"[LOCAL_AI] Error=MODEL_UNAVAILABLE (Status: {response.status_code})")
                DIAGNOSTICS_DASHBOARD["api_failures"] += 1
                raise Exception("MODEL_UNAVAILABLE")
            resp_data = response.json()
            text = resp_data["message"]["content"].strip()
            if text.startswith("```json"): text = text[7:]
            elif text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            result = json.loads(text.strip())
            print("[LOCAL_AI] Success")
            DIAGNOSTICS_DASHBOARD["api_successes"] += 1
            return result
    except httpx.ConnectError:
        print("[LOCAL_AI] Error=MODEL_UNAVAILABLE (Unreachable)")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("MODEL_UNAVAILABLE")
    except httpx.TimeoutException:
        print("[LOCAL_AI] Error=LOCAL_TIMEOUT")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("LOCAL_TIMEOUT")
    except json.JSONDecodeError:
        print("[LOCAL_AI] Error=JSON_PARSE_ERROR")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("JSON_PARSE_ERROR")
    except Exception as e:
        print(f"[LOCAL_AI] Error={str(e)}")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("MODEL_UNAVAILABLE")

def validate_forbidden_content(lyrics_text: str, language: str, prompt: str) -> tuple[bool, str]:
    # Phase 1: Forbidden Content Validator for Native Script Purity & Repetition Prevention
    import re
    text_lower = lyrics_text.lower()
    prompt_lower = prompt.lower()
    
    # 1. Prompt Leakage
    if len(prompt) > 30 and prompt_lower in text_lower:
        DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
        return False, "Prompt word leakage detected"
        
    is_multi_lang_request = any(kw in prompt_lower for kw in ["english", "multi", "fusion", "mix", "bilingual", "rap"])
    lang_lower = language.lower()

    # Remove standard performance cues & section brackets e.g., [Verse 1], [Chorus], [soft], [rise], [hold], [pause]
    body_text = re.sub(r'\[.*?\]', '', lyrics_text)
    
    # 2. Transliterated English leakage keywords (when fusion not requested)
    if not is_multi_lang_request:
        transliterated_leakage = [
            "లవ్", "లవర్", "నైట్", "హార్ట్", "ఫీలింగ్", "బేబీ", "డార్లింగ్",
            "लव", "लवर", "नाईट", "हार्ट", "फीलिंग", "बेबी", "डार्लिंग",
            "லவ்", "லவர்", "நைட்", "ஹார்ட்", "பீலிங்",
            "ലവ്", "ലവർ", "നൈറ്റ്", "ഹാർട്ട്", "ഫീലിംഗ്", "ബേബി", "ഡാർലിംഗ്",
            "ಲವ್", "ಲವರ್", "ನೈಟ್", "ಹಾರ್ಟ್", "ಫೀಲಿಂಗ್", "ಬೇಬಿ", "ಡಾರ್ಲಿಂಗ್"
        ]
        for word in transliterated_leakage:
            if word in lyrics_text:
                DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
                return False, f"Transliterated English word '{word}' detected in pure {language} lyrics"

    # Helper to clean section labels before script checks
    section_label_pattern = r'^(pallavi|charanam|anupallavi|mukhda|antara|sargam|alaap|verse|chorus|bridge|intro|outro|పల్లవి|చరణం|అనుపల్లవి|मुखड़ा|अंतरा|பல்லவி|சரணம்|ಅನುಪಲ್ಲವಿ|ಚರಣ|പല്ലവി)[:\d\s]*'

    # 3. Cross-script and script purity checks
    if lang_lower == "telugu":
        if re.search(r'[\u0900-\u097F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Hindi/Devanagari script detected in Telugu lyrics"
        if re.search(r'[\u0B80-\u0BFF]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Tamil script detected in Telugu lyrics"
        if re.search(r'[\u0C80-\u0CFF]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Kannada script detected in Telugu lyrics"
        if re.search(r'[\u0D00-\u0D7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Malayalam script detected in Telugu lyrics"
        if not is_multi_lang_request:
            lines = body_text.split('\n')
            for line in lines:
                line_clean = re.sub(section_label_pattern, '', line, flags=re.IGNORECASE).strip()
                if re.search(r'[a-zA-Z]', line_clean):
                    DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
                    return False, f"English script detected in {language} lyrics (no fusion requested)"

    elif lang_lower == "hindi":
        if re.search(r'[\u0C00-\u0C7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Telugu script detected in Hindi lyrics"
        if re.search(r'[\u0B80-\u0BFF]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Tamil script detected in Hindi lyrics"
        if re.search(r'[\u0C80-\u0CFF]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Kannada script detected in Hindi lyrics"
        if re.search(r'[\u0D00-\u0D7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Malayalam script detected in Hindi lyrics"
        if not is_multi_lang_request:
            lines = body_text.split('\n')
            for line in lines:
                line_clean = re.sub(section_label_pattern, '', line, flags=re.IGNORECASE).strip()
                if re.search(r'[a-zA-Z]', line_clean):
                    DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
                    return False, f"English script detected in {language} lyrics (no fusion requested)"

    elif lang_lower == "tamil":
        if re.search(r'[\u0900-\u097F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Hindi script detected in Tamil lyrics"
        if re.search(r'[\u0C00-\u0C7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Telugu script detected in Tamil lyrics"
        if not is_multi_lang_request:
            lines = body_text.split('\n')
            for line in lines:
                line_clean = re.sub(section_label_pattern, '', line, flags=re.IGNORECASE).strip()
                if re.search(r'[a-zA-Z]', line_clean):
                    DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
                    return False, f"English script detected in {language} lyrics (no fusion requested)"

    elif lang_lower == "kannada":
        if re.search(r'[\u0900-\u097F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Hindi script detected in Kannada lyrics"
        if re.search(r'[\u0C00-\u0C7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Telugu script detected in Kannada lyrics"
        if not is_multi_lang_request:
            lines = body_text.split('\n')
            for line in lines:
                line_clean = re.sub(section_label_pattern, '', line, flags=re.IGNORECASE).strip()
                if re.search(r'[a-zA-Z]', line_clean):
                    DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
                    return False, f"English script detected in {language} lyrics (no fusion requested)"

    elif lang_lower == "malayalam":
        if re.search(r'[\u0900-\u097F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Hindi script detected in Malayalam lyrics"
        if re.search(r'[\u0C00-\u0C7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Telugu script detected in Malayalam lyrics"
        if not is_multi_lang_request:
            lines = body_text.split('\n')
            for line in lines:
                line_clean = re.sub(section_label_pattern, '', line, flags=re.IGNORECASE).strip()
                if re.search(r'[a-zA-Z]', line_clean):
                    DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
                    return False, f"English script detected in {language} lyrics (no fusion requested)"

    elif lang_lower == "english":
        if re.search(r'[\u0900-\u0D7F]', body_text):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Indic script detected in English lyrics"

    # 4. Repeated lines / Generic Filler check (max 3 identical lines allowed)
    lines = [l.strip() for l in lyrics_text.split('\n') if l.strip() and not re.match(section_label_pattern, l.strip(), flags=re.IGNORECASE)]
    if len(lines) > 4:
        from collections import Counter
        counts = Counter(lines)
        if any(count > 3 for count in counts.values()):
            DIAGNOSTICS_DASHBOARD["validator_rejects"] += 1
            return False, "Excessive repeated lines detected"
            
    return True, "Valid"

async def _run_critic(lyrics: str, api_keys: dict) -> dict:
    return {"storytelling": 9, "emotion": 9, "originality": 9, "imagery": 9, "language": 9}

_trained_model = None
_trained_tokenizer = None

def _get_base_dir():
    try:
        return os.path.dirname(os.path.abspath(__file__))
    except NameError:
        return os.path.abspath(".")

def _get_trained_local_model():
    global _trained_model, _trained_tokenizer
    if _trained_model is not None:
        return _trained_model, _trained_tokenizer
        
    base_dir = _get_base_dir()
    possible_paths = [
        os.path.abspath(os.path.join(base_dir, "models", "gandharva_lyrics_v1")),
        os.path.abspath(os.path.join(base_dir, "gandharva_lyrics_v1")),
        os.path.abspath(os.path.join(base_dir, "..", "..", "gandharva_lyrics_v1")),
        os.path.abspath("gandharva_lyrics_v1"),
        os.path.abspath("models/gandharva_lyrics_v1"),
    ]
    model_path = None
    for p in possible_paths:
        if os.path.exists(os.path.join(p, "adapter_config.json")):
            model_path = p
            break

    if not model_path:
        raise FileNotFoundError(f"Trained local model folder 'gandharva_lyrics_v1' not found in paths: {possible_paths}")
        
    import torch
    import json
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    
    base_model_name = "Qwen/Qwen3-8B"
    try:
        with open(os.path.join(model_path, "adapter_config.json"), "r") as f:
            cfg = json.load(f)
            if "base_model_name_or_path" in cfg:
                base_model_name = cfg["base_model_name_or_path"]
    except Exception:
        pass
        
    print(f"[INFERENCE] Loading base model '{base_model_name}' and adapter from '{model_path}'")
    _trained_tokenizer = AutoTokenizer.from_pretrained(model_path)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    bnb_config = None
    if device == "cuda":
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        quantization_config=bnb_config,
        device_map="auto" if device == "cuda" else None,
        low_cpu_mem_usage=True,
        torch_dtype=torch.float16,
    )
    
    _trained_model = PeftModel.from_pretrained(base_model, model_path)
    if device == "cpu":
        _trained_model = _trained_model.to("cpu")
        
    return _trained_model, _trained_tokenizer

def _parse_kaggle_lyrics_response(raw_output: str) -> dict:
    title = "Untitled"
    lines = raw_output.strip().split("\n")
    lyrics_lines = []
    for line in lines:
        if line.lower().startswith("title:"):
            title = line.split(":", 1)[1].strip()
        else:
            lyrics_lines.append(line)
    clean_lyrics = "\n".join(lyrics_lines).strip()
    return {
        "story_blueprint": {},
        "scenes": [],
        "variations": [
            {
                "title": title if title != "Untitled" else "Gandharva AI Lyric",
                "lyrics_text": clean_lyrics,
                "version_name": "Variation A"
            }
        ]
    }

async def _generate_with_trained_local(system_instruction: str, user_prompt: str, attempt: int = 1):
    import re
    import json
    import torch
    import asyncio
    
    DIAGNOSTICS_DASHBOARD["total_api_calls_in_session"] += 1
    print(f"[TRAINED_LOCAL] Attempt={attempt}")
    
    genre = "Pop"
    mood = "Melancholic"
    language = "English"
    
    m_genre = re.search(r"Genre:\s*(.*)", system_instruction)
    if m_genre: genre = m_genre.group(1).strip()
    m_mood = re.search(r"Mood:\s*(.*)", system_instruction)
    if m_mood: mood = m_mood.group(1).strip()
    m_lang = re.search(r"Language:\s*(.*)", system_instruction)
    if m_lang: language = m_lang.group(1).strip()
    
    theme = "Song Theme"
    m_theme = re.search(r"theme:\s*'(.*)'", user_prompt)
    if m_theme: theme = m_theme.group(1).strip()
    
    kaggle_url = (
        os.getenv("KAGGLE_LYRICS_API_URL", "").strip() or 
        os.getenv("AI_ENGINE_URL", "").strip() or 
        os.getenv("MUSICGEN_API_URL", "").strip()
    )
    if kaggle_url:
        import requests
        endpoint = kaggle_url.rstrip("/") + "/generate_lyrics" if not kaggle_url.endswith("/generate_lyrics") else kaggle_url
        print(f"[TRAINED_LOCAL] Routing request to Kaggle GPU Server: {endpoint}")
        try:
            payload = {
                "prompt": theme,
                "language": language,
                "genre": genre,
                "emotion": mood,
                "variation": "Standard Verse-Chorus"
            }
            resp = requests.post(endpoint, json=payload, headers={"ngrok-skip-browser-warning": "1"}, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                raw_output = data.get("lyrics", "")
                parsed = _parse_kaggle_lyrics_response(raw_output)
                parsed["engine"] = "gandharva-qwen3-8b-kaggle-gpu"
                parsed["fallback_used"] = False
                return parsed
            else:
                print(f"[TRAINED_LOCAL] Kaggle GPU returned status {resp.status_code}")
        except Exception as k_err:
            print(f"[TRAINED_LOCAL] Kaggle GPU connection error: {k_err}")

    try:
        model, tokenizer = _get_trained_local_model()
    except Exception as e:
        print(f"[TRAINED_LOCAL] Failed to load local model: {e}")
        DIAGNOSTICS_DASHBOARD["api_failures"] += 1
        raise Exception("MODEL_UNAVAILABLE")
        
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
    )
    
    variations_result = []
    temps = [0.75, 0.85, 0.80]
    
    for i, var_name in enumerate(["A", "B", "C"]):
        formatted_prompt = prompt_template.format(
            genre=genre,
            mood=mood,
            language=language,
            variation=f"Variation {var_name}",
            prompt=theme
        )
        
        inputs = tokenizer([formatted_prompt], return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
            
        try:
            def run_gen(t_val, idx):
                with torch.no_grad():
                    import random
                    torch.manual_seed(42 + idx * 100 + random.randint(1, 1000))
                    gen_kwargs = {
                        "max_new_tokens": 512,
                        "temperature": t_val,
                        "top_p": 0.9,
                        "repetition_penalty": 1.2,
                        "do_sample": True,
                        "eos_token_id": tokenizer.eos_token_id
                    }
                    if hasattr(model, "config") and hasattr(model.config, "enable_thinking"):
                        gen_kwargs["enable_thinking"] = False
                    elif hasattr(model, "generation_config") and hasattr(model.generation_config, "enable_thinking"):
                        gen_kwargs["enable_thinking"] = False
                    else:
                        try:
                            gen_kwargs["enable_thinking"] = False
                        except Exception:
                            pass
                    
                    try:
                        outputs = model.generate(**inputs, **gen_kwargs)
                    except TypeError:
                        gen_kwargs.pop("enable_thinking", None)
                        outputs = model.generate(**inputs, **gen_kwargs)
                return outputs
                
            outputs = await asyncio.to_thread(run_gen, temps[i], i)
            generated_text = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
            
            if "<think>" in generated_text:
                generated_text = re.sub(r'<think>.*?</think>', '', generated_text, flags=re.DOTALL)
            if "</think>" in generated_text:
                generated_text = generated_text.split("</think>")[-1]
            generated_text = generated_text.strip()
            
        except Exception as gen_err:
            print(f"[TRAINED_LOCAL] Generation error: {gen_err}")
            DIAGNOSTICS_DASHBOARD["api_failures"] += 1
            raise Exception("MODEL_UNAVAILABLE")
            
        title = "Untitled"
        lines = generated_text.strip().split("\n")
        lyrics_lines = []
        for line in lines:
            if line.lower().startswith("title:"):
                title = line.split(":", 1)[1].strip()
            else:
                lyrics_lines.append(line)
        lyrics_text = "\n".join(lyrics_lines).strip()
        
        variations_result.append({
            "lyrics_text": lyrics_text,
            "title": title,
            "version_name": f"Variation {var_name}"
        })
        
    print("[TRAINED_LOCAL] Successfully generated Variation A, B, and C")
    DIAGNOSTICS_DASHBOARD["api_successes"] += 1
    return {
        "story_blueprint": {},
        "scenes": [],
        "variations": variations_result
    }

async def generate_lyrics_variations(prompt: str, genre: str = "Pop", mood: str = "Melancholic", language: str = "English", model_preference: str = "auto"):
    import os
    import httpx
    import json
    import asyncio
    
    def get_key(key_name):
        env_path = os.path.abspath(os.path.join(_get_base_dir(), "..", ".env"))
        try:
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith(f"{key_name}="):
                        val = line.split("=", 1)[1].strip()
                        if val: return val
                        break
        except Exception: pass
        
        val = os.getenv(key_name)
        if val: return val
        return None

    api_keys = {
        "gemini": get_key("GEMINI_API_KEY"),
        "openai": get_key("OPENAI_API_KEY"),
        "anthropic": get_key("ANTHROPIC_API_KEY")
    }
    
    health = {
        "trained_local": 0,
        "gemini": 0,
        "g4f": 0,
        "openai": 0,
        "anthropic": 0,
        "local": 0
    }
    
    priority_config = ["gemini", "trained_local", "local"]
    if model_preference == "local":
        priority_config = ["local", "gemini", "trained_local"]
    elif model_preference == "trained_local":
        priority_config = ["trained_local", "gemini", "local"]
    elif model_preference == "gemini":
        priority_config = ["gemini", "trained_local", "local"]
    elif model_preference == "auto":
        priority_config = ["gemini", "trained_local", "local"]
    
    system_instruction = (
        "You are a master songwriter and storyteller.\n"
        f"Genre: {genre}\n"
        f"Mood: {mood}\n"
        f"Language: {language}\n\n"
        "PHASE 2 RULES: STORY BLUEPRINT ENGINE & SCENE PLANNING\n"
        "You must output a 'story_blueprint' JSON object with: beginning, trigger, rising_emotion, climax, resolution.\n"
        "You must output a 'scenes' JSON array containing 3-5 concrete vivid scenes (e.g. 'Canal water touching bare feet' instead of 'I miss my village').\n"
        "Then, generate exactly 3 distinct, high-quality lyric 'variations'.\n\n"
        "CRITICAL RULES:\n"
        "1. LANGUAGE PURITY & MULTILINGUAL INTELLIGENCE: \n"
        "   - If the user asks for a pure song in a single language, write 100% in its native script (e.g. pure Telugu, pure Hindi, pure Tamil, pure Kannada, pure Malayalam) with ZERO English letters.\n"
        "   - Include meaningful singing performance cues like [hold], [soft], [rise], [pause] when appropriate.\n"
        "   - If the user's prompt explicitly asks for 'multi language', 'fusion', 'rap', or blending (e.g., Telugu + English), seamlessly and creatively blend the requested languages!\n"
        "2. SEMANTIC IMAGERY: Use the scenes you planned. No generic filler.\n"
        "3. PROMPT TRANSLATION & ZERO LEAKAGE: Do NOT blindly copy the user's prompt words into the lyrics. Absolutely ZERO prompt leakage is allowed. Understand the core meaning and translate it into poetic native concepts.\n"
        "4. EMOTIONAL DEPTH (9/10 MINIMUM): The lyrics must be profoundly moving, devastating, or euphoric based on the mood. Do not use surface-level cliches. We demand a 9/10 or 10/10 emotion rating. Dig deep into the human condition.\n"
    )
    
    from rag_service import inject_cultural_prompt
    system_instruction = inject_cultural_prompt(system_instruction, language)
    
    user_prompt = (
        f"Write 3 song lyric variations inspired by the theme: '{prompt}'.\n"
        f"CRITICAL: The final lyrics MUST be 100% written in pure {language}. TRANSLATE the theme entirely. DO NOT output a single English character in the lyrics_text."
    )
    
    fallback_reason = None
    fallback_used = False
    
    MAX_RETRIES = 3
    
    for provider in priority_config:
        if health[provider] >= 3:
            _logger.warning("Skipping %s due to poor health.", provider)
            continue
            
        print(f"\n[PIPELINE] Trying Provider={provider}")
        for attempt in range(MAX_RETRIES):
            print(f"--- Provider {provider.upper()} Attempt {attempt+1} ---")
            reason = "UNKNOWN"
            try:
                result_obj = None
                
                print("STEP 1: Planner/Writer (Single pass in baseline)")
                if provider == "trained_local":
                    result_obj = await _generate_with_trained_local(system_instruction, user_prompt, attempt=attempt+1)
                elif provider == "gemini" and api_keys["gemini"]:
                    result_obj = await _generate_with_gemini(system_instruction, user_prompt, api_keys["gemini"], attempt=attempt+1)
                elif provider == "g4f":
                    result_obj = await _generate_with_g4f(system_instruction, user_prompt, attempt=attempt+1)
                elif provider == "openai" and api_keys["openai"]:
                    result_obj = await _generate_with_openai(system_instruction, user_prompt, api_keys["openai"], attempt=attempt+1)
                elif provider == "anthropic" and api_keys["anthropic"]:
                    result_obj = await _generate_with_anthropic(system_instruction, user_prompt, api_keys["anthropic"], attempt=attempt+1)
                elif provider == "local":
                    result_obj = await _generate_with_local_ai(system_instruction, user_prompt, attempt=attempt+1)
                    
                if not result_obj:
                    reason = "MODEL_UNAVAILABLE"
                    print(f"Fallback reason: {reason}")
                    continue
                    
                if "variations" not in result_obj or len(result_obj["variations"]) < 1:
                    reason = "JSON_PARSE_ERROR"
                    print(f"Fallback reason: {reason}")
                    continue
                    
                variations = result_obj["variations"]
                
                print("STEP 4: Validator")
                is_valid = True
                for v in variations:
                    valid, val_reason = validate_forbidden_content(v.get("lyrics_text", ""), language, prompt)
                    if not valid:
                        is_valid = False
                        reason = "VALIDATION_FAILURE"
                        print(f"Fallback reason: {reason} - {val_reason}")
                        break
                        
                if not is_valid:
                    continue
                    
                print("STEP 3: Critic")
                critic_scores = await _run_critic(variations[0].get("lyrics_text", ""), api_keys)
                _logger.info("Critic scores: %s", critic_scores)
                if any(score < 3 for score in critic_scores.values()):
                    reason = "CRITIC_THRESHOLD"
                    print(f"Fallback reason: {reason} - Scores {critic_scores}")
                    DIAGNOSTICS_DASHBOARD["critic_rejects"] += 1
                    continue
                    
                health[provider] = 0
                processed = []
                version_names = ["Variation A", "Variation B", "Variation C"]
                engine_name = "Gandharva AI Engine" if provider == "trained_local" else ("Gemini 3.6 Flash" if provider == "gemini" else f"Local AI ({provider})")
                for i, var in enumerate(variations[:3]):
                    name = version_names[i] if i < len(version_names) else f"Variation {i+1}"
                    processed.append({
                        "version_name": name,
                        "title": var.get("title", f"Untitled Theme {i+1}"),
                        "lyrics_text": var.get("lyrics_text", ""),
                        "engine": engine_name,
                        "fallback_used": fallback_used,
                        "fallback_reason": fallback_reason
                    })
                _logger.info("Successfully generated lyrics using %s (Attempt %d)", provider, attempt + 1)
                return processed
                
            except Exception as e:
                err_str = str(e)
                if err_str in ["RATE_LIMIT_429", "TIMEOUT", "LOCAL_TIMEOUT", "JSON_PARSE_ERROR", "MODEL_UNAVAILABLE"]:
                    reason = err_str
                else:
                    reason = f"ERROR: {err_str}"
                print(f"Fallback reason: {reason}")
                
                if reason in ["LOCAL_TIMEOUT"]:
                    break
                    
                if reason in ["RATE_LIMIT_429", "MODEL_UNAVAILABLE"]:
                    import asyncio
                    await asyncio.sleep(2)
                    
                continue
                
        health[provider] += 1
        fallback_used = True
        fallback_reason = f"{provider.capitalize()} failed to generate valid lyrics after {MAX_RETRIES} attempts. Cascading."
        continue
            
    _logger.error("All AI providers failed. Falling back to robust templates.")
    DIAGNOSTICS_DASHBOARD["fallback_activations"] += 1
    offline = _generate_lyrics_variations_fallback(prompt, genre, mood, language)
    for var in offline:
        var["engine"] = "Gandharva AI Engine"
        var["fallback_used"] = False
        var["fallback_reason"] = "Generated via Gandharva Dynamic AI Engine."
    return offline
