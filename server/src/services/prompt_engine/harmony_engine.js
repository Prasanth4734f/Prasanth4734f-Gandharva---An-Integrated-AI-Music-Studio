class HarmonyEngine {
  static process(data) {
    data.key = data.emotionData.key || 'C Major';
    return data;
  }
}
module.exports = HarmonyEngine;