import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { ChevronLeft, Mic, Music, Play, Pause, Download, Save, Share2, Sparkles, Wand2, Sliders, ShieldCheck, CheckCircle2, Eye, EyeOff, RefreshCw, Volume2, VolumeX, FileSpreadsheet } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import ToastNotification from '../../components/ToastNotification';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import CONFIG from '../../config/api.config';
import apiClient from '../../services/apiClient';
import { generateMusic, checkMusicGenHealth } from '../../services/musicService';
import { saveProjectToLibrary } from '../../services/libraryStorage';
import { cacheAudioTrack, getPlaybackUri } from '../../services/audioCache';

const AI_VOICES = [
  { id: 'v1', name: 'Female Pop Singer', icon: '🎙️', desc: 'Bright, expressive, modern pop vocal' },
  { id: 'v2', name: 'Male Acoustic Singer', icon: '🎤', desc: 'Warm, acoustic, intimate acoustic voice' },
  { id: 'v3', name: 'Melodic Soul Singer', icon: '🌟', desc: 'Rich, vibrato-rich, soulful melody' },
  { id: 'v4', name: 'Cyber Synth Singer', icon: '⚡', desc: 'Futuristic autotuned electronic vocal' },
];

const GENRES = ['Pop', 'Lofi', 'Rock', 'Cinematic', 'Phonk', 'EDM'];
const MOODS = ['Happy', 'Sad', 'Romantic', 'Chill', 'Dark', 'Epic'];

export default function CreateSongScreen({ navigation, route }) {
  const lyricsText = route?.params?.lyrics || 'No lyrics provided';
  const songTitle = route?.params?.title || 'Untitled Song';
  const initialBgmPrompt = route?.params?.bgmPrompt || 'High-quality instrumental arrangement with acoustic guitar, piano, and 808 bass';
  const initialGenre = route?.params?.genre || 'Pop';
  const initialMood = route?.params?.mood || 'Romantic';
  const language = route?.params?.language || 'English';

  const [selectedVoice, setSelectedVoice] = useState(AI_VOICES[0]);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [bgmPrompt, setBgmPrompt] = useState(initialBgmPrompt);

  const [showLyricsPreview, setShowLyricsPreview] = useState(true);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isGeneratingBgm, setIsGeneratingBgm] = useState(false);
  const [isGPUOnline, setIsGPUOnline] = useState(null);

  const [voiceAudioUrl, setVoiceAudioUrl] = useState(null);
  const [bgmAudioUrl, setBgmAudioUrl] = useState(null);

  // Dual Track Sound References (useRef for synchronous zero-latency access)
  const vocalSoundRef = useRef(null);
  const bgmSoundRef = useRef(null);
  const loadedVoiceUrlRef = useRef(null);
  const loadedBgmUrlRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaybackMode, setActivePlaybackMode] = useState(null); // 'mix', 'voice_only', 'bgm_only'

  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(10000);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [bgmVolume, setBgmVolume] = useState(0.85);

  // Karaoke & Waveform animation state
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const lyricsLines = lyricsText.split('\n').filter(l => l.trim().length > 0);
  const lyricsScrollRef = useRef(null);

  // Toast Notification state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Check Kaggle GPU health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await checkMusicGenHealth();
        setIsGPUOnline(res.status === 'online');
      } catch (e) {
        setIsGPUOnline(false);
      }
    };
    checkHealth();
  }, []);

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      if (vocalSoundRef.current) vocalSoundRef.current.unloadAsync();
      if (bgmSoundRef.current) bgmSoundRef.current.unloadAsync();
    };
  }, []);

  // Detector calculations
  const detectedBpm = selectedGenre === 'Lofi' ? 85 : selectedGenre === 'EDM' ? 128 : selectedGenre === 'Rock' ? 140 : 120;
  const detectedKey = selectedMood === 'Sad' || selectedMood === 'Dark' ? 'A Minor' : 'C Major';
  const syllableCount = lyricsText.split(/\s+/).filter(Boolean).length;

  const stopAllAudio = async () => {
    try {
      if (vocalSoundRef.current) {
        await vocalSoundRef.current.unloadAsync();
        vocalSoundRef.current = null;
      }
      if (bgmSoundRef.current) {
        await bgmSoundRef.current.unloadAsync();
        bgmSoundRef.current = null;
      }
      loadedVoiceUrlRef.current = null;
      loadedBgmUrlRef.current = null;
      setIsPlaying(false);
      setActivePlaybackMode(null);
    } catch (e) {
      console.error('Stop error:', e);
    }
  };

  const handleGenerateVoice = async () => {
    setIsGeneratingVoice(true);
    await stopAllAudio();
    try {
      const voiceResult = await apiClient('/synthesize-voice', {
        method: 'POST',
        body: JSON.stringify({
          lyrics: lyricsText,
          voice: selectedVoice.name,
          title: songTitle,
          genre: selectedGenre,
          language: language,
          scale: detectedKey
        })
      });
      if (voiceResult && voiceResult.audioUrl) {
        setVoiceAudioUrl(voiceResult.audioUrl);
        showToast(`🎤 ${language} Vocal Synthesized (${selectedVoice.name})!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to synthesize voice track.', 'error');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleGenerateBGM = async () => {
    setIsGeneratingBgm(true);
    await stopAllAudio();
    try {
      const bgmResult = await generateMusic(
        `Pure instrumental BGM backing track. ${bgmPrompt}. Genre: ${selectedGenre}, Mood: ${selectedMood}. No vocals.`,
        10,
        1
      );
      if (bgmResult && bgmResult.variations && bgmResult.variations.length > 0) {
        const url = bgmResult.variations[0].audio_url;
        setBgmAudioUrl(url);
        showToast('🎶 BGM Ready! Use "BGM Preview" or click "Mix AI Voice + BGM" below.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to generate BGM track.', 'error');
    } finally {
      setIsGeneratingBgm(false);
    }
  };

  // Play AI Voice Specifically (Voice Preview button)
  const playVoicePreview = async () => {
    if (!voiceAudioUrl) return;

    if (activePlaybackMode === 'voice_only' && vocalSoundRef.current && loadedVoiceUrlRef.current === voiceAudioUrl) {
      if (isPlaying) {
        await vocalSoundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await vocalSoundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    await stopAllAudio();

    try {
      const vUri = await getPlaybackUri(voiceAudioUrl);
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: vUri },
        { shouldPlay: true, volume: vocalVolume }
      );
      vocalSoundRef.current = s;
      loadedVoiceUrlRef.current = voiceAudioUrl;
      setIsPlaying(true);
      setActivePlaybackMode('voice_only');

      s.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis || 0);
          setDurationMillis(status.durationMillis || 10000);
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setActivePlaybackMode(null);
          }
        }
      });
    } catch (err) {
      console.error('Voice preview error', err);
      showToast('Could not play voice preview.', 'error');
    }
  };

  // Play BGM Specifically (BGM Preview button)
  const playBgmPreview = async () => {
    if (!bgmAudioUrl) return;

    if (activePlaybackMode === 'bgm_only' && bgmSoundRef.current && loadedBgmUrlRef.current === bgmAudioUrl) {
      if (isPlaying) {
        await bgmSoundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await bgmSoundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    await stopAllAudio();

    try {
      const bUri = await getPlaybackUri(bgmAudioUrl);
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: bUri },
        { shouldPlay: true, volume: bgmVolume }
      );
      bgmSoundRef.current = s;
      loadedBgmUrlRef.current = bgmAudioUrl;
      setIsPlaying(true);
      setActivePlaybackMode('bgm_only');

      s.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis || 0);
          setDurationMillis(status.durationMillis || 10000);
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setActivePlaybackMode(null);
          }
        }
      });
    } catch (err) {
      console.error('BGM preview error', err);
      showToast('Could not play BGM preview.', 'error');
    }
  };

  // Dual Track Mixed Studio Playback (Plays BOTH Voice + BGM simultaneously in sync)
  const playMixedStudio = async (bUrl = null, vUrl = null) => {
    const targetBgm = (typeof bUrl === 'string' && bUrl) ? bUrl : bgmAudioUrl;
    const targetVoice = (typeof vUrl === 'string' && vUrl) ? vUrl : voiceAudioUrl;

    if (!targetBgm && !targetVoice) {
      showToast('Generate AI Voice or BGM track first!', 'info');
      return;
    }

    // Toggle pause/play if already loaded in mix mode
    if (activePlaybackMode === 'mix' && (vocalSoundRef.current || bgmSoundRef.current)) {
      if (isPlaying) {
        const promises = [];
        if (vocalSoundRef.current) promises.push(vocalSoundRef.current.pauseAsync());
        if (bgmSoundRef.current) promises.push(bgmSoundRef.current.pauseAsync());
        await Promise.all(promises);
        setIsPlaying(false);
      } else {
        const promises = [];
        if (vocalSoundRef.current) promises.push(vocalSoundRef.current.playAsync());
        if (bgmSoundRef.current) promises.push(bgmSoundRef.current.playAsync());
        await Promise.all(promises);
        setIsPlaying(true);
      }
      return;
    }

    await stopAllAudio();

    try {
      let vSoundObj = null;
      let bSoundObj = null;

      // Create BOTH sound objects FIRST with shouldPlay: false to prevent drift
      if (targetVoice) {
        const vUri = await getPlaybackUri(targetVoice);
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: vUri },
          { shouldPlay: false, volume: vocalVolume }
        );
        vSoundObj = s;
        vocalSoundRef.current = s;
      }

      if (targetBgm) {
        const bUri = await getPlaybackUri(targetBgm);
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: bUri },
          { shouldPlay: false, volume: bgmVolume }
        );
        bSoundObj = s;
        bgmSoundRef.current = s;
      }

      // Start BOTH sounds simultaneously at the exact same millisecond
      const startPromises = [];
      if (vSoundObj) startPromises.push(vSoundObj.playAsync());
      if (bSoundObj) startPromises.push(bSoundObj.playAsync());
      await Promise.all(startPromises);

      setIsPlaying(true);
      setActivePlaybackMode('mix');

      const primarySound = bSoundObj || vSoundObj;
      if (primarySound) {
        primarySound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPositionMillis(status.positionMillis || 0);
            setDurationMillis(status.durationMillis || 10000);
            setIsPlaying(status.isPlaying);

            if (status.durationMillis && lyricsLines.length > 0) {
              const ratio = status.positionMillis / status.durationMillis;
              const currentLine = Math.min(
                Math.floor(ratio * lyricsLines.length),
                lyricsLines.length - 1
              );
              setActiveLineIndex(currentLine);
            }

            if (status.didJustFinish) {
              if (vocalSoundRef.current) vocalSoundRef.current.stopAsync();
              if (bgmSoundRef.current) bgmSoundRef.current.stopAsync();
              setIsPlaying(false);
              setPositionMillis(0);
              setActiveLineIndex(0);
            }
          }
        });
      }
    } catch (err) {
      console.error('Mix studio playback error', err);
      showToast('Could not play mixed studio track.', 'error');
    }
  };

  const handleSeek = async (value) => {
    setPositionMillis(value);
    const promises = [];
    if (vocalSoundRef.current) promises.push(vocalSoundRef.current.setPositionAsync(value));
    if (bgmSoundRef.current) promises.push(bgmSoundRef.current.setPositionAsync(value));
    try { await Promise.all(promises); } catch(e){}
  };

  const handleVocalVolumeChange = async (val) => {
    setVocalVolume(val);
    if (vocalSoundRef.current) {
      try { await vocalSoundRef.current.setVolumeAsync(val); } catch(e){}
    }
  };

  const handleBgmVolumeChange = async (val) => {
    setBgmVolume(val);
    if (bgmSoundRef.current) {
      try { await bgmSoundRef.current.setVolumeAsync(val); } catch(e){}
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor((millis || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDownloadMP3 = async () => {
    const activeUrl = bgmAudioUrl || voiceAudioUrl;
    if (!activeUrl) {
      showToast('Generate your voice or BGM track first!', 'info');
      return;
    }

    const fullUrl = activeUrl.startsWith('http') ? activeUrl : `${CONFIG.BASE_URL}${activeUrl}`;
    const filename = `${songTitle.replace(/\s+/g, '_')}_Final_Song.mp3`;
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      showToast('Downloading MP3 song locally...', 'info');
      const { uri } = await FileSystem.downloadAsync(fullUrl, localUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        showToast('MP3 Exported successfully! 📥', 'success');
      } else {
        showToast(`Saved to: ${uri}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Download failed.', 'error');
    }
  };

  // Synchronized LRC Lyrics File Exporter
  const handleExportLRC = async () => {
    if (!lyricsText) {
      showToast('No lyrics available to export.', 'info');
      return;
    }

    try {
      // Build LRC Timestamped string
      const lines = lyricsText.split('\n').filter(l => l.trim().length > 0);
      const totalSeconds = durationMillis ? durationMillis / 1000 : 30;
      const secondsPerLine = totalSeconds / Math.max(lines.length, 1);

      let lrcContent = `[ti:${songTitle}]\n[ar:${selectedVoice.name}]\n[al:Gandharva AI Studio]\n[by:Gandharva AI]\n\n`;
      
      lines.forEach((line, index) => {
        const lineTime = index * secondsPerLine;
        const mins = Math.floor(lineTime / 60);
        const secs = Math.floor(lineTime % 60);
        const millis = Math.floor((lineTime % 1) * 100);

        const timeStamp = `[${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}.${millis < 10 ? '0' : ''}${millis}]`;
        lrcContent += `${timeStamp}${line}\n`;
      });

      const filename = `${songTitle.replace(/\s+/g, '_')}_Synchronized.lrc`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(localUri, lrcContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri);
        showToast('LRC Synchronized Lyrics Exported! 📜', 'success');
      } else {
        showToast(`LRC File saved to device!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to export LRC file.', 'error');
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      const musicTracks = [];
      if (voiceAudioUrl) {
        musicTracks.push({ id: `trk-vocal-${Date.now()}`, variation_name: 'AI Vocal Track', audio_url: voiceAudioUrl, duration: 10 });
      }
      if (bgmAudioUrl) {
        musicTracks.push({ id: `trk-bgm-${Date.now()}`, variation_name: 'BGM Backing Track', audio_url: bgmAudioUrl, duration: 10 });
      }

      await saveProjectToLibrary({
        id: `song-${Date.now()}`,
        name: songTitle || 'AI Full Song',
        genre: selectedGenre,
        mood: selectedMood,
        prompt: bgmPrompt,
        lyrics: [{ title: songTitle, lyrics_text: lyricsText }],
        music: musicTracks
      });

      showToast(`💾 "${songTitle}" saved to Library!`, 'success');
    } catch (err) {
      showToast(err.message || 'Save error', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Toast Notification */}
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#111827" size={22} />
            <Text style={styles.backText}>Lyrics Studio</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.gpuBadge, { backgroundColor: isGPUOnline ? '#DCFCE7' : '#FEF3C7', borderColor: isGPUOnline ? '#22C55E' : '#F59E0B' }]}>
              <ShieldCheck color={isGPUOnline ? '#166534' : '#92400E'} size={12} />
              <Text style={{ color: isGPUOnline ? '#166534' : '#92400E', fontSize: 11, fontWeight: 'bold', marginLeft: 4 }}>
                {isGPUOnline === null ? 'Checking...' : isGPUOnline ? 'GPU Online' : 'Kaggle Offline'}
              </Text>
            </View>
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{language}</Text>
            </View>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle} numberOfLines={2}>{songTitle}</Text>
          <Text style={styles.heroSub}>✨ AI Song Creator • Voice Synthesis & BGM Mixing</Text>
        </View>

        {/* Line-by-Line Synchronized Karaoke Lyrics Sheet */}
        <View style={styles.lyricsCard}>
          <View style={styles.lyricsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Mic color="#DB2777" size={18} />
              <Text style={styles.lyricsBoxTitle}>🎤 Line-by-Line Karaoke Lyrics</Text>
            </View>
            <TouchableOpacity 
              style={styles.toggleLyricsBtn}
              onPress={() => setShowLyricsPreview(!showLyricsPreview)}
            >
              {showLyricsPreview ? <EyeOff color="#2563EB" size={14} /> : <Eye color="#2563EB" size={14} />}
              <Text style={styles.toggleLyricsBtnText}>
                {showLyricsPreview ? 'Hide Lyrics' : 'View Lyrics'}
              </Text>
            </TouchableOpacity>
          </View>

          {showLyricsPreview && (
            <ScrollView 
              ref={lyricsScrollRef} 
              style={{ maxHeight: 180, marginTop: 12 }} 
              nestedScrollEnabled 
              showsVerticalScrollIndicator={true}
            >
              {lyricsLines.map((line, idx) => {
                const isActive = isPlaying && idx === activeLineIndex;
                const isSectionHeader = line.startsWith('[') && line.endsWith(']');

                return (
                  <View 
                    key={idx} 
                    style={[
                      styles.karaokeLineRow,
                      isActive && styles.karaokeLineRowActive,
                    ]}
                  >
                    {isActive && <Text style={{ fontSize: 12, marginRight: 6 }}>🎤</Text>}
                    <Text 
                      style={[
                        styles.karaokeText,
                        isSectionHeader && styles.karaokeSectionHeader,
                        isActive && styles.karaokeTextActive,
                      ]}
                    >
                      {line}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* AI Voice Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Choose AI Singing Voice</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {AI_VOICES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.voiceItem, selectedVoice.id === v.id && styles.voiceItemActive]}
                onPress={() => setSelectedVoice(v)}
              >
                <Text style={{ fontSize: 22 }}>{v.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.voiceName, selectedVoice.id === v.id && { color: '#DB2777' }]}>{v.name}</Text>
                  <Text style={styles.voiceDesc}>{v.desc}</Text>
                </View>
                {selectedVoice.id === v.id && <CheckCircle2 color="#DB2777" size={20} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Style & Detectors */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Arrangement & Smart AI Detectors</Text>
          
          {/* Detectors Row */}
          <View style={styles.detectorRow}>
            <View style={[styles.detectorChip, { borderColor: '#2563EB', backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.detectorLabel, { color: '#2563EB' }]}>⏱️ Tempo / BPM</Text>
              <Text style={[styles.detectorVal, { color: '#1E40AF' }]}>{detectedBpm} BPM</Text>
            </View>
            <View style={[styles.detectorChip, { borderColor: '#DB2777', backgroundColor: '#FDF2F8' }]}>
              <Text style={[styles.detectorLabel, { color: '#DB2777' }]}>🎼 Scale / Key</Text>
              <Text style={[styles.detectorVal, { color: '#9D174D' }]}>{detectedKey}</Text>
            </View>
            <View style={[styles.detectorChip, { borderColor: '#059669', backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.detectorLabel, { color: '#059669' }]}>📏 Words Meter</Text>
              <Text style={[styles.detectorVal, { color: '#065F46' }]}>{syllableCount} Words</Text>
            </View>
          </View>

          {/* Genre Chips */}
          <Text style={styles.subLabel}>Genre Arrangement</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, selectedGenre === g && styles.chipActive]}
                onPress={() => setSelectedGenre(g)}
              >
                <Text style={[styles.chipText, selectedGenre === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Mood Chips */}
          <Text style={[styles.subLabel, { marginTop: 14 }]}>Mood & Emotion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, selectedMood === m && styles.chipActive]}
                onPress={() => setSelectedMood(m)}
              >
                <Text style={[styles.chipText, selectedMood === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Voice Generation Button & Beside Preview Player */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <TouchableOpacity
            style={[styles.actionButton, { flex: 1, backgroundColor: '#DB2777' }]}
            onPress={handleGenerateVoice}
            disabled={isGeneratingVoice}
          >
            {isGeneratingVoice ? <ActivityIndicator color="#FFF" /> : <Mic color="#FFF" size={18} />}
            <Text style={styles.actionButtonText} numberOfLines={1}>
              {isGeneratingVoice ? 'Synthesizing...' : `Generate AI Voice`}
            </Text>
          </TouchableOpacity>

          {/* Voice Preview Badge beside Generate button */}
          {voiceAudioUrl && (
            <TouchableOpacity
              style={styles.voicePreviewBadge}
              onPress={() => playVoicePreview()}
            >
              {isPlaying && activePlaybackMode === 'voice_only' ? <Pause color="#2563EB" size={16} /> : <Play color="#2563EB" size={16} fill="#2563EB" />}
              <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: 'bold' }}>
                {isPlaying && activePlaybackMode === 'voice_only' ? 'Playing Voice' : 'Voice Preview'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* BGM Generation Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Tailored BGM Prompt</Text>
          <TextInput
            style={styles.bgmInput}
            value={bgmPrompt}
            onChangeText={setBgmPrompt}
            multiline
            numberOfLines={3}
            placeholder="Type custom BGM description (e.g. 120 BPM, romantic piano, acoustic guitar)..."
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.actionButton, { flex: 1, backgroundColor: '#2563EB' }]}
              onPress={handleGenerateBGM}
              disabled={isGeneratingBgm}
            >
              {isGeneratingBgm ? <ActivityIndicator color="#FFF" /> : <RefreshCw color="#FFF" size={16} />}
              <Text style={styles.actionButtonText} numberOfLines={1}>
                {isGeneratingBgm ? 'Composing BGM...' : bgmAudioUrl ? '🔄 Regenerate BGM' : '🎶 Generate BGM'}
              </Text>
            </TouchableOpacity>

            {/* BGM Preview Button beside Regenerate button */}
            {bgmAudioUrl && (
              <TouchableOpacity
                style={[styles.voicePreviewBadge, { borderColor: '#2563EB', backgroundColor: '#EFF6FF' }]}
                onPress={playBgmPreview}
              >
                {isPlaying && activePlaybackMode === 'bgm_only' ? <Pause color="#2563EB" size={16} /> : <Play color="#2563EB" size={16} fill="#2563EB" />}
                <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: 'bold' }}>
                  {isPlaying && activePlaybackMode === 'bgm_only' ? 'Playing BGM' : 'BGM Preview'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Master Mix Button Section */}
        {(voiceAudioUrl || bgmAudioUrl) && (
          <View style={{ marginBottom: 18 }}>
            <TouchableOpacity
              style={styles.mixMasterBtn}
              onPress={() => playMixedStudio()}
            >
              <Sparkles color="#FFFFFF" size={20} />
              <Text style={styles.mixMasterBtnText}>
                ✨ Mix AI Voice + BGM Music ({voiceAudioUrl ? '🎤 Voice' : 'No Voice'} + {bgmAudioUrl ? '🎶 BGM' : 'No BGM'})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pro Audio Player & Mixer Card */}
        {(bgmAudioUrl || voiceAudioUrl) && (
          <View style={styles.playerCard}>
            
            {/* Header Title & Status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: '#DB2777', fontSize: 16, fontWeight: '800' }}>🎧 Pro Audio Studio Player</Text>
                <Text style={{ color: '#111827', fontSize: 15, fontWeight: 'bold', marginTop: 2 }} numberOfLines={1}>{songTitle}</Text>
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
                  {voiceAudioUrl ? `🎤 ${language} Vocal Active` : 'No Voice'} • {bgmAudioUrl ? '🎶 BGM Active' : 'No BGM'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.playerPlayBtn}
                onPress={() => playMixedStudio()}
              >
                {isPlaying && activePlaybackMode === 'mix' ? <Pause color="#FFFFFF" size={24} /> : <Play color="#FFFFFF" size={24} fill="#FFFFFF" />}
              </TouchableOpacity>
            </View>

            {/* Animated Equalizer Waveform Bars */}
            <View style={styles.waveformContainer}>
              {[35, 65, 85, 45, 95, 75, 55, 90, 40, 70, 85, 60, 100, 40, 80, 50, 90, 65, 45, 75].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height: isPlaying ? Math.max(12, (h * (i % 2 === 0 ? 0.9 : 0.6))) : 12,
                      backgroundColor: i % 3 === 0 ? '#DB2777' : i % 3 === 1 ? '#2563EB' : '#10B981',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Interactive Timeline Scrubber Slider */}
            <View style={styles.scrubberRow}>
              <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
              <Slider
                style={{ flex: 1, marginHorizontal: 8 }}
                minimumValue={0}
                maximumValue={durationMillis || 10000}
                value={positionMillis}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#DB2777"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#DB2777"
              />
              <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
            </View>

            {/* Fader Sliders for Independent Vocal & BGM Volume */}
            <View style={styles.faderContainer}>
              <View style={styles.faderRow}>
                <Mic color="#DB2777" size={14} />
                <Text style={styles.faderLabel}>Vocal Volume</Text>
                <Slider
                  style={{ flex: 1, marginHorizontal: 6 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={vocalVolume}
                  onValueChange={handleVocalVolumeChange}
                  minimumTrackTintColor="#DB2777"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#DB2777"
                />
                <Text style={styles.faderVal}>{Math.round(vocalVolume * 100)}%</Text>
              </View>

              <View style={styles.faderRow}>
                <Music color="#2563EB" size={14} />
                <Text style={styles.faderLabel}>BGM Volume</Text>
                <Slider
                  style={{ flex: 1, marginHorizontal: 6 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={bgmVolume}
                  onValueChange={handleBgmVolumeChange}
                  minimumTrackTintColor="#2563EB"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#2563EB"
                />
                <Text style={styles.faderVal}>{Math.round(bgmVolume * 100)}%</Text>
              </View>
            </View>

            {/* Quick Action Buttons: Download MP3, Export LRC, Save */}
            <View style={styles.playerActionRow}>
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadMP3}>
                <Download color="#FFFFFF" size={15} />
                <Text style={styles.downloadBtnText}>MP3 Song</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.lrcBtn} onPress={handleExportLRC}>
                <FileSpreadsheet color="#FFFFFF" size={15} />
                <Text style={styles.lrcBtnText}>.LRC Lyrics</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToLibrary}>
                <Save color="#FFFFFF" size={15} />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mixMasterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB2777',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  mixMasterBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 50,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backText: {
    color: '#111827',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  gpuBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBadge: {
    backgroundColor: '#FDF2F8',
    borderColor: '#DB2777',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  langBadgeText: {
    color: '#DB2777',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  lyricsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lyricsBoxTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  toggleLyricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleLyricsBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  karaokeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  karaokeLineRowActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#DB2777',
    borderWidth: 1,
  },
  karaokeText: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 22,
  },
  karaokeSectionHeader: {
    color: '#2563EB',
    fontWeight: 'bold',
    marginTop: 4,
  },
  karaokeTextActive: {
    color: '#DB2777',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold',
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voiceItemActive: {
    borderColor: '#DB2777',
    backgroundColor: '#FDF2F8',
  },
  voiceName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
  },
  voiceDesc: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  detectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  detectorChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  detectorLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detectorVal: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 3,
  },
  subLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#DB2777',
    borderColor: '#BE185D',
  },
  chipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  voicePreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  bgmInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    color: '#111827',
    fontSize: 12,
    lineHeight: 18,
    padding: 12,
    marginTop: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#DB2777',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  playerPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DB2777',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: 'bold',
    width: 38,
    textAlign: 'center',
  },
  faderContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  faderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faderLabel: {
    color: '#374151',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    width: 80,
  },
  faderVal: {
    color: '#111827',
    fontSize: 11,
    fontWeight: 'bold',
    width: 36,
    textAlign: 'right',
  },
  playerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 4,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lrcBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 4,
  },
  lrcBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB2777',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
