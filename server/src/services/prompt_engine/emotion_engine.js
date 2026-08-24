const emotions = require('./knowledge/emotions.json');
class EmotionEngine {
  static process(data) {
    const emoData = emotions[data.intent.emotion] || emotions.chill;
    return { ...data, emotionData: emoData };
  }
}
module.exports = EmotionEngine;