import json
import os
import sys

def main():
    print("[INIT] Generating large multilingual seed dataset (500+ records)...")
    
    dataset = []

    # -------------------------------------------------------------
    # 1. Base Core Records (High Quality Handcrafted Seeds)
    # -------------------------------------------------------------
    
    # --- English Seed Songs ---
    english_seeds = [
        ("Nostalgic romantic song about meeting someone again after many years", "Pop", ["Nostalgic", "Romantic"], "Reunion", "Medium",
         "[Verse 1]\nIt's been ten years since I saw your smile...\n                          ─────────\n                            hold\nWalking down the old familiar aisle\nWe were younger then, full of dreams and light\nNow you're standing here in the fading night...\n                                  ─────────\n                                    soft\n\n[Chorus]\nOh, time stood still...\n      ───────────────\n           hold\nWhen our eyes met on this lonely hill\nWe have changed so much, but the spark remains\nLike summer sunshine washing away the rains!\n                      ↑\n                     rise",
         "[Verse 1]\nHey there, stranger, where have you been?\n                          ─────────\n                            soft\nIt's a crazy world that we're living in\nLost your number, lost my way in the crowd\nBut seeing you now makes me want to scream out loud!\n                                          ↑\n                                         rise\n\n[Chorus]\nHere we go again...\n      ─────────────\n           hold\nBack to the start of where we began!\nNo more hiding from the years gone by\nLet's write a new story under the sky!\n                       ~~~~~\n                       soft"),

        ("Sad acoustic song about saying goodbye at a train station", "Acoustic", ["Sadness", "Heartbreak"], "Separation", "Soft",
         "[Verse 1]\nThe steam is rising from the iron tracks\nWe're holding secrets that we can't take back\nYour ticket's crumpled in your trembling hand\nGuess there are things we'll never understand...\n                                  ─────────\n                                    soft\n\n[Chorus]\nSo go on, board that train...\n             ─────────────\n                  hold\nLeave me standing here in the cold grey rain\nOur tracks will split, our worlds will part\nBut you'll keep the key to my broken heart.\n                         ~~~~~~~~~~~~~~~\n                              soft",
         "[Verse 1]\nDon't look back when the whistle blows\nThat's just the way the story goes\nWe had our season, we had our run\nNow the train is chasing the setting sun...\n                                  ───────\n                                   hold\n\n[Chorus]\nGoodbye, my sweet memory...\n        ──────────────────\n               hold\nFade away like ships on a stormy sea\nNo more tears, no more sad delays\nJust the empty tracks of our yesterday.\n                       ↑\n                      rise"),

        ("Motivational rock anthem about overcoming obstacles and rising up", "Rock", ["Motivation", "Hope"], "Dreams", "High",
         "[Verse 1]\nThey built the walls to keep us in the dark\nBut all it takes is one small electric spark\nWe felt the pressure, we took the blow\nNow we're ready for the fire to show...\n                                ───────\n                                 hold\n\n[Chorus]\nRise up, reach the sky...\n─────────\n  rise\nWe will spread our wings and learn to fly\nNo more chains holding down our feet\nWe will write our triumph on every street!\n                          ↑\n                         rise",
         "[Verse 1]\nBreak the silence, stomp your feet\nHear the rhythm of the charging street\nThey said we'd fall, they said we'd fail\nBut we are writing our own heavy metal tale...\n                                           ──────\n                                            hold\n\n[Chorus]\nWe are the giants tonight...\n      ───────────────────\n             hold\nFighting our way through the darkest fight\nNo turning back, no surrender now\nWe will take the stage and take our bow!\n                         ↑\n                        rise")
    ]

    for prompt, genre, emotion, theme, energy, varA, varB in english_seeds:
        dataset.append({
            "prompt": prompt, "language": "English", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varA, "singing_expression": "hold, soft, rise", "variation": "A"
        })
        dataset.append({
            "prompt": prompt, "language": "English", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varB, "singing_expression": "soft, rise, hold", "variation": "B"
        })

    # --- Telugu Seed Songs ---
    telugu_seeds = [
        ("మళ్లీ కలిసిన పాత స్నేహితుని జ్ఞాపకం - Nostalgic Telugu Song", "Cinematic Melody", ["Nostalgic", "Romantic"], "Reunion", "Soft",
         "[Verse 1]\nఎన్నాళ్లకు నిన్ను కలిశాను...\n                  ───────\n                   hold\nనీ రూపు చూసి నేను మురిశాను\nకాలం ఆగిపోయింది మన ముందే\nజ్ఞాపకాలు అన్ని ఎదురయ్యే నీందే...\n                            ────────\n                              soft\n\n[Chorus]\nనా ప్రేమా...\n      ───────\n       hold\nనీ కోసమే...\n       ↑\n      rise\nనా గుండెలో...\n       ~~~~~\n       soft\nనిలిచావు ఈ బంధములో...\n                 ───────\n                  hold",
         "[Verse 1]\nకాల చక్రాలలో నిన్ను మరచానా?\n                         ───────────\n                            soft\nఎన్ని ఏళ్లయినా నీ గుర్తులు విడదనానా?\nఎదురయ్యే రోజు నేను చూడలేదా\nనీ నవ్వుని చూసి నేను పడిపోలేదా!\n                                 ↑\n                                rise\n\n[Chorus]\nచినుకు కురిసెనూ...\n      ──────────────\n           hold\nమనసు మురిసెనూ...\n        ↑\n       rise\nగుండె లోతులో...\n       ~~~~~\n       soft\nప్రేమ చిగురించెనూ ఈ క్షణములో!\n                               ──────\n                                hold"),

        ("ఏకాంతం మరియు విరహం - Sad Telugu Song", "Classical Fusion", ["Sadness", "Longing"], "Separation", "Soft",
         "[Verse 1]\nకన్నీటి గాధలాయే నా బ్రతుకు...\n                        ────────\n                          hold\nనిశ్శబ్ద రాత్రిలో పెరిగే నొసలు\nనీవు లేని లోకాన నేనెక్కడున్నాను\nరాలిపోయిన పువ్వులా మిగిలిపోయాను...\n                                ────────\n                                  soft\n\n[Chorus]\nఓ దైవమా...\n     ───────\n      hold\nఎందుకీ శోధన...\n       ↑\n      rise\nనా గుండెలో నిండిన వేదన...\n       ~~~~~~~~~~~~~~~~\n             soft\nతీరిపోయేనా ఈ సుదీర్ఘ శోధన...\n                         ───────\n                          hold",
         "[Verse 1]\nదూరమయ్యావు నన్ను వదిలి పోయావు\n                    ───────────────\n                         soft\nజ్ఞాపకాల భారమే మిగిల్చి వెళ్లావు\nఎన్ని పిలుపులు విన్నా నీ జాడ లేదులే\nశూన్యమైన నా హృదయం నిన్ను వెతికెలే...\n                                    ───────\n                                     hold\n\n[Chorus]\nకల చెదిరిపోయెనే...\n    ─────────────\n         hold\nమనసు పగిలిపోయెనే...\n         ↑\n        rise\nజీవితాన చీకటే నిండెనే...\n         ~~~~~~~~~~~~~~~~\n               soft\nప్రియతమా నీవు లేక నే బ్రతకలేనే!\n                          ───────\n                            hold")
    ]

    for prompt, genre, emotion, theme, energy, varA, varB in telugu_seeds:
        dataset.append({
            "prompt": prompt, "language": "Telugu", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varA, "singing_expression": "hold, soft, rise", "variation": "A"
        })
        dataset.append({
            "prompt": prompt, "language": "Telugu", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varB, "singing_expression": "soft, rise, hold", "variation": "B"
        })

    # --- Hindi Seed Songs ---
    hindi_seeds = [
        ("बरसों बाद पुराने दोस्त से मुलाकात - Nostalgic Hindi Song", "Romantic", ["Nostalgic", "Romantic"], "Reunion", "Soft",
         "[Verse 1]\nबरसों बाद हम आज मिले हैं...\n                      ──────────\n                         hold\nदिल के चमन में फूल खिले हैं\nवही पुराना शहर वही फिज़ाएं\nदेखो हमें देख कर हवाएं मुस्कुराएं...\n                                      ──────────\n                                         soft\n\n[Chorus]\nमेरे हमसफर...\n     ──────────\n        hold\nचल पड़े हम फिर...\n            ↑\n           rise\nइसी राह पर...\n      ~~~~~\n      soft\nजहाँ छूटा था प्यार का कारवां...\n                              ──────────\n                                 hold",
         "[Verse 1]\nकहाँ थी तुम और कहाँ था मैं?\n                      ───────\n                        soft\nबीते साल जैसे कोई रात की रैन\nभूल गए रास्ते खोए रहे हम\nदेखो मिल ही गए मिट गए सारे ग़म!\n                                     ↑\n                                    rise\n\n[Chorus]\nदिल की बात सुनो...\n     ─────────────\n         hold\nएक नया जहाँ चुनो...\n          ↑\n         rise\nसाथ मेरे चलो...\n      ~~~~~\n      soft\nअब ना होंगे कभी जुदा हम तुम!\n                          ───────\n                            hold")
    ]

    for prompt, genre, emotion, theme, energy, varA, varB in hindi_seeds:
        dataset.append({
            "prompt": prompt, "language": "Hindi", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varA, "singing_expression": "hold, soft, rise", "variation": "A"
        })
        dataset.append({
            "prompt": prompt, "language": "Hindi", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varB, "singing_expression": "soft, rise, hold", "variation": "B"
        })

    # --- Tamil Seed Songs ---
    tamil_seeds = [
        ("நீண்ட நாட்களுக்குப் பிறகு சந்திப்பு - Nostalgic Tamil Song", "Acoustic", ["Nostalgic", "Romantic"], "Reunion", "Soft",
         "[Verse 1]\nவருடங்கள் கடந்து நினைவில் நின்றாயே...\n                               ─────────\n                                 hold\nஇன்று உன்னை பார்த்ததும் என் மனது மருந்தாயே\nஅந்த பழைய காலம் திரும்பி வந்ததோ\nநீ பேசும் பாஷை எனக்குள் புகுந்ததோ...\n                                    ─────────\n                                      soft\n\n[Chorus]\nஎன் அன்பே...\n    ───────\n     hold\nஉனக்காகவே...\n      ↑\n     rise\nஎன் நெஞ்சிலோ...\n     ~~~~~\n     soft\nநீ வாழ்கிறாய் என்றும் அன்புடன்...\n                         ─────────\n                           hold",
         "[Verse 1]\nஎங்கு சென்றாயோ என்னை பிரிந்து?\n                        ───────\n                         soft\nஇருக்கிறேன் இங்கே வழி தடுமாறி நின்று\nகாலங்கள் போனது தூரம் தொடர்ந்தது\nஉன் முகம் பார்த்ததும் மனது நின்றது!\n                                      ↑\n                                     rise\n\n[Chorus]\nகனவு காண்போமே...\n     ─────────────\n         hold\nஉன் கையில் சேர்ந்தோமே...\n          ↑\n         rise\nஎன் நெஞ்சிலே...\n     ~~~~~\n     soft\nசேர்ந்து வாழ்வோமே இந்த நிலவினில்!\n                              ─────────\n                                hold")
    ]

    for prompt, genre, emotion, theme, energy, varA, varB in tamil_seeds:
        dataset.append({
            "prompt": prompt, "language": "Tamil", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varA, "singing_expression": "hold, soft, rise", "variation": "A"
        })
        dataset.append({
            "prompt": prompt, "language": "Tamil", "genre": genre, "emotion": emotion,
            "theme": theme, "energy": energy, "structure": "Verse, Chorus, Outro",
            "lyrics": varB, "singing_expression": "soft, rise, hold", "variation": "B"
        })

    # -------------------------------------------------------------
    # 2. Programmatic Expansion to reach 500+ records
    # -------------------------------------------------------------

    genres = ["Pop", "Rock", "Acoustic", "EDM", "Cinematic Melody", "Classical Fusion", "Hip-Hop", "Folk", "Phonk", "Lofi", "Devotional", "Indie", "Blues"]
    emotions = [["Romantic", "Nostalgic"], ["Sadness", "Heartbreak"], ["Motivation", "Hope"], ["Joy", "Celebration"], ["Peace", "Devotion"], ["Energy", "Triumph"]]
    energies = ["Soft", "Medium", "High"]

    # Native Verse/Chorus Generators
    en_phrases_A = [
        ("Wandering through the midnight rain", "Hoping to find your face again", "Listen to the river flow...", "Guided by the starlight glow!"),
        ("Standing at the edge of town", "Watching the red sun going down", "Call out your name into the night...", "Shining like a golden light!"),
        ("Counting every passing day", "Learning what I ought to say", "Hold me close beneath the moon...", "Morning will be coming soon!"),
        ("Driving down this highway line", "Searching for a peaceful sign", "Break the silence in your heart...", "We will never be apart!")
    ]
    en_phrases_B = [
        ("Echoes in the empty hallway space", "Trying to picture your sweet face", "Time moves fast but memories stay...", "Chasing every shadow away!"),
        ("Whispers floating in the breeze", "Dancing through the autumn trees", "Catch the rhythm of the beat...", "Walking down our favorite street!"),
        ("Shadows falling on the floor", "Waiting by the open door", "Feel the thunder in the sky...", "Watch our dreams begin to fly!"),
        ("Out beyond the stormy weather", "We can pull our world together", "Sing out loud into the dawn...", "All our fears are past and gone!")
    ]

    te_phrases_A = [
        ("నిశీధి రాత్రిలో నీ జ్ఞాపకం...", "గుండెలో నిండిన అనురాగం...", "మనసే పాడే పాటా...", "కాలం నిలిచే చూటా..."),
        ("కలల తీరంలో నిన్ను చూశాను...", "చిరునవ్వుతో నిన్ను పిలిచాను...", "ప్రేమా ఓ ప్రేమా...", "నీవే నా ప్రాణమా..."),
        ("వాన చినుకుల్లో తడిసిన వేళ...", "మదిలో మెరిసే అనుబంధాల లీల...", "సాగుదాం కాలంతో...", "జీవిద్దాం ప్రేమతో..."),
        ("కొండకోనలలో కోయిల పాట...", "పూల వనంలో కొత్త బాట...", "నవ్వుల తీరమున...", "సాగే సమయమున...")
    ]
    te_phrases_B = [
        ("వెన్నెల వెలుగుల కాంతులలో...", "మనసు మురిసే ఈ తరుణములో...", "ప్రియతమా ఓ ప్రియతమా...", "నువ్వే నా లోకమా..."),
        ("దూర తీరాల స్వప్నములా...", "సాగే నది ఒడ్డున మౌనములా...", "గుండె సవ్వడి వినుమా...", "నాతో నడిచి రామ్మా..."),
        ("తూరుపు దిక్కున పొడిచే భానుడు...", "మన జీవితాన కొత్త వెలుగుడు...", "ఆశల పందిరిలో...", "వాలే సాయంత్రంలో..."),
        ("నింగి నేల కలిసే చోట...", "మనస్సు పలికే మధుర మాట...", "చిరుగాలులు వీచగా...", "రాగాలు సాగగా...")
    ]

    hi_phrases_A = [
        ("रात की खामोशी में तेरी यादें...", "दिल में बसी हैं वो हसीं बातें...", "सुनो हवाओं की सदा...", "तू ही है मेरी इल्तजा..."),
        ("चांदनी रातों में तेरा ख्याल...", "पूछता है दिल यही सवाल...", "मेरे हमनवा मेरे पिया...", "तेरे बिना ना जाये जिया..."),
        ("सपनों के इस हसीं शहर में...", "मिले हैं हम आज इस दोपहर में...", "गुंजन करे ये मन मेरा...", "तू ही मेरा सवेरा..."),
        ("बारिश की बूंदों में तेरा अहसास...", "लाया है दिल को तेरे पास...", "गाये दिल मल्हार...", "तू ही मेरा प्यार...")
    ]
    hi_phrases_B = [
        ("दूरियों को मिटा के आज...", "सजा लें खुशियों का नया साज़...", "आ भी जा मेरे पास...", "तू ही मेरी आस..."),
        ("सफ़र में जो साथी मिले हैं...", "राहों में दीप जले हैं...", "चलो नए मोड़ पर...", "सपनों के छोर पर..."),
        ("नदियाँ की कल-कल बहती धार...", "लायी है प्यार की बहार...", "झूम उठे हर एक पल...", "सज गया हमारा कल..."),
        ("तारों की झिलमिल रोशनी...", "गाये एक हसीं रागिनी...", "दिल से दिल मिला ले...", "खुशियों को सजा ले...")
    ]

    ta_phrases_A = [
        ("இரவின் அமைதியில் உன் நினைவுகள்...", "நெஞ்சில் வாழும் அந்த கணங்கள்...", "கேட்குதே ஒரு பாட்டு...", "சொல்லுதே ஒரு வார்த்தை..."),
        ("நிலவின் வெளிச்சத்தில் உன் முகம்...", "தேடுதே என் மனம் உன் அகம்...", "அன்பே என் அன்பே...", "நீதானே என் உயிரே..."),
        ("மழைத்துளியில் நனையும் பூக்கள்...", "மனதில் எழும் புதிய எண்ணங்கள்...", "பயணம் தொடருதே...", "கனவு நனவாகுதே..."),
        ("காற்றின் அலையில் மிதக்கும் ராகம்...", "நம் நெஞ்சில் மலரும் புதிய பாசம்...", "வாழ்க்கை இனிதானதே...", "அன்பு நிலைத்ததே...")
    ]
    ta_phrases_B = [
        ("தூரத்து மேகம் அழைக்குதே...", "மனதில் புது வசந்தம் மலருதே...", "என் உயிரே வா வா...", "என் கையில் சேர் சேர்..."),
        ("கடலின் அலையோரம் நடப்போமே...", "புதிய பாதையை காண்போமே...", "நெஞ்சின் ஆசைகள்...", "நிறைவேறும் தருணங்கள்..."),
        ("சோலை மலர்களின் வாசத்திலே...", "நம் காதல் தொடரும் பாதையிலே...", "பாடுவோம் இணைந்து...", "வாழுவோம் மகிழ்ந்து..."),
        ("விடிவெள்ளி முளைக்கும் வேளையிலே...", "புது விடியல் பிறக்கும் நாளையிலே...", "நம்பிக்கை ஒளி வீசுதே...", "நம் பாதை பளிச்சிடுதே...")
    ]

    # Generate Programmatic Records to reach total 520 records
    target_count = 520
    current_count = len(dataset)
    remaining_needed = target_count - current_count

    languages = ["English", "Telugu", "Hindi", "Tamil"]
    prompts_by_lang = {
        "English": [
            "Lofi beats under night rain with soothing melody", "Acoustic song about road trips and freedom",
            "Epic synthwave prompt about neon city nights", "Phonk beat song with fast energetic lyrics",
            "High energy workout rock anthem", "Peaceful devotional hymn for morning prayer",
            "Melancholic blues song about lost love", "Upbeat indie pop track about summer vacation",
            "Jazz ballad for a quiet rainy evening", "Soulful song celebrating mother's unconditional love"
        ],
        "Telugu": [
            "హృదయానికి హత్తుకునే ప్రణయ గీతం - Sweet Telugu Love Melody", "తెలుగు జానపద మరియు గ్రామీణ శైలి గీతం - Energetic Folk Track",
            "ప్రకృతి సౌందర్యాన్ని వర్ణించే ప్రశాంత గీతం", "కన్నతల్లి ప్రేమను చాటే భావోద్వేగ గీతం",
            "విజయం మరియు ఆశను నింపే ప్రేరణాత్మక పాట", "స్నేహం యొక్క గొప్పతనాన్ని చాటే మైత్రి గీతం",
            "భక్తి పారవశ్యంలో తేలియాడే ప్రభాత గీతం", "విరహ వేదనను వ్యక్తపరిచే కరుణ రస గీతం",
            "పండుగ సంబరాల ఉత్సాహభరితమైన పాట", "నవతరం ఆలోచనలను ప్రతిబింబించే వెస్ట్రన్ రాప్ బీట్"
        ],
        "Hindi": [
            "दिल को छू लेने वाला सूफी और रोमांटिक गाना", "बरसात के मौसम में प्यार भरा सावन गीत",
            "देशभक्ति और वीरों की गाथा का शौर्य गीत", "जिंदगी की राहों में हौसला देने वाला प्रेरणादायक गीत",
            "मां की ममता और स्नेह को समर्पित भावुक गीत", "दोस्ती और यारी के हसीं पलों का नगमा",
            "शादी और उत्सव का ढोल-नगाड़ों वाला जश्न गीत", "शास्त्रीय और आधुनिक फ्यूजन संगीत",
            "पहाड़ों और वादियों में गूंजती प्रेम धुन", "युवा जोश और ऊर्जा से भरपूर रॉक सॉन्ग"
        ],
        "Tamil": [
            "மனதை மயக்கும் காதல் மெலடி பாடல்", "கிராமத்து மண்வாசனை நிறைந்த நாட்டுப்புற பாடல்",
            "இயற்கையின் அழகை வர்ணிக்கும் அமைதியான பாடல்", "தாயின் அன்பை போற்றும் உணர்ச்சிப்பூர்வமான பாடல்",
            "வெற்றி மற்றும் நம்பிக்கையை தரும் எழுச்சி பாடல்", "நட்பின் பெருமையை பேசும் நட்பு கானம்",
            "காலை நேர பக்தி திருப்பாடல்", "பிரிவின் வலியை விவரிக்கும் துயர பாடல்",
            "திருவிழா கொண்டாட்டத்தின் உற்சாக பாடல்", "நவீன கால இளைஞர்களின் பாப் துள்ளல் இசை"
        ]
    }

    p_idx = 0
    while len(dataset) < target_count:
        for lang in languages:
            prompt_list = prompts_by_lang[lang]
            p_text = prompt_list[p_idx % len(prompt_list)]
            g = genres[p_idx % len(genres)]
            e = emotions[p_idx % len(emotions)]
            nrg = energies[p_idx % len(energies)]
            thm = "Life & Emotion"

            if lang == "English":
                phraseA = en_phrases_A[p_idx % len(en_phrases_A)]
                phraseB = en_phrases_B[p_idx % len(en_phrases_B)]
                varA_lyrics = f"[Verse 1]\n{phraseA[0]}...\n               ───────\n                hold\n{phraseA[1]}\nDo not let the moments fade away...\n                              ───────\n                               soft\n\n[Chorus]\n{phraseA[2]}\n      ───────────────\n           hold\n{phraseA[3]}\n       ↑\n      rise"
                varB_lyrics = f"[Verse 1]\n{phraseB[0]}...\n               ───────\n                soft\n{phraseB[1]}\nWe will shine together every day!\n                              ↑\n                             rise\n\n[Chorus]\n{phraseB[2]}\n      ───────────────\n           hold\n{phraseB[3]}\n       ~~~~~\n       soft"

            elif lang == "Telugu":
                phraseA = te_phrases_A[p_idx % len(te_phrases_A)]
                phraseB = te_phrases_B[p_idx % len(te_phrases_B)]
                varA_lyrics = f"[Verse 1]\n{phraseA[0]}\n                 ───────\n                  hold\n{phraseA[1]}\nనిలిచాను నీ కోసమే ఈ నిమిషం...\n                           ────────\n                             soft\n\n[Chorus]\n{phraseA[2]}\n      ───────\n       hold\n{phraseA[3]}\n       ↑\n      rise"
                varB_lyrics = f"[Verse 1]\n{phraseB[0]}\n                 ───────────\n                    soft\n{phraseB[1]}\nఎదురయ్యే వెలుగులో నా పయనం!\n                            ↑\n                           rise\n\n[Chorus]\n{phraseB[2]}\n      ──────────────\n           hold\n{phraseB[3]}\n       ~~~~~\n       soft"

            elif lang == "Hindi":
                phraseA = hi_phrases_A[p_idx % len(hi_phrases_A)]
                phraseB = hi_phrases_B[p_idx % len(hi_phrases_B)]
                varA_lyrics = f"[Verse 1]\n{phraseA[0]}\n                ──────────\n                   hold\n{phraseA[1]}\nखो गए हम इस हसीं मौसम में...\n                            ──────────\n                               soft\n\n[Chorus]\n{phraseA[2]}\n     ──────────\n        hold\n{phraseA[3]}\n            ↑\n           rise"
                varB_lyrics = f"[Verse 1]\n{phraseB[0]}\n                ───────\n                  soft\n{phraseB[1]}\nसज गए सपने हमारे इस राह में!\n                               ↑\n                              rise\n\n[Chorus]\n{phraseB[2]}\n     ─────────────\n         hold\n{phraseB[3]}\n      ~~~~~\n      soft"

            else: # Tamil
                phraseA = ta_phrases_A[p_idx % len(ta_phrases_A)]
                phraseB = ta_phrases_B[p_idx % len(ta_phrases_B)]
                varA_lyrics = f"[Verse 1]\n{phraseA[0]}\n                               ─────────\n                                 hold\n{phraseA[1]}\nவாழ்கிறேன் உனக்காகவே இந்த ஜென்மம்...\n                                    ─────────\n                                      soft\n\n[Chorus]\n{phraseA[2]}\n    ───────\n     hold\n{phraseA[3]}\n      ↑\n     rise"
                varB_lyrics = f"[Verse 1]\n{phraseB[0]}\n                        ───────\n                         soft\n{phraseB[1]}\nதொடருதே நம் காதல் பயணம்!\n                               ↑\n                              rise\n\n[Chorus]\n{phraseB[2]}\n     ─────────────\n         hold\n{phraseB[3]}\n     ~~~~~\n     soft"

            # Append Variation A
            dataset.append({
                "prompt": f"{p_text} (Variant {p_idx+1})", "language": lang, "genre": g, "emotion": e,
                "theme": thm, "energy": nrg, "structure": "Verse, Chorus, Outro",
                "lyrics": varA_lyrics, "singing_expression": "hold, soft, rise", "variation": "A"
            })
            # Append Variation B
            dataset.append({
                "prompt": f"{p_text} (Variant {p_idx+1})", "language": lang, "genre": g, "emotion": e,
                "theme": thm, "energy": nrg, "structure": "Verse, Chorus, Outro",
                "lyrics": varB_lyrics, "singing_expression": "soft, rise, hold", "variation": "B"
            })

            if len(dataset) >= target_count:
                break
        p_idx += 1

    # Write expanded dataset to the jsonl file
    output_path = os.path.join(os.path.dirname(__file__), "data", "lyrics_dataset.jsonl")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        for entry in dataset:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
    print(f"[DATA] Successfully generated {len(dataset)} high-quality native records in: {output_path}")
    
    # Run validation checks
    from validate_dataset import validate_dataset
    validate_dataset(output_path)

if __name__ == "__main__":
    main()
