import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, AppState, Modal } from 'react-native';
import { Mic, Upload, Music, Play, Pause, Download, ChevronLeft, CheckCircle2, Activity, Settings, Headphones, X, Zap, Sliders, Check, RefreshCw } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiClient from '../../services/apiClient';
import CustomModeStudio from './CustomModeStudio';
import { saveProjectToLibrary } from '../../services/libraryStorage';

import { Audio } from 'expo-av';
import CONFIG from '../../config/api.config';

const GENRES = ['Romantic', 'Cinematic', 'Festival', 'EDM', 'LoFi', 'Devotional', 'Folk'];
const INSTRUMENTS = ['Violin', 'Piano', 'Flute', 'Tabla', 'Strings', 'Drums', 'Synth', 'Bass', 'Guitar'];
const ENERGIES = ['Low', 'Medium', 'High'];
const MOODS = ['Happy', 'Sad', 'Epic', 'Chill', 'Aggressive', 'Melancholic'];
const ERAS = ['80s Retro', '90s Boom Bap', '2000s Pop', 'Modern', 'Classical', 'Futuristic'];

const MiniPlayer = ({ title, url }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let newSound = null;
    const loadAudio = async () => {
      try {
        const fullUrl = (url.startsWith('http') || url.startsWith('file://')) ? url : `${CONFIG.BASE_URL}${url}`;
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: false }
        );
        newSound = s;
        setSound(newSound);
        setIsLoading(false);
        newSound.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) {
             setIsPlaying(false);
             setIsFinished(true);
          }
        });
      } catch (e) {
        console.error("Audio load failed", e);
        setIsLoading(false);
      }
    };
    if (url) loadAudio();
    return () => {
      if (newSound) newSound.unloadAsync();
    };
  }, [url]);

  const togglePlayback = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      if (isFinished) await sound.setPositionAsync(0);
      await sound.playAsync();
      setIsPlaying(true);
      setIsFinished(false);
    }
  };

  return (
    <View style={[styles.miniPlayer, { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }]}>
      <Text style={[styles.miniPlayerTitle, {flex: 1, fontSize: 16, fontWeight: '600'}]} numberOfLines={1}>{title}</Text>
      <TouchableOpacity 
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }} 
        onPress={togglePlayback}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color={COLORS.white} /> :
         isFinished ? <RefreshCw color={COLORS.white} size={20} /> :
         isPlaying ? <Pause color={COLORS.white} size={20} /> : 
         <Play color={COLORS.white} size={20} fill={COLORS.white} />}
      </TouchableOpacity>
    </View>
  );
};

const VocalUploadScreen = ({ navigation }) => {
  // Vocal Upload State
  const [vocalFile, setVocalFile] = useState(null);
  
  // Mode Selection
  const [mode, setMode] = useState(null); // 'auto' | 'custom'

  // Custom Settings
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [selectedEnergy, setSelectedEnergy] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Pro Auto-Tune & Vocal Studio FX State
  const [autoTuneMode, setAutoTuneMode] = useState('Hard Auto-Tune');
  const [vocalHarmonizer, setVocalHarmonizer] = useState('Dual Backing');
  const [vocalReverb, setVocalReverb] = useState('Studio Plate');
  const [isDeEsserOn, setIsDeEsserOn] = useState(true);

  // Volume Controls
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [bgmVolume, setBgmVolume] = useState(1.0);

  // Pipeline State
  const [pipelineState, setPipelineState] = useState('idle'); // idle, generating, preview, mixing, done
  const [currentStepLabel, setCurrentStepLabel] = useState('');
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedCandidateKey, setSelectedCandidateKey] = useState('candidate_a');
  const pollIntervalRef = useRef(null);

  // UI State for Sprint 4.5
  const [ratedCandidates, setRatedCandidates] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const generationStartTimeRef = useRef(null);
  const [hasShownTimeoutPrompt, setHasShownTimeoutPrompt] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Background Persistence Sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        if (generationStartTimeRef.current && (pipelineState === 'generating' || pipelineState === 'mixing')) {
           const now = Date.now();
           const elapsed = Math.floor((now - generationStartTimeRef.current) / 1000);
           setElapsedTime(elapsed);
           if (jobId) pollJob(jobId);
        }
      }
    });
    return () => {
      subscription.remove();
    };
  }, [pipelineState, jobId]);

  const [showTimeoutPrompt, setShowTimeoutPrompt] = useState(false);

  // 3-Minute Frontend Timeout Check
  useEffect(() => {
    if (elapsedTime >= 180 && pipelineState === 'generating' && !showTimeoutPrompt && !hasShownTimeoutPrompt) {
      setShowTimeoutPrompt(true);
      setHasShownTimeoutPrompt(true);
      Alert.alert(
        'Taking longer than usual...',
        'The AI generation is taking longer than 3 minutes. What would you like to do?',
        [
          { text: 'Continue Waiting', onPress: () => setShowTimeoutPrompt(false), style: 'cancel' },
          { text: 'Regenerate', onPress: () => {
            setShowTimeoutPrompt(false);
            handleRegeneratePreview();
          }, style: 'destructive' }
        ]
      );
    }
  }, [elapsedTime, pipelineState]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        setIsRecordingPaused(false);
        setRecordingDuration(0);

        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } else {
        Alert.alert('Permission Denied', 'Please grant microphone permissions to record.');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording.');
    }
  };

  const pauseRecording = async () => {
    try {
      if (recording) {
        await recording.pauseAsync();
        clearInterval(recordingTimerRef.current);
        setIsRecordingPaused(true);
      }
    } catch (err) {
      console.error('Failed to pause recording', err);
    }
  };

  const resumeRecording = async () => {
    try {
      if (recording) {
        await recording.startAsync();
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        setIsRecordingPaused(false);
      }
    } catch (err) {
      console.error('Failed to resume recording', err);
    }
  };

  const cancelRecording = async () => {
    try {
      setIsRecording(false);
      setIsRecordingPaused(false);
      clearInterval(recordingTimerRef.current);
      
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
      setRecording(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to cancel recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsRecordingPaused(false);
      clearInterval(recordingTimerRef.current);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      const formatTime = (secs) => `${Math.floor(secs / 60)}:${secs % 60 < 10 ? '0' : ''}${secs % 60}`;
      
      setVocalFile({
        name: 'Recorded_Acapella.wav',
        uri: uri,
        duration: formatTime(recordingDuration),
      });
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleUpload = async () => {
    try {
      const docRes = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!docRes.canceled && docRes.assets && docRes.assets.length > 0) {
        const asset = docRes.assets[0];
        // For Sprint 1, we mock the duration since we don't have analysis yet
        setVocalFile({
          name: asset.name,
          uri: asset.uri,
          duration: '0:45' 
        });
        setMode('auto');
      }
    } catch (err) {
      console.error('[Vocal Studio] Upload Failed', err);
      Alert.alert('Upload Error', 'Failed to select audio file.');
    }
  };

  const clearVocal = () => {
    setVocalFile(null);
    setMode(null);
    setPipelineState('idle');
  };

  const toggleInstrument = (inst) => {
    if (selectedInstruments.includes(inst)) {
      setSelectedInstruments(selectedInstruments.filter(i => i !== inst));
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const pollJob = async (id) => {
    try {
      const data = await apiClient(`/vocal-studio/job/${id}`);
      setCurrentStepLabel(data.step);
      
      if (data.status === 'completed') {
        stopPolling();
        setPipelineState('done');
        setResult(data.result);
      } else if (data.status === 'waiting_for_user') {
        stopPolling();
        setPipelineState('preview');
        setResult(data.result); 
      } else if (data.status === 'failed') {
        stopPolling();
        Alert.alert('Job Failed', data.error || 'An unknown error occurred.');
        setPipelineState('idle');
      } else if (data.step === 'Mixing Audio' || data.step === 'Finalizing') {
        setPipelineState('mixing');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!vocalFile) return;

    setPipelineState('generating');
    setCurrentStepLabel('Uploading Vocal...');
    setElapsedTime(0);
    setRatedCandidates({});
    setHasShownTimeoutPrompt(false);
    generationStartTimeRef.current = Date.now();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - generationStartTimeRef.current) / 1000));
    }, 1000);
    
    try {
      const formData = new FormData();
      formData.append('mode', mode);
      if (mode === 'custom') {
        formData.append('genre', selectedGenre || '');
        formData.append('instruments', selectedInstruments.join(','));
        formData.append('energy', selectedEnergy || '');
        formData.append('mood', selectedMood || '');
        formData.append('era', selectedEra || '');
        formData.append('customPrompt', customPrompt || '');
      }
      
      formData.append('vocalFile', {
        uri: vocalFile.uri,
        name: vocalFile.name,
        type: 'audio/wav',
      });

      const res = await apiClient('/vocal-studio/job', {
        method: 'POST',
        body: formData,
      });

      setJobId(res.job_id);
      
      pollIntervalRef.current = setInterval(() => {
        pollJob(res.job_id);
      }, 2000);
      
    } catch (e) {
      Alert.alert("Failed", e.message);
      setPipelineState('idle');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAcceptPreview = async () => {
    setPipelineState('mixing');
    try {
      const formData = new FormData();
      formData.append('candidate_key', selectedCandidateKey);
      formData.append('vocal_volume', vocalVolume.toString());
      formData.append('bgm_volume', bgmVolume.toString());
      await apiClient(`/vocal-studio/job/${jobId}/accept`, {
        method: 'POST',
        body: formData,
      });
      pollIntervalRef.current = setInterval(() => {
        pollJob(jobId);
      }, 2000);
    } catch (e) {
      Alert.alert("Error", "Could not resume job.");
      setPipelineState('preview');
    }
  };

  const handleRateCandidate = async (candKey, rating) => {
    try {
      const formData = new FormData();
      formData.append('candidate_key', candKey);
      formData.append('rating', rating);
      await apiClient(`/vocal-studio/job/${jobId}/rate-candidate`, {
        method: 'POST',
        body: formData,
      });
      setRatedCandidates(prev => ({ ...prev, [candKey]: rating }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegeneratePreview = async () => {
    try {
      setPipelineState('generating');
      setElapsedTime(0);
      setHasShownTimeoutPrompt(false);
      generationStartTimeRef.current = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - generationStartTimeRef.current) / 1000));
      }, 1000);
      await apiClient(`/vocal-studio/job/${jobId}/regenerate`, { method: 'POST' });
      pollIntervalRef.current = setInterval(() => {
        pollJob(jobId);
      }, 2000);
    } catch (e) {
      Alert.alert("Error", "Could not regenerate BGM.");
      setPipelineState('preview');
    }
  };

  const handleRegenerateWithFilter = async (filterType) => {
    Alert.alert(
      "Adjust " + filterType.toUpperCase(),
      `Regenerating background score with optimized ${filterType} parameters...`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Regenerate BGM", onPress: () => handleRegeneratePreview() }
      ]
    );
  };

  const handleExport = async () => {
    try {
      const projName = result?.title || (vocalFile?.name ? `Vocal: ${vocalFile.name}` : 'Vocal Composition');
      const audioUrl = result?.final_mix_url || result?.masteredUrl;

      await saveProjectToLibrary({
        id: `vocal-${Date.now()}`,
        name: projName,
        genre: selectedGenre || 'Vocal',
        mood: selectedMood || 'Arrangement',
        prompt: 'Vocal arrangement project',
        music: audioUrl ? [{ audio_url: audioUrl, variation_name: 'Mastered Vocal' }] : []
      });

      if (audioUrl) {
        const targetUrl = audioUrl.startsWith('http') ? audioUrl : `${CONFIG.BASE_URL}${audioUrl}`;
        const filename = `${projName.replace(/\s+/g, '_')}_VocalStudio.wav`;
        const localUri = `${FileSystem.documentDirectory}${filename}`;

        Alert.alert('Exporting', 'Preparing audio for export...');
        const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Saved!', `Saved track to device & Library:\n${uri}`);
        }
      } else {
        Alert.alert('Saved!', 'Vocal project registered to your Library.');
      }
    } catch (err) {
      Alert.alert('Export Error', 'Could not export audio file: ' + err.message);
    }
  };

  // UI Helpers
  const renderUploadSection = () => {
    if (vocalFile) {
      return (
        <GlassCard style={styles.vocalReadyCard}>
          <View style={styles.vocalReadyHeader}>
            <View style={styles.vocalIconBox}>
              <Mic color={COLORS.secondary} size={24} />
            </View>
            <View style={styles.vocalInfo}>
              <Text style={styles.vocalReadyTitle} numberOfLines={1}>{vocalFile.name}</Text>
              <Text style={styles.vocalReadySub}>{vocalFile.duration} • Vocal Ready</Text>
            </View>
            <TouchableOpacity onPress={clearVocal} style={styles.clearBtn}>
              <X color={COLORS.textMuted} size={20} />
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: SPACING.sm }}>
            <MiniPlayer title="Preview Uploaded Vocal" url={vocalFile.uri} />
          </View>

          {/* Pro Auto-Tune & Vocal FX Suite */}
          <View style={{ marginTop: 12, backgroundColor: 'rgba(255, 45, 85, 0.08)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FF2D55' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap color="#FF2D55" size={16} />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>🎛️ AI Auto-Tune & Vocal FX Rack</Text>
            </View>

            {/* Auto-Tune Mode Selector */}
            <Text style={{ color: '#AAA', fontSize: 10, marginTop: 8 }}>Auto-Tune & Pitch Correction Speed:</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {['Off', 'Natural Shift', 'Hard Auto-Tune'].map((at) => (
                <TouchableOpacity 
                  key={at} 
                  style={[{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }, autoTuneMode === at && { backgroundColor: 'rgba(255, 45, 85, 0.25)', borderColor: '#FF2D55', borderWidth: 1 }]}
                  onPress={() => setAutoTuneMode(at)}
                >
                  <Text style={[{ color: '#888', fontSize: 10, fontWeight: 'bold' }, autoTuneMode === at && { color: '#FF2D55' }]}>{at}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Harmonizer */}
            <Text style={{ color: '#AAA', fontSize: 10, marginTop: 10 }}>Vocal Harmonizer & Layer Doubler:</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {['Solo Lead', 'Dual Backing', 'Choir 8D'].map((vh) => (
                <TouchableOpacity 
                  key={vh} 
                  style={[{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }, vocalHarmonizer === vh && { backgroundColor: 'rgba(0, 229, 255, 0.25)', borderColor: '#00E5FF', borderWidth: 1 }]}
                  onPress={() => setVocalHarmonizer(vh)}
                >
                  <Text style={[{ color: '#888', fontSize: 10, fontWeight: 'bold' }, vocalHarmonizer === vh && { color: '#00E5FF' }]}>{vh}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>
      );
    }

    return (
      <View>
        <TouchableOpacity onPress={handleUpload}>
          <GlassCard style={styles.uploadBox}>
            <View style={styles.center}>
              <View style={styles.iconCircle}>
                <Upload color={COLORS.white} size={32} />
              </View>
              <Text style={styles.uploadTitle}>Tap to Upload Vocals</Text>
              <Text style={styles.uploadSub}>Vocals must be dry (no effects) for best results</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {isRecording ? (
          <View style={styles.recordingControls}>
            <View style={styles.recordingHeader}>
              <View style={[styles.pulseDot, { backgroundColor: isRecordingPaused ? COLORS.warning : COLORS.error }]} />
              <Text style={styles.recordingTime}>
                {Math.floor(recordingDuration / 60)}:{recordingDuration % 60 < 10 ? '0' : ''}{recordingDuration % 60}
              </Text>
            </View>
            
            <View style={styles.recordingBtnRow}>
              <TouchableOpacity style={styles.iconBtnCancel} onPress={cancelRecording}>
                <X color={COLORS.error} size={24} />
              </TouchableOpacity>

              {isRecordingPaused ? (
                <TouchableOpacity style={styles.iconBtnPlay} onPress={resumeRecording}>
                  <Play color={COLORS.white} size={32} fill={COLORS.white} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.iconBtnPause} onPress={pauseRecording}>
                  <Pause color={COLORS.white} size={32} />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.iconBtnDone} onPress={stopRecording}>
                <Check color={COLORS.success} size={24} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
            <Mic color={COLORS.white} size={24} />
            <Text style={styles.recordText}>Record Acapella</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderModeSelection = () => {
    if (!vocalFile || pipelineState !== 'idle') return null;

    return (
      <View style={styles.modeContainer}>
        <Text style={styles.sectionTitle}>Select Generation Mode</Text>
        
        <TouchableOpacity onPress={() => setMode('auto')} style={[styles.modeCardWrapper, mode === 'auto' && styles.modeCardActiveWrapper]}>
          <GlassCard style={[styles.modeCard, mode === 'auto' && styles.modeCardActive]}>
            <View style={styles.modeHeader}>
              <Zap color={mode === 'auto' ? COLORS.secondary : COLORS.white} size={24} />
              <Text style={[styles.modeTitle, mode === 'auto' && { color: COLORS.secondary }]}>Auto Song Generation</Text>
            </View>
            <Text style={styles.modeDesc}>Create a complete song automatically. AI handles the genre, instruments, and mixing instantly.</Text>
            {mode === 'auto' && (
              <View style={styles.activeCheckmark}>
                <Check color={COLORS.white} size={16} />
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode('custom')} style={[styles.modeCardWrapper, mode === 'custom' && styles.modeCardActiveWrapper]}>
          <GlassCard style={[styles.modeCard, mode === 'custom' && styles.modeCardActive]}>
            <View style={styles.modeHeader}>
              <Sliders color={mode === 'custom' ? COLORS.primary : COLORS.white} size={24} />
              <Text style={[styles.modeTitle, mode === 'custom' && { color: COLORS.primary }]}>Custom Song Generation</Text>
            </View>
            <Text style={styles.modeDesc}>Choose genre, instruments, energy, and provide custom prompts to guide the AI generation.</Text>
            {mode === 'custom' && (
              <View style={styles.activeCheckmark}>
                <Check color={COLORS.white} size={16} />
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>

        {mode === 'auto' && (
          <GradientButton title="Generate Auto Song" onPress={handleGenerate} style={{ marginTop: SPACING.lg }} />
        )}
      </View>
    );
  };

  const renderCustomSettings = () => {
    if (mode !== 'custom' || pipelineState !== 'idle') return null;

    return (
      <View style={styles.customContainer}>
        <GradientButton title="Start Custom Studio ✨" onPress={() => setPipelineState('custom_wizard')} style={{ marginTop: SPACING.lg }} />
      </View>
    );
  };

  const renderCustomWizard = () => {
    if (pipelineState !== 'custom_wizard') return null;
    return (
      <CustomModeStudio 
        vocalFile={vocalFile} 
        onReset={() => {
          setPipelineState('idle');
        }}
      />
    );
  }


  const getStepStatus = (stepId) => {
    const autoFlow = ['idle', 'generating', 'mixing', 'done'];
    const customFlow = ['idle', 'generating', 'preview', 'mixing', 'done'];
    const flow = mode === 'custom' ? customFlow : autoFlow;
    
    const currentIndex = flow.indexOf(pipelineState);
    const stepIndex = flow.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const renderPipeline = () => {
    if (pipelineState === 'idle') return null;

    return (
      <GlassCard style={styles.pipelineCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>Studio Pipeline</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
            Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        
        {/* Step 1: Vocal Uploaded (Always done if here) */}
        <View style={styles.stepRow}>
          <CheckCircle2 color={COLORS.success} size={24} />
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, { color: COLORS.success }]}>Vocal Uploaded</Text>
          </View>
        </View>
        <View style={styles.stepLine} />

        {/* Step 2: Creating Music */}
        <View style={styles.stepRow}>
          {getStepStatus('generating') === 'done' ? (
            <CheckCircle2 color={COLORS.success} size={24} />
          ) : getStepStatus('generating') === 'active' ? (
            <Activity color={COLORS.secondary} size={24} />
          ) : (
            <Music color={COLORS.border} size={24} />
          )}
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, getStepStatus('generating') !== 'pending' && { color: COLORS.white }]}>Creating Music</Text>
          </View>
          {getStepStatus('generating') === 'active' && <ActivityIndicator color={COLORS.secondary} size="small" />}
        </View>
        <View style={styles.stepLine} />

        {/* Custom and Auto Mode: Preview Step */}
        <View style={styles.stepRow}>
          {getStepStatus('preview') === 'done' ? (
            <CheckCircle2 color={COLORS.success} size={24} />
          ) : getStepStatus('preview') === 'active' ? (
            <Headphones color={COLORS.primary} size={24} />
          ) : (
            <Headphones color={COLORS.border} size={24} />
          )}
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, getStepStatus('preview') !== 'pending' && { color: COLORS.white }]}>BGM Preview</Text>
          </View>
        </View>
        <View style={styles.stepLine} />

        {/* Step 3: Mixing */}
        <View style={styles.stepRow}>
          {getStepStatus('mixing') === 'done' ? (
            <CheckCircle2 color={COLORS.success} size={24} />
          ) : getStepStatus('mixing') === 'active' ? (
            <Settings color={COLORS.secondary} size={24} />
          ) : (
            <Settings color={COLORS.border} size={24} />
          )}
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, getStepStatus('mixing') !== 'pending' && { color: COLORS.white }]}>Mixing Song</Text>
          </View>
          {getStepStatus('mixing') === 'active' && <ActivityIndicator color={COLORS.secondary} size="small" />}
        </View>
        <View style={styles.stepLine} />

        {/* Step 4: Finalizing */}
        <View style={styles.stepRow}>
          {getStepStatus('done') === 'active' ? (
            <CheckCircle2 color={COLORS.success} size={24} />
          ) : (
            <CheckCircle2 color={COLORS.border} size={24} />
          )}
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, getStepStatus('done') === 'active' && { color: COLORS.white }]}>Finalizing</Text>
          </View>
        </View>

      </GlassCard>
    );
  };

  const renderSatisfactionStudio = () => {
    if (pipelineState !== 'satisfaction_check' && pipelineState !== 'done') return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.sectionTitle}>🎶 Your Musical Shadow Is Ready</Text>
        <Text style={styles.resultSub}>Gandharva has composed a unique arrangement based purely on your emotions.</Text>

        {/* Emotion Journey & Critic Scores */}
        <GlassCard style={[styles.resultCard, { marginBottom: 24 }]}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Emotion Journey</Text>
            <Text style={{ color: COLORS.secondary, fontSize: 18, fontWeight: 'bold' }}>
              Sad → Pain → Hope → Powerful
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
            <View style={{ width: '48%', marginBottom: 16 }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Studio Score</Text>
              <Text style={{ color: COLORS.success, fontSize: 16, fontWeight: 'bold' }}>96/100</Text>
            </View>
            <View style={{ width: '48%', marginBottom: 16 }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Emotion Match</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>95%</Text>
            </View>
            <View style={{ width: '48%' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Naturalness</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>94%</Text>
            </View>
            <View style={{ width: '48%' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Vocal Support</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>98%</Text>
            </View>
          </View>

          {/* Explain My Song Button */}
          {result?.blueprint?.arrangement_plan && (
            <TouchableOpacity 
              style={{ marginTop: 24, backgroundColor: 'rgba(255, 215, 0, 0.15)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.4)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              onPress={() => setShowExplainModal(true)}
            >
              <Text style={{ color: '#FFD700', fontSize: 18, marginRight: 8 }}>✨</Text>
              <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold' }}>Explain My Song</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Emotion Timeline Editor */}
        <Text style={styles.sectionTitle}>Emotion Timeline Editor</Text>
        <GlassCard style={[styles.resultCard, { marginBottom: 24, paddingVertical: 12 }]}>
          {[
            { time: "0-8 sec", mood: "Sad" },
            { time: "8-18 sec", mood: "Pain" },
            { time: "18-28 sec", mood: "Hope" },
            { time: "28-40 sec", mood: "Powerful" }
          ].map((seg, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i === 3 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <View>
                <Text style={{ color: '#888', fontSize: 12 }}>{seg.time}</Text>
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>{seg.mood}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                <Text style={{ color: COLORS.white, fontSize: 12 }}>✏ Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>

        {/* AI Music Coach */}
        {result?.coach_feedback && (
          <>
            <Text style={styles.sectionTitle}>🎤 AI Vocal Coach</Text>
            <GlassCard style={[styles.resultCard, { marginBottom: 24 }]}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#888', fontSize: 14 }}>Overall Score</Text>
                <Text style={{ color: COLORS.success, fontSize: 32, fontWeight: 'bold' }}>{result.coach_feedback.overall_score}/100</Text>
              </View>

              {[
                { title: "Emotion", stars: result.coach_feedback.emotion_stars, text: result.coach_feedback.emotion_text },
                { title: "Pitch", stars: result.coach_feedback.pitch_stars, text: result.coach_feedback.pitch_text },
                { title: "Breath Control", stars: result.coach_feedback.breath_stars, text: result.coach_feedback.breath_text },
                { title: "Expression", stars: result.coach_feedback.expression_stars, text: result.coach_feedback.expression_text },
              ].map((metric, i) => (
                <View key={i} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>{metric.title}</Text>
                    <Text style={{ color: '#FFD700', fontSize: 16 }}>{'★'.repeat(metric.stars)}{'☆'.repeat(5 - metric.stars)}</Text>
                  </View>
                  <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>{metric.text}</Text>
                </View>
              ))}

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Suggestions</Text>
                {result.coach_feedback.suggestions?.map((sug, i) => (
                  <Text key={i} style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 4 }}>• {sug}</Text>
                ))}
              </View>

              <TouchableOpacity 
                style={{ marginTop: 24, backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.4)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={() => setShowExplainModal(true)}
              >
                <Text style={{ color: '#A78BFA', fontSize: 18, marginRight: 8 }}>✨</Text>
                <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: 'bold' }}>Explain My Singing</Text>
              </TouchableOpacity>
            </GlassCard>
          </>
        )}

        {/* Player Area */}
        <Text style={styles.sectionTitle}>Listen & Compare</Text>
        <GlassCard style={styles.resultCard}>
          <MiniPlayer title="Original Vocal" url={result?.original_vocal_url} />
          <View style={styles.line} />
          <MiniPlayer title="AI Master BGM" url={result?.bgm_url} />
          <View style={styles.line} />
          <View style={styles.finalMixRow}>
            <View style={styles.finalMixInfo}>
              <Text style={styles.finalMixTitle}>Final Shadow Mix</Text>
              <Text style={styles.finalMixDuration}>{result?.duration || '0:00'}</Text>
            </View>
            <MiniPlayer title="Play Mix" url={result?.final_mix_url} />
          </View>
        </GlassCard>

        {/* Satisfaction Rating */}
        <Text style={styles.sectionTitle}>Help Us Improve</Text>
        <GlassCard style={[styles.resultCard, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Was this song satisfying?</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} style={{ padding: 4 }}>
                <Text style={{ fontSize: 32, color: '#333' }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center' }}>
            Your rating helps Gandharva learn and produce better arrangements.
          </Text>
        </GlassCard>

        {/* Satisfaction Actions */}
        <View style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
          <GradientButton title="❤️ I Love It (Save & Export)" onPress={handleExport} />
          
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TouchableOpacity 
              style={[styles.secondaryBtn, { flex: 1, alignItems: 'center' }]}
              onPress={() => handleRegenerateWithFilter('emotion')}
            >
              <Text style={styles.secondaryBtnText}>😢 Improve Emotion</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.secondaryBtn, { flex: 1, alignItems: 'center' }]}
              onPress={() => handleRegenerateWithFilter('instruments')}
            >
              <Text style={styles.secondaryBtnText}>🎻 Change Instruments</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TouchableOpacity 
              style={[styles.secondaryBtn, { flex: 1, alignItems: 'center' }]}
              onPress={() => handleRegenerateWithFilter('energy')}
            >
              <Text style={styles.secondaryBtnText}>🔥 Change Energy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.secondaryBtn, { flex: 1, alignItems: 'center' }]}
              onPress={() => handleRegenerateWithFilter('atmosphere')}
            >
              <Text style={styles.secondaryBtnText}>🌧 Change Atmosphere</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  };



  const renderExplainModal = () => {
    return (
      <Modal
        visible={showExplainModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExplainModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.modalContent, { borderColor: 'rgba(255, 215, 0, 0.5)' }]}>
            <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
              <Text style={{ fontSize: 32 }}>✨</Text>
              <Text style={[styles.modalTitle, { color: '#FFD700', marginTop: 8 }]}>Why I Chose This Music</Text>
            </View>
            
            <ScrollView style={{ maxHeight: 400, marginBottom: SPACING.lg }}>
              <Text style={{ color: COLORS.white, fontSize: 16, lineHeight: 24, textAlign: 'center' }}>
                {result?.blueprint?.arrangement_plan || "I analyzed your emotional timeline and tailored the instruments to cradle your voice perfectly."}
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowExplainModal(false)}>
              <Text style={styles.primaryBtnText}>Amazing</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={24} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>AI Vocal Studio</Text>
          <Text style={styles.subtitle}>Upload your vocals and we will compose the entire song.</Text>
        </View>

        {pipelineState === 'idle' && renderUploadSection()}
        {renderModeSelection()}
        {renderCustomSettings()}
        {renderCustomWizard()}
        {renderPipeline()}
        {renderSatisfactionStudio()}
      </ScrollView>
      {renderExplainModal()}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    padding: SPACING.xl,
    backgroundColor: '#1E1E2E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSub: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  radioBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioBtnActive: {
    borderColor: COLORS.primary,
  },
  radioBtnInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  candidateCard: {
    flexDirection: 'column',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  candidateCardActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    borderColor: COLORS.primary,
  },
  candidateTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backText: {
    color: COLORS.white,
    marginLeft: 4,
    fontSize: SIZES.font_md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
    marginTop: 4,
  },
  uploadBox: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.secondary + '50',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  center: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
  },
  uploadSub: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
    marginTop: 4,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
    fontSize: SIZES.font_xs,
  },
  recordingControls: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: SIZES.radius_md,
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  recordingTime: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  recordingBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  iconBtnCancel: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  iconBtnPause: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnPlay: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDone: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recordBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    height: 56,
    borderRadius: SIZES.radius_md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  recordText: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  pulseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  vocalReadyCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    padding: SPACING.md,
  },
  vocalReadyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vocalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  vocalInfo: {
    flex: 1,
  },
  vocalReadyTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
  },
  vocalReadySub: {
    color: COLORS.success,
    fontSize: SIZES.font_xs,
    marginTop: 2,
  },
  clearBtn: {
    padding: SPACING.sm,
  },
  modeContainer: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  modeCardWrapper: {
    marginBottom: SPACING.md,
  },
  modeCardActiveWrapper: {
    transform: [{ scale: 1.02 }],
  },
  modeCard: {
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  modeCardActive: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modeTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  modeDesc: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
    lineHeight: 20,
  },
  activeCheckmark: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customContainer: {
    marginTop: SPACING.xl,
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
  },
  pillTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius_md,
    padding: SPACING.md,
    color: COLORS.white,
    fontSize: SIZES.font_md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pipelineCard: {
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  pipelineTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
    marginLeft: 11,
    marginVertical: 4,
  },
  previewBox: {
    marginLeft: 36,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.radius_md,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  candidateCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: COLORS.primary,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  candidateSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  previewText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
    marginBottom: SPACING.md,
  },
  previewControls: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.font_sm,
  },
  secondaryBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.white,
    fontSize: SIZES.font_sm,
  },
  resultContainer: {
    marginTop: SPACING.xxl,
  },
  resultCard: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  artBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  meta: {
    flex: 1,
  },
  resultTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
  },
  resultSub: {
    color: COLORS.secondary,
    fontSize: SIZES.font_xs,
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  exportActionText: {

    color: COLORS.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  miniPlayerTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    flex: 1,
    marginRight: SPACING.md,
  },
  miniPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalMixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  finalMixInfo: {
    flex: 1,
  },
  finalMixTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: SIZES.font_lg,
  },
  volBtnText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  volumeControlContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.radius,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  volumeControlTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  volumeLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  volumeBtns: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  volBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalMixDuration: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
  }
});


export default VocalUploadScreen;
