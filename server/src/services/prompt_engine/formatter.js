class Formatter {
  static process(data) {
    const parts = [
      `A highly detailed, professional ${data.genre.toLowerCase()} instrumental composition`,
      `The tempo is strictly set to ${data.tempo} BPM, played in the key of ${data.key}`,
      `The primary instrumentation features a rich arrangement of ${data.instruments.map(i => `expressive ${i.toLowerCase()}`).join(', ')}`,
      ...(data.intent.scene !== 'none' ? [`The atmosphere is deeply influenced by a ${data.intent.scene} setting, bringing a unique environmental texture to the mix`] : []),
      `The emotional arc of the track is overwhelmingly ${data.intent.emotion}, with a ${data.emotionData.energy ? data.emotionData.energy.toLowerCase() : 'balanced'} energy level and a ${data.emotionData.brightness ? data.emotionData.brightness.toLowerCase() : 'neutral'} tonal brightness`,
      `The rhythm follows a ${data.rhythm} pattern, ensuring a solid foundation for the arrangement`,
      `This is a master-quality production featuring ${data.production.join(', ')} with pristine clarity, wide stereo imaging, deep bass resonance, and natural dynamics`,
      `Strictly no vocals, instrumental only`
    ];

    // Join with periods and spaces for a massive, highly descriptive paragraph
    return parts.join('. ') + '.';
  }
}
module.exports = Formatter;