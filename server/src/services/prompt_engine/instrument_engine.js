const instruments = require('./knowledge/instruments.json');
class InstrumentEngine {
  static process(data) {
    let topInstruments = [];
    for (const [name, info] of Object.entries(instruments)) {
      if (info.tags.includes(data.intent.emotion) || info.tags.includes(data.genre.toLowerCase())) {
        topInstruments.push(name);
      }
    }
    // Shuffle and pick top 3
    data.instruments = topInstruments.sort(() => 0.5 - Math.random()).slice(0, 3);
    if (data.instruments.length === 0) data.instruments = ['Piano', 'Strings'];
    return data;
  }
}
module.exports = InstrumentEngine;