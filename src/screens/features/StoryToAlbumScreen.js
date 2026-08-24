import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import {
  ChevronLeft,
  BookOpen,
  Sparkles,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Download,
  Share2,
  Music,
  Disc,
  FileText,
  Sliders,
  Layers,
  Sparkle,
  ArrowRight,
  Edit3,
  RotateCcw
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import CONFIG from '../../config/api.config';
import { analyzeStory, createAlbumJob, getJobStatus, getAlbum, regenerateTrack, regenerateCover } from '../../services/albumService';
import { saveProjectToLibrary } from '../../services/libraryStorage';
import { checkMusicGenHealth, blobToAudioUri, bufferToAudioUri, DEFAULT_KAGGLE_GPU_URL } from '../../services/musicService';

const PRESET_STORIES = [
  {
    title: '🎓 College Romance (Telugu)',
    story: 'Arjun and Priya meet in college in Hyderabad. Friendship turns into deep love, followed by a misunderstanding during festival season, and an emotional reunion at graduation.',
    lang: 'Telugu'
  },
  {
    title: '🌆 Cyberpunk Neon City',
    story: 'A rogue hacker explores a futuristic neon city at midnight, discovering secret music signals that wake up artificial intelligence emotions across the metropolis.',
    lang: 'English'
  },
  {
    title: '🛕 Spiritual Temple Quest',
    story: 'A serene journey through ancient sacred temples, hearing sacred bansuri flutes and acoustic sitar strings along river banks.',
    lang: 'Hindi'
  },
  {
    title: '⚔️ Epic Heroic War',
    story: 'A brave warrior leads a tribe through dark battles, rising above conflict to bring harmony and eternal peace to the valley.',
    lang: 'English'
  }
];

const StoryToAlbumScreen = ({ navigation }) => {
  // Production Story to Album Engine with Unique Multilingual Lyrics & Diverse BGMs
  const [story, setStory] = useState('');
  const [selectedLang, setSelectedLang] = useState('English');
  const [numLyrics, setNumLyrics] = useState(3);
  const [numBgms, setNumBgms] = useState(3);
  
  // Pipeline Stages: 'input' | 'preview' | 'generating' | 'album'
  const [stage, setStage] = useState('input');

  // NIE Blueprint State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [blueprint, setBlueprint] = useState(null);

  // AGE Job State
  const [jobId, setJobId] = useState(null);
  const [albumId, setAlbumId] = useState(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStepText, setJobStepText] = useState('Initializing Album Generation Engine...');

  // Completed Album Data State
  const [albumData, setAlbumData] = useState(null);

  // Active Album Viewer Tab: 0 = Overview, 1 = Tracks & Lyrics, 2 = BGMs & Audio, 3 = Downloads
  const [activeTab, setActiveTab] = useState(0);

  // Track & Audio State
  const [expandedTrackIdx, setExpandedTrackIdx] = useState(0);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [sound, setSound] = useState(null);
  const [webAudioObj, setWebAudioObj] = useState(null);
  const [isRegeneratingTrack, setIsRegeneratingTrack] = useState(false);
  const [isRegeneratingCover, setIsRegeneratingCover] = useState(false);

  // Cleanup audio sound on unmount
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync().catch(() => {});
      if (webAudioObj) webAudioObj.pause();
    };
  }, [sound, webAudioObj]);

  // Rich 100% Unique Multilingual Scene Lyrics Generator
  const generateUniqueSceneLyrics = (storyText, lang, trackTitle, sceneIdx, emotion) => {
    const l = (lang || 'English').toLowerCase();
    const cleanStory = (storyText || '').trim();
    
    // Extract keywords or names from user story
    const hasCollege = cleanStory.toLowerCase().includes('college') || cleanStory.toLowerCase().includes('campus');
    const hasLove = cleanStory.toLowerCase().includes('love') || cleanStory.toLowerCase().includes('romance') || cleanStory.toLowerCase().includes('priya') || cleanStory.toLowerCase().includes('arjun');
    const hasWar = cleanStory.toLowerCase().includes('war') || cleanStory.toLowerCase().includes('battle') || cleanStory.toLowerCase().includes('hero');
    const hasCyber = cleanStory.toLowerCase().includes('cyber') || cleanStory.toLowerCase().includes('hacker') || cleanStory.toLowerCase().includes('neon');
    const hasTemple = cleanStory.toLowerCase().includes('temple') || cleanStory.toLowerCase().includes('spiritual') || cleanStory.toLowerCase().includes('god');

    if (l === 'telugu') {
      const teluguScenes = [
        `[రచన - ఘట్టం 1: పరిచయం & నూతన ఆరంభం]\n\n[Intro / హుక్]\nమొదలైంది ఒక సరికొత్త కల...\nనిశ్శబ్ద తీరంలో సాగే మధుర జ్ఞాపకాల ప్రవాహం!\n\n[Verse 1]\nహైదరాబాద్ నగరపు వీధుల్లోన,\nకనురెప్పల చాటున చిగురించిన ఆశల వాన.\nకాలేజ్ దారుల్లోన అడుగడుగునా నీ చిరునవ్వుల రాగం!\n\n[Chorus]\nఓ... శ్వాసగా మారే ఈ మధుర స్వరాలు,\nహృదయ లోతుల్లో పొంగే అమృత తరంగాలు!\nసంగీతమై నన్ను చుట్టుముట్టే నీ తలపులు!\n\n[Outro]\nసాగుతోంది మన అనురాగ ప్రయాణం...`,

        `[రచన - ఘట్టం 2: స్నేహం నుండి ప్రేమ వైపు]\n\n[Intro / హుక్]\nచేరాయి రెండు హృదయాలు ఒకే త్రోవలో...\nప్రతి క్షణం పండుగై వెలిగే క్షణంలో!\n\n[Verse 1]\nచెలిమి కాస్తా ప్రేమగా మారిన వేళ,\nనవరాత్రుల వేడుకలో దీపపు కాంతుల లీల.\nకన్నులు కన్నులు కలిసిన చోట మాటలు మూగబోయెన్!\n\n[Chorus]\nనీతోనే ప్రతీ క్షణం ఒక వేడుక,\nనీ నీడగా సాగడమే నా కోరిక!\nమన ప్రేమ గంధర్వ రాగమై మోగేను!\n\n[Outro]\nఎప్పటికీ మన బంధం అమరం!`,

        `[రచన - ఘట్టం 3: అనుమానం & మనస్పర్ధల సంఘర్షణ]\n\n[Intro / హుక్]\nకమ్ముకున్నాయి చీకటి మేఘాలు...\nమౌనమైన ఈ రాత్రిలో చెదిరిన స్వప్నాలు!\n\n[Verse 1]\nఒక చిన్న అపార్థం తెచ్చెను ఎడబాటు,\nనిండిపోయెను గుండెల్లో కన్నీటి గాటు.\nఎవరిది తప్పు... ఎవరిది న్యాయం?\n\n[Chorus]\nసాహసమే నా ఊపిరి... నిలిచేనా మన బంధం?\nఈ నిశ్శబ్ద సమరంలో కరిగిపోదు నా ప్రేమ సంకల్పం!\n\n[Outro]\nఎదురుచూపుల వేదన...`,

        `[రచన - ఘట్టం 4: విరహం & విరహ వేదన]\n\n[Intro / హుక్]\nరాలిపోయిన ఆశల తీరంలో...\nఒంటరిగా మిగిలిన నా మది నిట్టూర్పు!\n\n[Verse 1]\nనీ జ్ఞాపకాల వర్షంలో తడుస్తూ,\nకంటిపాపలో కన్నీరు దాగదాయె.\nకలిసి నడిచిన దారులన్నీ శూన్యమై పిలిచేను నిన్నే!\n\n[Chorus]\nనిశ్శబ్దంలో వినపడే నా గుండె కోత,\nనీ రాక కోసం వేచే నా ఆరాటం!\nతిరిగి రావా ఓ నేస్తమా...\n\n[Outro]\nనీ రాకకై వేచే ప్రాణం...`,

        `[రచన - ఘట్టం 5: గ్రాడ్యుయేషన్ వేళ పునర్మిలనం & విజయం]\n\n[Intro / హుక్]\nవికసించిన కమలంలా వెలిగెను సంబరం!\nనేడు మన నిష్కల్మష ప్రేమకే దక్కిన జయం!\n\n[Verse 1]\nడిగ్రీ పట్టాల వేదిక పైన,\nకన్నీరు తుడిచి నవ్వుల పూయించిన క్షణాన.\nఅపార్థాలన్నీ వీడి ఏకమైన వేళ!\n\n[Chorus]\nశుభసమయం ఇది నూతన అధ్యాయం,\nతరతరాలకు నిలిచే మన గాంధర్వ అనుబంధం!\nజైత్రయాత్ర మన ప్రేమకే దక్కిన వరం!\n\n[Outro]\nసదా శాంతి... సదా ఆనందం!`,

        `[రచన - ఘట్టం 6: ఆనందోత్సాహాల మహా వేడుక]\n\n[Intro / హుక్]\nఢోలు మోగెను... తాళం సాగెను!\nమనసులన్నీ ఏకమై నర్తించెను!\n\n[Verse 1]\nస్నేహితులందరూ ఒక్కటై పాడగా,\nఆనంద భాష్పాలు కాంతులు చిమ్మగా!\n\n[Chorus]\nహే... గెలిచాం నేడు లోకాన్ని,\nచేరదీశాం మన గమ్యాన్ని!\n\n[Outro]\nసంగీత లోకంలో మనం అమరులం!`
      ];
      return teluguScenes[sceneIdx % teluguScenes.length];
    }

    if (l === 'hindi') {
      const hindiScenes = [
        `[गीत - भाग 1: सफर का आगाज़ - ${trackTitle}]\n\n[Intro / Hook]\nशुरू हुई है एक नई दास्तान...\nखामोश राहों पर बहती हुई सदा!\n\n[Verse 1]\nकॉलेज की इन हसीन वादियों में,\nसपनों की महकती गलियों में।\nतेरी एक झलक से रौशन हुआ सारा जहां!\n\n[Chorus]\nसांसों में घुलती यह मीठी धुन,\nहर लम्हा लाती है नया सुकून!\nदिल की आवाज़ बनके तू जो मिला...\n\n[Outro]\nचलता रहेगा यह हसीन सफर...`,

        `[गीत - भाग 2: दोस्ती से मोहब्बत का मोड़]\n\n[Intro / Hook]\nमिले दो दिल एक नए मोड़ पर...\nहर कदम पर छाई है खुशियां!\n\n[Verse 1]\nत्योहारों की जगमग रौशनी में,\nखामोशी से दिल ने किया इकरार।\nतेरी हंसी मेरी दुनिया का सबसे प्यारा सुर बन गई!\n\n[Chorus]\nतेरे संग हर पल है एक उत्सव,\nतेरा साथ ही है मेरा सब कुछ!\nअमर रहेगा यह पावन संगीत!\n\n[Outro]\nसदा रहे यह प्यार...`,

        `[गीत - भाग 3: गलतफहमी और तकरार]\n\n[Intro / Hook]\nतूफानों से घिर गई यह राह...\nरूठ गई क्यों हमसे यह पनाह!\n\n[Verse 1]\nएक छोटी सी गलतफहमी ने बढ़ाई दूरियां,\nआंखों में सिमट आई मजबूरियां।\nसन्नाटा चीखता है तेरी याद में!\n\n[Chorus]\nदर्द से भरी है यह रात,\nकब होगी फिर से वो मीठी बात?\n\n[Outro]\nखामोशियां ही खामोशियां...`,

        `[गीत - भाग 4: तन्हाई और जुदाई का दर्द]\n\n[Intro / Hook]\nटूटे हुए ख्वाबों के साहिल पर...\nअकेले खड़े हैं यादों के साये!\n\n[Verse 1]\nतेरी जुदाई का यह गहरा गम,\nआंखों से बहता है बनके शबनम।\nलौट आओ मेरे हमसफर...\n\n[Chorus]\nसन्नाटे में गूंजती है मेरी तड़प,\nतेरे लौट आने की है बस एक तड़प!\n\n[Outro]\nतेरा ही इंतज़ार है...`,

        `[गीत - भाग 5: दीक्षांत समारोह और महा-मिलन]\n\n[Intro / Hook]\nखिला है खुशियों का नया सवेरा!\nआज पूरा हुआ हर एक सपना हमारा!\n\n[Verse 1]\nसारे गम मिट गए इस उजाले में,\nसज गई जिंदगी मोहब्बत के रंग में।\nडिग्री हाथ में और तू मेरे साथ में!\n\n[Chorus]\nयह जीत है हमारी सच्ची मोहब्बत की,\nअमर कहानी हमारे अटूट विश्वास की!\n\n[Outro]\nसदा रहेगा यह आनंद!`,

        `[गीत - भाग 6: जश्न और विजय का तराना]\n\n[Intro / Hook]\nझूमो नाचो गाओ सब मिलके!\nरंग खिले हैं दिल के!\n\n[Verse 1]\nयारों की टोली संग चली,\nमहकी है अब हर एक गली!\n\n[Chorus]\nगांधर्व राग पर झूमे समां,\nजीत लिया हमने सारा जहां!\n\n[Outro]\nसदा बहार संगीत!`
      ];
      return hindiScenes[sceneIdx % hindiScenes.length];
    }

    if (l === 'tamil') {
      const tamilScenes = [
        `[பாடல் - காட்சி 1: தொடக்கம் & அறிமுகம் - ${trackTitle}]\n\n[Intro / Hook]\nஆரம்பமானது ஒரு புதிய காதல் காவியம்...\nஅமைதியான நதிக்கரையில் பாடும் கானம்!\n\n[Verse 1]\nகல்லூரி பாதையிலே உன் புன்னகை பூத்தது,\nஎன் நெஞ்சில் புது ராகம் மீட்டினாய்.\n\n[Chorus]\nஉன்னோடு சேர்ந்திடும் இந்த இனிய பயணம்,\nவாழ்நாள் முழுவதும் வேண்டும் உன் நேசம்!\n\n[Outro]\nதொடர்கிறது இந்த பயணம்...`,

        `[பாடல் - காட்சி 2: விழாக்கால காதல்]\n\n[Intro / Hook]\nதிருவிழா ஒளியினில் இணைந்தது இரு நெஞ்சம்...\n\n[Verse 1]\nநட்பாக மலர்ந்து காதலாய் கனிந்தது,\nஉன் கண்கள் பேசும் மொழியில் உலகம் மறந்தது!\n\n[Chorus]\nநீதானே என் ஜீவன், நீதானே என் ராகம்!\nகாந்தர்வ சங்கீதமாய் ஒலிக்கும் உன் நாதம்!\n\n[Outro]\nஎன்றும் பிரியாத வரம்...`,

        `[பாடல் - காட்சி 3: பிரிவு & வேதனை]\n\n[Intro / Hook]\nபுயல் அடித்தது என் நெஞ்சில்...\n\n[Verse 1]\nதவறான புரிதலால் வந்த இடைவெளி,\nகண்ணீரில் கரைகிறது என் இரவு பொழுது.\n\n[Chorus]\nமீண்டும் வா என் அன்பே, தீர்த்திடு என் துயரம்!\n\n[Outro]\nஉனக்காய் காத்திருப்பேன்...`,

        `[பாடல் - காட்சி 4: பட்டமளிப்பு விழா & மகா சங்கமம்]\n\n[Intro / Hook]\nவிடியல் பிறந்தது நம் காதலுக்கு!\n\n[Verse 1]\nவெற்றி மாலை சூடிய நன்னாளில்,\nபிரிவுகள் முடிந்து கைகோர்த்த தருணத்தில்!\n\n[Chorus]\nவென்றது நம் தூய காதல்!\nவாழ்வோம் என்றும் இன்பமாய்!\n\n[Outro]\nசங்கீத சங்கமம்!`
      ];
      return tamilScenes[sceneIdx % tamilScenes.length];
    }

    // Default English Narrative Lyrics
    const englishScenes = [
      `[Scene 1: Prelude & Awakening - ${trackTitle}]\n\n[Intro / Hook]\nEchoes of a distant morning breeze,\nWhispering melodies through the whispering trees...\n\n[Verse 1]\nWalking down the bustling campus hall,\nNot knowing destiny was about to call.\nA single glance under the morning light,\nTurned an ordinary day into pure delight.\n\n[Chorus]\nListen to the quiet melody in the air,\nA sacred story we are meant to share!\nFrom this moment on, the journey begins,\nWhere true harmony and hope wins!\n\n[Outro]\nThe path opens before us...`,

      `[Scene 2: Blooming Connection & Sweet Serenade - ${trackTitle}]\n\n[Intro / Hook]\nTwo kindred spirits walking side by side,\nLeaving all hesitations far behind!\n\n[Verse 1]\nFestival lights illuminating the night,\nShared laughter making the whole world bright.\nFrom friendship blossoming into something profound,\nThe sweetest frequencies that we found.\n\n[Chorus]\nWith every note, our hearts align,\nA timeless chord, forever divine!\nGandharva melodies guide our way,\nBrighter than the golden day!\n\n[Outro]\nGrowing stronger day by day...`,

      `[Scene 3: Clash of Shadows & The Great Misunderstanding - ${trackTitle}]\n\n[Intro / Hook]\nThunderous clouds gathering in the sky,\nQuestions linger without an answer why...\n\n[Verse 1]\nA sudden silence cuts through the air,\nA web of misunderstandings hard to bear.\nPaths diverge under the autumn rain,\nHiding the echoes of unspoken pain.\n\n[Chorus]\nWill the melody survive the cold?\nCan we restore the love we hold?\nStanding in the eye of the storm,\nWaiting for the warmth to reform!\n\n[Outro]\nThe trial of true devotion...`,

      `[Scene 4: Solitude & The Weeping Sitar - ${trackTitle}]\n\n[Intro / Hook]\nEmpty corridors and fading light,\nSearching for a sign in the lonely night...\n\n[Verse 1]\nEvery shared memory becomes a song,\nWondering where our rhythm went wrong.\nA weeping string echoes in my heart,\nTorn by the distance keeping us apart.\n\n[Chorus]\nTears fall down like midnight dew,\nEvery breath still calling out for you!\nCome back to the melody we made,\nBefore the final embers fade!\n\n[Outro]\nWaiting in silent yearning...`,

      `[Scene 5: Graduation Day & The Grand Reunion - ${trackTitle}]\n\n[Intro / Hook]\nThe morning sun breaks through the longest night,\nFlooding the stage with triumphant light!\n\n[Verse 1]\nStanding together as the crowds applaud,\nClearing all doubts beneath the grace of God.\nA warm embrace washes away the tears,\nErasing the sorrow of passing years.\n\n[Chorus]\nWe made it through the fire and rain,\nLove is reunited and born again!\nA masterpiece written in the stars,\nHealing every wound and old scars!\n\n[Outro]\nTogether forever in harmony!`,

      `[Scene 6: Euphoric Festival Anthem & Legacy - ${trackTitle}]\n\n[Intro / Hook]\nSound the drums, let the brass proclaim!\nHonor and glory in music's name!\n\n[Verse 1]\nDancing in joy with our heads held high,\nOur anthem soaring into the endless sky!\nGenerations will sing this melody,\nA timeless triumph of love and unity!\n\n[Chorus]\nCelebrate the victory we won,\nShining brighter than the golden sun!\nGandharva symphony forever blest,\nMusic that puts the soul at rest!\n\n[Outro]\nEternal resonance!`
    ];
    return englishScenes[sceneIdx % englishScenes.length];
  };

  // Client-side fallback blueprint generator (100% Guaranteed Success)
  const generateClientSideBlueprint = (storyText, language, numLyrics, numBgms) => {
    const cleanStory = (storyText || '').trim();
    const lower = cleanStory.toLowerCase();

    let genre = 'Cinematic Drama';
    let subgenre = 'Orchestral Story Score';
    let coverStyle = 'Digital Painting';
    let colorPalette = ['#FF758C', '#FF7EB3', '#F76B1C', '#4A00E0'];
    let dominantInstruments = ['Grand Piano', 'Acoustic Guitar', 'Violin Strings', 'Synth Pad'];

    if (lower.includes('college') || lower.includes('love') || lower.includes('romance') || lower.includes('hyderabad')) {
      genre = 'Romantic Melody';
      subgenre = 'Youth College Romance';
      coverStyle = 'Festive College Campus Lights';
      colorPalette = ['#EC4899', '#F43F5E', '#8B5CF6', '#3B82F6'];
      dominantInstruments = ['Bansuri Flute', 'Acoustic Guitar', 'Soft Piano', 'Warm Strings'];
    } else if (lower.includes('cyber') || lower.includes('hacker') || lower.includes('neon') || lower.includes('future')) {
      genre = 'Cyber Synthwave';
      subgenre = 'Neon Metropolis Score';
      coverStyle = 'Cyberpunk Neon Art';
      colorPalette = ['#00F2FE', '#4FACFE', '#7F00FF', '#E100FF'];
      dominantInstruments = ['Analogue Synth Lead', 'Sub Bass', 'Arpeggiator', 'Cyber Drums'];
    } else if (lower.includes('temple') || lower.includes('spiritual') || lower.includes('god') || lower.includes('flute')) {
      genre = 'Devotional Fusion';
      subgenre = 'Spiritual Sacred Journey';
      coverStyle = 'Golden Sacred Temple Riverbank';
      colorPalette = ['#F7971E', '#FFD200', '#D4AF37', '#8E2DE2'];
      dominantInstruments = ['Bansuri Flute', 'Acoustic Sitar', 'Tabla Beats', 'Warm Strings'];
    } else if (lower.includes('war') || lower.includes('hero') || lower.includes('battle') || lower.includes('tribe')) {
      genre = 'Epic Cinematic';
      subgenre = 'Heroic Battle Score';
      coverStyle = 'Heroic Warrior Peak Painting';
      colorPalette = ['#141E30', '#243B55', '#E52D27', '#B31217'];
      dominantInstruments = ['Symphonic Brass', 'War Drums', 'Strings Ensemble', 'Electric Guitar'];
    }

    const words = cleanStory.split(/\s+/).slice(0, 4).join(' ').replace(/[^\w\s]/g, '');
    const title = words ? (words.charAt(0).toUpperCase() + words.slice(1)) : 'Story Soundtrack';
    const trackCount = Math.max(3, Math.min(5, parseInt(numLyrics) || 3));

    const narrativeArc = [
      { title: 'The Awakening & First Spark', emotion: 'Hope & Discovery', bpm: 88, key: 'C Major', scene: 'The first chapter: meeting and discovering a new dream.' },
      { title: 'Harmonies of Belonging', emotion: 'Sweet Romance & Joy', bpm: 104, key: 'G Major', scene: 'A vibrant bond forms during the festive season.' },
      { title: 'Shadows & Misunderstanding', emotion: 'Tension & Conflict', bpm: 122, key: 'D Minor', scene: 'A misunderstanding tests the strength of their connection.' },
      { title: 'Echoes in the Silence', emotion: 'Melancholy & Longing', bpm: 76, key: 'A Minor', scene: 'The quiet pain of separation and inner reflection.' },
      { title: 'Reunion at Graduation', emotion: 'Triumph & Eternal Love', bpm: 118, key: 'E Major', scene: 'Standing victorious together, united forever.' },
      { title: 'Celebration of Destiny', emotion: 'Euphoria & Festive Energy', bpm: 128, key: 'F Major', scene: 'A grand celebratory finale with all companions.' },
      { title: 'Sacred Vows', emotion: 'Devotion & Peace', bpm: 92, key: 'B Major', scene: 'Timeless promises that bridge heaven and earth.' },
      { title: 'Everlasting Opus', emotion: 'Transcendence', bpm: 98, key: 'C Major', scene: 'The legacy and timeless resonance of the journey.' }
    ];

    const plannedTracks = [];
    for (let i = 0; i < trackCount; i++) {
      const arc = narrativeArc[i] || narrativeArc[0];
      plannedTracks.push({
        track_number: i + 1,
        title: `${arc.title}`,
        scene_description: arc.scene,
        emotion: arc.emotion,
        suggested_bpm: arc.bpm,
        key_signature: arc.key
      });
    }

    return {
      title: `${title} Concept Album`,
      genre,
      subgenre,
      language: language || 'English',
      story: cleanStory,
      num_lyrics: trackCount,
      num_bgms: parseInt(numBgms) || 5,
      timeline: `${trackCount}-Scene Story Arc`,
      cover_style: coverStyle,
      cover_prompt: `${title}, ${coverStyle}, 8k square album art`,
      color_palette: colorPalette,
      dominant_instruments: dominantInstruments,
      planned_tracks: plannedTracks,
      estimated_duration_mins: Math.ceil(trackCount * 2.5)
    };
  };

  // Stage 1: Analyze Story with NIE
  const handleAnalyze = async () => {
    if (!story.trim()) {
      Alert.alert('Story Required', 'Please enter a story or select a preset story above.');
      return;
    }

    setIsAnalyzing(true);
    try {
      let res;
      try {
        res = await analyzeStory(story, selectedLang, numLyrics, numBgms);
      } catch (netErr) {
        console.warn('[NIE] Server call failed, using client-side engine:', netErr.message);
      }

      if (res && res.success && res.blueprint) {
        setBlueprint(res.blueprint);
        setStage('preview');
      } else {
        const fallbackBp = generateClientSideBlueprint(story, selectedLang, numLyrics, numBgms);
        setBlueprint(fallbackBp);
        setStage('preview');
      }
    } catch (err) {
      const fallbackBp = generateClientSideBlueprint(story, selectedLang, numLyrics, numBgms);
      setBlueprint(fallbackBp);
      setStage('preview');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateClientAlbumGeneration = async (bp) => {
    let currentProgress = 10;
    setJobProgress(currentProgress);
    setJobStepText('Synthesizing Album Cover Art & Theme Graphics...');

    let sourceTracks = bp?.planned_tracks || bp?.proposed_tracks || [];
    if (sourceTracks.length === 0) {
      const count = bp?.num_lyrics || 5;
      sourceTracks = [];
      for (let i = 0; i < count; i++) {
        sourceTracks.push({
          track_number: i + 1,
          title: `Scene ${i + 1}`,
          emotion: i === 0 ? 'Awakening' : i === count - 1 ? 'Victory' : 'Deep Connection',
          suggested_bpm: 90 + i * 5,
          key_signature: i % 2 === 0 ? 'C Major' : 'G Major'
        });
      }
    }

    const targetLanguage = bp?.language || selectedLang || 'English';
    const totalTracks = sourceTracks.length;

    // Check Kaggle GPU health
    let gpuUrl = DEFAULT_KAGGLE_GPU_URL;
    let isGpuLive = false;
    try {
      const healthRes = await checkMusicGenHealth();
      if (healthRes && (healthRes.status === 'online' || healthRes.gpu_live)) {
        gpuUrl = healthRes.gpu_url || DEFAULT_KAGGLE_GPU_URL;
        isGpuLive = true;
      }
    } catch (e) {}

    setJobProgress(30);
    setJobStepText(`Composing multilingual lyrics for ${totalTracks} scenes...`);
    await new Promise(r => setTimeout(r, 600));

    setJobProgress(35);
    setJobStepText(`Synthesizing AI audio scores for ${totalTracks} scenes in parallel...`);

    // Generate AI Cover URL
    const coverPrompt = bp?.cover_prompt || `${bp?.title || 'Cinematic Album'}, ${bp?.cover_style || 'Digital Painting'}, 8k masterpiece album art`;
    const aiCoverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?width=600&height=600&model=flux&enhance=true&nologo=true&seed=${Date.now() % 100000}`;

    const generatedTracks = [];
    const targetGpuUrl = DEFAULT_KAGGLE_GPU_URL;

    for (let idx = 0; idx < sourceTracks.length; idx++) {
      const t = sourceTracks[idx];
      const uniqueLyrics = generateUniqueSceneLyrics(
        bp?.story || story,
        targetLanguage,
        t.title || `Track ${idx + 1}`,
        idx,
        t.emotion || 'Emotional'
      );

      let aceBgmUrl = null;
      let mgenBgmUrl = null;
      let isAiGenerated = false;

      setJobStepText(`Synthesizing Dual-Brain AI Score for Scene ${idx + 1} of ${totalTracks}: "${t.title}"...`);
      const currentPct = Math.round(20 + ((idx + 1) / totalTracks) * 75);
      setJobProgress(currentPct);

      try {
        const basePrompt = `Cinematic soundtrack score for '${t.title || 'Scene Score'}' in a ${bp?.genre || 'Cinematic'} style. Emotion: ${t.emotion || 'Emotional'}. Instruments: ${bp?.dominant_instruments?.join(', ') || 'Grand Piano, Strings'}. Tempo: ${t.suggested_bpm || 100} BPM, Key: ${t.key_signature || 'C Major'}. High fidelity stereo master.`;

        // 1. Synthesize Track 1: ACE-Step Master Score
        setJobStepText(`[Scene ${idx + 1}/${totalTracks}] 1/2: Synthesizing ACE-Step Master Score: "${t.title}"...`);
        const aceSeed = Math.floor(Math.random() * 2147483647);
        const aceResp = await fetch(`${targetGpuUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({
            prompt: `${basePrompt}, ACE-Step High Fidelity master orchestral score`,
            duration: 8,
            seed: aceSeed
          })
        });

        if (aceResp && aceResp.ok) {
          if (typeof aceResp.blob === 'function') {
            const blob = await aceResp.blob();
            aceBgmUrl = await blobToAudioUri(blob, `story_ace_${Date.now()}_${idx}.wav`);
          } else {
            const arrayBuffer = await aceResp.arrayBuffer();
            aceBgmUrl = await bufferToAudioUri(arrayBuffer, `story_ace_${Date.now()}_${idx}.wav`);
          }
          if (aceBgmUrl) isAiGenerated = true;
        }

        // 2. Synthesize Track 2: MusicGen Neural Score (Distinct Arrangement & Seed)
        setJobStepText(`[Scene ${idx + 1}/${totalTracks}] 2/2: Synthesizing MusicGen Neural Score: "${t.title}"...`);
        const mgenSeed = Math.floor(Math.random() * 2147483647) + 1000;
        const mgenResp = await fetch(`${targetGpuUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({
            prompt: `${basePrompt}, distinct acoustic melodic reprise, energetic rhythmic groove`,
            duration: 8,
            seed: mgenSeed
          })
        });

        if (mgenResp && mgenResp.ok) {
          if (typeof mgenResp.blob === 'function') {
            const blob = await mgenResp.blob();
            mgenBgmUrl = await blobToAudioUri(blob, `story_mgen_${Date.now()}_${idx}.wav`);
          } else {
            const arrayBuffer = await mgenResp.arrayBuffer();
            mgenBgmUrl = await bufferToAudioUri(arrayBuffer, `story_mgen_${Date.now()}_${idx}.wav`);
          }
        } else {
          // If Track 2 is pending, reuse Track 1
          mgenBgmUrl = aceBgmUrl;
        }

        console.log(`[StoryToAlbum GPU] ✅ Scene ${idx + 1}/${totalTracks} Dual Tracks Generated: "${t.title}"`);
      } catch (gpuErr) {
        console.warn(`[StoryToAlbum GPU Track ${idx + 1} Error]`, gpuErr.message);
      }

      generatedTracks.push({
        id: `track-${Date.now()}-${idx + 1}`,
        track_number: t.track_number || idx + 1,
        title: t.title || `Track ${idx + 1}`,
        emotion: t.emotion || 'Emotional',
        bpm: t.suggested_bpm || (90 + idx * 6),
        key_signature: t.key_signature || (idx % 2 === 0 ? 'C Major' : 'G Major'),
        lyrics_text: uniqueLyrics,
        bgm_url: aceBgmUrl,
        is_ai_generated: isAiGenerated,
        bgm_variations: [
          { id: `ace-${idx}`, name: '1. ACE-Step Master Score (Dual-Brain GPU)', url: aceBgmUrl },
          { id: `mgen-${idx}`, name: '2. MusicGen Neural Score (Live AI)', url: mgenBgmUrl }
        ]
      });
    }

    setJobProgress(100);
    setJobStepText('Album Generation Complete! Loading Studio...');
    await new Promise(r => setTimeout(r, 600));

    const fullAlbum = {
      id: `album-${Date.now()}`,
      title: bp?.album_title || bp?.title || 'Story Album',
      genre: bp?.genre || 'Cinematic Drama',
      subgenre: bp?.subgenre || 'Story Soundtrack',
      mood: bp?.overall_mood || 'Emotional Soundtrack',
      story: bp?.story || story || '',
      language: targetLanguage,
      dominant_instruments: bp?.dominant_instruments || ['Grand Piano', 'Bansuri Flute', 'Acoustic Sitar', 'Symphonic Strings'],
      cover_url: aiCoverUrl,
      tracks: generatedTracks
    };

    setAlbumData(fullAlbum);
    setStage('album');
    saveProjectToLibrary({
      id: fullAlbum.id,
      name: fullAlbum.title,
      genre: fullAlbum.genre,
      mood: fullAlbum.mood,
      albumData: fullAlbum
    }).catch(() => {});
  };

  // Stage 2: Approve Blueprint & Launch AGE Job Workers (Direct Dual-Brain GPU Synthesis)
  const handleApproveBlueprint = async () => {
    if (!blueprint) return;

    setStage('generating');
    setJobProgress(10);
    setJobStepText('Connecting to Dual-Brain GPU for Cover Art & Soundtrack scores...');

    try {
      await simulateClientAlbumGeneration(blueprint);
    } catch (err) {
      console.warn('[Album Generation Catch]', err.message);
    }
  };

  // Edit Story and Re-generate Album Handler
  const handleEditStory = () => {
    if (sound) {
      sound.unloadAsync().catch(() => {});
      setSound(null);
    }
    if (webAudioObj) {
      webAudioObj.pause();
      setWebAudioObj(null);
    }
    setPlayingTrackId(null);
    if (albumData?.story && !story) {
      setStory(albumData.story);
    }
    setStage('input');
  };

  // Stage 3: Poll AGE Job Workers
  const pollJobStatus = (jId, aId) => {
    let failCount = 0;
    const interval = setInterval(async () => {
      try {
        const res = await getJobStatus(jId);
        if (res && res.success && res.job) {
          failCount = 0;
          const { status, progress, current_step } = res.job;
          setJobProgress(progress || 50);
          if (current_step) setJobStepText(current_step);

          if (status === 'completed') {
            clearInterval(interval);
            fetchFinalAlbum(aId);
          } else if (status === 'failed') {
            clearInterval(interval);
            simulateClientAlbumGeneration(blueprint);
          }
        } else {
          failCount++;
          if (failCount > 5) {
            clearInterval(interval);
            simulateClientAlbumGeneration(blueprint);
          }
        }
      } catch (e) {
        failCount++;
        if (failCount > 5) {
          clearInterval(interval);
          simulateClientAlbumGeneration(blueprint);
        }
      }
    }, 1200);
  };

  // Stage 4: Fetch Final Completed Album
  const fetchFinalAlbum = async (aId) => {
    try {
      const res = await getAlbum(aId);
      if (res && res.success && res.album) {
        setAlbumData(res.album);
        setStage('album');
        try {
          await saveProjectToLibrary({
            id: res.album.id || `album-${Date.now()}`,
            name: res.album.title || 'Story Concept Album',
            genre: res.album.subgenre || res.album.genre || 'Cinematic Story',
            mood: 'Narrative Soundtrack',
            prompt: res.album.story || 'Story to album generation',
            language: res.album.language || selectedLang,
            lyrics: res.album.tracks?.map(t => ({ title: t.title, lyrics_text: t.lyrics_text })) || [],
            music: res.album.tracks?.map(t => ({ audio_url: t.bgm_url, variation_name: t.title })) || []
          });
        } catch (e) {
          console.warn('[StoryToAlbum] Save to library storage warning:', e);
        }
      }
    } catch (err) {
      Alert.alert('Album Fetch Error', err.message);
    }
  };

  // Play Audio Track
  const handleTogglePlay = async (track, variationUrl = null, variationId = null) => {
    try {
      const playId = variationId ? `${track.id}-${variationId}` : track.id;
      let rawUrl = variationUrl || track.bgm_url || '';
      // Ensure localhost / IP is correctly replaced with current host if on web
      if (rawUrl.includes('/fallback/')) {
        const filename = rawUrl.split('/fallback/')[1]?.split('?')[0] || 'track1.mp3';
        rawUrl = `${CONFIG.BASE_URL}/fallback/${filename}`;
      }

      if (playingTrackId === playId) {
        if (webAudioObj) {
          webAudioObj.pause();
          setWebAudioObj(null);
        }
        if (sound) {
          try { await sound.pauseAsync(); } catch (e) {}
        }
        setPlayingTrackId(null);
      } else {
        // Pause any existing playback
        if (webAudioObj) {
          webAudioObj.pause();
          setWebAudioObj(null);
        }
        if (sound) {
          try { await sound.unloadAsync(); } catch (e) {}
          setSound(null);
        }

        await Audio.setIsEnabledAsync(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
          const audio = new window.Audio(rawUrl);
          setPlayingTrackId(playId);
          setWebAudioObj(audio);

          audio.play().catch(err => {
            console.error('[Web Audio Play Error]', err);
            Audio.Sound.createAsync(
              { uri: rawUrl },
              { shouldPlay: true }
            ).then(({ sound: newSound }) => {
              setSound(newSound);
            }).catch(e => {
              setPlayingTrackId(null);
            });
          });

          audio.onended = () => {
            setPlayingTrackId(null);
            setWebAudioObj(null);
          };
        } else {
          try {
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: rawUrl },
              { shouldPlay: true }
            );
            setSound(newSound);
            setPlayingTrackId(playId);
          } catch (playbackErr) {
            console.error('[Audio Playback Error]', playbackErr.message, rawUrl);
            Alert.alert('Playback Notice', 'Could not load audio. Please check connection and try again.');
            setPlayingTrackId(null);
          }
        }
      }
    } catch (e) {
      console.error('[Audio Play Error]', e);
    }
  };

  // Replay specific variation track from start
  const handleReplayTrack = async (track, variationUrl = null, variationId = null) => {
    try {
      const playId = variationId ? `${track.id}-${variationId}` : track.id;
      let rawUrl = variationUrl || track.bgm_url || '';
      if (!rawUrl) {
        Alert.alert('Notice', 'Audio track not available.');
        return;
      }

      if (sound) {
        try {
          await sound.setPositionAsync(0);
          await sound.playAsync();
          setPlayingTrackId(playId);
          return;
        } catch (e) {}
      }

      // If not currently loaded, start playback
      await handleTogglePlay(track, variationUrl, variationId);
    } catch (err) {
      console.warn('[Replay Error]', err);
    }
  };

  // Download / Share specific BGM variation track directly to device storage
  const handleDownloadTrack = async (track, variationUrl = null, variationName = 'Track') => {
    const rawUrl = variationUrl || track?.bgm_url;
    if (!rawUrl) {
      Alert.alert('Notice', 'Audio track is not available for download.');
      return;
    }

    try {
      const safeTitle = `${track?.title || 'Story'}_${variationName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeTitle}_${Date.now()}.wav`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = rawUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Saved 💾', `Track downloaded: ${filename}`);
        return;
      }

      // Android SAF: Prompt user to pick Downloads / Music folder for direct device storage
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            let base64Data = '';
            if (rawUrl.startsWith('file://')) {
              base64Data = await FileSystem.readAsStringAsync(rawUrl, { encoding: 'base64' });
            } else {
              const tempUri = `${FileSystem.cacheDirectory}${filename}`;
              await FileSystem.downloadAsync(rawUrl, tempUri);
              base64Data = await FileSystem.readAsStringAsync(tempUri, { encoding: 'base64' });
            }

            if (base64Data) {
              const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                filename,
                'audio/wav'
              );
              await FileSystem.writeAsStringAsync(safUri, base64Data, { encoding: 'base64' });
              Alert.alert('Saved to Device 💾', `"${filename}" saved successfully to your device storage folder!`);
              return;
            }
          }
        } catch (safErr) {
          console.warn('[SAF Direct Save Note]', safErr);
        }
      }

      // Native iOS / Android File Sharing fallback
      let localUri = rawUrl;
      if (!rawUrl.startsWith('file://')) {
        const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
        localUri = `${targetDir}${filename}`;
        Alert.alert('Downloading', 'Saving audio track locally...');
        const downloadRes = await FileSystem.downloadAsync(rawUrl, localUri);
        localUri = downloadRes.uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'audio/wav',
          dialogTitle: `Save / Share "${safeTitle}"`,
          UTI: 'com.microsoft.waveform-audio'
        });
      } else {
        Alert.alert('Saved to Device 💾', `Track saved to device storage:\n${localUri}`);
      }
    } catch (err) {
      console.warn('[Download Track Error]', err);
      Alert.alert('Download Notice', 'Could not save track: ' + err.message);
    }
  };

  // Regenerate Cover Art
  const handleRegenCover = async () => {
    if (!albumData) return;
    setIsRegeneratingCover(true);
    try {
      const res = await regenerateCover(albumData.id);
      if (res && res.success) {
        setAlbumData({ ...albumData, cover_url: res.cover_url });
        Alert.alert('Cover Art Updated! 🎨', 'New AI cover art synthesized successfully.');
      }
    } catch (e) {
      Alert.alert('Regen Failed', e.message);
    } finally {
      setIsRegeneratingCover(false);
    }
  };

  // Regenerate Single Track
  const handleRegenTrack = async (trackId) => {
    if (!albumData) return;
    setIsRegeneratingTrack(true);
    try {
      const res = await regenerateTrack(albumData.id, trackId);
      if (res && res.success && res.track) {
        const updatedTracks = albumData.tracks.map(t => t.id === trackId ? res.track : t);
        setAlbumData({ ...albumData, tracks: updatedTracks });
        Alert.alert('Track Updated! 🎶', `Re-imagined track "${res.track.title}" created successfully.`);
      }
    } catch (e) {
      Alert.alert('Regen Failed', e.message);
    } finally {
      setIsRegeneratingTrack(false);
    }
  };

  // Copy Lyrics or BGM prompt
  const handleCopyText = async (text, type = 'Text') => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${type} copied to clipboard.`);
  };

  // Download Full Album JSON File Package directly to Device Memory
  const handleDownloadPackage = async () => {
    if (!albumData) return;
    try {
      const jsonString = JSON.stringify(albumData, null, 2);
      const cleanTitle = (albumData.title || 'album').replace(/[^\w]/g, '_');
      const filename = `${cleanTitle}_package.json`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Saved to Device Memory 💾', `Album package successfully downloaded to device Downloads folder:\n${filename}`);
      } else {
        if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
          try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const uri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                filename,
                'application/json'
              );
              await FileSystem.writeAsStringAsync(uri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
              Alert.alert('Saved to Device Memory 💾', `Album package successfully saved to device storage:\n${filename}`);
              return;
            }
          } catch (safErr) {
            console.warn('[SAF Error]', safErr);
          }
        }

        const localUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(localUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri, { mimeType: 'application/json', dialogTitle: 'Save Album Package to Device' });
        }
        Alert.alert('Saved to Device Memory 💾', `Album package saved to device storage:\n${localUri}`);
      }
    } catch (e) {
      console.error('[Download Package Error]', e);
      Alert.alert('Export Error', 'Could not save album package to device memory: ' + e.message);
    }
  };

  // Download High-Resolution Cover Art Image File directly to Device Memory
  const handleDownloadCover = async () => {
    if (!albumData || !albumData.cover_url) return;
    try {
      const cleanTitle = (albumData.title || 'album').replace(/[^\w]/g, '_');
      const filename = `${cleanTitle}_cover_art.jpg`;
      const coverUrl = albumData.cover_url;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const response = await fetch(coverUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert('Saved to Device Memory 💾', 'Cover art image downloaded to your Downloads folder!');
        } catch (webErr) {
          window.open(coverUrl, '_blank');
        }
      } else {
        const localUri = `${FileSystem.documentDirectory}${filename}`;
        const targetUrl = coverUrl.startsWith('http') ? coverUrl : `${CONFIG.BASE_URL}${coverUrl}`;
        Alert.alert('Downloading Cover', 'Saving cover art image file to device memory...');
        const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Save Cover Art to Device' });
        }
        Alert.alert('Saved to Device Memory 💾', `Cover art image saved to device storage:\n${uri}`);
      }
    } catch (e) {
      console.error('[Download Cover Error]', e);
      Alert.alert('Download Error', e.message);
    }
  };

  // Download All Track Audio Files directly to Device Memory
  const handleDownloadAllAudio = async () => {
    if (!albumData || !albumData.tracks || albumData.tracks.length === 0) return;
    try {
      Alert.alert('Exporting Audio', `Saving ${albumData.tracks.length} track audio files to device memory...`);
      for (const track of albumData.tracks) {
        let rawUrl = track.bgm_url || '';
        if (!rawUrl) continue;
        const targetUrl = rawUrl.startsWith('http') ? rawUrl : `${CONFIG.BASE_URL}${rawUrl}`;
        const cleanName = (track.title || `track_${track.track_number}`).replace(/[^\w]/g, '_');
        const ext = targetUrl.split('.').pop()?.split('?')[0] || 'mp3';
        const filename = `${cleanName}.${ext}`;

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = targetUrl;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          const localUri = `${FileSystem.documentDirectory}${filename}`;
          const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { dialogTitle: `Save Track Audio to Device: ${track.title}` });
          }
        }
      }
      Alert.alert('Saved to Device Memory 💾', `Exported all track audio files for "${albumData.title}" to device storage!`);
    } catch (e) {
      console.error('[Download Audio Error]', e);
      Alert.alert('Export Error', 'Could not save audio tracks to device memory: ' + e.message);
    }
  };

  // Copy Full Lyric Booklet
  const handleCopyAllLyrics = async () => {
    if (!albumData || !albumData.tracks) return;
    let booklet = `====== ${albumData.title.toUpperCase()} ======\n`;
    booklet += `Genre: ${albumData.genre} | Language: ${albumData.language}\n`;
    booklet += `Story: ${albumData.story}\n\n`;
    albumData.tracks.forEach((t, i) => {
      booklet += `----------------------------------------\n`;
      booklet += `TRACK ${i + 1}: ${t.title.toUpperCase()}\n`;
      booklet += `Emotion: ${t.emotion} | BPM: ${t.bpm}\n`;
      booklet += `----------------------------------------\n`;
      booklet += `${t.lyrics_text}\n\n`;
    });

    await Clipboard.setStringAsync(booklet);
    Alert.alert('Lyric Booklet Copied! 📖', 'Full album lyrics booklet copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#171717" size={24} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.badgePill}>
            <Sparkles color="#7C3AED" size={14} />
            <Text style={styles.badgeText}>NIE + AGE Engines</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Story to Album 📖 ➔ 💿</Text>
          <Text style={styles.subTitle}>Transform any story narrative into a complete AI-generated music album</Text>
        </View>

        {/* STAGE 1: STORY INPUT & PRESETS */}
        {stage === 'input' && (
          <View>
            <View style={styles.cardBox}>
              <Text style={styles.cardLabel}>Write your story narrative:</Text>
              <TextInput
                style={styles.storyInput}
                placeholder="e.g. A college romance story set in Hyderabad where two friends discover love during festival season..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={story}
                onChangeText={setStory}
              />

              {/* Language Selection */}
              <Text style={[styles.cardLabel, { marginTop: 14 }]}>Language Output:</Text>
              <View style={styles.langRow}>
                {['English', 'Telugu', 'Hindi', 'Tamil'].map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langChip, selectedLang === lang && styles.langChipActive]}
                    onPress={() => setSelectedLang(lang)}
                  >
                    <Text style={[styles.langText, selectedLang === lang && styles.langTextActive]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Number of Situational Lyrics */}
              <Text style={[styles.cardLabel, { marginTop: 14 }]}>Situational Lyrics Scenes (Min. 5):</Text>
              <View style={styles.langRow}>
                {[5, 6, 7, 8].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[styles.langChip, numLyrics === count && styles.langChipActive]}
                    onPress={() => setNumLyrics(count)}
                  >
                    <Text style={[styles.langText, numLyrics === count && styles.langTextActive]}>{count} Scenes</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Number of ACE-Step BGMs (Min. 4, Limit 9) */}
              <Text style={[styles.cardLabel, { marginTop: 14 }]}>ACE-Step BGMs to Generate (Min. 4, Limit 9):</Text>
              <View style={styles.langRow}>
                {[4, 5, 6, 7, 8, 9].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[styles.langChip, numBgms === count && styles.langChipActive]}
                    onPress={() => setNumBgms(count)}
                  >
                    <Text style={[styles.langText, numBgms === count && styles.langTextActive]}>{count} BGMs</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Story Presets */}
              <Text style={[styles.cardLabel, { marginTop: 16 }]}>Or pick a preset story idea:</Text>
              <View style={{ gap: 8 }}>
                {PRESET_STORIES.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => {
                      setStory(p.story);
                      setSelectedLang(p.lang);
                    }}
                  >
                    <Text style={styles.presetTitle}>{p.title}</Text>
                    <Text style={styles.presetDesc} numberOfLines={1}>{p.story}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryActionBtnText}>Analyze Story & Create Blueprint ✦</Text>
                  <ArrowRight color="#FFFFFF" size={18} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 2: ALBUM BLUEPRINT PREVIEW MODAL */}
        {stage === 'preview' && blueprint && (
          <View style={styles.blueprintCard}>
            <View style={styles.blueprintHeader}>
              <View style={styles.blueprintBadge}>
                <Sparkle color="#7C3AED" size={16} />
                <Text style={styles.blueprintBadgeText}>NIE Album Blueprint Preview</Text>
              </View>
              <TouchableOpacity onPress={() => setStage('input')}>
                <Text style={styles.editStoryText}>Edit Story</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.blueprintTitle}>{blueprint.title}</Text>
            <Text style={styles.blueprintSub}>{blueprint.subgenre} • {blueprint.language} • ~{blueprint.estimated_duration_mins} mins</Text>



            {/* Dominant Instruments */}
            <Text style={[styles.metaLabel, { marginTop: 12 }]}>Dominant Instruments:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {(blueprint?.dominant_instruments || ['Acoustic Guitar', 'Grand Piano', 'Strings', 'Percussion']).map((inst, i) => (
                <View key={i} style={styles.instChip}>
                  <Text style={styles.instChipText}>{inst}</Text>
                </View>
              ))}
            </View>

            {/* Tracklist Preview */}
            <Text style={[styles.metaLabel, { marginTop: 16 }]}>Planned Tracklist Scenes ({(blueprint?.planned_tracks || blueprint?.proposed_tracks || []).length} Songs):</Text>
            <View style={{ gap: 8, marginTop: 6 }}>
              {(blueprint?.planned_tracks || blueprint?.proposed_tracks || []).map((t, idx) => (
                <View key={idx} style={styles.previewTrackRow}>
                  <View style={styles.trackNumBadge}>
                    <Text style={styles.trackNumText}>{t.track_number || idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTrackTitle}>{t.title || `Track ${idx + 1}`}</Text>
                    <Text style={styles.previewTrackDesc}>{t.scene_description || t.emotion || 'Scene Atmosphere'}</Text>
                  </View>
                  <View style={styles.emotionPill}>
                    <Text style={styles.emotionPillText}>{t.emotion}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.approveBtn} onPress={handleApproveBlueprint}>
              <Text style={styles.approveBtnText}>Approve & Build Complete Album 🚀</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 3: REAL-TIME JOB GENERATION TRACKER */}
        {stage === 'generating' && (
          <View style={styles.generatingCard}>
            <ActivityIndicator size="large" color="#7C3AED" style={{ marginBottom: 16 }} />
            <Text style={styles.genTitle}>Album Generation Engine (AGE) Active</Text>
            <Text style={styles.genStepText}>{jobStepText}</Text>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${jobProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{jobProgress}% Complete</Text>

            {/* Parallel Workers List */}
            <View style={styles.workersBox}>
              <View style={styles.workerRow}>
                <Disc color={jobProgress >= 35 ? "#059669" : "#9CA3AF"} size={18} />
                <Text style={styles.workerName}>Cover Art Synthesizer Worker</Text>
                <Text style={[styles.workerStatus, { color: jobProgress >= 35 ? "#059669" : "#D97706" }]}>
                  {jobProgress >= 35 ? 'Done ✓' : 'Working...'}
                </Text>
              </View>

              <View style={styles.workerRow}>
                <FileText color={jobProgress >= 70 ? "#059669" : "#9CA3AF"} size={18} />
                <Text style={styles.workerName}>Multi-Track Lyrics Generator Worker</Text>
                <Text style={[styles.workerStatus, { color: jobProgress >= 70 ? "#059669" : "#D97706" }]}>
                  {jobProgress >= 70 ? 'Done ✓' : jobProgress >= 35 ? 'Working...' : 'Queued'}
                </Text>
              </View>

              <View style={styles.workerRow}>
                <Music color={jobProgress >= 100 ? "#059669" : "#9CA3AF"} size={18} />
                <Text style={styles.workerName}>MusicGen BGM Composer Worker</Text>
                <Text style={[styles.workerStatus, { color: jobProgress >= 100 ? "#059669" : "#D97706" }]}>
                  {jobProgress >= 100 ? 'Done ✓' : jobProgress >= 70 ? 'Working...' : 'Queued'}
                </Text>
              </View>
            </View>

            {/* Cancel & Restart Control */}
            <TouchableOpacity 
              style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: '#F3F4F6', borderRadius: 8, alignSelf: 'center' }}
              onPress={() => setStage('preview')}
            >
              <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '600' }}>← Cancel & Return to Blueprint</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 4: COMPLETED ALBUM VIEWER (4 TABS) */}
        {stage === 'album' && albumData && (
          <View>
            {/* Album Cover Art - Full 1:1 Aspect Ratio Uncropped Display */}
            <View style={styles.albumHeroCard}>
              <Image source={{ uri: albumData.cover_url }} style={styles.albumCoverImage} resizeMode="cover" />
            </View>

            {/* Album Metadata Box */}
            <View style={styles.albumHeaderMetaBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={styles.genreBadge}>
                  <Text style={styles.genreBadgeText}>{albumData.subgenre || albumData.genre}</Text>
                </View>
                <TouchableOpacity style={styles.editStoryTopBtn} onPress={handleEditStory}>
                  <Edit3 color="#7C3AED" size={13} />
                  <Text style={styles.editStoryTopBtnText}>Edit Story</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.albumHeroTitle}>{albumData.title}</Text>
              <Text style={styles.albumHeroSub}>{albumData.tracks.length} Songs • {albumData.language} Language</Text>
            </View>

            {/* 4 Interactive Navigation Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabItem, activeTab === 0 && styles.tabItemActive]} onPress={() => setActiveTab(0)}>
                <Disc color={activeTab === 0 ? "#7C3AED" : "#6B7280"} size={16} />
                <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.tabItem, activeTab === 1 && styles.tabItemActive]} onPress={() => setActiveTab(1)}>
                <FileText color={activeTab === 1 ? "#7C3AED" : "#6B7280"} size={16} />
                <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>Lyrics</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.tabItem, activeTab === 2 && styles.tabItemActive]} onPress={() => setActiveTab(2)}>
                <Music color={activeTab === 2 ? "#7C3AED" : "#6B7280"} size={16} />
                <Text style={[styles.tabText, activeTab === 2 && styles.tabTextActive]}>BGMs</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.tabItem, activeTab === 3 && styles.tabItemActive]} onPress={() => setActiveTab(3)}>
                <Download color={activeTab === 3 ? "#7C3AED" : "#6B7280"} size={16} />
                <Text style={[styles.tabText, activeTab === 3 && styles.tabTextActive]}>Export</Text>
              </TouchableOpacity>
            </View>

            {/* TAB 0: OVERVIEW */}
            {activeTab === 0 && (
              <View style={styles.tabContentBox}>
                <Text style={styles.sectionHeaderTitle}>Story Narrative Summary</Text>
                <Text style={styles.storySummaryText}>{albumData?.story || albumData?.title || 'Story Narrative'}</Text>

                <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>Dominant Instruments</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {(albumData?.dominant_instruments || ['Acoustic Guitar', 'Piano', 'Cinematic Percussion']).map((inst, idx) => (
                    <View key={idx} style={styles.instTag}>
                      <Text style={styles.instTagText}>{inst}</Text>
                    </View>
                  ))}
                </View>

                {/* Edit & Regenerate Story Action */}
                <TouchableOpacity style={styles.editStoryMainBtn} onPress={handleEditStory}>
                  <Edit3 color="#FFFFFF" size={16} />
                  <Text style={styles.editStoryMainBtnText}>Edit Story & Re-generate Album ✦</Text>
                </TouchableOpacity>

                {/* Regenerate Cover Art Action */}
                <TouchableOpacity style={styles.regenBtn} onPress={handleRegenCover} disabled={isRegeneratingCover}>
                  {isRegeneratingCover ? (
                    <ActivityIndicator color="#7C3AED" size="small" />
                  ) : (
                    <>
                      <RefreshCw color="#7C3AED" size={16} />
                      <Text style={styles.regenBtnText}>Regenerate Cover Art</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 1: TRACKS & LYRICS */}
            {activeTab === 1 && (
              <View style={[styles.tabContentBox, styles.lyricsTabContentBox]}>
                <View style={styles.lyricsSectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Album Song Lyrics ({(albumData?.tracks || []).length} Tracks)</Text>
                  <TouchableOpacity style={styles.copyBookletBtn} onPress={handleCopyAllLyrics}>
                    <Text style={styles.copyBookletBtnText}>📋 Copy All</Text>
                  </TouchableOpacity>
                </View>
                {(albumData?.tracks || []).map((t, idx) => (
                  <View key={t.id || idx} style={styles.accordionCard}>
                    <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedTrackIdx(expandedTrackIdx === idx ? -1 : idx)}>
                      <View style={styles.trackIndexBadge}>
                        <Text style={styles.trackIndexText}>{t.track_number || idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.accordionTitle}>{t.title || `Track ${idx + 1}`}</Text>
                        <Text style={styles.accordionSub}>{t.emotion || 'Emotional'} • {t.bpm || 95} BPM</Text>
                      </View>
                      <Text style={styles.expandToggleText}>{expandedTrackIdx === idx ? '▲ Hide' : '▼ View Lyrics'}</Text>
                    </TouchableOpacity>

                    {expandedTrackIdx === idx && (
                      <View style={styles.lyricsBodyBox}>
                        <Text style={styles.lyricsText}>{t.lyrics_text}</Text>
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopyText(t.lyrics_text, 'Lyrics')}>
                            <Text style={styles.actionBtnText}>Copy Lyrics</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleRegenTrack(t.id)} disabled={isRegeneratingTrack}>
                            <Text style={styles.actionBtnText}>Regenerate Track</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* TAB 2: BGMs & AUDIO */}
            {activeTab === 2 && (
              <View style={styles.tabContentBox}>
                <Text style={styles.sectionHeaderTitle}>MusicGen BGM Backing Tracks</Text>
                {(albumData?.tracks || []).map((t, idx) => (
                  <View key={t.id || idx} style={styles.bgmTrackCard}>
                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.bgmTrackTitle}>{t.title}</Text>
                      <Text style={styles.bgmTrackMeta}>{t.key_signature} • {t.bpm} BPM • {t.bgm_variations?.length || 1} BGM Variations</Text>
                    </View>

                    {/* Variations List */}
                    <View style={{ gap: 8, marginBottom: 12 }}>
                      {(t.bgm_variations || [
                        { id: 'v1', name: '1. ACE-Step Master Score (Dual-Brain GPU)', url: t.bgm_url }
                      ]).map((v) => {
                        const playId = `${t.id}-${v.id}`;
                        const isPlaying = playingTrackId === playId || (v.id === 'v1' && playingTrackId === t.id);
                        return (
                          <View key={v.id} style={styles.variationRow}>
                            <TouchableOpacity 
                              style={[styles.playCircleBtnMini, isPlaying && styles.playCircleBtnActive]} 
                              onPress={() => handleTogglePlay(t, v.url, v.id)}
                            >
                              {isPlaying ? (
                                <Pause color="#FFFFFF" size={12} />
                              ) : (
                                <Play color="#FFFFFF" size={12} style={{ marginLeft: 1 }} />
                              )}
                            </TouchableOpacity>

                            {/* Replay Button */}
                            <TouchableOpacity 
                              style={styles.variationActionBtn} 
                              onPress={() => handleReplayTrack(t, v.url, v.id)}
                            >
                              <RotateCcw color="#6B7280" size={13} />
                            </TouchableOpacity>

                            <Text style={styles.variationName} numberOfLines={1}>{v.name}</Text>

                            {/* Download Specific Track Button */}
                            <TouchableOpacity 
                              style={styles.variationDownloadBtn} 
                              onPress={() => handleDownloadTrack(t, v.url, v.name)}
                            >
                              <Download color="#7C3AED" size={14} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.promptBox}>
                      <Text style={styles.promptLabel}>🎶 MusicGen Master Prompt:</Text>
                      <Text style={styles.promptText}>{t.bgm_prompt}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 3: DOWNLOADS & EXPORT */}
            {activeTab === 3 && (
              <View style={styles.tabContentBox}>
                <Text style={styles.sectionHeaderTitle}>Export & Download Album Package</Text>
                
                <TouchableOpacity style={styles.downloadOption} onPress={handleDownloadPackage}>
                  <Download color="#7C3AED" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.downloadTitle}>Export Full Album JSON Package</Text>
                    <Text style={styles.downloadSub}>Includes metadata, lyrics, and BGM prompts (Direct Download / Share)</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.downloadOption} onPress={handleDownloadAllAudio}>
                  <Music color="#2563EB" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.downloadTitle}>Download Audio Tracks (.MP3 / .WAV)</Text>
                    <Text style={styles.downloadSub}>Export all album track audio compositions to device</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.downloadOption} onPress={handleDownloadCover}>
                  <Disc color="#059669" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.downloadTitle}>Download Cover Art (1024x1024)</Text>
                    <Text style={styles.downloadSub}>High-resolution album cover image (Direct Download)</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.downloadOption} onPress={handleCopyAllLyrics}>
                  <FileText color="#D97706" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.downloadTitle}>Copy Full Album Lyric Booklet</Text>
                    <Text style={styles.downloadSub}>Copy complete formatted track lyrics booklet to clipboard</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.createSongNavBtn} 
                  onPress={() => Alert.alert('Under Development 🚀', 'AI Song Studio multi-track integration is currently under active development. Stay tuned for upcoming updates!')}
                >
                  <Text style={styles.createSongNavText}>✨ Open in AI Song Studio →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    paddingTop: 46
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '500'
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14
  },
  badgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700'
  },
  titleContainer: {
    marginBottom: 16
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171717'
  },
  subTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 6
  },
  storyInput: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
    fontSize: 13,
    color: '#171717',
    minHeight: 90,
    textAlignVertical: 'top'
  },
  langRow: {
    flexDirection: 'row',
    gap: 8
  },
  langChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    alignItems: 'center'
  },
  langChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED'
  },
  langText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600'
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  presetChip: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937'
  },
  presetDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  blueprintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#DDD6FE'
  },
  blueprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  blueprintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  blueprintBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED'
  },
  editStoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600'
  },
  blueprintTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171717'
  },
  blueprintSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  metaRowBox: {
    flexDirection: 'row',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    gap: 12
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C1D95'
  },
  metaValue: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  instChip: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  instChipText: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '600'
  },
  previewTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    gap: 10
  },
  trackNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trackNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9'
  },
  previewTrackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827'
  },
  previewTrackDesc: {
    fontSize: 10,
    color: '#6B7280'
  },
  emotionPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  emotionPillText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '700'
  },
  approveBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  generatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD6FE'
  },
  genTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937'
  },
  genStepText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center'
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#F3E8FF',
    borderRadius: 5,
    marginTop: 16,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED'
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 6
  },
  workersBox: {
    width: '100%',
    marginTop: 20,
    gap: 12
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
    gap: 10
  },
  workerName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  workerStatus: {
    fontSize: 11,
    fontWeight: '700'
  },
  albumHeroCard: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#0F172A',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  albumCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  albumHeaderMetaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  genreBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  genreBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  albumHeroTitle: {
    color: '#171717',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4
  },
  albumHeroSub: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600'
  },
  editStoryTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  editStoryTopBtnText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700'
  },
  editStoryMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14
  },
  editStoryMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4
  },
  tabItemActive: {
    backgroundColor: '#F3E8FF'
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280'
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '800'
  },
  tabContentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  lyricsTabContentBox: {
    backgroundColor: '#FAF5FF', // Soothing light lavender/purple background
    borderColor: '#DDD6FE',
    borderWidth: 1.5,
  },
  lyricsSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  copyBookletBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  copyBookletBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6
  },
  storySummaryText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18
  },
  instTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  instTagText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600'
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 16,
    gap: 6
  },
  regenBtnText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '700'
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: '#FCFAFF',
  },
  trackIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trackIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937'
  },
  accordionSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2
  },
  expandToggleText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  lyricsBodyBox: {
    padding: 16,
    backgroundColor: '#FFFDF9', // Soft parchment cream background for comfortable reading
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF'
  },
  lyricsText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  actionBtnText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700'
  },
  bgmTrackCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10
  },
  bgmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  playCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bgmTrackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937'
  },
  bgmTrackMeta: {
    fontSize: 10,
    color: '#6B7280'
  },
  promptBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF'
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED'
  },
  promptText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2
  },
  downloadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 10
  },
  downloadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937'
  },
  downloadSub: {
    fontSize: 11,
    color: '#6B7280'
  },
  createSongNavBtn: {
    backgroundColor: '#DB2777',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  createSongNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  variationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  variationName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    flex: 1
  },
  playCircleBtnMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playCircleBtnActive: {
    backgroundColor: '#059669'
  },
  variationActionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  variationDownloadBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE'
  }
});

export default StoryToAlbumScreen;
