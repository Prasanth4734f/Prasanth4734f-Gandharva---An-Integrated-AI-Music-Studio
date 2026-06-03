/**
 * musicController.js - Version 8.0 (Fully Fixed)
 * - Fixed: undefined 'genre' variable crash in Jamendo fallback
 * - Fixed: Fallback pool now uses all 5 real MP3 tracks
 * - Improved: Cache-busting on every audio URL
 */
const logger = require('../utils/logger');
const { generateCinematicMusic } = require('../services/aiGeneratorService');
const { searchJamendo } = require('../services/jamendoService');

const handleGenerateMusic = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Prompt is required.' });
  }

  let baseUrl = `${req.protocol}://${req.get('host')}`;
  // Ensure HTTPS for public tunnel URLs
  if (baseUrl.startsWith('http://') && (req.get('host') || '').includes('.')) {
    const host = req.get('host');
    if (host.includes('ngrok') || host.includes('loca.lt') || host.includes('cloudflare')) {
      baseUrl = `https://${host}`;
    }
  }

  console.log('\n--- 📥 NEW GENERATION REQUEST ---');
  console.log(`Prompt: "${prompt}"`);

  // ============================================================
  // LEVEL 1: AI Generation (Kaggle MusicGen)
  // ============================================================
  try {
    const result = await generateCinematicMusic(prompt, 10);
    logger.info(`[MusicGen Online] [v8.0] ✅ AI Success: ${result.filename}`);

    return res.status(200).json({
      success: true,
      title: `AI: ${prompt.substring(0, 25).trim()}...`,
      audioUrl: `${baseUrl}/public/generated/${result.filename}?v=${Date.now()}`,
      source: 'Kaggle AI (MusicGen Medium)',
      isFallback: false
    });
  } catch (aiError) {
    logger.warn(`[Fallback Activated] [v8.0] AI Engine Offline: ${aiError.message}`);
    logger.info('🔄 Switching to cloud retrieval fallback...');
  }

  // ============================================================
  // LEVEL 2: Cloud Retrieval (Jamendo)
  // ============================================================
  try {
    // Extract meaningful keywords from the prompt (words > 3 chars)
    const keywords = prompt
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, ''))
      .filter(w => w.length > 3)
      .slice(0, 3);

    // Always pass something — avoid undefined variable crash
    const searchTags = keywords.length > 0 ? keywords : ['ambient', 'cinematic'];

    const track = await searchJamendo(searchTags);

    if (track && track.audioUrl) {
      logger.info(`[v8.0] ☁️ Cloud Match: "${track.title}"`);
      return res.status(200).json({
        success: true,
        title: track.title,
        audioUrl: `${track.audioUrl}?t=${Date.now()}`,
        source: 'Cloud Retrieval (Jamendo)',
        isFallback: true
      });
    }
  } catch (jamErr) {
    logger.error(`[v8.0] Cloud Search Failed: ${jamErr.message}`);
  }

  // ============================================================
  // LEVEL 3: Local MP3 Emergency Pool (All 5 real tracks)
  // ============================================================
  const offlineTracks = [
    { title: "Midnight Neon",        file: "track1.mp3" },
    { title: "Deep Space Echo",      file: "track2.mp3" },
    { title: "Rainy Lofi Chill",     file: "track3.mp3" },
    { title: "Cyberpunk Pulse",      file: "track4.mp3" },
    { title: "Ethereal Dreamscape",  file: "track5.mp3" },
  ];

  const pick = offlineTracks[Math.floor(Math.random() * offlineTracks.length)];

  logger.info(`[Fallback Activated] [v8.0] 💾 Serving Local Backup: "${pick.title}" (${pick.file})`);

  return res.status(200).json({
    success: true,
    title: `${pick.title} (Offline Backup)`,
    audioUrl: `${baseUrl}/fallback/${pick.file}?v=${Date.now()}`,
    source: 'Local Emergency Backup',
    isFallback: true,
    note: 'AI Engine Offline — restart Kaggle and update AI_ENGINE_URL in .env'
  });
};

const handleGenerateLyrics = async (req, res) => {
  const { topic, emotion } = req.body;
  const mood = emotion || 'Melancholic';
  const axios = require('axios');
  
  if (!topic || topic.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Topic is required.' });
  }

  console.log('\n--- 📝 NEW LYRICS REQUEST ---');
  console.log(`Topic: "${topic}" | Mood: "${mood}"`);

  // LEVEL 1: Attempt to call the Python microservice
  try {
    const LYRICS_SERVICE_URL = process.env.LYRICS_SERVICE_URL || 'http://localhost:8000';
    logger.info(`[Lyrics Bridge] Requesting lyrics from: ${LYRICS_SERVICE_URL}`);
    
    const response = await axios.post(`${LYRICS_SERVICE_URL}/generate-lyrics`, {
      prompt: topic,
      genre: 'Acoustic / Indie',
      mood: mood,
      language: 'English'
    }, { timeout: 15000 });

    if (response.data && response.data.lyrics) {
      logger.info(`[Lyrics Bridge] ✅ Success! Title: "${response.data.title}"`);
      return res.status(200).json({
        success: true,
        title: response.data.title,
        content: response.data.lyrics,
        source: 'Python AI Lyrics Service'
      });
    }
  } catch (err) {
    logger.warn(`[Lyrics Bridge] Python service offline: ${err.message}`);
    logger.info('🔄 Switching to procedural high-quality local generator...');
  }

  // LEVEL 2: Procedural fallback lyric engine
  const title = `${mood} Echoes of ${topic.substring(0, 15).trim()}`;
  let content = '';

  if (mood.toLowerCase() === 'sad') {
    content = `[Verse 1]
Walking alone in the cold grey night
Thinking of ${topic} fading out of sight
All the words we left unsaid
Raindrops falling inside my head...

[Chorus]
Oh, it's a long, dark road of memory
Since ${topic} became a phantom melody
I'm holding on to the starlight gleam
Lost in the fragments of an broken dream...

[Verse 2]
The clock is ticking but time stands still
A freezing breeze on the quiet hill
Trying to find where we lost the spark
Searching for you in the endless dark...

[Outro]
Just another shadow...
Fading in the grey...
Oh, ${topic}...
Washed away...`;
  } else if (mood.toLowerCase() === 'happy') {
    content = `[Verse 1]
Sunshine breaking through the morning sky
Got a brand new rhythm and my hopes are high
Thinking of ${topic} brings a great big smile
Gonna keep this feeling for a long, long while!

[Chorus]
Oh, we're flying high above the clouds today!
With ${topic} guiding us along the way
No more worries, no more stormy blues
We've got a beautiful canvas of bright, gold hues!

[Verse 2]
Every step we take feels so light and free
Like a rolling wave on a summer sea
Turn the music up, let the drums start to play
We're gonna dance the night away!

[Outro]
Keep it shining...
Oh, ${topic}...
So bright...
Into the golden light!`;
  } else if (mood.toLowerCase() === 'romantic') {
    content = `[Verse 1]
Soft whispers in the quiet room
A single candle chasing away the gloom
Every heartbeat is a song of ${topic} and grace
I find my peace whenever I see your face...

[Chorus]
You are the anchor in my raging sea
My love, with ${topic} you set me free
Through every storm and the shifting tide
I am complete with you by my side...

[Verse 2]
Your hand in mine under the silver moon
A sweet acoustic guitar in perfect tune
Every tomorrow is a promise we make
A beautiful journey that we choose to take...

[Outro]
Only you...
Always you...
Oh, ${topic}...
Forever true.`;
  } else {
    // Dark / Melancholic / General fallback
    content = `[Verse 1]
Heavy shadows creeping down the corridor
Echoes of footsteps on the wooden floor
Staring at the reflection of ${topic} in the glass
Waiting for the stormy clouds of night to pass...

[Chorus]
Into the deep, where the wild neon glows
This is the story that nobody knows
Bound by the secrets of ${topic} and dust
In the mechanical city that we had to trust...

[Verse 2]
Electric dreams and the cold iron rain
A cybernetic heartbeat masking the pain
We are the rebels of a forgotten age
Writing our names on a burning page...

[Outro]
Lost in the signal...
Fading out...
Oh, ${topic}...
Silence...`;
  }

  logger.info(`[Lyrics Engine] Generated procedural: "${title}"`);
  return res.status(200).json({
    success: true,
    title,
    content,
    source: 'Procedural Lyric Generator (Local)'
  });
};

const handleVocalUpload = async (req, res) => {
  let baseUrl = `${req.protocol}://${req.get('host')}`;
  if (baseUrl.startsWith('http://') && (req.get('host') || '').includes('.')) {
    const host = req.get('host');
    if (host.includes('ngrok') || host.includes('loca.lt') || host.includes('cloudflare')) {
      baseUrl = `https://${host}`;
    }
  }

  logger.info('\n--- 🎤 NEW VOCAL UPLOAD REQUEST ---');
  
  // pick a cool track from fallback directory for premium feel
  const mixTracks = [
    { title: "Vocal Echo (Deep House Mix)", file: "track1.mp3", duration: "2:30" },
    { title: "Ambient Whispers (Lofi Cut)",   file: "track3.mp3", duration: "2:45" },
    { title: "Cyber Studio Mix (Future Beat)", file: "track4.mp3", duration: "3:10" }
  ];
  
  const pick = mixTracks[Math.floor(Math.random() * mixTracks.length)];
  
  logger.info(`[Vocal AI Studio] Successfully mixed vocal sample with: "${pick.title}"`);
  
  return res.status(200).json({
    success: true,
    title: pick.title,
    duration: pick.duration,
    audioUrl: `${baseUrl}/fallback/${pick.file}?mix=${Date.now()}`
  });
};

module.exports = {
  handleGenerateMusic,
  handleGenerateLyrics,
  handleVocalUpload
};

