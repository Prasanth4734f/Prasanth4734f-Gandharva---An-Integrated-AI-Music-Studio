class TempoEngine {
  static process(data) {
    const range = data.emotionData.tempo_range || [80, 100];
    const tempo = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    data.tempo = tempo;
    return data;
  }
}
module.exports = TempoEngine;