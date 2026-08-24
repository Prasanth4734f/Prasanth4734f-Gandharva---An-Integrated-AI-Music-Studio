const https = require('https');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash'
];

/**
 * Call Google Gemini Flash API for rapid songwriting with multi-model resilience
 */
async function callGeminiPrompt(systemPrompt, userPrompt, temperature = 0.9) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const payload = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: temperature,
      topP: 0.95,
      maxOutputTokens: 2500,
    }
  });

  for (const model of CANDIDATE_MODELS) {
    try {
      const text = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 10000
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(body);
                let text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
                resolve(text);
              } catch (e) {
                reject(new Error('Failed to parse Gemini response'));
              }
            } else {
              reject(new Error(`Gemini API HTTP ${res.statusCode}: ${body.substring(0, 120)}`));
            }
          });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Gemini API call timed out on ${model}`));
        });

        req.write(payload);
        req.end();
      });

      if (text && text.length > 30) {
        return text;
      }
    } catch (err) {
      console.warn(`[Lyrics Gemini] Model ${model} warning: ${err.message}. Trying next model...`);
    }
  }

  throw new Error('All Gemini candidate models were unavailable.');
}

/**
 * Generate 2 unique, full-length non-repeating variations + BGM prompt via Gemini
 */
async function generateAiLyricsWithVariations({ prompt, genre = 'Pop', mood = 'Inspiring', language = 'Telugu' }) {
  const cleanTopic = (prompt || 'Love and Life').trim();
  const langLower = (language || 'telugu').toLowerCase();

  let tagGuide = '';
  if (langLower === 'telugu') {
    tagGuide = `You MUST include ALL of the following distinct song sections with full lyrics (at least 22-30 lines total):
[హుక్ / ఇంట్రో] (4 lines)
[పల్లవి] (4-6 lines - main catchy chorus)
[చరణం 1] (4-6 lines - story verse)
[చరణం 2] (4-6 lines - emotional second verse)
[వంత / బ్రిడ్జ్] (3-4 lines - musical vocal peak)
[ముగింపు] (3-4 lines - final outro)`;
  } else if (langLower === 'hindi') {
    tagGuide = `You MUST include ALL of the following distinct song sections with full lyrics (at least 22-30 lines total):
[हुक / इंट्रो] (4 lines)
[मुखड़ा] (4-6 lines - main catchy chorus)
[अंतरा 1] (4-6 lines - story verse)
[अंतरा 2] (4-6 lines - emotional second verse)
[ब्रिज] (3-4 lines - vocal climax)
[आउट्रो] (3-4 lines - final outro)`;
  } else if (langLower === 'tamil') {
    tagGuide = `You MUST include ALL of the following distinct song sections with full lyrics (at least 22-30 lines total):
[ஹூக் / இன்ட்ரோ] (4 lines)
[பல்லவி] (4-6 lines - main chorus)
[சரணம் 1] (4-6 lines - first verse)
[சரணம் 2] (4-6 lines - second verse)
[பிரிட்ஜ்] (3-4 lines - musical peak)
[முடிவு / அவுட்ரோ] (3-4 lines - final outro)`;
  } else {
    tagGuide = `You MUST include ALL of the following distinct song sections with full lyrics (at least 22-30 lines total):
[Intro / Hook] (4 lines)
[Verse 1] (4-6 lines - story verse)
[Chorus] (4-6 lines - catchy main chorus)
[Verse 2] (4-6 lines - emotional second verse)
[Bridge] (3-4 lines - vocal climax / musical shift)
[Outro] (3-4 lines - final fadeout)`;
  }

  // Distinct Style Persona for Variation A: Poetic, Emotional, Melodic Metaphors (Full Song)
  const promptA = `You are an award-winning master music lyricist. Write a COMPLETE, FULL-LENGTH commercial song in ${language} for the theme: "${cleanTopic}".
Genre: ${genre} | Mood: ${mood}.
Style: Deep, poetic, heartfelt, rich metaphors, classical melodic flow.

STRUCTURE REQUIREMENTS:
${tagGuide}

Do NOT write a short snippet. Write the full 22-30 lines of complete lyrics.
Do NOT write conversational remarks or explanations. Output ONLY the complete song lyrics with section tags.`;

  // Distinct Style Persona for Variation B: Catchy, Dynamic, Fast Rhythm & Rhymes (Full Song)
  const promptB = `You are a modern chart-topping hit songwriter and composer. Write a COMPLETELY DIFFERENT, FULL-LENGTH alternative version of song lyrics in ${language} for the theme: "${cleanTopic}".
Genre: ${genre} | Mood: ${mood}.
Style: High-energy, modern rhythmic bounce, catchy vocal hooks, conversational power rhymes. Use completely DIFFERENT vocabulary, phrasing, and flow than a classical poem.

STRUCTURE REQUIREMENTS:
${tagGuide}

Do NOT write a short snippet. Write the full 22-30 lines of complete lyrics.
Do NOT write conversational remarks or explanations. Output ONLY the complete song lyrics with section tags.`;

  // BGM Producer Prompt
  const promptBgm = `Write a 2-line technical audio producer prompt describing the perfect instrumental arrangement for a ${genre} ${mood} song titled "${cleanTopic}". Include BPM, Key signature, and featured instruments.`;

  // Run in parallel for ultra-fast generation
  const [lyricsA, lyricsB, bgmText] = await Promise.all([
    callGeminiPrompt('Write full-length Variation A lyrics.', promptA, 0.88),
    callGeminiPrompt('Write full-length Variation B lyrics.', promptB, 0.98),
    callGeminiPrompt('Write a BGM prompt.', promptBgm, 0.7).catch(() => `Master ${genre} instrumental arrangement with ${mood} atmosphere. 120 BPM, Key of C Major. Layered acoustic and electric instruments.`)
  ]);

  return {
    project_id: `gandharva-ai-${Date.now()}`,
    title: `${mood} ${genre}: ${cleanTopic.substring(0, 24)}`,
    variations: [
      {
        id: `gandharva-var-A-${Date.now()}`,
        version_name: 'Variation A',
        title: `${cleanTopic} - Variation A (Soulful Poetic)`,
        lyrics_text: lyricsA,
        engine: 'Gandharva Gemini AI Engine',
        fallback_used: false
      },
      {
        id: `gandharva-var-B-${Date.now()}`,
        version_name: 'Variation B',
        title: `${cleanTopic} - Variation B (Rhythmic Dynamic)`,
        lyrics_text: lyricsB,
        engine: 'Gandharva Gemini AI Engine',
        fallback_used: false
      },
      {
        id: `gandharva-var-bgm-${Date.now()}`,
        version_name: '🎶 BGM Prompt',
        title: `${cleanTopic} - AI BGM Arrangement`,
        lyrics_text: bgmText,
        engine: 'Gandharva AI BGM Prompt Engine',
        fallback_used: false
      }
    ],
    success: true,
    source: 'Gandharva Gemini AI Songwriting Engine'
  };
}

module.exports = {
  generateAiLyricsWithVariations
};
