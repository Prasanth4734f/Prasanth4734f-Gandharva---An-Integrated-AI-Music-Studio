class GenreEngine {
  static process(data) {
    data.genre = 'Cinematic';
    if (data.intent.emotion === 'chill') data.genre = 'Lofi';
    if (data.intent.emotion === 'happy') data.genre = 'Pop';
    return data;
  }
}
module.exports = GenreEngine;