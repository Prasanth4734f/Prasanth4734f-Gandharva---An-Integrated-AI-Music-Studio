import os
import logging
import torch
import soundfile as sf
import librosa
from pydub import AudioSegment
import tempfile
import numpy as np

logger = logging.getLogger(__name__)

class EmotionEngine:
    """
    Emotion Engine: Phase 2 (Production Architecture)
    Uses Emotion2Vec and Silero VAD to extract a multilingual acoustic emotion timeline.
    """
    
    @staticmethod
    def analyze(file_path: str) -> dict:
        logger.info(f"[EmotionEngine] Starting acoustic emotion extraction for {file_path}")
        
        timeline = []
        primary_emotion = "Neutral"
        
        try:
            # 1. Silero VAD to find active speech chunks
            model_vad, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad')
            (get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils
            
            wav = read_audio(file_path, sampling_rate=16000)
            speech_timestamps = get_speech_timestamps(wav, model_vad, sampling_rate=16000)
            
            if not speech_timestamps:
                logger.warning("[EmotionEngine] No vocal activity detected!")
                return {"primary_emotion": primary_emotion, "emotion_timeline": timeline}
                
            # 2. Emotion2Vec Initialization
            try:
                from modelscope.pipelines import pipeline
                from modelscope.utils.constant import Tasks
                emotion_pipeline = pipeline(task=Tasks.emotion_recognition, model="iic/emotion2vec_base_finetuned")
            except ImportError:
                logger.error("[EmotionEngine] ModelScope/FunASR not installed. Please wait for PIP task to finish.")
                return {"primary_emotion": primary_emotion, "emotion_timeline": timeline}
                
            # 3. Analyze each spoken chunk
            audio_seg = AudioSegment.from_file(file_path)
            emotion_counts = {}
            
            for chunk in speech_timestamps:
                start_sec = chunk['start'] / 16000.0
                end_sec = chunk['end'] / 16000.0
                
                # Slice chunk
                chunk_audio = audio_seg[int(start_sec * 1000) : int(end_sec * 1000)]
                
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
                    chunk_audio.export(tmp_wav.name, format="wav")
                    
                    try:
                        rec_result = emotion_pipeline(tmp_wav.name)
                        # rec_result usually contains labels and scores. 
                        # Example: [{'labels': ['happy', 'sad', ...], 'scores': [0.8, 0.1, ...]}]
                        if isinstance(rec_result, list) and len(rec_result) > 0:
                            labels = rec_result[0].get('labels', [])
                            scores = rec_result[0].get('scores', [])
                            
                            if labels and scores:
                                emotion_probs = {labels[i].lower(): round(float(scores[i]), 3) for i in range(len(labels))}
                                
                                # Still track primary for high-level summary, but the true value is in the probabilities
                                top_idx = np.argmax(scores)
                                detected_emotion = labels[top_idx].capitalize()
                                
                                timeline.append({
                                    "start_sec": round(start_sec, 2),
                                    "end_sec": round(end_sec, 2),
                                    "probabilities": emotion_probs
                                })
                                
                                emotion_counts[detected_emotion] = emotion_counts.get(detected_emotion, 0) + 1
                    except Exception as chunk_err:
                        logger.warning(f"[EmotionEngine] Failed on chunk {start_sec}-{end_sec}: {chunk_err}")
                        
                    os.unlink(tmp_wav.name)
            
            if emotion_counts:
                primary_emotion = max(emotion_counts, key=emotion_counts.get)
                
            logger.info(f"[EmotionEngine] Primary Emotion: {primary_emotion}, Timeline Segments: {len(timeline)}")
            return {
                "primary_emotion": primary_emotion,
                "emotion_timeline": timeline
            }
                
        except Exception as e:
            logger.error(f"[EmotionEngine] Fatal Error: {str(e)}")
            return {"primary_emotion": "Neutral", "emotion_timeline": []}
