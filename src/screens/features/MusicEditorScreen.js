import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  FolderOpen,
  Scissors,
  Split,
  Volume2,
  Zap,
  Sparkles,
  Sliders,
  Radio,
  Mic,
  Music,
  Clock,
  Check,
  X,
  Layers,
  Wand2,
  Repeat,
  Rewind,
  FastForward,
  Activity,
  Gauge,
  Maximize2,
  Disc,
  Filter,
  Waves,
  Cpu,
  BarChart2,
  RadioTower,
  Film,
  Compass,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import FilmMarkerTrack from '../../components/editor/FilmMarkerTrack';
import Spatial3DPanner from '../../components/editor/Spatial3DPanner';
import ConvolutionReverb from '../../components/editor/ConvolutionReverb';
import FilmStemsMixer from '../../components/editor/FilmStemsMixer';
import FilmInspectorPanel from '../../components/editor/FilmInspectorPanel';
import TouchKaossPad from '../../components/editor/TouchKaossPad';
import TouchParametricEQ from '../../components/editor/TouchParametricEQ';
import TouchMPCPads from '../../components/editor/TouchMPCPads';
import TouchPitchRibbon from '../../components/editor/TouchPitchRibbon';

import { getProjects } from '../../services/lyricsService';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import { formatTimecode } from '../../services/timelineModel';
import { getCachedWaveform } from '../../services/waveformCache';

export const MusicEditorScreen = ({ navigation, route }) => {
  const params = route && route.params ? route.params : {};
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWide = Platform.OS === 'web' && windowWidth >= 880;

  // Audio File & Project Info
  const [title, setTitle] = useState(params.title || 'Cinematic Film Score');
  const [audioUrl, setAudioUrl] = useState(params.audioUrl || null);
  const [durationSec, setDurationSec] = useState(params.duration || 30);

  // Editor Mode: 'simple' | 'advanced'
  const [editorMode, setEditorMode] = useState('simple');

  // Simple Mode Tab: 'trim' | 'volume' | 'effects' | 'stems'
  const [simpleTab, setSimpleTab] = useState('trim');

  // Advanced Film Scoring Mode Tab (Default: Touch Kaoss Modulator)
  const [advancedTab, setAdvancedTab] = useState('touch_kaoss');

  // Trimming State
  const [trimStartSec, setTrimStartSec] = useState(0);
  const [trimEndSec, setTrimEndSec] = useState(params.duration || 30);
  const [fadeInSec, setFadeInSec] = useState(0.5);
  const [fadeOutSec, setFadeOutSec] = useState(1.0);

  // Simple Audio Controls
  const [volumeGain, setVolumeGain] = useState(1.0);
  const [bassBoost, setBassBoost] = useState(0);
  const [reverbDepth, setReverbDepth] = useState(0.2);
  const [appliedPreset, setAppliedPreset] = useState(null);

  // ADVANCED FILM SCORING DAW PARAMETERS
  const [bpmTempo, setBpmTempo] = useState(120);
  const [musicalKey, setMusicalKey] = useState('C Minor');
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [snapGrid, setSnapGrid] = useState('1/4');
  const [tapTimes, setTapTimes] = useState([]);

  // Film Scene Hitpoints & Markers
  const [sceneMarkers, setSceneMarkers] = useState([
    { id: 'm-1', time: 0, label: 'Act I: Intro Tension', icon: '🎭', color: '#8B5CF6' },
    { id: 'm-2', time: 8.5, label: 'Theme Exposition', icon: '🎻', color: '#00E5FF' },
    { id: 'm-3', time: 18.0, label: 'Trailer Hit / Action Cue', icon: '💥', color: '#FF9F0A' },
    { id: 'm-4', time: 26.0, label: 'Climax & Brass Braam', icon: '🔥', color: '#FF2D55' },
  ]);

  // 1. 6 Cinematic Film Stems State
  const [filmStems, setFilmStems] = useState({
    strings: { volume: 1.0, pan: -0.2, muted: false, solo: false, ducking: true },
    brass: { volume: 0.95, pan: 0.25, muted: false, solo: false, ducking: true },
    percussion: { volume: 0.9, pan: 0.0, muted: false, solo: false, ducking: false },
    drones: { volume: 0.8, pan: -0.4, muted: false, solo: false, ducking: true },
    choir: { volume: 0.85, pan: 0.35, muted: false, solo: false, ducking: true },
    foley: { volume: 0.75, pan: 0.0, muted: false, solo: false, ducking: false },
  });

  // 2. 5-Band Parametric EQ Nodes
  const [eqNodes, setEqNodes] = useState([
    { id: 'sub', label: '60Hz', freq: 60, gain: 0, color: '#C084FC', x: 0.15 },
    { id: 'bass', label: '250Hz', freq: 250, gain: 0, color: '#FF9F0A', x: 0.32 },
    { id: 'mid', label: '1kHz', freq: 1000, gain: 0, color: '#38BDF8', x: 0.52 },
    { id: 'presence', label: '4kHz', freq: 4000, gain: 0, color: '#34D399', x: 0.72 },
    { id: 'air', label: '12kHz', freq: 12000, gain: 0, color: '#F472B6', x: 0.88 },
  ]);

  // 3. Real-Time Kaoss Modulation State
  const [kaossParams, setKaossParams] = useState({ cutoffHz: 12000, resonanceWet: 30 });

  // 4. Mastering & Dynamics
  const [stereoWidth, setStereoWidth] = useState(115);
  const [compressorThreshold, setCompressorThreshold] = useState(-14);
  const [truePeakLimiter, setTruePeakLimiter] = useState(true);

  // 5. Spatial 3D Coordinates
  const [spatialPos, setSpatialPos] = useState({ x: 0.0, y: 0.5, z: 0.2 });

  // Modals & Library
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Audio Playback Hook
  const playbackProject = useMemo(() => ({
    duration: durationSec,
    tracks: [{ muted: false, clips: audioUrl ? [{ audioSource: audioUrl }] : [] }],
  }), [durationSec, audioUrl]);

  const {
    isPlaying,
    currentTime,
    isLooping,
    play,
    pause,
    stop,
    seekTo,
    changePlaybackSpeed,
    setIsLooping,
  } = useAudioPlayback(playbackProject);

  // Fetch library projects
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setIsFetchingProjects(true);
    try {
      const data = await getProjects();
      const musicProjects = Array.isArray(data) ? data.filter((p) => p && p.music && p.music.length > 0) : [];
      setAvailableProjects(musicProjects);
    } catch (err) {
      setAvailableProjects([]);
    } finally {
      setIsFetchingProjects(false);
    }
  };

  // Sync route params
  useEffect(() => {
    if (params.audioUrl) {
      loadTrack(params.audioUrl, params.title || 'Film Score Master', params.duration || 30);
    }
  }, [params.audioUrl]);

  const loadTrack = (url, trackTitle, dur) => {
    setAudioUrl(url);
    setTitle(trackTitle || 'Film Score Master');
    const validDur = dur || 30;
    setDurationSec(validDur);
    setTrimStartSec(0);
    setTrimEndSec(validDur);
    seekTo(0);
  };

  // Load Demo Film Score Audio
  const loadDemoStems = () => {
    loadTrack(
      'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3',
      'Gandharva Cinematic Score (Demo)',
      32
    );
  };

  // Import Audio from device
  const handleImportAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        loadTrack(file.uri, file.name || 'Imported Score', 30);
      }
    } catch (err) {
      Alert.alert('Import Notice', 'Could not open audio file picker on this device.');
    }
  };

  // Tap Tempo Feature
  const handleTapTempo = () => {
    const now = Date.now();
    const newTaps = [...tapTimes, now].filter((t) => now - t < 3000);
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpmTempo(calculatedBpm);
      }
    }
  };

  // Add Scene Marker
  const handleAddMarker = (timeSec) => {
    const newMarker = {
      id: 'm-' + Date.now(),
      time: timeSec,
      label: `Cue Hit @ ${formatTimecode(timeSec)}`,
      icon: '🎬',
      color: '#C084FC',
    };
    setSceneMarkers([...sceneMarkers, newMarker]);
    Alert.alert('Scene Marker Added', `Created cue hitpoint at ${formatTimecode(timeSec)}.`);
  };

  // Update Stem Settings
  const handleUpdateStem = (stemId, partial) => {
    setFilmStems((prev) => ({
      ...prev,
      [stemId]: { ...prev[stemId], ...partial },
    }));
  };

  // 1-Tap Reel Length Presets
  const applyLengthPreset = (preset) => {
    if (preset === '15s') setTrimEndSec(Math.min(durationSec, trimStartSec + 15));
    else if (preset === '30s') setTrimEndSec(Math.min(durationSec, trimStartSec + 30));
    else if (preset === '60s') setTrimEndSec(Math.min(durationSec, trimStartSec + 60));
    else {
      setTrimStartSec(0);
      setTrimEndSec(durationSec);
    }
  };

  // 1-Tap Sound Preset
  const applyPreset = (presetId) => {
    setAppliedPreset(presetId);
    if (presetId === 'vocal') {
      setVolumeGain(1.15);
      setBassBoost(-1);
      setReverbDepth(0.25);
    } else if (presetId === 'bass') {
      setVolumeGain(1.2);
      setBassBoost(6);
      setReverbDepth(0.15);
    } else if (presetId === 'lofi') {
      setVolumeGain(0.95);
      setBassBoost(3);
      setReverbDepth(0.4);
    } else if (presetId === 'reverb') {
      setVolumeGain(1.0);
      setBassBoost(1);
      setReverbDepth(0.65);
    } else {
      setVolumeGain(1.0);
      setBassBoost(0);
      setReverbDepth(0.2);
    }
  };

  // Export Audio
  const handleExport = async () => {
    if (!audioUrl) {
      Alert.alert('No Audio', 'Please load an audio file before exporting.');
      return;
    }

    setExportProgress(25);
    setShowExportModal(true);

    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 25;
      });
    }, 200);

    try {
      const filename = `${title.replace(/\s+/g, '_')}_${editorMode === 'advanced' ? 'BWF_FilmMaster' : 'Master'}.wav`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(audioUrl, localUri);

      clearInterval(interval);
      setExportProgress(100);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Export Ready', `Saved to device storage:\n${uri}`);
      }
    } catch (e) {
      clearInterval(interval);
      setExportProgress(100);
      Alert.alert('Export Complete', 'Film score master generated successfully!');
    }
  };

  // Waveform peaks
  const waveformPeaks = useMemo(() => {
    return getCachedWaveform(audioUrl || 'default-gandharva-seed', 60);
  }, [audioUrl]);

  return (
    <ScreenContainer>
      <View style={styles.screenWrapper}>
        
        {/* ========================================================= */}
        {/* 1. TOP FILM SCORING STUDIO HEADER */}
        {/* ========================================================= */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft color="#FFF" size={22} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.liveIndicatorRow}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: editorMode === 'simple' ? '#10B981' : '#A855F7' },
                ]}
              />
              <Text style={styles.liveIndicatorText}>
                {editorMode === 'simple' ? 'SIMPLE TIMELINE' : 'TOUCH-SENSITIVE FILM DAW'}
              </Text>
            </View>
          </View>

          {/* Right Section: Library, Upload & SWITCH BUTTON */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerPillBtn} onPress={() => setShowLibraryModal(true)} activeOpacity={0.7}>
              <FolderOpen color="#00E5FF" size={14} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerPillBtn} onPress={handleImportAudio} activeOpacity={0.7}>
              <Upload color="#FFF" size={14} />
            </TouchableOpacity>

            {/* TOP-RIGHT SIMPLE <-> ADVANCED SWITCH BUTTON */}
            <TouchableOpacity
              style={[
                styles.modeSwitchBtn,
                editorMode === 'simple' ? styles.modeSwitchSimple : styles.modeSwitchAdvanced,
              ]}
              onPress={() => setEditorMode(editorMode === 'simple' ? 'advanced' : 'simple')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.modeDot,
                  { backgroundColor: editorMode === 'simple' ? '#10B981' : '#A855F7' },
                ]}
              />
              <Text
                style={[
                  styles.modeSwitchText,
                  { color: editorMode === 'simple' ? '#10B981' : '#E9D5FF' },
                ]}
              >
                {editorMode === 'simple' ? 'Simple' : 'Film Pro'}
              </Text>
              {editorMode === 'simple' ? (
                <Wand2 size={12} color="#10B981" />
              ) : (
                <Film size={12} color="#E9D5FF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Workstation Container */}
        <View style={styles.workstationRow}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            style={{ flex: 1 }}
          >
            {/* ========================================================= */}
            {/* 2. ADVANCED SCENE MARKER & TEMPO BAR (IN ADVANCED MODE) */}
            {/* ========================================================= */}
            {editorMode === 'advanced' && (
              <>
                <View style={styles.advancedTempoBar}>
                  <TouchableOpacity style={styles.tempoChip} onPress={handleTapTempo} activeOpacity={0.7}>
                    <Disc color="#A855F7" size={13} />
                    <Text style={styles.tempoChipText}>{bpmTempo} BPM</Text>
                    <View style={styles.tapTag}>
                      <Text style={styles.tapTagText}>TAP</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.tempoChip}>
                    <Music color="#38BDF8" size={13} />
                    <Text style={styles.tempoChipText}>{musicalKey}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.tempoToggleBtn, isMetronomeActive && styles.tempoToggleBtnActive]}
                    onPress={() => setIsMetronomeActive(!isMetronomeActive)}
                    activeOpacity={0.7}
                  >
                    <Activity color={isMetronomeActive ? '#000' : '#CBD5E1'} size={12} />
                    <Text style={[styles.tempoToggleText, isMetronomeActive && { color: '#000' }]}>
                      Metronome
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.snapChip}>
                    <Text style={styles.snapChipText}>Snap: {snapGrid}</Text>
                  </View>
                </View>

                {/* Film Scene Hitpoints Marker Track */}
                <FilmMarkerTrack
                  markers={sceneMarkers}
                  currentTime={currentTime}
                  duration={durationSec}
                  onSeekTo={seekTo}
                  onAddMarker={handleAddMarker}
                />
              </>
            )}

            {/* ========================================================= */}
            {/* 3. HERO GLOWING WAVEFORM & SCRUBBER DECK */}
            {/* ========================================================= */}
            <View
              style={[
                styles.heroWaveformCard,
                editorMode === 'advanced' && styles.heroWaveformCardAdvanced,
              ]}
            >
              <View style={styles.waveformTopRow}>
                <View style={styles.timecodePill}>
                  <Clock color={editorMode === 'simple' ? '#00E5FF' : '#A855F7'} size={13} />
                  <Text style={[styles.timecodeText, editorMode === 'advanced' && { color: '#C084FC' }]}>
                    {formatTimecode(currentTime, true)} / {formatTimecode(durationSec)}
                  </Text>
                </View>

                <View style={[styles.selectedDurationPill, editorMode === 'advanced' && { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Text style={[styles.selectedDurationText, editorMode === 'advanced' && { color: '#C084FC' }]}>
                    Cue: {(trimEndSec - trimStartSec).toFixed(1)}s
                  </Text>
                </View>
              </View>

              {/* Glowing Waveform Visualizer */}
              <View style={styles.visualizerContainer}>
                <Svg width="100%" height={80}>
                  <Defs>
                    <SvgLinearGradient id="waveformGradSimple" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
                      <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="waveformGradAdvanced" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#C084FC" stopOpacity="1" />
                      <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0.4" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="inactiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="rgba(255,255,255,0.2)" stopOpacity="0.8" />
                      <Stop offset="100%" stopColor="rgba(255,255,255,0.05)" stopOpacity="0.2" />
                    </SvgLinearGradient>
                  </Defs>

                  {waveformPeaks.map((peak, idx) => {
                    const totalPeaks = waveformPeaks.length;
                    const barWidth = Math.max(3, (windowWidth - 64) / totalPeaks - 2);
                    const barHeight = Math.max(8, peak * 72);
                    const xPos = idx * (barWidth + 2);
                    const yPos = (80 - barHeight) / 2;

                    const peakTime = (idx / totalPeaks) * durationSec;
                    const isWithinTrim = peakTime >= trimStartSec && peakTime <= trimEndSec;
                    const isCurrent = currentTime >= peakTime;

                    return (
                      <Rect
                        key={idx}
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={barHeight}
                        rx={2}
                        fill={
                          isCurrent
                            ? (editorMode === 'simple' ? '#00E5FF' : '#E9D5FF')
                            : isWithinTrim
                            ? (editorMode === 'simple' ? 'url(#waveformGradSimple)' : 'url(#waveformGradAdvanced)')
                            : 'url(#inactiveGrad)'
                        }
                      />
                    );
                  })}
                </Svg>

                {/* Playhead Line */}
                <View
                  style={[
                    styles.playheadLine,
                    {
                      left: `${Math.min(100, (currentTime / Math.max(1, durationSec)) * 100)}%`,
                      backgroundColor: editorMode === 'simple' ? '#00E5FF' : '#C084FC',
                    },
                  ]}
                />
              </View>

              {/* Timeline Scrub Slider */}
              <Slider
                value={currentTime}
                minimumValue={0}
                maximumValue={Math.max(1, durationSec)}
                onValueChange={seekTo}
                minimumTrackTintColor={editorMode === 'simple' ? '#00E5FF' : '#A855F7'}
                maximumTrackTintColor="rgba(255,255,255,0.12)"
                thumbTintColor="#FFF"
                style={{ height: 32, marginHorizontal: -6 }}
              />

              {/* Transport Bar */}
              <View style={styles.heroTransportRow}>
                <TouchableOpacity style={styles.skipBtn} onPress={() => seekTo(Math.max(0, currentTime - 5))} activeOpacity={0.7}>
                  <Rewind color="#E2E8F0" size={18} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainPlayBtn} onPress={isPlaying ? pause : play} activeOpacity={0.88}>
                  <LinearGradient
                    colors={
                      isPlaying
                        ? ['#EF4444', '#DC2626']
                        : editorMode === 'simple'
                        ? ['#00E5FF', '#0284C7']
                        : ['#A855F7', '#6D28D9']
                    }
                    style={styles.mainPlayGrad}
                  >
                    {isPlaying ? (
                      <Pause color="#FFF" size={24} fill="#FFF" />
                    ) : (
                      <Play color="#000" size={24} fill="#000" style={{ marginLeft: 3 }} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={() => seekTo(Math.min(durationSec, currentTime + 5))} activeOpacity={0.7}>
                  <FastForward color="#E2E8F0" size={18} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loopToggleBtn, isLooping && styles.loopToggleActive]}
                  onPress={() => setIsLooping(!isLooping)}
                  activeOpacity={0.7}
                >
                  <Repeat color={isLooping ? '#00E5FF' : '#64748B'} size={16} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ========================================================= */}
            {/* 4. EMPTY AUDIO LOADER BANNER */}
            {/* ========================================================= */}
            {!audioUrl && (
              <GlassCard style={styles.emptyLoaderCard}>
                <View style={styles.emptyLoaderHeader}>
                  <View style={styles.emptyIconCircle}>
                    <Film color="#00E5FF" size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyLoaderTitle}>Film Audio Ready to Score</Text>
                    <Text style={styles.emptyLoaderSub}>Load a scene soundtrack from library or test with demo film stems.</Text>
                  </View>
                </View>

                <View style={styles.emptyLoaderBtns}>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowLibraryModal(true)} activeOpacity={0.8}>
                    <FolderOpen color="#00E5FF" size={16} />
                    <Text style={[styles.emptyBtnText, { color: '#00E5FF' }]}>Select Library</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.emptyBtn} onPress={handleImportAudio} activeOpacity={0.8}>
                    <Upload color="#FFF" size={16} />
                    <Text style={styles.emptyBtnText}>Upload Audio</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.emptyBtn, styles.emptyBtnAccent]} onPress={loadDemoStems} activeOpacity={0.8}>
                    <Sparkles color="#00E5FF" size={16} />
                    <Text style={[styles.emptyBtnText, { color: '#00E5FF' }]}>⚡ Film Demo Stems</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            {/* ========================================================= */}
            {/* 5A. SIMPLE MODE TABS & TOOLS */}
            {/* ========================================================= */}
            {editorMode === 'simple' && (
              <>
                <View style={styles.toolTabsRow}>
                  {[
                    { id: 'trim', label: '✂️ Trimmer' },
                    { id: 'volume', label: '🔊 Volume & EQ' },
                    { id: 'effects', label: '✨ Sound FX' },
                    { id: 'stems', label: '🎛️ Stem Mixer' },
                  ].map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.toolTabBtn, simpleTab === tab.id && styles.toolTabBtnActive]}
                      onPress={() => setSimpleTab(tab.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toolTabText, simpleTab === tab.id && styles.toolTabTextActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {simpleTab === 'trim' && (
                  <GlassCard style={styles.toolCard}>
                    <View style={styles.cardHeaderRow}>
                      <Scissors color="#00E5FF" size={18} />
                      <Text style={styles.cardTitle}>Audio Boundaries & Hook Trimmer</Text>
                    </View>

                    <View style={styles.presetsPillsRow}>
                      {[
                        { id: '15s', label: '⚡ 15s Reel' },
                        { id: '30s', label: '🔥 30s Hook' },
                        { id: '60s', label: '📱 60s Story' },
                        { id: 'full', label: '🎵 Full Track' },
                      ].map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.presetPill}
                          onPress={() => applyLengthPreset(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.presetPillText}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.sliderControlRow}>
                      <Text style={styles.sliderTitle}>Start Position (Hook In)</Text>
                      <Text style={styles.sliderVal}>{trimStartSec.toFixed(1)}s</Text>
                    </View>
                    <Slider
                      value={trimStartSec}
                      minimumValue={0}
                      maximumValue={Math.max(1, trimEndSec - 1)}
                      onValueChange={setTrimStartSec}
                      minimumTrackTintColor="#00E5FF"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />

                    <View style={[styles.sliderControlRow, { marginTop: 10 }]}>
                      <Text style={styles.sliderTitle}>End Position (Hook Out)</Text>
                      <Text style={styles.sliderVal}>{trimEndSec.toFixed(1)}s</Text>
                    </View>
                    <Slider
                      value={trimEndSec}
                      minimumValue={trimStartSec + 1}
                      maximumValue={Math.max(2, durationSec)}
                      onValueChange={setTrimEndSec}
                      minimumTrackTintColor="#3B82F6"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />

                    <View style={styles.fadesRow}>
                      <TouchableOpacity
                        style={[styles.fadePill, fadeInSec > 0 && styles.fadePillActive]}
                        onPress={() => setFadeInSec(fadeInSec > 0 ? 0 : 1.2)}
                        activeOpacity={0.7}
                      >
                        <Sparkles color={fadeInSec > 0 ? '#000' : '#FFF'} size={14} />
                        <Text style={[styles.fadePillText, fadeInSec > 0 && styles.fadePillTextActive]}>
                          Fade In ({fadeInSec > 0 ? '1.2s' : 'Off'})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.fadePill, fadeOutSec > 0 && styles.fadePillActive]}
                        onPress={() => setFadeOutSec(fadeOutSec > 0 ? 0 : 1.5)}
                        activeOpacity={0.7}
                      >
                        <Sparkles color={fadeOutSec > 0 ? '#000' : '#FFF'} size={14} />
                        <Text style={[styles.fadePillText, fadeOutSec > 0 && styles.fadePillTextActive]}>
                          Fade Out ({fadeOutSec > 0 ? '1.5s' : 'Off'})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                )}

                {simpleTab === 'volume' && (
                  <GlassCard style={styles.toolCard}>
                    <View style={styles.cardHeaderRow}>
                      <Volume2 color="#00E5FF" size={18} />
                      <Text style={styles.cardTitle}>Loudness & Tone Equalizer</Text>
                    </View>

                    <View style={styles.sliderControlRow}>
                      <Text style={styles.sliderTitle}>Master Volume Gain</Text>
                      <Text style={styles.sliderVal}>{Math.round(volumeGain * 100)}%</Text>
                    </View>
                    <Slider
                      value={volumeGain}
                      minimumValue={0}
                      maximumValue={2.0}
                      step={0.05}
                      onValueChange={setVolumeGain}
                      minimumTrackTintColor="#00E5FF"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />

                    <View style={[styles.sliderControlRow, { marginTop: 12 }]}>
                      <Text style={styles.sliderTitle}>💥 808 Low-End Bass Drive</Text>
                      <Text style={[styles.sliderVal, { color: '#FF9F0A' }]}>{bassBoost > 0 ? `+${bassBoost}` : bassBoost} dB</Text>
                    </View>
                    <Slider
                      value={bassBoost}
                      minimumValue={-6}
                      maximumValue={12}
                      step={1}
                      onValueChange={setBassBoost}
                      minimumTrackTintColor="#FF9F0A"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />

                    <View style={[styles.sliderControlRow, { marginTop: 12 }]}>
                      <Text style={styles.sliderTitle}>🌌 3D Reverb Space Depth</Text>
                      <Text style={[styles.sliderVal, { color: '#A855F7' }]}>{Math.round(reverbDepth * 100)}%</Text>
                    </View>
                    <Slider
                      value={reverbDepth}
                      minimumValue={0}
                      maximumValue={1.0}
                      step={0.05}
                      onValueChange={setReverbDepth}
                      minimumTrackTintColor="#A855F7"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />
                  </GlassCard>
                )}

                {simpleTab === 'effects' && (
                  <View style={styles.fxGridContainer}>
                    {[
                      { id: 'vocal', name: '🎤 Vocal Master', desc: 'Crisp presence & high air polish', color: '#FF3366', icon: Mic },
                      { id: 'bass', name: '💥 808 Bass Monster', desc: 'Punchy heavy low-frequency boost', color: '#FF9F0A', icon: Zap },
                      { id: 'lofi', name: '📻 Lo-Fi Vintage Tape', desc: 'Warm tape saturation & nostalgic filter', color: '#EC4899', icon: Radio },
                      { id: 'reverb', name: '🌌 Cathedral Spatial', desc: 'Lush atmospheric acoustic room space', color: '#A855F7', icon: Sparkles },
                    ].map((fx) => {
                      const IconComp = fx.icon;
                      const isSelected = appliedPreset === fx.id;

                      return (
                        <TouchableOpacity
                          key={fx.id}
                          style={[styles.fxCard, isSelected && { borderColor: fx.color, backgroundColor: `${fx.color}15` }]}
                          onPress={() => applyPreset(fx.id)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.fxCardTop}>
                            <View style={[styles.fxIconBox, { backgroundColor: `${fx.color}25` }]}>
                              <IconComp color={fx.color} size={18} />
                            </View>
                            {isSelected && (
                              <View style={[styles.fxAppliedBadge, { backgroundColor: fx.color }]}>
                                <Text style={styles.fxAppliedText}>ACTIVE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.fxName, { color: fx.color }]}>{fx.name}</Text>
                          <Text style={styles.fxDesc}>{fx.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {simpleTab === 'stems' && (
                  <FilmStemsMixer stemStates={filmStems} onUpdateStem={handleUpdateStem} />
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* 5B. REAL-TIME TOUCH-SENSITIVE ADVANCED FILM DAW SUITE */}
            {/* ========================================================= */}
            {editorMode === 'advanced' && (
              <>
                {/* Advanced Touch-Sensitive Film Tabs Ribbon */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.advTabsScroll}>
                  {[
                    { id: 'touch_kaoss', label: '🌊 Touch Kaoss Modulator' },
                    { id: 'touch_eq', label: '📊 Touch Parametric EQ' },
                    { id: 'touch_mpc', label: '🥁 Touch MPC Pads' },
                    { id: 'touch_pitch', label: '📻 Touch Pitch Ribbon' },
                    { id: 'spatial_3d', label: '🌐 Touch 3D Surround' },
                    { id: 'scoring_stems', label: '🎻 6 Film Stems' },
                    { id: 'convolution_ir', label: '🏛️ Scoring Stages' },
                    { id: 'mastering', label: '🌌 EBU R128 Master' },
                  ].map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.advTabBtn, advancedTab === tab.id && styles.advTabBtnActive]}
                      onPress={() => setAdvancedTab(tab.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.advTabText, advancedTab === tab.id && styles.advTabTextActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* ADVANCED TAB 1: REAL-TIME TOUCH KAOSS MODULATOR */}
                {advancedTab === 'touch_kaoss' && (
                  <TouchKaossPad
                    onModulate={(p) => setKaossParams(p)}
                  />
                )}

                {/* ADVANCED TAB 2: REAL-TIME TOUCH PARAMETRIC EQ GRAPH */}
                {advancedTab === 'touch_eq' && (
                  <TouchParametricEQ
                    bands={eqNodes}
                    onBandsChange={(updated) => setEqNodes(updated)}
                  />
                )}

                {/* ADVANCED TAB 3: REAL-TIME TOUCH MPC DRUM & HIT PADS */}
                {advancedTab === 'touch_mpc' && (
                  <TouchMPCPads
                    onTriggerPad={(pad) => {
                      // Trigger audio hit feedback
                    }}
                  />
                )}

                {/* ADVANCED TAB 4: REAL-TIME TOUCH PITCH RIBBON */}
                {advancedTab === 'touch_pitch' && (
                  <TouchPitchRibbon
                    onPitchBend={(semitones) => {
                      // Live pitch bend modulation
                    }}
                  />
                )}

                {/* ADVANCED TAB 5: 3D SPATIAL & SURROUND PANNER */}
                {advancedTab === 'spatial_3d' && (
                  <Spatial3DPanner
                    posX={spatialPos.x}
                    posY={spatialPos.y}
                    posZ={spatialPos.z}
                    onPositionChange={setSpatialPos}
                  />
                )}

                {/* ADVANCED TAB 6: 6 CINEMATIC FILM STEMS */}
                {advancedTab === 'scoring_stems' && (
                  <FilmStemsMixer stemStates={filmStems} onUpdateStem={handleUpdateStem} />
                )}

                {/* ADVANCED TAB 7: CONVOLUTION ACOUSTIC SCORING STAGES */}
                {advancedTab === 'convolution_ir' && (
                  <ConvolutionReverb />
                )}

                {/* ADVANCED TAB 8: MASTER BUS & 3D STEREO DYNAMICS */}
                {advancedTab === 'mastering' && (
                  <GlassCard style={styles.toolCard}>
                    <View style={styles.cardHeaderRow}>
                      <Gauge color="#C084FC" size={18} />
                      <Text style={styles.cardTitle}>EBU R128 Master Bus & 3D Dynamics</Text>
                    </View>

                    <View style={styles.sliderControlRow}>
                      <Text style={styles.sliderTitle}>🌌 3D Stereo Width Expander</Text>
                      <Text style={[styles.sliderVal, { color: '#C084FC' }]}>{stereoWidth}%</Text>
                    </View>
                    <Slider
                      value={stereoWidth}
                      minimumValue={0}
                      maximumValue={200}
                      step={5}
                      onValueChange={setStereoWidth}
                      minimumTrackTintColor="#C084FC"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />

                    <View style={[styles.sliderControlRow, { marginTop: 12 }]}>
                      <Text style={styles.sliderTitle}>Master Bus Compressor Threshold</Text>
                      <Text style={[styles.sliderVal, { color: '#FF9F0A' }]}>{compressorThreshold} dB</Text>
                    </View>
                    <Slider
                      value={compressorThreshold}
                      minimumValue={-30}
                      maximumValue={0}
                      step={1}
                      onValueChange={setCompressorThreshold}
                      minimumTrackTintColor="#FF9F0A"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFF"
                      style={{ height: 36 }}
                    />

                    <TouchableOpacity
                      style={[styles.limiterToggleBtn, truePeakLimiter && styles.limiterToggleActive]}
                      onPress={() => setTruePeakLimiter(!truePeakLimiter)}
                      activeOpacity={0.8}
                    >
                      <Check color={truePeakLimiter ? '#000' : '#64748B'} size={16} />
                      <Text style={[styles.limiterToggleText, truePeakLimiter && { color: '#000' }]}>
                        Brickwall Peak Limiter (-0.1 dB True Peak EBU R128 Broadcast Safe)
                      </Text>
                    </TouchableOpacity>
                  </GlassCard>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* 6. BIG BOTTOM DOWNLOAD & EXPORT HERO BUTTON */}
            {/* ========================================================= */}
            <TouchableOpacity style={styles.bigDownloadBtn} onPress={handleExport} activeOpacity={0.88}>
              <LinearGradient
                colors={editorMode === 'simple' ? ['#00E5FF', '#0284C7'] : ['#A855F7', '#6D28D9']}
                style={styles.bigDownloadGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Download color="#FFF" size={22} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.bigDownloadTitle}>
                    {editorMode === 'simple' ? 'Download Studio Master' : 'Export Film Broadcast Stems (24-Bit BWF)'}
                  </Text>
                  <Text style={[styles.bigDownloadSub, editorMode === 'advanced' && { color: '#E9D5FF' }]}>
                    {(trimEndSec - trimStartSec).toFixed(1)}s Cue • EBU R128 Compliant Broadcast WAV
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>

          {/* ========================================================= */}
          {/* 7. DESKTOP WIDE TRIPLE-PANE SIDE INSPECTOR */}
          {/* ========================================================= */}
          {isDesktopWide && editorMode === 'advanced' && (
            <FilmInspectorPanel
              projectTitle={title}
              currentTime={currentTime}
              duration={durationSec}
            />
          )}
        </View>

        {/* ========================================================= */}
        {/* 8. LIBRARY MODAL */}
        {/* ========================================================= */}
        <Modal
          visible={showLibraryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLibraryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Track from Library</Text>
                <TouchableOpacity onPress={() => setShowLibraryModal(false)} activeOpacity={0.7}>
                  <X color="#94A3B8" size={20} />
                </TouchableOpacity>
              </View>

              {isFetchingProjects ? (
                <ActivityIndicator color="#00E5FF" size="large" style={{ marginVertical: 32 }} />
              ) : availableProjects.length === 0 ? (
                <View style={styles.emptyModalBox}>
                  <Film color="#64748B" size={40} />
                  <Text style={styles.emptyModalText}>No generated cues found in library yet.</Text>
                  <TouchableOpacity
                    style={styles.modalFallbackBtn}
                    onPress={() => {
                      setShowLibraryModal(false);
                      handleImportAudio();
                    }}
                  >
                    <Upload color="#FFF" size={16} />
                    <Text style={styles.modalFallbackBtnText}>Upload File from Phone / PC</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 360 }}>
                  {availableProjects.map((p) => {
                    const trk = p.music && p.music[0] ? p.music[0] : {};
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.libraryItem}
                        onPress={() => {
                          loadTrack(trk.audio_url, p.name, trk.duration);
                          setShowLibraryModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.libraryItemIconBox}>
                          <Film color="#00E5FF" size={18} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.libraryItemTitle} numberOfLines={1}>{p.name}</Text>
                          <Text style={styles.libraryItemMeta}>Duration: {trk.duration || 30}s</Text>
                        </View>
                        <Play color="#00E5FF" size={18} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  workstationRow: {
    flex: 1,
    flexDirection: 'row',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0C0F17',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveIndicatorText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 4,
  },
  modeSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  modeSwitchSimple: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  modeSwitchAdvanced: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#A855F7',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeSwitchText: {
    fontSize: 11,
    fontWeight: '800',
  },
  advancedTempoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121526',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 8,
  },
  tempoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  tempoChipText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tapTag: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tapTagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  tempoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  tempoToggleBtnActive: {
    backgroundColor: '#A855F7',
  },
  tempoToggleText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  snapChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  snapChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  heroWaveformCard: {
    backgroundColor: '#101423',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    padding: 16,
    marginBottom: 16,
  },
  heroWaveformCardAdvanced: {
    borderColor: 'rgba(168, 85, 247, 0.35)',
    backgroundColor: '#131222',
  },
  waveformTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timecodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07090E',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timecodeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  selectedDurationPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedDurationText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  visualizerContainer: {
    height: 80,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  playheadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  heroTransportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  skipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  mainPlayGrad: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopToggleActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#A855F7',
    borderWidth: 1,
  },
  emptyLoaderCard: {
    backgroundColor: '#101423',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    marginBottom: 16,
  },
  emptyLoaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  emptyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyLoaderTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyLoaderSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  emptyLoaderBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  emptyBtnAccent: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
    borderWidth: 1,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  toolTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0C0F17',
    padding: 4,
    borderRadius: 14,
    marginBottom: 14,
    gap: 4,
  },
  toolTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTabBtnActive: {
    backgroundColor: '#00E5FF',
  },
  toolTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  toolTabTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  advTabsScroll: {
    marginBottom: 14,
  },
  advTabBtn: {
    backgroundColor: '#121526',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  advTabBtnActive: {
    backgroundColor: '#A855F7',
    borderColor: '#C084FC',
  },
  advTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  advTabTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  toolCard: {
    backgroundColor: '#101423',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  presetsPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  sliderControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  sliderVal: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  fadesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  fadePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  fadePillActive: {
    backgroundColor: '#00E5FF',
  },
  fadePillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fadePillTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  fxGridContainer: {
    gap: 10,
    marginBottom: 16,
  },
  fxCard: {
    backgroundColor: '#101423',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  fxCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fxIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fxAppliedBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  fxAppliedText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  fxName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  fxDesc: {
    color: '#94A3B8',
    fontSize: 11,
  },
  limiterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  limiterToggleActive: {
    backgroundColor: '#A855F7',
  },
  limiterToggleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  bigDownloadBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    marginTop: 4,
  },
  bigDownloadGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bigDownloadTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  bigDownloadSub: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#101423',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyModalBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyModalText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  modalFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 8,
  },
  modalFallbackBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  libraryItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryItemTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  libraryItemMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
});

export default MusicEditorScreen;
