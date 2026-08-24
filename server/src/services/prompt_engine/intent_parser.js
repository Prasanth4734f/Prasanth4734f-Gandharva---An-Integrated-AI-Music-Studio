class IntentParser {
  static process(input) {
    const text = (input.raw || '').toLowerCase();
    
    // Dynamic extraction: Find descriptive words in the user's prompt
    const words = text.replace(/[^a-z\s]/g, '').split(/\s+/);
    
    // Basic stop words to ignore
    const stopWords = ['a','the','in','on','at','is','and','or','with','for','of','to','create','music','that','gives','full','vibe','their','my','make'];
    const meaningfulWords = words.filter(w => w.length > 2 && !stopWords.includes(w));
    
    // We will build a dynamic intent profile based on the ACTUAL words the user typed
    const result = { 
      emotion: 'neutral', 
      theme: meaningfulWords.slice(0, 2).join(' ') || 'general', 
      scene: 'none',
      dynamicKeywords: meaningfulWords
    };
    
    // Check known categories, but use dynamic keywords for flavoring later
    if (text.includes('sad') || text.includes('cry') || text.includes('tears')) result.emotion = 'sad';
    else if (text.includes('love') || text.includes('romantic') || text.includes('kiss')) { result.emotion = 'romantic'; result.theme = 'love'; }
    else if (text.includes('happy') || text.includes('party') || text.includes('joy')) result.emotion = 'happy';
    else if (text.includes('angry') || text.includes('rage') || text.includes('dark')) result.emotion = 'angry';
    else if (text.includes('chill') || text.includes('relax') || text.includes('calm')) result.emotion = 'chill';
    
    // If no emotion matched, dynamically assign their most prominent word as the emotion/vibe!
    if (result.emotion === 'neutral' && meaningfulWords.length > 0) {
      result.emotion = meaningfulWords[0];
    }
    
    if (text.includes('rain')) result.scene = 'rain';
    else if (text.includes('night')) result.scene = 'night';
    else if (text.includes('wedding')) result.scene = 'wedding';
    else if (text.includes('space') || text.includes('sci-fi')) result.scene = 'sci-fi';
    else if (meaningfulWords.length > 1) {
      // Use their second word as the scene if not recognized
      result.scene = meaningfulWords[1];
    }

    return { ...input, intent: result };
  }
}
module.exports = IntentParser;