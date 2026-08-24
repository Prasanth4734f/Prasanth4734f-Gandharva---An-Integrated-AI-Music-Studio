/**
 * PromptEnhancer Engine (GANDHARVA Fallback Engine)
 * A self-contained, rule-based production generator for transforming basic user prompts
 * into single continuous, highly detailed, film-producer level prompts (150-200 words).
 * 
 * Preserves the exact user meaning, story, and emotion.
 */

const CATEGORIES = {
  sad_separation: {
    match: /(separat|breakup|misunderstand|divorce|broken|apart|leave|left)/i,
    genre: "Emotional Cinematic Orchestral Score",
    tempo: "around 68 BPM",
    intro: "begins with a warm, intimate acoustic piano melody echoing fond past memories",
    mid: "gradually builds as melancholic cello solos and delicate violin textures weave in, expressing deepening emotional tension and tragic longing",
    climax: "reaches a poignant emotional climax with rich string swells and gentle ambient pads",
    outro: "subsides into a quiet, solitary acoustic piano coda with lingering emotional resonance",
    instruments: "grand piano, weeping cello, soft string section, and subtle ambient pads"
  },
  sad_emotional: {
    match: /(sad|lonely|pain|cry|tear|grief|sorrow|loss|remembering|rain|alone)/i,
    genre: "Melancholic Cinematic Soundtrack",
    tempo: "around 64 BPM",
    intro: "opens with a solitary piano motif set against soft rain ambiance and gentle pad textures",
    mid: "unfolds gracefully with a deeply expressive solo cello and warm orchestral strings that swell with poignant nostalgia",
    climax: "rises into an emotionally surging crescendo with soaring violin harmonies",
    outro: "gently fades into quiet lingering piano notes that leave a reflective, bittersweet atmosphere",
    instruments: "solo grand piano, expressive cello, soft string quartet, and ambient pads"
  },
  maternal_love: {
    match: /(mother|mom|son|child|baby|sacrifice|family|lullaby)/i,
    genre: "Heartfelt Cinematic Lullaby & Acoustic Score",
    tempo: "around 70 BPM",
    intro: "starts with a soothing acoustic guitar and gentle music box melody radiating warmth and unconditional love",
    mid: "blends tender woodwinds, soft piano chords, and comforting cellos to illustrate a life of devotion and selfless sacrifice",
    climax: "builds into an uplifting, deeply moving orchestral embrace filled with warmth",
    outro: "settles softly back into a peaceful acoustic guitar lullaby",
    instruments: "acoustic guitar, grand piano, warm cello, soft flute, and comforting strings"
  },
  romantic_love: {
    match: /(love|romantic|romance|heart|sweet|kiss|wedding|passion)/i,
    genre: "Lush Romantic Cinematic Ballad",
    tempo: "around 82 BPM",
    intro: "begins with a delicate grand piano and lush string chords establishing an affectionate, intimate mood",
    mid: "develops into a warm, passionate arrangement with flowing acoustic guitar arpeggios, smooth basslines, and velvety saxophone touches",
    climax: "swells into a breathtaking emotional climax celebrating deep romantic connection",
    outro: "resolves smoothly with gentle piano chords lingering warmly in the air",
    instruments: "grand piano, acoustic guitar, velvet string ensemble, and warm bass"
  },
  hero_entry: {
    match: /(hero|heroic|epic|entry|victory|warrior|king|triumphant)/i,
    genre: "Epic Hollywood Trailer Score",
    tempo: "around 124 BPM",
    intro: "opens with low brass swells and sharp staccato strings signaling a dramatic and majestic entrance",
    mid: "drives forward with thunderous cinematic taiko percussion, soaring french horns, and heavy orchestral brass building powerful momentum",
    climax: "erupts into a colossal, heroic brass and choral climax filled with grandeur",
    outro: "concludes with a reverberating brass hit and triumphant ambient trail",
    instruments: "full orchestral brass, french horns, staccato strings, epic taiko drums, and cinematic choir"
  },
  horror: {
    match: /(horror|scary|dark|creepy|ghost|haunted|fear|suspense|monster)/i,
    genre: "Dark Atmospheric Suspense Score",
    tempo: "around 60 BPM",
    intro: "commences with ominous low synth drones, unsettling music box tones, and echoing metallic textures",
    mid: "escalates unnervingly with dissonant string glissandos, low bass pulses, and erratic percussion bursts creating intense psychological dread",
    climax: "surges into a sudden, terrifying sonic crescendo",
    outro: "dissolves back into cold, breathing ambient silence",
    instruments: "dark analog synths, low cellos, metallic percussion, and dissonant string textures"
  },
  village_folk: {
    match: /(village|folk|rural|nature|tribal|country|traditional|flute)/i,
    genre: "Organic Folk & Cultural World Fusion",
    tempo: "around 90 BPM",
    intro: "opens with an authentic acoustic flute melody over gentle hand percussion and warm acoustic guitar strumming",
    mid: "blossoms into a lively, soulful rhythm with rhythmic wooden percussion, earthy bass, and soaring acoustic whistle melodies",
    climax: "peaks in a joyful, celebratory harmony celebrating rural life and community warmth",
    outro: "winds down peacefully with soft acoustic guitar and fading flute notes",
    instruments: "bamboo flute, acoustic guitar, folk percussion, and warm acoustic bass"
  },
  action: {
    match: /(action|chase|fight|battle|fast|drive|cyber|power|speed)/i,
    genre: "High-Octane Cinematic Action Score",
    tempo: "around 138 BPM",
    intro: "starts with fast arpeggiated synths and heavy rhythmic bass pulses setting an urgent pacing",
    mid: "surges forward with aggressive electric guitar riffs, punchy electronic drums, and sharp brass hits",
    climax: "delivers a relentless, pulse-pounding dynamic climax full of adrenaline",
    outro: "ends on a sharp drum hit with an echoing synth decay",
    instruments: "heavy electronic drums, distorted electric guitar, driving sub-bass, and sharp brass"
  },
  fantasy: {
    match: /(fantasy|magic|dream|mystic|fairy|enchanted|wonder)/i,
    genre: "Enchanted Orchestral Fantasy Score",
    tempo: "around 88 BPM",
    intro: "begins with shimmering harp glissandos and ethereal choir pads casting a magical spell",
    mid: "weaves lush woodwinds, soaring violin melodies, and gentle bells into a rich, otherworldly soundscape",
    climax: "rises into a majestic, wonderous orchestral swell",
    outro: "softly settles into lingering harp arpeggios and quiet starlight ambiance",
    instruments: "concert harp, angelic choir, woodwind section, orchestral strings, and celesta"
  }
};

class PromptEnhancer {
  /**
   * Generates a single continuous 150-200 word Hollywood producer prompt
   * preserving the exact user story and meaning.
   * @param {string} rawPrompt 
   * @returns {string} Single continuous descriptive paragraph
   */
  static enhance(rawPrompt) {
    if (!rawPrompt || !rawPrompt.trim()) return rawPrompt;
    const input = rawPrompt.trim();

    // Match best category
    let matched = null;
    for (const key in CATEGORIES) {
      if (CATEGORIES[key].match.test(input)) {
        matched = CATEGORIES[key];
        break;
      }
    }

    if (!matched) {
      // Default versatile cinematic production prompt builder
      matched = {
        genre: "Professional Cinematic Studio Production",
        tempo: "around 95 BPM",
        intro: "begins with a clear, engaging melodic intro setting an atmospheric scene",
        mid: "gradually layers rich acoustic and electronic harmonies, building dynamic momentum and emotional depth",
        climax: "culminates in a vibrant, pristine studio master climax",
        outro: "resolves smoothly with a high-fidelity natural decay",
        instruments: "grand piano, acoustic strings, warm bass, and subtle studio percussion"
      };
    }

    const continuousParagraph = `A professional ${matched.genre} composition tailored to evoke "${input}". The music ${matched.intro}, setting a clear emotional foundation. As the piece unfolds at a steady tempo ${matched.tempo}, it ${matched.mid}. The arrangement highlights realistic instrumentation including ${matched.instruments}, carefully balanced to preserve the core feeling of the original narrative. Reaching its peak, the score ${matched.climax}, expertly capturing the full emotional weight of the scene. Finally, the composition ${matched.outro}, leaving a lasting impact with pristine studio-quality clarity, balanced dynamic range, and Billboard-grade production polish.`;

    return continuousParagraph;
  }
}

module.exports = PromptEnhancer;
