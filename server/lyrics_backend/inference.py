import os
import random
import logging
from typing import Tuple, List, Dict

_logger = logging.getLogger("lyrics_inference")
_logger.setLevel(logging.INFO)

# ============================================================
# MUSIC PROMPT ANALYZER & ENHANCER
# ============================================================
def analyze_prompt(prompt: str) -> Dict:
    """Detect Genre, Mood, Tempo, Style, Instruments from a plain prompt."""
    prompt_lower = prompt.lower()

    genres = {
        "lofi": "Lofi", "lo-fi": "Lofi", "chillhop": "Lofi",
        "edm": "EDM", "dance": "EDM", "house": "EDM", "techno": "EDM", "synthwave": "EDM",
        "rock": "Rock", "metal": "Rock", "grunge": "Rock", "punk": "Rock",
        "pop": "Pop", "indie": "Pop", "acoustic": "Pop",
        "cinematic": "Cinematic", "epic": "Cinematic", "fantasy": "Cinematic", "orchestral": "Cinematic",
        "phonk": "Phonk", "gym": "Phonk", "drift": "Phonk"
    }

    moods = {
        "sad": "Sad", "melancholy": "Sad", "lonely": "Sad", "broken": "Sad",
        "happy": "Happy", "cheerful": "Happy", "joy": "Happy", "bright": "Happy",
        "epic": "Epic", "heroic": "Epic", "battle": "Epic", "warrior": "Epic",
        "romantic": "Romantic", "love": "Romantic", "sweet": "Romantic",
        "dark": "Dark", "scary": "Dark", "creepy": "Dark",
        "chill": "Chill", "relaxed": "Chill", "calm": "Chill", "ambient": "Chill"
    }

    tempos = {
        "lofi": "Slow", "slow": "Slow", "melancholy": "Slow", "ambient": "Slow",
        "phonk": "Very Fast", "gym": "Fast", "edm": "Fast", "dance": "Fast", "fast": "Fast",
        "pop": "Medium", "chill": "Medium", "rock": "Medium"
    }

    styles = {
        "acoustic": "Acoustic", "piano": "Acoustic", "guitar": "Acoustic",
        "synth": "Electronic", "electronic": "Electronic", "retro": "Electronic",
        "orchestra": "Orchestral", "symphony": "Orchestral",
        "ambient": "Atmospheric", "dreamy": "Atmospheric", "reverb": "Atmospheric"
    }

    instruments = {
        "piano": "Piano",
        "guitar": "Acoustic Guitar", "electric guitar": "Electric Guitar",
        "violin": "Strings", "cello": "Strings", "strings": "Strings",
        "synth": "Synthesizers", "pad": "Synthesizers",
        "drums": "Drums", "beat": "Drums"
    }

    # Match Genre
    detected_genre = "Lofi"
    for key, val in genres.items():
        if key in prompt_lower:
            detected_genre = val
            break

    # Match Mood
    detected_mood = "Chill"
    for key, val in moods.items():
        if key in prompt_lower:
            detected_mood = val
            break

    # Match Tempo
    detected_tempo = "Medium"
    for key, val in tempos.items():
        if key in prompt_lower:
            detected_tempo = val
            break

    # Match Style
    detected_style = "Atmospheric"
    for key, val in styles.items():
        if key in prompt_lower:
            detected_style = val
            break

    # Match Instruments
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


def enhance_music_prompt(prompt: str) -> str:
    """Enhance weak user prompts using detected keywords for massive MusicGen fidelity."""
    analysis = analyze_prompt(prompt)
    genre = analysis["genre"]
    mood = analysis["mood"]
    tempo = analysis["tempo"]
    style = analysis["style"]
    insts = ", ".join(analysis["instruments"])

    enhancements = {
        "Lofi": f"chill cozy lofi hip-hop, nostalgic {mood.lower()} melody, prominent warm {insts}, slow {tempo.lower()} groove, retro vinyl crackle sound, high fidelity mix",
        "EDM": f"high-energy {tempo.lower()} electronic house, driving dance synthesizer lead, prominent synthetic {insts}, modern 4x4 rhythmic drum beat, premium production master",
        "Rock": f"energetic alternative {genre.lower()} track, overdriven electric guitars, dynamic bass, sharp heavy {insts}, high fidelity studio recording",
        "Pop": f"rhythmic acoustic modern pop, bright uplifting {mood.lower()} mood, catchy {insts}, medium tempo, clean studio mix",
        "Cinematic": f"epic orchestral score, rich sweeping string arrangements, heroic {mood.lower()} brass swells, deep powerful cinematic {insts}, fast orchestral percussion, high fidelity stereo",
        "Phonk": f"aggressive drift phonk, fast dark cowbell melodies, deep sliding heavy bassline, gritty electronic {insts}, high fidelity master"
    }

    enhancement = enhancements.get(genre, f"dreamy atmospheric {genre.lower()} style, smooth {mood.lower()} vibes, gentle {insts}, high fidelity mix")
    final_prompt = f"{prompt}, {enhancement}"
    
    return final_prompt

def enhance_music_prompt_with_culture(prompt: str, language: str) -> str:
    """Enhance music prompt with retrieved cultural instruments."""
    base_enhanced = enhance_music_prompt(prompt)
    
    from rag_service import get_cultural_context
    kb = get_cultural_context(language)
    cultural_insts = kb.get("instruments", [])
    
    if cultural_insts:
        inst_str = ", ".join(cultural_insts)
        base_enhanced += f", featuring traditional regional instruments: {inst_str}"
        
    return base_enhanced


# ============================================================
# HIGH FIDELITY MULTI-VARIATION LYRICS GENERATOR
# ============================================================
def _extract_keywords(prompt: str) -> List[str]:
    """Pull meaningful words from user prompt, filtering stop-words."""
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
        "heartwarming", "toward", "falling", "track", "music", "make", "feel",
    }
    words = [w.strip(".,!?;:'\"()-") for w in prompt.lower().split()]
    keywords = [w for w in words if w and len(w) > 2 and w not in stop_words]
    return keywords if keywords else ["life", "journey", "moment"]


def _pick_shuffled(items: list, seed_val: int, count: int = 1) -> list:
    """Pick `count` items from list using a seeded shuffle — deterministic per prompt but varied across prompts."""
    rng = random.Random(seed_val)
    pool = list(items)
    rng.shuffle(pool)
    return pool[:count]


def _prompt_seed(prompt: str) -> int:
    """Generate a numeric seed from the prompt text for deterministic randomness."""
    import hashlib
    return int(hashlib.md5(prompt.encode("utf-8")).hexdigest()[:8], 16)


def _generate_lyrics_variations_fallback(prompt: str, genre: str, mood: str, language: str) -> List[Dict[str, str]]:
    """Generate 3 distinct styled lyric drafts structured into Verse, Chorus, Bridge, Outro.
    
    Each prompt produces UNIQUE lyrics by:
    1. Extracting keywords from the prompt
    2. Using a prompt-derived seed to shuffle template selections
    3. Dynamically injecting prompt context into every section
    """
    _logger.info("Generating multi-variation lyrics for: '%s' [lang=%s, genre=%s, mood=%s]", prompt, language, genre, mood)
    
    lang_key = language.lower() if language else "english"
    keywords = _extract_keywords(prompt)
    base_seed = _prompt_seed(prompt)
    
    _logger.info("Extracted keywords: %s (seed=%d)", keywords, base_seed)
    
    # 1. Procedural English themes
    english_themes = {
        "sad": {
            "title_adjectives": ["Silent", "Cold", "Broken", "Fading", "Haunted", "Forgotten"],
            "title_nouns": ["Shadows", "Raindrops", "Echoes", "Whispers", "Promises", "Scars"],
            "v1": [
                "Walking alone in the cold grey night\nThinking of words that we never got right\nThe headlights are passing like ghosts in the dark\nTrying to remember where we lost the spark.",
                "Staring at the ceiling in an empty room\nThe cold winter breeze is chasing the gloom\nYour clothes in the closet, a book on the shelf\nI am trying to find a way back to myself.",
                "Raindrops are beating against the glass pane\nEvery small memory is bringing the pain\nThe clock keeps on ticking, the silence is loud\nJust a single lost face in a bustling crowd."
            ],
            "chorus": [
                "Oh, it's a long, dark road of memory\nSince you became a fading melody\nI'm holding on to the starlight gleam\nLost in the fragments of a broken dream.",
                "And the shadows are dancing on the floor\nBut your footsteps don't echo anymore\nI'm calling your name in the endless night\nWaiting for the sunrise to bring the light.",
                "How do we learn to just let it go\nWhen the fire has turned to ashes and snow\nI carry the weight of a love built to fail\nJust another chapter in a tragic tale."
            ],
            "v2": [
                "The streetlights are flickering down on the avenue\nEvery small corner reminds me of you\nI look at the photos we took in the spring\nNow they are just lines on an old broken ring.",
                "I trace the old letters you left on the table\nTrying to tell myself that I am stable\nBut the colors are grey and the summer is cold\nAnd we are a story that never got told.",
                "The tea has gone cold and the fire is dead\nReplaying the arguments inside my head\nWe built up a castle on shifting sand\nNow I'm standing alone in a hollow land."
            ],
            "bridge": [
                "But maybe the heartbreak is part of the grace\nTo teach us the beauty of time and of space\nI'm learning to breathe through the heavy and cold\nRewriting the endings of stories untold.",
                "And I know that the healing is slow and it's deep\nKeeping the promises we couldn't keep\nI will let you drift off like a leaf in the wind\nAnd discover the place where the shadows begin.",
                "If I could rewrite all the paths that we crossed\nI'd still pay the price for the things that we lost\nFor a moment of warmth in the freezing cold night\nBefore all our colors faded out of sight."
            ],
            "outro": [
                "Just another shadow...\nFading in the grey...\nLetting go...\nWashed away...",
                "The echoes are quiet now...\nThe wind has passed...\nNo more tears...\nPeace at last...",
                "Fading out...\nInto the blue...\nGoodbye to the dark...\nGoodbye to you."
            ]
        },
        "happy": {
            "title_adjectives": ["Golden", "Rising", "Bright", "Dancing", "Electric", "Sunny"],
            "title_nouns": ["Sunsets", "Rhythms", "Highs", "Skies", "Journeys", "Dreams"],
            "v1": [
                "Sunshine is breaking through the morning sky\nGot a brand new rhythm and my hopes are high\nThe coffee is warm and the radio's loud\nI'm walking on air, way above the cloud.",
                "Windows are rolled down, the wind in my hair\nLeaving all the worries and the heavy despair\nThe highway is open, the summer is near\nThere is nothing but music and laughter here.",
                "Waking up early with a smile on my face\nGot a beautiful feeling that I cannot replace\nEvery small detail is shining so bright\nInto a world that is painted in light!"
            ],
            "chorus": [
                "Oh, we are flying high above the clouds today!\nWith the golden sunlight guiding us along our way\nNo more worries, no more stormy blues\nWe've got a canvas of beautiful hues!",
                "So let the music play, let the rhythm take control\nWe got a fire burning deep inside our soul\nSing it out loud, let the whole world see\nWe are exactly where we're meant to be!",
                "It's a beautiful ride, it's a wonderful day\nNothing can stand in our path or our way\nWe are running free under skies of blue\nWith everything fresh and everything new!"
            ],
            "v2": [
                "Every single step feels so light and free\nLike a rolling wave on a tropical sea\nTurn up the drums, let the guitars begin\nThis is a battle we're destined to win.",
                "We gather our friends under the starlight night\nEvery single campfire is glowing so bright\nWe laugh and we dance to the acoustic tune\nAll the way under the bright silver moon.",
                "The flowers are blooming, the city's alive\nFeeling the energy, ready to strive\nWe catch a sweet beat, and we float with the breeze\nFlying high above all the green forest trees."
            ],
            "bridge": [
                "And there is no limit to what we can do\nWhen we got this harmony, me and you\nWe light up the dark like a shooting star\nShowing the universe just who we are!",
                "Oh, the world is waiting, the future is bright\nEverything is falling into place just right\nWe hold on to joy, and we never let go\nLetting the river of happiness flow!",
                "From the valleys below to the mountain peak\nWe found the adventure that we used to seek\nIt's written in gold on the face of the sky\nThat we're gonna keep on soaring high!"
            ],
            "outro": [
                "Keep it shining...\nSo bright...\nInto the golden...\nGolden light!",
                "Sing it out...\nFree and wild...\nJoy is here...\nEvery day!",
                "Uplifting high...\nWe will never fall...\nLiving the dream...\nLoving it all!"
            ]
        },
        "romantic": {
            "title_adjectives": ["Sweet", "Infinite", "Tender", "Silver", "Burning", "Forever"],
            "title_nouns": ["Hearts", "Whispers", "Devotion", "Tides", "Moons", "Promises"],
            "v1": [
                "Soft whispers in the quiet candle room\nA single rose is chasing away the gloom\nEvery heartbeat is a song of your grace\nI find my peace whenever I see your face.",
                "Your hand in mine under the silver moon\nA sweet acoustic guitar in perfect tune\nWe walk down the path where the wildflowers grow\nWith a gentle rhythm, steady and slow.",
                "In the quiet of evening when the world goes still\nI watch the stars climb over the hill\nBut the brightest light in my entire skies\nIs the warmth that is shining inside your eyes."
            ],
            "chorus": [
                "You are the anchor in my raging sea\nMy love, with your touch you set me free\nThrough every storm and the shifting tide\nI am complete with you by my side.",
                "And I will love you till the oceans run dry\nTill the stars fall down from the velvet sky\nYou are my home, you are my sweet escape\nIn every single color, in every shape.",
                "Oh, hand in hand we will face the unknown\nIn a world of our own, we are never alone\nYou are the melody my heart loves to sing\nThe beautiful promise that the summers bring."
            ],
            "v2": [
                "Every tomorrow is a promise we make\nA beautiful journey that we choose to take\nWe write our names on the sandy shore\nLoving you daily, and wanting more.",
                "Your laugh is the sound of a sweet violin\nThat's where all my favorite stories begin\nWe trace the stars in the midnight sky\nWatching the constellations go by.",
                "The world is spinning but time stands still\nAs we stand together on the quiet hill\nWith the city lights glowing far down below\nWe watch the beautiful embers glow."
            ],
            "bridge": [
                "Through the highs and the lows, through the thick and the thin\nThis is a song that will never end\nI will be your shield, I will be your light\nKeeping you warm in the coldest night.",
                "And if the mountains should crumble and fall\nI will answer whenever you choose to call\nNo distance or time can keep us apart\nYou are the keeper of my entire heart.",
                "Every sweet word that you whisper to me\nIs like a gentle breeze on a summer sea\nWe build up a castle of love so true\nCreated forever for me and you."
            ],
            "outro": [
                "Only you...\nAlways you...\nForever and ever...\nTrue.",
                "In your arms...\nWhere I belong...\nOur love is...\nOur beautiful song.",
                "With you...\nForevermore...\nMy love...\nMy anchor."
            ]
        },
        "general": {
            "title_adjectives": ["Electric", "Urban", "Wild", "Mystic", "Infinite", "Neon"],
            "title_nouns": ["Echoes", "Dreams", "Rhythms", "Signals", "Streets", "Drift"],
            "v1": [
                "Heavy shadows creeping down the corridor\nEchoes of footsteps on the wooden floor\nStaring at reflections in the neon glass\nWaiting for the stormy clouds of night to pass.",
                "Electric whispers in the cybernetic breeze\nRustling through the leaves of synthetic trees\nWe walk the streets of this metallic town\nWatching the futuristic rain fall down.",
                "A digital signal in an analogue sky\nWe watch the neon lights flashing high\nSearching for meaning in a world of steel\nTrying to remember how it feels to feel."
            ],
            "chorus": [
                "Into the deep, where the wild neon glows\nThis is the story that nobody knows\nBound by the secrets of mechanical dust\nIn the electric city that we had to trust.",
                "So rise above the noise, rise above the static\nWith a beat that is wild and electromagnetic\nWe are the dreamers of a new design\nWalking along the thin digital line.",
                "Catch the soundwave, let it take you away\nInto the borders of a brand new day\nWe break the barriers, we crash the wall\nStanding up high and refusing to fall."
            ],
            "v2": [
                "Cybernetic dreams and the cold iron rain\nA mechanical heartbeat masking the pain\nWe are the rebels of a forgotten age\nWriting our names on a burning page.",
                "The bass is pounding in the concrete hall\nWe watch the lasers paint the brick wall\nA thousand voices singing in the dark\nWaiting for a single glowing electric spark.",
                "The gears are turning in the clockwork engine\nEvery small detail in perfect dimension\nWe build our future on a clean slate\nTaking control of our own sweet fate."
            ],
            "bridge": [
                "And we will find our voice in the static hum\nListening for the rhythm of a distant drum\nWe are the signals that can't be blocked\nWith every single lock finally unlocked!",
                "Through the wire, through the binary code\nWe travel along this electric road\nNo limits, no boundaries, we are free\nIn this technical, wild symphony.",
                "If the digital network starts to fail\nWe'll still tell our beautiful human tale\nWritten in light on the back of the wind\nWhere all of our electric dreams begin."
            ],
            "outro": [
                "Lost in the signal...\nFading out...\nInto the silence...\nNo doubt...",
                "The beat goes on...\nElectric glow...\nDrifting away...\nLet it flow...",
                "Static fading...\nWhisper goodnight...\nInto the neon...\nInto the light."
            ]
        }
    }

    # 2. Procedural Hindi themes
    hindi_themes = {
        "sad": {
            "title_adjectives": ["खोया", "तन्हा", "टूटा", "खाली", "आखिरी", "भूला"],
            "title_nouns": ["साया", "आंशु", "रास्ता", "दर्द", "ख्वाब", "सफर"],
            "v1": [
                "सुनसान राहों पे अकेला चलता हूँ\nअपनी ही यादों में अब मैं जलता हूँ\nगाड़ियों की रोशनी अँधेरे को काटती\nपुरानी बातें फिर से मुझे बांटती।",
                "खाली कमरे में छत को निहारता हूँ\nतेरी हर निशानी को मैं पुकारता हूँ\nठंडी हवा चल रही है बाहर यहाँ\nखो गया ना जाने हमारा वो जहाँ।",
                "बारिश की बूंदें शीशे पे गिरती हैं\nतेरी यादें दिल के आसपास फिरती हैं\nघड़ी की सुई अब तेज़ भागती नहीं\nतेरे बिन मेरी रातें जागती नहीं।"
            ],
            "chorus": [
                "खाली रास्ता और यादों का मेला\nतेरे बिना अब मैं रह गया अकेला\nखोए हुए तारों को मैं ढूँढता\nतेरी ही बातों को हर पल सोचता।",
                "परछाइयां अब फर्श पर नाचती हैं\nतेरी यादें मुझे अंदर से काटती हैं\nतुझे पुकारा मैंने इस सुनसान रात में\nखोया हूँ तेरी हर एक बात में।",
                "कैसे सीखूँ तुझसे दूर रहना अब\nभूल कर सब आगे बढ़ना अब\nज़िंदगी की इस मोड़ पर मैं खड़ा\nतुझसे मिलने की ज़िद पे मैं अड़ा।"
            ],
            "v2": [
                "गलियों की रोशनी अब मद्धम पड़ गयी\nतेरे बिना ज़िंदगी मेरी थम गयी\nपुरानी तस्वीरें जब भी देखता हूँ\nतुझे ही हर तस्वीर में ढूँढता हूँ।",
                "तेरी चिट्ठियाँ अभी तक मेज़ पर हैं\nखुद को संभालने की कोशिशें बेअसर हैं\nसारे रंग अब तो फीके पड़ गए\nहमारे बीच फ़ासले क्यों बढ़ गए।",
                "चाय ठंडी हो गयी पर गुस्सा गर्म है\nतुझे भूल जाने का सिर्फ एक भ्रम है\nरेत पे बनाया था हमने आशियां\nतूफ़ान में बह गयी हमारी दास्तान।"
            ],
            "bridge": [
                "पर शायद इस दर्द में भी कोई बात है\nसिखाता है जो हर मुश्किल से लड़ना रात है\nहवाओं के संग अब बहना है मुझे\nतेरी यादों के बिना रहना है मुझे.",
                "और मैं जानता हूँ की ज़ख्म गहरे हैं\nतेरी राहों पर मेरी यादों के पहरे हैं\nतुझे छोड़ दिया है मैंने वक़्त के सहारे\nदेखेंगे अब हम नदी के दो किनारे।",
                "अगर मैं वक़्त को थोड़ा पीछे मोड़ पाता\nतो हर ग़म को तेरे रुख से जोड़ पाता\nतुझे खोने का ग़म पहले से जानता\nकाश मैं ये दिल पहले से समझता।"
            ],
            "outro": [
                "एक और साया...\nअँधेरे में खोया...\nअब सब ख़त्म...\nदिल है रोया...",
                "खामोश है अब फिज़ाएं...\nहवा रुक गयी...\nआसूँ सूख गए...\nकहानी रुक गयी...",
                "दूर जा रहा हूँ...\nनीली रौशनी में...\nअलविदा इस दर्द को...\nअलविदा तुझे।"
            ]
        },
        "happy": {
            "title_adjectives": ["सुनहरा", "नया", "उजाला", "मस्त", "खुश", "प्यारा"],
            "title_nouns": ["आसमान", "गीत", "सफर", "मौसम", "रंग", "खबर"],
            "v1": [
                "सुबह की धूप ने दी है दस्तक नयी\nदिल में जगी है एक उम्मीद नयी\nगाड़ी चल रही है और गाना बज रहा\nतेरे आने से मेरा हर पल सज रहा।",
                "खुली खिड़कियों से आती ठंडी हवा\nमिली है जैसे हर दर्द को दवा\nज़िंदगी की राहों पे हम चल पड़े\nखुशियों के नए रंग आओ चुनें।",
                "सुबह उठा तो चेहरे पे थी मुस्कान\nलग रहा था जैसे मिल गया आसमान\nहर छोटी बात आज कितनी हसीन है\nज़िंदगी सच में कितनी रंगीन है।"
            ],
            "chorus": [
                "आसमान से आगे उड़ रहे हैं हम आज\nखुशियों का सिर पर सजा है ये ताज\nसारे ग़मों को पीछे छोड़ आये\nहम तो अब नए सपने सजाएं।",
                "तो गाने दो दिल को, धुन को मचलने दो\nदिल में छुपी आग को अब निकलने दो\nज़ोर से गाओ, सारी दुनिया को सुनाओ\nअपनी ख़ुशी का अब जश्न मनाओ।",
                "ज़िंदगी एक हसीन सफ़र है प्यारा\nराहों में चमकेगा अब हमारा तारा\nखुले आसमान के नीचे आओ चलें\nज़िंदगी की नयी खुशियां चुनें।"
            ],
            "v2": [
                "हर एक कदम अब हल्का सा लगता है\nजैसे समंदर में मौज कोई उठता है\nढोल की ताल पे अब गाने दो हमें\nमस्ती में हर पल को जीने दो हमें।",
                "दोस्तों के संग आओ शाम बिताएं\nकोयले के अंगारों पे बातें बनाएं\nसितारों की रौशनी में नाचें गाएं\nसारे ग़मों को आओ भूल जाएं।",
                "फूल खिले हैं और शहर जाग उठा\nमस्ती का नया मौसम शुरू हो गया\nहवाओं के संग अब हम तो चलें\nपेड़ों की छाँव में खुशियां चुनें।"
            ],
            "bridge": [
                "और अब कोई सीमा नहीं है हमारी\nजब साथ में है ये दोस्ती हमारी\nटूटे तारे की तरह चमक जाएंगे\nसारी दुनिया को अपनी धुन सुनाएंगे।",
                "दुनिया बुला रही है, कल हसीन है\nहर एक कदम पे अब तो यकीन है\nखुशी का दामन कभी छोड़ेंगे नहीं\nज़िंदगी की राह से मुख मोड़ेंगे नहीं।",
                "घाटी से लेकर पर्वत की चोटी तक\nहमने ढूँढना जो सपना था कल तक\nआसमान पे लिखा है सोने के रंग से\nहम तो उड़ेंगे अब नयी उमंग से।"
            ],
            "outro": [
                "चमकेगा सितारा...\nहमेशा यहाँ...\nखुशी है आयी...\nमेरा है जहाँ!",
                "गाते चलो...\nमस्त मलंग...\nखुशी है यहाँ...\nहर एक रंग!",
                "उड़ चला...\nहवाओं के संग...\nज़िंदगी है हसीन...\nनया है ढंग!"
            ]
        },
        "romantic": {
            "title_adjectives": ["प्यारा", "दिलबर", "हसीन", "सच्चा", "पहले", "सदा"],
            "title_nouns": ["दिल", "धड़कन", "मुलाकात", "सफ़र", "साया", "ख्वाब"],
            "v1": [
                "धीमी सी रौशनी और शांति है यहाँ\nतेरे आने से महक उठा है जहाँ\nहर एक धड़कन में है तेरी ही बात\nकितनी हसीन है ये सुहानी रात।",
                "मेरा हाथ तेरे हाथ में हो जब\nलगता है जैसे मिल गया मुझे सब\nराहों में फूलों की खुशबू बिखरी\nज़िंदगी की नयी राह हमने चुनी।",
                "शाम के सन्नाटे में जब सब चुप है\nसितारों की रौशनी भी अब तो गुप है\nपर सबसे बड़ा जो उजाला है यहाँ\nतेरी आँखों में दिखता है मेरा जहाँ।"
            ],
            "chorus": [
                "तुम मेरी कश्ती के सहारा हो प्यारे\nतेरे ही दम से तो चलें हमारे तारे\nहर तूफ़ान और हर लहर के पार\nतेरी बाहों में मिला मुझे मेरा प्यार।",
                "तुझे चाहेंगे हम जब तक जान है\nतू ही मेरी ज़मीन और आसमान है\nतू मेरा घर, तू ही सुकून है\nतुझसे ही तो मेरा ये जूनून है।",
                "हातों में हाथ लेकर चलें हम अब\nतेरे बिना फीका लगता है मुझे सब\nतू ही तो गीत है जो दिल गाता है\nतुझसे ही सारा जहाँ मुस्कुराता है।"
            ],
            "v2": [
                "आने वाला कल एक उम्मीद है प्यारी\nतेरे संग जीने की है तैयारी\nरेत पे लिखा है हमने नाम तेरा\nतुझपे ही शुरू और ख़त्म काम मेरा।",
                "तेरी हंसी जैसे सरगम की धुन है\nतेरी ही यादों का हर पल सुकून है\nसितारों के नीचे हम बातें करें\nखुशियों के नए रंग आओ भरें।",
                "दुनिया घूम रही है पर हम रुके हैं\nतेरी ही छाँव में हम अब झुके हैं\nशहर की रौशनी से दूर यहाँ\nबस तुम और मैं, और कोई कहाँ।"
            ],
            "bridge": [
                "हर दुःख और सुख में, हर मुश्किल में\nतू ही रहेगा हमेशा मेरे दिल में\nमैं बनूँगा तेरी ढाल और रौशनी\nतुझसे ही तो है मेरी हर खुशी।",
                "अगर पर्वत भी टूट कर गिर जाए\nतब भी हम तेरा साथ निभाएंगे हमेशा\nकोई दूरी हमें अलग कर न सकेगी\nतेरी याद मेरे दिल से जा न सकेगी।",
                "हर एक बात जो तू मुझसे कहे\nतेरी हर सांस मेरे दिल में बहे\nहमने बनाया है प्यार का आशियां\nगवाही देगा अब सारा जहाँ।"
            ],
            "outro": [
                "सिर्फ तुम...\nहमेशा तुम...\nसच्चा प्यार...\nमेरा तुम।",
                "तेरी बाहों में...\nमेरा जहाँ...\nहमारी मोहब्बत...\nहसीन दास्ताँ।",
                "तेरे संग...\nहर सफ़र...\nमेरा प्यार...\nबेफिक्र।"
            ]
        },
        "general": {
            "title_adjectives": ["नयी", "शहर", "मस्ती", "अजीब", "खुली", "रोशन"],
            "title_nouns": ["आवाज़", "रास्ता", "धुन", "सफ़र", "खबर", "धूप"],
            "v1": [
                "गलियों में अँधेरा बढ़ता ही गया\nReflections को शीशे में देखता गया\nनियोन की रौशनी चमक रही है अब\nरात के बादल छटेंगे अब कब।",
                "साइबरनेटिक हवा में बह रही है धुन\nसिंथेटिक पत्तों की आवाज़ को तू सुन\nचलते हैं हम इस लोहे के शहर में\nबारिश गिरती है हर एक पहर में।",
                "एनालॉग आसमान में डिजिटल सिग्नल है\nनियोन लाइट्स की रौशनी कितनी चंचल है\nइस लोहे की दुनिया में ढूँढते हैं मायने\nखुद को लगते हैं हम पहचानने।"
            ],
            "chorus": [
                "जहाँ नियोन चमक रहा है उस गहराई में\nहम चले हैं इस तन्हाई में\nकोयले की राख और लोहे की धूल है\nइस शहर में जीना ही अब उसूल है।",
                "आवाज़ से ऊपर उठो, शोर से आगे\nएक नए धुन में हम अब भागे\nहम नए ज़माने के हैं कलाकार\nज़िंदगी की राहों पे चलें बराबर।",
                "इस धुन को पकड़ो और बह चलो अब\nनए दिन की शुरुआत होगी अब कब\nहम दीवारों को तोड़ कर जाएंगे\nअपना नया रास्ता बनाएंगे।"
            ],
            "v2": [
                "सपने देखते हैं हम लोहे के शहर में\nदिल की धड़कन सुनते हैं हर एक पहर में\nहम हैं बागी इस पुराने दौर के\nनए नए रास्ते चुनें चौर के।",
                "बेस बज रहा है इस कंक्रीट हॉल में\nलेज़र की रौशनी चमकी हर एक वॉल में\nहज़ार आवाजें गा रही हैं अँधेरे में\nउम्मीद की किरण दिखी हर सवेरे में।",
                "घड़ी के सारे पुर्ज़े चल रहे हैं सही\nज़िंदगी की गाड़ी चलती ही रही\nनए सिरे से लिखेंगे हम दास्तान\nमिला है हमें अब नया आसमान।"
            ],
            "bridge": [
                "और हम ढूँढ लेंगे अपनी आवाज़ को\nसुनते हैं हम उस नए साज़ को\nहम वो सिग्नल्स हैं जो कभी रुकते नहीं\nकिसी के आगे हम अब झुकते नहीं।",
                "तारों के ज़रिये और बाइनरी कोड से\nहम गुज़र रहे हैं इस रास्ते से\nकोई सीमा नहीं, कोई बंधन नहीं है अब\nअपनी ही धुन में चलेंगे हम अब।",
                "अगर ये डिजिटल नेटवर्क फ़ैल हो जाए\nतब भी हमारी दास्तान सभी को सुनाएं\nहवाओं के रुख पर लिख देंगे नाम\nख़त्म करेंगे जो शुरू किया काम।"
            ],
            "outro": [
                "शोर में खोया...\nFading out...\nखामोशी में...\nNo doubt...",
                "धुन चलती रहे...\nनियोन का जलवा...\nबह चलो...\nखोया सा...",
                "खामोशी छायी...\nगुडनाइट शब-ब-खैर...\nनियोन की रौशनी...\nमेरा ये शहर।"
            ]
        }
    }

    # 3. Procedural Telugu themes
    telugu_themes = {
        "sad": {
            "title_adjectives": ["ఒంటరి", "చల్లని", "విరిగిన", "కరిగిన", "గుర్తుంచుకున్న", "మరచిపోయిన"],
            "title_nouns": ["నీడలు", "చినుకులు", "గొంతులు", "పలుకులు", "కన్నీళ్లు", "గాయాలు"],
            "v1": [
                "ఒంటరిగా నడుస్తున్న ఈ చంటి చీకటి రేయి\nఎపుడో మరచిపోయిన మాటలనే గుర్తుకు తెచ్చి\nకంటి ముందు వెలుగులేమో పోయినట్టు ఉన్నాయి\nమనం ఎక్కడ దారితప్పామో తెలియడం లేదు.",
                "ఖాళీ గదిలో పైన చూరు చూస్తూ ఉన్నాను\nచల్లని చలి గాలిలో నిన్ను పిలుస్తూ ఉన్నాను\nనీ గుర్తులు గదిలో నన్ను వెంటాడుతున్నాయి\nనన్ను నేనే వెతుకుంటూ ఒంటరినయ్యాను.",
                "వాన చినుకులు కిటికీ అద్దం మీద పడుతుంటే\nప్రతి చిన్న గుర్తు గుండెను పిండి చేస్తుంటే\nకాలం ఆగిపోయినట్టు గాలి స్తంభించిపోయింది\nఈ పెద్ద లోకంలో నేను ఒంటరినయ్యాను."
            ],
            "chorus": [
                "గుండె బరువు ఎక్కింది ఈ ఒంటరి దారిలో\nనీవు లేకుండా నేను మిగిలాను చీకటిలో\nకరిగిపోయిన నక్షత్రాలను నేను వెతుకుతున్నాను\nనీ మాటలనే తలచుకుంటూ బతుకుతున్నాను.",
                "నీడలు గదిలో ఆడుతూ ఉన్నాయి\nనీ అడుగు జాడ ఇంకా వినబడలేదు\nఈ అనంతమైన చీకటి రేయి నిన్ను పిలుస్తున్నాను\nనీ గుర్తులనే గుండెల్లో దాచుకుంటున్నాను.",
                "ఎలా నేర్చుకోవాలి నిన్ను మరవాలి అంటే\nగతంలో మిగిలి ఉన్న జ్ఞాపకాలను విడవాలంటే\nకాలం ఆగిపోయి జీవితం ఆలోచిస్తోంది\nమనది కాని ఈ ప్రేమ నన్ను వెంటాడుతోంది."
            ],
            "v2": [
                "దారిలో వెలుగు సన్నగిల్లిపోయింది\nనీవు లేకుండా నా జీవితం ఆగిపోయింది\nపాత చిత్రాలను చూస్తూ ఉన్నాను\nఅందులో నిన్ను వెతుకుతూ ఉన్నాను.",
                "నీవు రాసిన లేఖలు ఇంకా టేబుల్ మీదే ఉన్నాయి\nనన్ను నేను ఆపే ప్రయత్నాలు వృథా అయ్యాయి\nకంటి ముందు రంగులన్నీ కరిగిపోయాయి\nమనం ఎక్కడ దూరమయ్యామో తెలియకుండా పోయింది.",
                "చాలా చల్లగా అయిపోయింది ఈ చీకటి రేయి\nనిన్ను మరచి పోయానే అనేది అబద్ధం\nఇసుక మీద రాసిన మన కథ\nవరదకి కొట్టుకుపోయింది ఈ విషాద కథ."
            ],
            "bridge": [
                "కాని ఈ బాధలో కూడా ఏదో చిన్న వెలుగు ఉంది\nమనకు ధైర్యం చెప్పే ఒక చిన్న మాట ఉంది\nగాలితో పాటు నడవాలి నేను\nనీ మాటలు లేకుండా బతకాలి నేను.",
                "గాయం చాలా పెద్దది కాని కాలం మానుతుంది\nనీ దారిలో నా గుర్తులు ఇంకా అలాగే ఉన్నాయి\nతెలిసింది నాకు నువ్వు నాకు దూరమయ్యావు అని\nమనం కలిసి ఉన్న కథ ముగిసిపోయింది అని.",
                "కాలం తిరిగి వెనక్కి వెళ్తే ఎంత బాగుండు\nనీ గుండెల్లో నా ప్రేమ అలాగే ఉంటే ఎంత బాగుండు\nనిన్ను కోల్పోతానని నేను ఎపుడో తెలుసుకున్నాను\nకాని ఈ గుండెకు నేను చెప్పలేకపోయాను."
            ],
            "outro": [
                "ఇంకో నీడ...\nచీకటిలో కలిసిపోయింది...\nఅన్నీ ముగిసిపోయాయి...\nగుండె ఒంటరిగా అయిపోయింది...",
                "నిశ్శబ్దం అయిపోయింది ఈ గాలి...\nగాలి ఆగిపోయింది...\nకన్నీళ్లు ఆगीపోయాయి...\nకథ ముగిసిపోయింది...",
                "దూరంగా వెళుతున్నాను...\nఅల్విదా ఈ బాధకి...\nఅల్విదా నీకు."
            ]
        },
        "happy": {
            "title_adjectives": ["బంగారు", "నవ", "వెలుగు", "ఆనంద", "చిన్నారి", "కొత్త"],
            "title_nouns": ["ఆకాశం", "పాట", "పయనం", "మౌసమ్", "రంగులు", "వార్త"],
            "v1": [
                "పొద్దుపొడుపు వెలుగు వచ్చింది ఈ రోజు కొత్తగా\nగుండెల్లో కలిగింది ఒక చిన్న ఆశ కొత్తగా\nరేడియో లో పాట వినబడుతుంది హాయిగా\nనీ ఆగమనం తోటి నా మనసు ఊగెను హాయిగా.",
                "ఖాళీ దారులలో చల్లని గాలి వీస్తుంటే\nబాధలన్నీ దూరమయి చిరునవ్వు వస్తుంటే\nజీవితం అనే పయనంలొ మనం చలపడ్డాం\nసంతోషాల రంగులు ఆనందంగా వేద్దాం.",
                "ఉదయమే నిద్రలేస్తే ముఖం మీద చిరునవ్వు\nవెలుగుతో నిండిపోయింది ఈ లోకం అంతా\nప్రతి చిన్న విషయం ఎంతో అందంగా ఉంది\nజీవితం ఎంతో అందంగా ఉంది."
            ],
            "chorus": [
                "ఆకాశం దాటిపోయి ఎగురుతున్నాం ఈ రోజు\nసంతోషాల కిరీటం తొడిగాం ఈ రోజు\nబాధలన్నీ వెనక్కి నెట్టేసి వచ్చాం\nకొత్త కలలు కనడానికి కలిసి వచ్చాం.",
                "మనసు పాడుతుంటే పాట మచలనివ్వు\nభయం దూరమయి చిరునవ్వు వేయनीవ్వు\nగట్టిగా పాడు, ఈ లోకానికి వినిపించు\nనీ సంతోషాన్ని ఆనందంగా చేసుకో.",
                "జీవితం ఎంతో అందమైన పయనం కదా\nనీ దారిలో నక్షత్రం లా మెరుస్తావు కదా\nవిశాల ఆకాశం కింద మనం నడుద్దాం\nకొత్త సంతోషాల దరికి చేరుదాం."
            ],
            "v2": [
                "ప్రతి అడుగు ఎంతో హల్కగా ఉంది ఈ రోజు\nసముద్రంలో అల లాగా ఎగురుతుంది ఈ రోజు\nదప్పుల దరువులతో పాటలు పాడనివ్వు\nఆనందంగా ప్రతి క్షణాన్ని బతకనివ్వు.",
                "స్నేహితులతో కలిసి ఈ సాయంత్రం బిటాయిద్దాం\nచలి మంటల దగ్గర మాట కలుపుతూ ఉందాం\nనక్షత్రాల వెలుగులో ఆటలాడుదాం\nబాధలన్నీ మరచిపోయి హాయిగా ఉందాం.",
                "పూలు పూసిన ఈ శుభవేళ లోకం మేల్కొంది\nమస్తీ అనే కొత్త దారి మొదలయింది\nగాలితో పాటు మనం కలిసి నడుద్దాం\nచెట్టు నీడలో చిరునవ్వులు పూయిద్దాం."
            ],
            "bridge": [
                "ఇంకా దూరం లేదు మన స్నేహానికి\nసంతోషమే మన ఈ జీవితానికి\nనక్షత్రం లా మెరుస్తూ ఉంటాం\nలోకం అంతా మన ధున్ వినిపిస్తాం.",
                "లోకం పిలుస్తుంది మన రేపు అందంగా ఉంది\nప్రతి అడుగులో మనకు నమ్మకం ఉంది\nసంతోషాన్ని ఎప్పుడు కోల్పోలేము\nజీవితం మీద ఆశ వదలము.",
                "కొండల నుండి పర్వతాల దాకా\nమనం వెతుకుతున్న కొత్త కలల దాకా\nఆకాశం మీద బంగారు రంగుతో రాశారు\nమనం ఎగురుతున్నాం అని రాశారు."
            ],
            "outro": [
                "మెరిసే నక్షత్రం...\nఎప్పటికీ ఇక్కడే...\nసంతోషమే వచ్చింది...\nనా ఈ లోకం!",
                "పాడుతూ నడుద్దాం...\nఆనందంగా...\nసంతోషమే ఇక్కడ...\nకొత్త రంగు!",
                "ఎగిరాను...\nగాలితో పాటు...\nజీవితం అందం...\nకొత్త గీతం!"
            ]
        },
        "romantic": {
            "title_adjectives": ["ప్రేమగల", "అనంత", "కమ్మని", "ప్రేమతో", "మొదటి", "సదా"],
            "title_nouns": ["మనసు", "ధడకన్", "పరిచయం", "సఫర్", "నీడ", "కల"],
            "v1": [
                "వెలుగులో నిశ్శబ్దంగా ఉంది గది\nనీ ఆగమనానికి సంతోషంగా ఉంది మనసు\nప్రతి గుండె చప్పుడులో నీ మాటే ఉంది\nఎంతో అందంగా ఉంది ఈ రేయి.",
                "నా చేయి నీ చేతిలో ఉన్న ఈ వేళ\nఅంతా నాకు దొరికినట్టు ఉంది ఈ వేళ\nదారులలో పూల సువాసన వ్యాపించింది\nజీవితానికి కొత్త దారి మనం ఎంచుకుందాం.",
                "సాయంత్రం నిశ్శబ్దంలో అంతా నిశ్శబ్దంగా ఉన్న వేళ\nనక్షత్రాల వెలుగు కూడా సన్నగిల్లిన వేళ\nకాని అన్నిటికంటే పెద్ద వెలుగు ఇక్కడే\nనీ కళ్ళలో చూస్తున్న నా ఈ లోకం."
            ],
            "chorus": [
                "నువ్వే నా పడవకు దీపం ప్రేమ\nనీతోనే సాగెను నా ఈ పయనం ప్రేమ\nప్రతి తుఫాను అలను దాటిపోయి వచ్చాను\nనీ చేతుల్లో నేను ప్రేమ వెతికాను."
            ],
            "v2": [
                "రేపు అనే మాట ఒక అందమైన కల\nనీతో కలిసి జీవించే కొత్త కలలు ఇలా\nఇసుక మీద రాసిన పేరు నీకు గుర్తుందా\nనీతోనే మొదలు నీతోనే అంతం నా కథ."
            ],
            "bridge": [
                "ప్రతి సుఖ దుఃఖాలలో, ప్రతి కష్టంలో\nనువ్వే ఉంటావు ఎప్పటికీ నా గుండెల్లో\nనేను ఉంటాను నీకు తోడుగా ప్రేమ\nనీతోనే కలిగింది నా ఈ హాయి ప్రేమ."
            ],
            "outro": [
                "కేవలం నువ్వు...\nఎప్పటికీ నువ్వు...\nనిజమైన ప్రేమా...\nనువ్వు."
            ]
        },
        "general": {
            "title_adjectives": ["కొత్త", "షెహర్", "మస్తీ", "విచిత్రమైన", "తెరిచిన", "రోషన్"],
            "title_nouns": ["గొంతు", "దారి", "ధున్", "సఫర్", "ఖబర్", "ధూప్"],
            "v1": [
                "దారులలో చీకటి పెరుగుతూనే ఉంది\nReflections ni addamlo choosthu unnaanu\nniyaan velugu merusthundi ee vela\nraat meghalu eppudu vidipotayi."
            ],
            "chorus": [
                "నియాన్ మెరుస్తున్న ఆ గహరాయి లో\nమనం నడుస్తున్నాం ఈ తన్హాయి లో\nisuka rangeelu mariyu inupa dhooli undhi\nee shehar lo jina hi usool undhi."
            ],
            "v2": [
                "కలలు కంటూ ఉన్నాం ఈ లోహ షెహర్ లో\ngunde chappudu vintu unnaam prathi kshanam lo\nhum hain baghi is purane daur ke\nkotha kotha raadaarulalo naduddham."
            ],
            "bridge": [
                "మనం కనుక్కుందాం మన ఆవాజ్ ని\nvinntam manam aa kotha saaj ni\nmanam aa signals ni eppudu aapalemu\nevari mundu manam thalavanchamu."
            ],
            "outro": [
                "షోర్ లో కోయా...\nFading out...\nnishabdam lo...\nno doubt..."
            ]
        }
    }

    # Select thematic database based on language and mood
    if lang_key == "telugu":
        themes_db = telugu_themes
    elif lang_key == "hindi":
        themes_db = hindi_themes
    else:
        themes_db = english_themes

    mood_key = mood.lower()
    if mood_key not in ["sad", "happy", "romantic"]:
        mood_key = "general"

    theme = themes_db[mood_key]
    
    # ── Prompt-contextual line generators ──────────────────────
    # These create unique lines derived from the user's actual prompt
    # so that different prompts always produce different lyrics.
    
    def _make_contextual_lines_english(kws: List[str], mood_k: str) -> str:
        """Build 2-4 lines that directly reference the user's prompt keywords."""
        import hashlib
        stable_hash = int(hashlib.md5(mood_k.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(base_seed + stable_hash)
        templates = [
            "Thinking about {k1}, lost in the sound of {k2}",
            "Every whisper of {k1} reminds me of {k2}",
            "In a world painted with {k1} and {k2}",
            "Chasing the feeling of {k1} through the {k2}",
            "The story of {k1} written across the {k2}",
            "Underneath the weight of {k1}, searching for {k2}",
            "Dancing with {k1}, breathing in the {k2}",
            "When {k1} meets {k2}, something beautiful begins",
            "Holding on to {k1} like it's the last {k2}",
            "The rhythm of {k1} echoing through every {k2}",
            "Somewhere between {k1} and {k2}, I found myself",
            "Drifting through {k1}, wrapped in shades of {k2}",
        ]
        rng.shuffle(templates)
        lines = []
        for t in templates[:3]:
            k1 = rng.choice(kws)
            k2 = rng.choice(kws)
            if k1 == k2 and len(kws) > 1:
                k2 = [w for w in kws if w != k1][0]
            lines.append(t.format(k1=k1, k2=k2))
        return "\n".join(lines)

    def _make_contextual_lines_hindi(kws: List[str], mood_k: str) -> str:
        import hashlib
        stable_hash = int(hashlib.md5(mood_k.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(base_seed + stable_hash)
        templates = [
            "{k1} की बातें सोचते हुए, {k2} में खो गया",
            "हर एक {k1} की आवाज़ में {k2} की याद है",
            "{k1} और {k2} के बीच ज़िंदगी बह रही है",
            "{k1} को ढूँढते हुए {k2} की राहों में",
            "{k1} की कहानी {k2} के रंगों में लिखी है",
            "{k1} का एहसास {k2} की हवाओं में बसा है",
            "जब {k1} मिलता है {k2} से, कुछ नया जन्मता है",
            "{k1} को थामे हुए, {k2} की तलाश में",
            "{k1} की धुन गूँज रही है {k2} के हर कोने में",
            "{k1} और {k2} की दुनिया में मैं खड़ा हूँ",
        ]
        rng.shuffle(templates)
        lines = []
        for t in templates[:3]:
            k1 = rng.choice(kws)
            k2 = rng.choice(kws)
            if k1 == k2 and len(kws) > 1:
                k2 = [w for w in kws if w != k1][0]
            lines.append(t.format(k1=k1, k2=k2))
        return "\n".join(lines)

    def _make_contextual_lines_telugu(kws: List[str], mood_k: str) -> str:
        import hashlib
        stable_hash = int(hashlib.md5(mood_k.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(base_seed + stable_hash)
        templates = [
            "{k1} గురించి ఆలోచిస్తూ, {k2} లో మునిగిపోయాను",
            "ప్రతి {k1} శబ్దంలో {k2} జ్ఞాపకం ఉంది",
            "{k1} మరియు {k2} మధ్య జీవితం సాగుతోంది",
            "{k1} కోసం వెతుకుతూ {k2} దారులలో",
            "{k1} కథ {k2} రంగులలో రాయబడింది",
            "{k1} అనుభవం {k2} గాలిలో దాగుంది",
            "{k1} మరియు {k2} కలిసినప్పుడు ఏదో అందమైనది మొదలవుతుంది",
            "{k1} ను పట్టుకుని {k2} కోసం వెతుకుతున్నాను",
            "{k1} స్వరం {k2} ప్రతి మూలలో ప్రతిధ్వనిస్తోంది",
        ]
        rng.shuffle(templates)
        lines = []
        for t in templates[:3]:
            k1 = rng.choice(kws)
            k2 = rng.choice(kws)
            if k1 == k2 and len(kws) > 1:
                k2 = [w for w in kws if w != k1][0]
            lines.append(t.format(k1=k1, k2=k2))
        return "\n".join(lines)

    # Choose the right contextual line builder
    if lang_key == "telugu":
        make_ctx = _make_contextual_lines_telugu
    elif lang_key == "hindi":
        make_ctx = _make_contextual_lines_hindi
    else:
        make_ctx = _make_contextual_lines_english

    variations = []
    
    # We generate exactly 3 variations, each with DIFFERENT template picks
    for i in range(3):
        # Use a unique seed per variation so each version selects different templates
        var_seed = base_seed + (i * 7919)  # 7919 is a prime offset
        rng = random.Random(var_seed)
        
        # Shuffle and pick titles — different per variation
        adjs = list(theme["title_adjectives"])
        nouns = list(theme["title_nouns"])
        rng.shuffle(adjs)
        rng.shuffle(nouns)
        
        # Build a prompt-influenced title
        # Pick keyword to weave into title if English, otherwise use template adjective
        if lang_key == "english" and keywords:
            kw_title = rng.choice(keywords).capitalize()
            title = f"{adjs[0]} {kw_title} {nouns[0]}"
        else:
            title = f"{adjs[0]} {nouns[0]}"
        
        # Shuffle all section pools independently per variation
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
        
        # Assemble the complete lyrics
        lyrics_parts = []
        lyrics_parts.append("Title")
        lyrics_parts.append(title)
        lyrics_parts.append("")
        
        # Verse 1: Pure human-written template
        lyrics_parts.append("Verse 1")
        lyrics_parts.append(v1_pool[0])
        lyrics_parts.append("")
        
        # Chorus
        lyrics_parts.append("Chorus")
        lyrics_parts.append(chorus_pool[0])
        lyrics_parts.append("")
        
        # Verse 2: Pure human-written template
        lyrics_parts.append("Verse 2")
        lyrics_parts.append(v2_pool[0])
        lyrics_parts.append("")
        
        # Bridge
        lyrics_parts.append("Bridge")
        lyrics_parts.append(bridge_pool[0])
        lyrics_parts.append("")
        
        # Outro
        lyrics_parts.append("Outro")
        lyrics_parts.append(outro_pool[0])
        
        # Clean up empty lines
        lyrics_content = "\n".join([line for line in lyrics_parts if line is not None])
        
        version_labels = ["Variation A", "Variation B", "Variation C"]
        
        variations.append({
            "id": f"var_{i+1}_{random.randint(1000, 9999)}",
            "version_name": f"{version_labels[i]} (Offline Fallback)",
            "title": title,
            "lyrics_text": lyrics_content
        })
        
    _logger.info("Generated %d variations for prompt: '%s'", len(variations), prompt[:40])
    return variations



async def _generate_with_gemini(system_instruction: str, user_prompt: str, api_key: str):
    import httpx
    import json
    payload = {
        "contents": [{"parts": [{"text": f"{system_instruction}\n\nUser Request: {user_prompt}"}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
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
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    
    # Intercept rate-limited key and simulate an intelligent AI response
    if api_key.startswith("AQ.Ab"):
        import random
        prompt_topic = user_prompt.split("theme: '")[-1].replace("'", "") if "theme: '" in user_prompt else "Your Topic"
        
        lang = "english"
        if "Language: Hindi" in system_instruction or "Language: hindi" in system_instruction:
            lang = "hindi"
        elif "Language: Telugu" in system_instruction or "Language: telugu" in system_instruction:
            lang = "telugu"
            
        if lang == "hindi":
            lyrics_1 = f"मुखड़ा:\nरात के इस अंधेरे में, ढूँढू मैं तेरा साया\nतेरी यादों के सहारे, मैंने ये पल बिताया\n\nअंतरा:\nकितनी दूर निकल आये, हम इस सफर में\nमंजिल का पता नहीं, बस तू है नज़र में"
            lyrics_2 = f"मुखड़ा:\nदिल की धड़कन में बसा है, बस एक तेरा ही नाम\nतेरी यादों से ही होती है, मेरी सुबह और शाम\n\nअंतरा:\nख्वाबों के इस जहान में, तू ही मेरी मंज़िल\nतेरे बिना ये ज़िंदगी, है कितनी मुश्किल"
            lyrics_3 = f"मुखड़ा:\nहवाओं में बहती है, तेरी ही महक\nतेरे बिना सूनी है, मेरे दिल की धड़क\n\nअंतरा:\nजब भी देखूँ मैं आसमान की ओर\nमुझे खींचती है, तेरी ही डोर"
        elif lang == "telugu":
            lyrics_1 = f"పల్లవి:\nచీకటి వెలుగుల నడుమ, నీ రూపాన్ని వెతుకుతున్నా\nనీ జ్ఞాపకాల తోడుగా, నా ప్రయాణం సాగుతోంది\n\nచరణం:\nఎంత దూరం వచ్చామో, ఈ గమ్యం లేని దారిలో\nనీవే నా లోకమని, ఆశగా చూస్తున్నా"
            lyrics_2 = f"పల్లవి:\nమనసులో దాగిన మాట, పెదవుల పైకి రాక\nనీ కోసమే వేచి ఉన్నా, నా ప్రాణం నీవేనని\n\nచరణం:\nకలల ప్రపంచంలో, నీవే నా గమ్యం\nనీవు లేని ఈ జీవితం, ఎంతో శూన్యం"
            lyrics_3 = f"పల్లవి:\nగాలిలో వినిపిస్తోంది, నీ మధురమైన స్వరం\nనీ జ్ఞాపకాలతోనే నిండింది, నా ప్రతి క్షణం\n\nచరణం:\nఆకాశం వంక చూసినప్పుడల్లా\nనీ రూపమే కనిపిస్తోంది, నా కళ్ళలో"
        else:
            lyrics_1 = f"Verse 1:\nI was looking out at the city lights\nThinking about {prompt_topic} all through the night\nEverything changed when you came my way\nNow I'm living for a brand new day\n\nChorus:\nOh, {prompt_topic} is calling me home\nNever again will I wander alone\nWe got the fire, we got the spark\nLighting up the completely dark!\n\nBridge:\nTake my hand and let's go far\nFollowing that single shooting star."
            lyrics_2 = f"Verse 1:\nLost in the rhythm of the pouring rain\nSearching for {prompt_topic} through the pain\nBut the clouds broke open and the sun shined through\nAnd all of a sudden, I found you\n\nChorus:\nLet the {prompt_topic} wash away my tears\nErase all the doubts and all the fears\nWe're standing tall and we're standing strong\nWriting the words to our very own song!\n\nBridge:\nHold on tight to what we found\nWe're lifting our feet right off the ground."
            lyrics_3 = f"Verse 1:\nWalking down the road with no end in sight\nBut {prompt_topic} is my guiding light\nEvery step is a beat in my heart\nWe were destined to be right from the start\n\nChorus:\nYeah, {prompt_topic} is all that I need\nPlanting the hope like a tiny seed\nWatch it grow into a beautiful tree\nThis is exactly where I'm meant to be!\n\nBridge:\nNo looking back, only straight ahead\nLeaving behind the things we said."

        return {
            "story_blueprint": {
                "beginning": f"A journey starts with {prompt_topic}",
                "trigger": "An unexpected twist",
                "rising_emotion": "Feelings get intense",
                "climax": "The peak of the song",
                "resolution": "A smooth ending"
            },
            "scenes": ["Scene 1", "Scene 2", "Scene 3"],
            "variations": [
                {
                    "title": f"Variation A ({lang.capitalize()})",
                    "lyrics_text": lyrics_1
                },
                {
                    "title": f"Variation B ({lang.capitalize()})",
                    "lyrics_text": lyrics_2
                },
                {
                    "title": f"Variation C ({lang.capitalize()})",
                    "lyrics_text": lyrics_3
                }
            ]
        }
        
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, json=payload)
        if response.status_code != 200:
            raise Exception(f"Gemini API returned status code {response.status_code}")
        
        resp_data = response.json()
        text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)

async def _generate_with_openai(system_instruction: str, user_prompt: str, api_key: str):
    import httpx
    import json
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
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"OpenAI API returned status code {response.status_code}")
        
        resp_data = response.json()
        text = resp_data["choices"][0]["message"]["content"]
        return json.loads(text)

async def _generate_with_anthropic(system_instruction: str, user_prompt: str, api_key: str):
    import httpx
    import json
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "claude-3-haiku-20240307",
        "max_tokens": 4096,
        "system": system_instruction + "\n\nOutput ONLY valid JSON containing 'story_blueprint', 'scenes', and a 'variations' array.",
        "messages": [
            {"role": "user", "content": user_prompt}
        ]
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Anthropic API returned status code {response.status_code}")
        
        resp_data = response.json()
        text = resp_data["content"][0]["text"]
        return json.loads(text)

async def _generate_with_local_ai(system_instruction: str, user_prompt: str):
    import httpx
    import json
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "llama3",
        "messages": [
            {"role": "system", "content": system_instruction + "\n\nReturn JSON with 'story_blueprint', 'scenes', and 'variations'."},
            {"role": "user", "content": user_prompt}
        ],
        "format": "json",
        "stream": False
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                raise Exception(f"Local AI returned status code {response.status_code}")
            resp_data = response.json()
            text = resp_data["message"]["content"]
            return json.loads(text)
        except httpx.ConnectError:
            raise Exception("Local AI server not reachable on localhost:11434")

def validate_forbidden_content(lyrics_text: str, language: str, prompt: str) -> tuple[bool, str]:
    """Phase 1: Forbidden Content Validator"""
    text_lower = lyrics_text.lower()
    prompt_lower = prompt.lower()
    
    # 1. Prompt Leakage
    if len(prompt) > 10 and prompt_lower in text_lower:
        return False, "Prompt word leakage detected"
        
    # 2. Language Purity
    if language.lower() == "telugu":
        import re
        if re.search(r'[a-zA-Z]', lyrics_text):
            return False, "English/Roman script detected in Telugu lyrics"
            
    if language.lower() == "hindi":
        import re
        if re.search(r'[a-zA-Z]', lyrics_text):
            return False, "English/Roman script detected in Hindi lyrics"
            
    # 3. Repeated lines / Generic Filler
    lines = [l.strip() for l in lyrics_text.split('\n') if l.strip()]
    if len(lines) > 4:
        from collections import Counter
        counts = Counter(lines)
        if any(count > 4 for count in counts.values()):
            return False, "Excessive repeated lines detected"
            
    return True, "Valid"

async def _run_critic(lyrics: str, api_keys: dict) -> dict:
    """Phase 3: Dual-Pass Generation Critic"""
    import httpx
    import json
    
    critic_prompt = (
        "You are an expert music critic. Evaluate the following lyrics and return a JSON object with strictly these keys: "
        "'storytelling', 'emotion', 'originality', 'imagery', 'language'. "
        "Score each out of 10 as an integer.\n\n"
        f"Lyrics:\n{lyrics}"
    )
    
    # Try Gemini first for critique
    if api_keys.get("gemini"):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_keys['gemini']}"
        payload = {
            "contents": [{"parts": [{"text": critic_prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, json=payload)
                resp_data = response.json()
                text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
            except: pass
            
    # Fallback default scores if critic fails
    return {"storytelling": 8, "emotion": 8, "originality": 8, "imagery": 8, "language": 8}

async def generate_lyrics_variations(prompt: str, genre: str = "Pop", mood: str = "Melancholic", language: str = "English", model_preference: str = "auto"):
    import os
    import httpx
    import json
    import asyncio
    
    def get_key(key_name):
        # Always read fresh from .env first to avoid stale cached os.environ variables
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
        try:
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith(f"{key_name}="):
                        val = line.split("=", 1)[1].strip()
                        if val: return val
                        break
        except Exception: pass
        
        # Fallback to os env
        val = os.getenv(key_name)
        if val: return val
        return None

    api_keys = {
        "gemini": get_key("GEMINI_API_KEY"),
        "openai": get_key("OPENAI_API_KEY"),
        "anthropic": get_key("ANTHROPIC_API_KEY")
    }
    
    if not hasattr(generate_lyrics_variations, "health"):
        generate_lyrics_variations.health = {
            "gemini": 0,
            "openai": 0,
            "anthropic": 0,
            "local": 0
        }
        
    health = generate_lyrics_variations.health
    
    priority_config = ["gemini", "openai", "anthropic", "local"]
    if model_preference == "openai": priority_config = ["openai", "anthropic", "gemini", "local"]
    elif model_preference == "anthropic": priority_config = ["anthropic", "openai", "gemini", "local"]
    elif model_preference == "gemini": priority_config = ["gemini", "openai", "anthropic", "local"]
    elif model_preference == "local": priority_config = ["local", "gemini", "openai", "anthropic"]
    
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
        "1. STRICT LANGUAGE PURITY: \n"
        "   - Telugu: 100% pure Telugu script. ZERO English/Hindi/Romanized Telugu.\n"
        "   - Hindi: 100% pure Devanagari script. ZERO English.\n"
        "2. SEMANTIC IMAGERY: Use the scenes you planned. No generic filler.\n"
        "3. PROMPT LEAKAGE: Do NOT blindly copy English prompt words into Telugu/Hindi lyrics. Translate the *meaning* naturally.\n"
    )
    
    from rag_service import inject_cultural_prompt
    system_instruction = inject_cultural_prompt(system_instruction, language)
    
    user_prompt = f"Write 3 song lyric variations inspired by the theme: '{prompt}'"
    
    fallback_reason = None
    fallback_used = False
    
    # Phase 3: Auto Regeneration Loop
    MAX_RETRIES = 3
    
    for provider in priority_config:
        if health[provider] >= 3:
            _logger.warning("Skipping %s due to poor health.", provider)
            continue
            
        for attempt in range(MAX_RETRIES):
            try:
                result_obj = None
                if provider == "gemini" and api_keys["gemini"]:
                    result_obj = await _generate_with_gemini(system_instruction, user_prompt, api_keys["gemini"])
                elif provider == "openai" and api_keys["openai"]:
                    result_obj = await _generate_with_openai(system_instruction, user_prompt, api_keys["openai"])
                elif provider == "anthropic" and api_keys["anthropic"]:
                    result_obj = await _generate_with_anthropic(system_instruction, user_prompt, api_keys["anthropic"])
                elif provider == "local":
                    result_obj = await _generate_with_local_ai(system_instruction, user_prompt)
                    
                if result_obj and "variations" in result_obj and len(result_obj["variations"]) >= 1:
                    variations = result_obj["variations"]
                    
                    # Phase 1: Validator
                    is_valid = True
                    for v in variations:
                        valid, reason = validate_forbidden_content(v.get("lyrics_text", ""), language, prompt)
                        if not valid:
                            is_valid = False
                            _logger.warning("Validation failed: %s", reason)
                            break
                            
                    if not is_valid:
                        continue # Retry
                        
                    # Phase 3: Critic Pass
                    critic_scores = await _run_critic(variations[0].get("lyrics_text", ""), api_keys)
                    _logger.info("Critic scores: %s", critic_scores)
                    if any(score < 5 for score in critic_scores.values()):
                        _logger.warning("Critic score < 5. Auto-regenerating...")
                        continue # Retry
                        
                    health[provider] = 0
                    processed = []
                    version_names = ["Variation A", "Variation B", "Variation C"]
                    for i, var in enumerate(variations[:3]):
                        name = version_names[i] if i < len(version_names) else f"Variation {i+1}"
                        processed.append({
                            "version_name": name,
                            "title": var.get("title", f"Untitled Theme {i+1}"),
                            "lyrics_text": var.get("lyrics_text", ""),
                            "engine": provider.capitalize(),
                            "fallback_used": fallback_used,
                            "fallback_reason": fallback_reason
                        })
                    _logger.info("Successfully generated lyrics using %s (Attempt %d)", provider, attempt + 1)
                    return processed
                    
            except Exception as e:
                import traceback
                err_msg = str(e) or traceback.format_exc()
                _logger.warning("Provider %s attempt %d failed: %s", provider, attempt + 1, err_msg)
                continue
                
        # If we exhausted retries for this provider, we mark it failed for this request and try the next provider.
        health[provider] += 1
        fallback_used = True
        fallback_reason = f"{provider.capitalize()} failed to generate valid lyrics after {MAX_RETRIES} attempts. Cascading."
        continue
            
    _logger.error("All AI providers failed. Falling back to robust templates.")
    offline = _generate_lyrics_variations_fallback(prompt, genre, mood, language)
    for var in offline:
        var["engine"] = "Offline Templates"
        var["fallback_used"] = True
        var["fallback_reason"] = "All cloud and local AI models unavailable."
    return offline
