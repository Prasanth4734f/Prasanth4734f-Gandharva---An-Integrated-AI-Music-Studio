import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Switch, Dimensions } from 'react-native';
import { ChevronLeft, Play, Pause, Download, Share2, Volume2, Music, Scissors, Activity, Sparkles, Clock, RotateCcw, Check, Sliders, Save, Upload, FolderOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import CONFIG from '../../config/api.config';
import { getProjects } from '../../services/lyricsService';
import { editMusic } from '../../services/editorService';
import { cacheAudioTrack, getPlaybackUri } from '../../services/audioCache';

const { width } = Dimensions.get('window');

const MusicEditorScreen = ({ navigation, route }) => {
  const params = route.params || {};

  // Loaded Audio state
  const [projectId, setProjectId] = useState(params.projectId || null);
  const [trackId, setTrackId] = useState(params.trackId || null);
  const [audioUrl, setAudioUrl] = useState(params.audioUrl || null);
  const [title, setTitle] = useState(params.title || '');
  
  // Custom Device Import file state
  const [importedFile, setImportedFile] = useState(null); // { uri, name, mimeType, size }

  // Load selection state
  const [availableProjects, setAvailableProjects] = useState([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [showLibraryList, setShowLibraryList] = useState(false);

  // Audio Playback
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(10000); // 10s default

  // Processing & Load State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // --- EDITOR PARAMETERS ---
  // Basic
  const [volume, setVolume] = useState(1.0); // 0.0 to 2.0
  const [trimStart, setTrimStart] = useState('0');
  const [trimEnd, setTrimEnd] = useState('10');
  const [cutStart, setCutStart] = useState('');
  const [cutEnd, setCutEnd] = useState('');
  const [fadeIn, setFadeIn] = useState('0'); // seconds
  const [fadeOut, setFadeOut] = useState('0'); // seconds

  // Advanced DSP
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'dsp' | 'ai'
  const [tempo, setTempo] = useState(1.0); // 0.75, 1.0, 1.25, 1.5
  const [pitch, setPitch] = useState(0); // -3 to +3
  const [bassBoost, setBassBoost] = useState('None'); // 'None', 'low', 'medium', 'high'
  const [eqBass, setEqBass] = useState(0); // -10 to +10 dB
  const [eqMid, setEqMid] = useState(0); // -10 to +10 dB
  const [eqTreble, setEqTreble] = useState(0); // -10 to +10 dB
  const [reverb, setReverb] = useState('None'); // 'None', 'studio', 'hall', 'concert'
  const [echo, setEcho] = useState(0); // 0.0 to 1.0 (feedback percent)

  // AI Editing
  const [aiRemix, setAiRemix] = useState(false);
  const [remixStyle, setRemixStyle] = useState('Techno'); // Techno, Calm, Epic, Lofi, Cyberpunk
  const [extendDuration, setExtendDuration] = useState(null); // null, 30, 60, 90

  // Export
  const [exportFormat, setExportFormat] = useState('wav'); // wav, mp3

  // Load Projects on mount
  useEffect(() => {
    loadProjectsList();
  }, []);

  // Sync route params when navigated to with new arguments
  useEffect(() => {
    if (params.audioUrl) {
      setProjectId(params.projectId);
      setTrackId(params.trackId);
      setAudioUrl(params.audioUrl);
      setTitle(params.title || 'Studio Composition');
      setImportedFile(null);
      
      setTrimStart('0');
      setTrimEnd('10');
      setCutStart('');
      setCutEnd('');
      setVolume(1.0);
      setFadeIn('0');
      setFadeOut('0');
    }
  }, [params.audioUrl]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadProjectsList = async () => {
    setIsFetchingProjects(true);
    try {
      const data = await getProjects();
      const musicProjects = data.filter(p => p.music && p.music.length > 0);
      setAvailableProjects(musicProjects);
    } catch (err) {
      console.warn('[Editor] Failed to fetch library projects', err);
    } finally {
      setIsFetchingProjects(false);
    }
  };

  // Trigger Expo Document Picker to import audio from phone
  const handleImportAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('[Editor Import] Document Selected:', asset);
        
        // Unload old audio
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
          setIsPlaying(false);
        }

        setImportedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'audio/wav',
          size: asset.size
        });

        // Load details in state
        setAudioUrl(asset.uri); // Local file uri
        setTitle(asset.name.replace(/\.[^/.]+$/, ""));
        setTrackId('imported-raw');
        setProjectId(null);
        
        setTrimStart('0');
        setTrimEnd('30'); // Default estimation
        setCutStart('');
        setCutEnd('');
        
        // Inform user
        Alert.alert('Import Successful', `${asset.name} preloaded in player.\nApply changes to edit.`);
      }
    } catch (err) {
      console.error('[Editor Import] Failed to pick document', err);
      Alert.alert('Import Error', 'Could not open document picker.');
    }
  };

  const selectProject = (proj) => {
    const track = proj.music[0];
    setProjectId(proj.id);
    setTrackId(track.id);
    setAudioUrl(track.audio_url);
    setTitle(proj.name);
    setImportedFile(null);
    setShowLibraryList(false);
    
    setTrimStart('0');
    setTrimEnd(String(track.duration || 10));
    setCutStart('');
    setCutEnd('');
    
    if (sound) {
      sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  const playSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      // Check if file is a local URI from document picker, or relative backend static URL
      let targetUri = audioUrl;
      if (!audioUrl.startsWith('file') && !audioUrl.startsWith('content') && !audioUrl.startsWith('ph:')) {
        targetUri = await getPlaybackUri(audioUrl);
      }
        
      console.log(`[Editor Player] Loading URI: ${targetUri}`);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: targetUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis);
          setDurationMillis(status.durationMillis || 10000);
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
    } catch (err) {
      console.error('[Editor Player] Playback failed', err);
      Alert.alert('Audio Error', 'Could not stream or preview the audio file.');
    }
  };

  const togglePlayback = async () => {
    if (!sound) {
      await playSound();
      return;
    }
    const status = await sound.getStatusAsync();
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      if (status.isLoaded && status.positionMillis >= status.durationMillis - 100) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const applySocialPreset = (preset) => {
    if (preset === '15s') {
      setTrimStart('0');
      setTrimEnd('15');
      setCutStart('');
      setCutEnd('');
    } else if (preset === '30s') {
      setTrimStart('0');
      setTrimEnd('30');
      setCutStart('');
      setCutEnd('');
    } else if (preset === '60s') {
      setTrimStart('0');
      setTrimEnd('60');
      setCutStart('');
      setCutEnd('');
    }
  };

  const handleApplyChanges = async () => {
    if (!audioUrl) {
      Alert.alert('Error', 'Please load an audio file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }

    // Prepare Multipart FormData payload
    const formData = new FormData();
    if (projectId) formData.append('project_id', projectId);
    if (trackId) formData.append('track_id', trackId);
    if (audioUrl && !importedFile) formData.append('audio_url', audioUrl);
    
    // Append controls
    if (volume !== 1.0) formData.append('volume', String(volume));
    if (trimStart) formData.append('trim_start', trimStart);
    if (trimEnd) formData.append('trim_end', trimEnd);
    if (cutStart) formData.append('cut_start', cutStart);
    if (cutEnd) formData.append('cut_end', cutEnd);
    if (fadeIn && parseFloat(fadeIn) > 0) formData.append('fade_in', fadeIn);
    if (fadeOut && parseFloat(fadeOut) > 0) formData.append('fade_out', fadeOut);
    
    // Advanced DSP
    if (tempo !== 1.0) formData.append('tempo', String(tempo));
    if (pitch !== 0) formData.append('pitch', String(pitch));
    if (bassBoost !== 'None') formData.append('bass_boost', bassBoost.toLowerCase());
    if (eqBass !== 0) formData.append('eq_bass', String(eqBass));
    if (eqMid !== 0) formData.append('eq_mid', String(eqMid));
    if (eqTreble !== 0) formData.append('eq_treble', String(eqTreble));
    if (reverb !== 'None') formData.append('reverb', reverb.toLowerCase());
    if (echo > 0) formData.append('echo', String(echo));
    
    // AI
    formData.append('ai_remix', aiRemix ? 'true' : 'false');
    if (aiRemix) formData.append('remix_style', remixStyle);
    if (extendDuration) formData.append('extend_duration', String(extendDuration));
    
    formData.append('export_format', exportFormat);

    // If file is imported, attach the document!
    if (importedFile) {
      formData.append('customAudioFile', {
        uri: importedFile.uri,
        name: importedFile.name || 'custom_import.wav',
        type: importedFile.mimeType || 'audio/wav',
      });
    }

    console.log('[Editor Submit] Sending FormData...');

    try {
      const data = await editMusic(formData);
      if (data.success) {
        // Auto-cache the new edited file locally
        cacheAudioTrack(data.audioUrl);

        setAudioUrl(data.audioUrl);
        setTitle(data.title || title);
        setTrackId(data.trackId);
        setProjectId(data.projectId);
        setImportedFile(null); // File uploaded! Switch to static URL
        
        if (data.duration) {
          setTrimStart('0');
          setTrimEnd(String(data.duration));
        }
        
        Alert.alert('Processing Completed', 'Audio successfully exported to variation archive.');
        
        setTimeout(() => {
          playSound();
        }, 300);
      } else {
        throw new Error(data.message || 'Operation failed.');
      }
    } catch (err) {
      console.error('[Editor Apply] Failed', err);
      setError(err.message || 'Server failed to process file.');
      Alert.alert('Processing Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!audioUrl) return;
    const targetUrl = audioUrl.startsWith('http') ? audioUrl : `${CONFIG.BASE_URL}${audioUrl}`;
    const ext = exportFormat;
    const filename = `${title.replace(/\s+/g, '_')}_Edited.${ext}`;
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      Alert.alert('Downloading', 'Saving audio composition locally...');
      const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
      Alert.alert('Success!', `Saved edited track to device:\n${uri}`);
    } catch (err) {
      Alert.alert('Download Error', 'Could not cache audio file: ' + err.message);
    }
  };

  const handleShare = async () => {
    if (!audioUrl) return;
    const targetUrl = audioUrl.startsWith('http') ? audioUrl : `${CONFIG.BASE_URL}${audioUrl}`;
    const ext = exportFormat;
    const filename = `${title.replace(/\s+/g, '_')}_Edited.${ext}`;
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Share Unavailable', 'Native sharing is not supported.');
      }
    } catch (err) {
      Alert.alert('Share Error', 'Could not share track: ' + err.message);
    }
  };

  const handleSaveToProject = () => {
    Alert.alert(
      'Saved!',
      'Your edited audio version has been registered as a project variation.',
      [{ text: 'Great', onPress: () => navigation.navigate('Main', { screen: 'LibraryTab' }) }]
    );
  };

  const resetTrack = () => {
    setAudioUrl(null);
    setTrackId(null);
    setProjectId(null);
    setImportedFile(null);
    setTitle('');
    if (sound) {
      sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  const getProgressPercent = () => {
    if (!durationMillis) return '0%';
    const pct = (positionMillis / durationMillis) * 100;
    return `${pct}%`;
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isCompressedFormat = importedFile && (
    importedFile.name.toLowerCase().endsWith('.mp3') ||
    importedFile.name.toLowerCase().endsWith('.m4a') ||
    importedFile.name.toLowerCase().endsWith('.aac')
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Navigation */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={24} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Music Editor</Text>
          <Text style={styles.subtitle}>Splicing, DSP filters, and device audio imports</Text>
        </View>

        {/* --- LANDING MENU: SELECT OR IMPORT --- */}
        {!audioUrl ? (
          <View style={styles.landingContainer}>
            {/* Card 1: Import Local Document */}
            <TouchableOpacity onPress={handleImportAudio}>
              <GlassCard style={styles.landingCard}>
                <View style={styles.iconCircleBig}>
                  <Upload color={COLORS.secondary} size={32} />
                </View>
                <Text style={styles.landingCardTitle}>Import Audio File</Text>
                <Text style={styles.landingCardSub}>MP3, WAV, M4A, AAC from device files</Text>
              </GlassCard>
            </TouchableOpacity>

            {/* Card 2: Select from Library */}
            <View style={{ marginTop: SPACING.lg }}>
              <TouchableOpacity onPress={() => setShowLibraryList(!showLibraryList)}>
                <GlassCard style={styles.landingCard}>
                  <View style={styles.iconCircleBig}>
                    <FolderOpen color={COLORS.primary} size={32} />
                  </View>
                  <Text style={styles.landingCardTitle}>Edit Library Music</Text>
                  <Text style={styles.landingCardSub}>Choose from generated composition history</Text>
                </GlassCard>
              </TouchableOpacity>

              {showLibraryList && (
                <GlassCard style={styles.librarySelectCard}>
                  {isFetchingProjects ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : availableProjects.length === 0 ? (
                    <Text style={styles.noProjectsText}>No music tracks found in library.</Text>
                  ) : (
                    availableProjects.map((p) => (
                      <TouchableOpacity 
                        key={p.id} 
                        style={styles.projectListItem}
                        onPress={() => selectProject(p)}
                      >
                        <View style={styles.row}>
                          <Music color={COLORS.secondary} size={16} />
                          <Text style={styles.projectListItemText} numberOfLines={1}>{p.name}</Text>
                        </View>
                        <Text style={styles.projectListItemMeta}>
                          {p.genre || 'Ambient'} • {p.music[0].duration}s
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </GlassCard>
              )}
            </View>
          </View>
        ) : (
          /* --- EDITING LAYOUT --- */
          <View>
            
            {/* Compatibility Mode Banner */}
            {isCompressedFormat && (
              <GlassCard style={styles.warningBanner}>
                <Text style={styles.warningTitle}>⚠️ Compatibility Mode Active</Text>
                <Text style={styles.warningDesc}>
                  Imported compressed formats (MP3/M4A/AAC) are processed through our high-fidelity WAV reference buffer workflow.
                </Text>
              </GlassCard>
            )}

            {/* Audio Player Card */}
            <GlassCard style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <View style={styles.musicIconCircle}>
                  {isProcessing ? (
                    <ActivityIndicator color={COLORS.secondary} size="small" />
                  ) : (
                    <Activity color={isPlaying ? COLORS.primary : COLORS.white} size={24} />
                  )}
                </View>
                <View style={styles.metaContainer}>
                  <Text style={styles.songTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.songSubtitle}>
                    {importedFile ? 'Imported Preview File' : 'AI Studio Master WAV'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.changeBtn} onPress={resetTrack}>
                  <RotateCcw color={COLORS.textMuted} size={18} />
                </TouchableOpacity>
              </View>

              {/* Seekbar */}
              <View style={styles.seekContainer}>
                <View style={styles.seekTrack}>
                  <View style={[styles.seekProgress, { width: getProgressPercent() }]} />
                  <View style={[styles.seekKnob, { left: getProgressPercent() }]} />
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                  <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                </View>
              </View>

              {/* Controls */}
              <View style={styles.playerControls}>
                <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayback}>
                  {isPlaying ? <Pause color={COLORS.background} size={24} fill={COLORS.background} /> : <Play color={COLORS.background} size={24} fill={COLORS.background} style={{ marginLeft: 3 }} />}
                </TouchableOpacity>

                <View style={styles.actionsRow}>
                  {!importedFile && (
                    <TouchableOpacity style={styles.playerActionBtn} onPress={handleSaveToProject}>
                      <Save color={COLORS.white} size={20} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.playerActionBtn} onPress={handleDownload}>
                    <Download color={COLORS.white} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.playerActionBtn} onPress={handleShare}>
                    <Share2 color={COLORS.white} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>

            {/* Tabs for sections */}
            <View style={styles.tabsRow}>
              {['basic', 'dsp', 'ai'].map((tab) => (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab === 'basic' ? 'Basic' : tab === 'dsp' ? 'Effects' : 'AI Edit'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Contents */}
            {activeTab === 'basic' && (
              <GlassCard style={styles.editingBlock}>
                {/* Trim */}
                <View style={styles.sectionHeader}>
                  <Scissors color={COLORS.secondary} size={18} />
                  <Text style={styles.sectionTitle}>Trim Segment (Seconds)</Text>
                </View>
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={trimStart}
                      onChangeText={setTrimStart}
                      style={styles.textInput}
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={trimEnd}
                      onChangeText={setTrimEnd}
                      style={styles.textInput}
                      placeholder="10"
                    />
                  </View>
                </View>

                {/* Presets */}
                <Text style={styles.subLabel}>Presets</Text>
                <View style={styles.presetRow}>
                  <TouchableOpacity style={styles.presetBtn} onPress={() => applySocialPreset('15s')}>
                    <Text style={styles.presetText}>15s Reel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetBtn} onPress={() => applySocialPreset('30s')}>
                    <Text style={styles.presetText}>30s Short</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetBtn} onPress={() => applySocialPreset('60s')}>
                    <Text style={styles.presetText}>60s Video</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Cut */}
                <View style={styles.sectionHeader}>
                  <Scissors color={COLORS.error} size={18} />
                  <Text style={styles.sectionTitle}>Cut Out Middle Segment</Text>
                </View>
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>From (sec)</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={cutStart}
                      onChangeText={setCutStart}
                      style={styles.textInput}
                      placeholder="e.g. 3"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>To (sec)</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={cutEnd}
                      onChangeText={setCutEnd}
                      style={styles.textInput}
                      placeholder="e.g. 6"
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Volume Control */}
                <View style={styles.sectionHeader}>
                  <Volume2 color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>Volume Level ({Math.round(volume * 100)}%)</Text>
                </View>
                <View style={styles.chipGrid}>
                  {[0.0, 0.5, 1.0, 1.5, 2.0].map((v) => (
                    <TouchableOpacity 
                      key={v} 
                      style={[styles.chip, volume === v && styles.activeChip]}
                      onPress={() => setVolume(v)}
                    >
                      <Text style={[styles.chipText, volume === v && styles.activeChipText]}>
                        {v === 0 ? 'Mute' : v === 1.0 ? 'Normal' : `${v}x`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Fades */}
                <View style={styles.sectionHeader}>
                  <Clock color={COLORS.white} size={18} />
                  <Text style={styles.sectionTitle}>Fades (Seconds)</Text>
                </View>
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Fade In Duration</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={fadeIn}
                      onChangeText={setFadeIn}
                      style={styles.textInput}
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Fade Out Duration</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={fadeOut}
                      onChangeText={setFadeOut}
                      style={styles.textInput}
                      placeholder="0"
                    />
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Tab 2: DSP & Special Effects */}
            {activeTab === 'dsp' && (
              <GlassCard style={styles.editingBlock}>
                {/* Tempo */}
                <View style={styles.sectionHeader}>
                  <Clock color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>Tempo Speed</Text>
                </View>
                <View style={styles.chipGrid}>
                  {[0.75, 1.0, 1.25, 1.5].map((t) => (
                    <TouchableOpacity 
                      key={t} 
                      style={[styles.chip, tempo === t && styles.activeChip]}
                      onPress={() => setTempo(t)}
                    >
                      <Text style={[styles.chipText, tempo === t && styles.activeChipText]}>{t}x</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Pitch */}
                <View style={styles.sectionHeader}>
                  <Sliders color={COLORS.secondary} size={18} />
                  <Text style={styles.sectionTitle}>Pitch Shift (Semitones)</Text>
                </View>
                <View style={styles.chipGrid}>
                  {[-3, -2, -1, 0, 1, 2, 3].map((p) => (
                    <TouchableOpacity 
                      key={p} 
                      style={[styles.chip, pitch === p && styles.activeChip]}
                      onPress={() => setPitch(p)}
                    >
                      <Text style={[styles.chipText, pitch === p && styles.activeChipText]}>
                        {p === 0 ? '0 (Dry)' : p > 0 ? `+${p}` : p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Bass Boost */}
                <View style={styles.sectionHeader}>
                  <Sparkles color="#EC4899" size={18} />
                  <Text style={styles.sectionTitle}>Bass Boost Profile</Text>
                </View>
                <View style={styles.chipGrid}>
                  {['None', 'Low', 'Medium', 'High'].map((b) => (
                    <TouchableOpacity 
                      key={b} 
                      style={[styles.chip, bassBoost === b && styles.activeChip]}
                      onPress={() => setBassBoost(b)}
                    >
                      <Text style={[styles.chipText, bassBoost === b && styles.activeChipText]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* EQ */}
                <View style={styles.sectionHeader}>
                  <Sliders color={COLORS.white} size={18} />
                  <Text style={styles.sectionTitle}>3-Band Equalizer Crossover</Text>
                </View>
                <View style={styles.eqRow}>
                  {/* Bass */}
                  <View style={styles.eqCol}>
                    <Text style={styles.eqLabel}>Bass ({eqBass}dB)</Text>
                    <View style={styles.eqBtnContainer}>
                      <TouchableOpacity style={styles.eqAdjust} onPress={() => setEqBass(Math.max(-10, eqBass - 2))}>
                        <Text style={styles.eqBtnText}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.eqAdjust} onPress={() => setEqBass(Math.min(10, eqBass + 2))}>
                        <Text style={styles.eqBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Mid */}
                  <View style={styles.eqCol}>
                    <Text style={styles.eqLabel}>Mids ({eqMid}dB)</Text>
                    <View style={styles.eqBtnContainer}>
                      <TouchableOpacity style={styles.eqAdjust} onPress={() => setEqMid(Math.max(-10, eqMid - 2))}>
                        <Text style={styles.eqBtnText}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.eqAdjust} onPress={() => setEqMid(Math.min(10, eqMid + 2))}>
                        <Text style={styles.eqBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Treble */}
                  <View style={styles.eqCol}>
                    <Text style={styles.eqLabel}>Treble ({eqTreble}dB)</Text>
                    <View style={styles.eqBtnContainer}>
                      <TouchableOpacity style={styles.eqAdjust} onPress={() => setEqTreble(Math.max(-10, eqTreble - 2))}>
                        <Text style={styles.eqBtnText}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.eqAdjust} onPress={() => setEqTreble(Math.min(10, eqTreble + 2))}>
                        <Text style={styles.eqBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Reverb */}
                <View style={styles.sectionHeader}>
                  <Activity color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>Acoustic Reverb</Text>
                </View>
                <View style={styles.chipGrid}>
                  {['None', 'Studio', 'Hall', 'Concert'].map((r) => (
                    <TouchableOpacity 
                      key={r} 
                      style={[styles.chip, reverb === r && styles.activeChip]}
                      onPress={() => setReverb(r)}
                    >
                      <Text style={[styles.chipText, reverb === r && styles.activeChipText]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Echo */}
                <View style={styles.sectionHeader}>
                  <Volume2 color={COLORS.secondary} size={18} />
                  <Text style={styles.sectionTitle}>Feedback Echo Delay ({Math.round(echo * 100)}%)</Text>
                </View>
                <View style={styles.chipGrid}>
                  {[0.0, 0.2, 0.4, 0.6, 0.8].map((e) => (
                    <TouchableOpacity 
                      key={e} 
                      style={[styles.chip, echo === e && styles.activeChip]}
                      onPress={() => setEcho(e)}
                    >
                      <Text style={[styles.chipText, echo === e && styles.activeChipText]}>
                        {e === 0 ? 'Dry' : `${Math.round(e * 100)}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Tab 3: AI Editing Controls */}
            {activeTab === 'ai' && (
              <GlassCard style={styles.editingBlock}>
                {/* AI Remix Toggle */}
                <View style={styles.aiToggleRow}>
                  <View style={styles.aiToggleText}>
                    <View style={styles.row}>
                      <Sparkles color="#EC4899" size={20} />
                      <Text style={styles.aiToggleTitle}>AI Generative Remix</Text>
                    </View>
                    <Text style={styles.aiToggleDesc}>Re-synthesizes the track with style prompts</Text>
                  </View>
                  <Switch 
                    value={aiRemix}
                    onValueChange={setAiRemix}
                    trackColor={{ false: '#333333', true: '#EC4899' }}
                    thumbColor={'#fff'}
                  />
                </View>

                {aiRemix && (
                  <View style={styles.remixPanel}>
                    <Text style={styles.subLabel}>Target Style & Mood</Text>
                    <View style={styles.chipGrid}>
                      {['Techno', 'Calm', 'Epic', 'Lofi', 'Cyberpunk'].map((style) => (
                        <TouchableOpacity 
                          key={style} 
                          style={[styles.chip, remixStyle === style && styles.activeChip]}
                          onPress={() => setRemixStyle(style)}
                        >
                          <Text style={[styles.chipText, remixStyle === style && styles.activeChipText]}>{style}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                {/* AI Extension looping */}
                <View style={styles.sectionHeader}>
                  <Clock color={COLORS.secondary} size={18} />
                  <Text style={styles.sectionTitle}>Extend Audio Duration</Text>
                </View>
                <Text style={styles.subDesc}>Applies a looping block with automatic crossfades</Text>
                <View style={styles.chipGrid}>
                  {['None', '30s', '60s', '90s'].map((opt) => {
                    const val = opt === 'None' ? null : parseInt(opt);
                    return (
                      <TouchableOpacity 
                        key={opt} 
                        style={[styles.chip, extendDuration === val && styles.activeChip]}
                        onPress={() => setExtendDuration(val)}
                      >
                        <Text style={[styles.chipText, extendDuration === val && styles.activeChipText]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.divider} />

                {/* Export Format */}
                <View style={styles.sectionHeader}>
                  <Download color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>Render Export Format</Text>
                </View>
                <View style={styles.chipGrid}>
                  {['wav', 'mp3'].map((fmt) => (
                    <TouchableOpacity 
                      key={fmt} 
                      style={[styles.chip, exportFormat === fmt && styles.activeChip]}
                      onPress={() => setExportFormat(fmt)}
                    >
                      <Text style={[styles.chipText, exportFormat === fmt && styles.activeChipText]}>
                        {fmt.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Submit Action */}
            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={handleApplyChanges}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.applyBtnText}>Render & Apply Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 120,
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
  landingContainer: {
    marginTop: SPACING.md,
  },
  landingCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: COLORS.border,
    borderWidth: 1,
    height: 180,
  },
  iconCircleBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  landingCardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  landingCardSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  librarySelectCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  noProjectsText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  projectListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  projectListItemText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    maxWidth: width * 0.45,
  },
  projectListItemMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  warningBanner: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
  },
  warningTitle: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: 'bold',
  },
  warningDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  playerCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  musicIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  metaContainer: {
    flex: 1,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  songSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  changeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
  },
  seekContainer: {
    marginBottom: SPACING.md,
  },
  seekTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    position: 'relative',
  },
  seekProgress: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  seekKnob: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  playPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  playerActionBtn: {
    marginLeft: SPACING.lg,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: COLORS.surfaceLight,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.white,
  },
  editingBlock: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  inputContainer: {
    width: '47%',
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.white,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  subLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  subDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  presetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: SPACING.lg,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  activeChip: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '25',
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  eqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eqCol: {
    width: '30%',
    alignItems: 'center',
  },
  eqLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  eqBtnContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  eqAdjust: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  eqBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiToggleText: {
    flex: 0.8,
  },
  aiToggleTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aiToggleDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  remixPanel: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  applyBtn: {
    marginTop: SPACING.lg,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: COLORS.error + '15',
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: SIZES.font_sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MusicEditorScreen;
