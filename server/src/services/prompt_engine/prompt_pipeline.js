const IntentParser = require('./intent_parser');
const KeywordEngine = require('./keyword_engine');
const EmotionEngine = require('./emotion_engine');
const GenreEngine = require('./genre_engine');
const TempoEngine = require('./tempo_engine');
const HarmonyEngine = require('./harmony_engine');
const RhythmEngine = require('./rhythm_engine');
const InstrumentEngine = require('./instrument_engine');
const ArrangementEngine = require('./arrangement_engine');
const ProductionEngine = require('./production_engine');
const SceneEngine = require('./scene_engine');
const ConsistencyEngine = require('./consistency_engine');
const VariationEngine = require('./variation_engine');
const Formatter = require('./formatter');

class PromptPipeline {
  static run(rawPrompt) {
    let data = { raw: rawPrompt };
    
    data = IntentParser.process(data);
    data = KeywordEngine.process(data);
    data = EmotionEngine.process(data);
    data = SceneEngine.process(data);
    data = GenreEngine.process(data);
    data = TempoEngine.process(data);
    data = HarmonyEngine.process(data);
    data = RhythmEngine.process(data);
    data = InstrumentEngine.process(data);
    data = ArrangementEngine.process(data);
    data = ProductionEngine.process(data);
    data = ConsistencyEngine.process(data);
    data = VariationEngine.process(data);
    
    return Formatter.process(data);
  }
}
module.exports = PromptPipeline;