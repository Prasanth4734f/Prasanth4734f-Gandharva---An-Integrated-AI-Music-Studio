/**
 * Gandharva Prompt Optimizer
 * Transforms simple user input into high-quality cinematic AI prompts.
 */

const OPTIMIZER_MAP = {
  'Lofi': 'lofi hip hop beat, chill aesthetic, mellow drums, emotional electric piano, jazzy chords, high fidelity, 4k audio quality',
  'EDM': 'energetic electronic dance music, powerful bassline, cinematic synths, high energy, crisp production, festival atmosphere',
  'Chill': 'atmospheric ambient soundtrack, immersive textures, deep calm, emotional environmental audio, high-quality cinematic sound design',
  'Sad': 'melancholic emotional piano, cinematic strings, mournful atmosphere, deep resonance, heartbreaking melody, pristine quality',
  'Cinematic': 'orchestral cinematic soundtrack, epic brass, heroic percussion, immersive storytelling atmosphere, wide soundstage',
  'Cyberpunk': 'futuristic synthwave electronic, neon cyberpunk atmosphere, gritty bass, energetic gaming ambience, immersive electronic textures',
  'Gym': 'aggressive phonk workout music, cowbell melodies, high energy, driving bass, motivational intense atmosphere',
  'Phonk': 'dark atmospheric phonk, drift style, distorted bass, cowbell rhythm, underground aesthetic, high energy',
};

const optimizePrompt = (userPrompt, genre = 'Chill') => {
  const descriptors = OPTIMIZER_MAP[genre] || OPTIMIZER_MAP['Chill'];
  
  // Combine user intent with cinematic descriptors
  const optimized = `${userPrompt}. ${descriptors}. Cinematic immersion, high definition, detailed soundscape, no noise, professional mix.`;
  
  console.log(`[Optimizer] Raw: "${userPrompt}"`);
  console.log(`[Optimizer] Enhanced: "${optimized}"`);
  
  return optimized;
};

module.exports = { optimizePrompt };

