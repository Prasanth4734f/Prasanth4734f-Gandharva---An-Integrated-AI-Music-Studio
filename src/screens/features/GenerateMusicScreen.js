import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Music, Activity, ArrowLeftRight, Clock, SlidersHorizontal, Play, Pause, Download, Share2, Heart, RotateCcw, ChevronLeft, ShieldCheck, Sparkles, Wand2, Mic, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Slider from '@react-native-community/slider';

import CONFIG from '../../config/api.config';
import { generateMusic, checkMusicGenHealth, enhanceMusicPrompt } from '../../services/musicService';
import { cacheAudioTrack, getPlaybackUri } from '../../services/audioCache';
import { saveProjectToLibrary } from '../../services/libraryStorage';

const DURATIONS = ['6s', '10s', '15s', '30s'];
const WAVEFORM_HEIGHTS = [16, 26, 42, 28, 18, 50, 38, 22, 54, 40, 28, 46, 32, 20, 52, 44, 26, 36, 50, 32, 22, 44, 34, 18];

const PROMPT_IDEAS = [
  "High-energy electronic dance track with heavy bass and synth drops",
  "Chill lofi hip hop beat with cozy vinyl crackle and piano",
  "Epic cinematic orchestral battle theme with massive brass swells",
  "Acoustic pop song with bright acoustic guitar and sunny melodies",
  "Dark mysterious synthwave with driving 80s drums",
  "Aggressive drift phonk with fast dark cowbell melodies"
];

const AI_VOICES = [
  'Female Pop Singer 🎙️',
  'Male Acoustic Voice 🎤',
  'Melodic Soul Singer 🌟',
  'EDM Synth Vocals ⚡'
];

const GenerateMusicScreen = ({ navigation, route }) => {
  const passedLyrics = route?.params?.lyrics || null;
  const passedTitle = route?.params?.title || null;
  const passedPrompt = route?.params?.prompt || '';
  const mode = route?.params?.mode || 'vocal';

  const [prompt, setPrompt] = useState(passedPrompt);
  const [attachedLyrics, setAttachedLyrics] = useState(passedLyrics);
  const [songTitle, setSongTitle] = useState(passedTitle);
  const [selectedVoice, setSelectedVoice] = useState('Female Pop Singer 🎙️');
  const [showLyricsPreview, setShowLyricsPreview] = useState(false);

  const [selectedDuration, setSelectedDuration] = useState('10s');
  const [generationSeconds, setGenerationSeconds] = useState(0);
  const [stepStatusText, setStepStatusText] = useState('Connecting to Dual-Brain GPU...');
  const [enableVariations, setEnableVariations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [musicResult, setMusicResult] = useState(null);
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const [error, setError] = useState(null);
  const [magicCooldown, setMagicCooldown] = useState(0);

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(6000);
  const [isSeeking, setIsSeeking] = useState(false);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const [isGPUOnline, setIsGPUOnline] = useState(null);

  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Update prompt and lyrics if route params change
  useEffect(() => {
    if (route?.params?.lyrics) {
      setAttachedLyrics(route.params.lyrics);
    }
    if (route?.params?.title) {
      setSongTitle(route.params.title);
    }
    if (route?.params?.prompt && !prompt) {
      setPrompt(route.params.prompt);
    }
  }, [route?.params]);

  // Check GPU Health on mount & on demand
  const verifyHealth = async () => {
    setIsGPUOnline(null);
    try {
      const res = await checkMusicGenHealth();
      const isOnline = res && (res.status === 'online' || res.status === 'Live' || res.status === 'Online');
      if (isOnline && res.gpu_live !== false) {
        setIsGPUOnline(true);
        return;
      }
    } catch (e) {
      console.warn('[GPU Health Check Warning]', e?.message);
    }

    // Backend health check failed or GPU is offline
    setIsGPUOnline(false);
  };


  React.useEffect(() => {
    verifyHealth();
  }, []);

  // Cleanup sound on unmount
  React.useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  // Magic wand cooldown timer
  React.useEffect(() => {
    let interval = null;
    if (magicCooldown > 0) {
      interval = setInterval(() => {
        setMagicCooldown((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [magicCooldown]);

  const activeVariation = (musicResult && musicResult.variations && musicResult.variations[selectedVarIndex])
    ? musicResult.variations[selectedVarIndex]
    : null;

  const playSound = async (audioUrl) => {
    const target = audioUrl || (activeVariation ? activeVariation.audio_url : null);
    if (!target) return;

    try {
      setError(null);
      await Audio.setIsEnabledAsync(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {}
        setSound(null);
      }

      console.log(`[Audio Playback] Loading variation track: ${target}`);

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: target },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        (statusUpdate) => {
          if (!statusUpdate.isLoaded) return;
          if (statusUpdate.durationMillis) {
            setDurationMillis(statusUpdate.durationMillis);
          }
          if (!isSeeking) {
            setPositionMillis(statusUpdate.positionMillis || 0);
          }
          setIsPlaying(statusUpdate.isPlaying);
          if (statusUpdate.didJustFinish) {
            setIsPlaying(false);
            setPositionMillis(0);
          }
        }
      );

      if (status && status.isLoaded) {
        if (status.durationMillis) {
          setDurationMillis(status.durationMillis);
        }
        setSound(newSound);
        setIsPlaying(true);
        console.log('[Audio Playback] Variation playing successfully!');
      }
    } catch (err) {
      console.error('[Audio] Playback failed:', err);
      setError('Could not play audio track. Please tap Play to retry.');
    }
  };

  const handleSeek = async (millis) => {
    try {
      setPositionMillis(millis);
      if (sound) {
        await sound.setPositionAsync(millis);
        if (!isPlaying) {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else if (activeVariation) {
        await playSound(activeVariation.audio_url);
      }
    } catch (e) {
      console.warn('[Audio Seek Error]', e);
    }
  };

  const handleWaveformPress = async (event) => {
    const touchX = event.nativeEvent.locationX;
    if (waveformWidth > 0 && durationMillis > 0) {
      const ratio = Math.max(0, Math.min(1, touchX / waveformWidth));
      const targetMillis = Math.floor(ratio * durationMillis);
      await handleSeek(targetMillis);
    }
  };

  const handleReplay = async () => {
    try {
      if (!sound) {
        if (activeVariation) {
          await playSound(activeVariation.audio_url);
        }
        return;
      }
      await sound.setPositionAsync(0);
      setPositionMillis(0);
      await sound.playAsync();
      setIsPlaying(true);
    } catch (e) {
      console.warn('[Replay Error]', e);
    }
  };

  const togglePlayback = async () => {
    const currentTrack = activeVariation || (musicResult && musicResult.variations ? musicResult.variations[selectedVarIndex] : null);
    const targetUrl = currentTrack ? currentTrack.audio_url : null;

    if (!sound) {
      await playSound(targetUrl);
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        await playSound(targetUrl);
        return;
      }
      if (status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (status.positionMillis >= (status.durationMillis || 1000) - 100) {
          await sound.setPositionAsync(0);
          setPositionMillis(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('[Toggle Playback Error]', e);
      await playSound(targetUrl);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = PROMPT_IDEAS[Math.floor(Math.random() * PROMPT_IDEAS.length)];
    setPrompt(randomPrompt);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      Alert.alert('Incomplete', 'Please type a basic idea first (e.g. "fight scene music") to enhance it.');
      return;
    }
    setIsEnhancing(true);
    let enhancedText = '';

    try {
      const data = await enhanceMusicPrompt(prompt);
      if (data && data.enhanced_prompt) {
        enhancedText = data.enhanced_prompt;
      }
    } catch (err) {
      console.warn('[Magic Enhance Fallback]', err.message);
    }

    if (!enhancedText) {
      const p = prompt.trim();
      const lower = p.toLowerCase();
      let genre = 'Cinematic Soundtrack';
      if (lower.includes('fight') || lower.includes('action') || lower.includes('war') || lower.includes('heavy') || lower.includes('movie')) {
        genre = 'Epic Orchestral Action';
      } else if (lower.includes('sad') || lower.includes('cry') || lower.includes('alone') || lower.includes('heartbreak')) {
        genre = 'Melancholic Acoustic & Grand Piano';
      } else if (lower.includes('lofi') || lower.includes('chill') || lower.includes('relax')) {
        genre = 'Chill Lofi Beats';
      } else if (lower.includes('dance') || lower.includes('party') || lower.includes('edm')) {
        genre = 'High-Energy Festival EDM';
      } else if (lower.includes('love') || lower.includes('romance')) {
        genre = 'Romantic Symphony';
      }

      enhancedText = `Master high-fidelity ${genre}. ${p}. Featuring heavy brass sections, driving cinematic percussion, sub-bass pulses, and atmospheric orchestral pads. 128 BPM, key of C Minor, wide stereo master.`;
    }

    setPrompt(enhancedText);
    setIsEnhancing(false);
    setMagicCooldown(3);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Incomplete', 'Please describe your music prompt.');
      return;
    }
    setIsGenerating(true);
    setGenerationSeconds(0);
    setStepStatusText(enableVariations ? 'Synthesizing AI Track 1 of 3...' : 'Synthesizing AI Track on Dual-Brain GPU...');
    setError(null);
    setMusicResult(null);
    setSelectedVarIndex(0);

    // Live timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setGenerationSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Stop playback if playing
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }

    try {
      const durationNum = parseInt(selectedDuration) || 10;
      const variationsCount = enableVariations ? 3 : 1;
      const data = await generateMusic(
        prompt, 
        durationNum, 
        variationsCount,
        (progressText) => setStepStatusText(progressText)
      );
      setMusicResult(data);

      // Auto-cache all variations locally
      if (data.variations) {
        data.variations.forEach(v => {
          cacheAudioTrack(v.audio_url);
        });

        // Auto-save generated music project to library
        try {
          await saveProjectToLibrary({
            id: data.project_id || `music-${Date.now()}`,
            name: data.title || `AI Track: ${prompt.substring(0, 25)}`,
            genre: 'AI Music',
            mood: 'Generated',
            prompt: prompt,
            music: data.variations.map(v => ({
              id: v.id,
              variation_name: v.variation_name || 'Track',
              audio_url: v.audio_url,
              duration: v.duration || 10
            }))
          });
        } catch (e) {
          console.warn('[GenerateMusic] Save to library warning:', e);
        }
      }

      // Auto-play the first generated track ONLY if the user is still on this screen
      if (data.variations && data.variations.length > 0 && navigation.isFocused()) {
        await playSound(data.variations[0].audio_url);
      }
    } catch (err) {
      setError(err.message || 'Music generation service offline. Local fallback track was created.');
      console.error(err);
    } finally {
      clearInterval(timerInterval);
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!musicResult) return;
    const track = musicResult.variations[selectedVarIndex];
    const targetUrl = track.audio_url.startsWith('http') ? track.audio_url : `${CONFIG.BASE_URL}${track.audio_url}`;

    // Extract actual extension (.mp3 or .wav) from the URL
    const ext = targetUrl.split('.').pop() || 'wav';
    const filename = `${track.variation_name.replace(/\s+/g, '_')}_${track.seed}.${ext}`;
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      Alert.alert('Downloading', 'Saving audio composition locally...');
      const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
      Alert.alert('Success!', `Saved to local device storage:\n${uri}`);
    } catch (err) {
      Alert.alert('Download Error', 'Could not cache audio file: ' + err.message);
    }
  };

  const handleShare = async () => {
    if (!musicResult) return;
    const track = musicResult.variations[selectedVarIndex];
    const targetUrl = track.audio_url.startsWith('http') ? track.audio_url : `${CONFIG.BASE_URL}${track.audio_url}`;

    const ext = targetUrl.split('.').pop() || 'wav';
    const filename = `${track.variation_name.replace(/\s+/g, '_')}_${track.seed}.${ext}`;
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      // First download the file so we share the physical audio rather than just a URL
      const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        await Share.share({
          message: `Listen to GANDHARVA Composition: ${targetUrl}`,
        });
      }
    } catch (err) {
      Alert.alert('Share Error', 'Could not share track: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!musicResult) {
      Alert.alert('No Track', 'Please generate a music track first before saving.');
      return;
    }

    try {
      const activeTrack = musicResult.variations[selectedVarIndex];
      await saveProjectToLibrary({
        id: `music-${Date.now()}`,
        name: musicResult.title || `AI Track: ${prompt.substring(0, 20)}...`,
        genre: 'AI Music',
        mood: 'Cinematic',
        prompt: prompt,
        music: musicResult.variations.map(v => ({
          id: v.id,
          variation_name: v.variation_name || 'Track',
          audio_url: v.audio_url,
          duration: v.duration || 10
        }))
      });

      Alert.alert(
        'Music Project Saved!',
        'This composition has been successfully saved to your Library.',
        [{ text: 'View Library', onPress: () => navigation.navigate('Main', { screen: 'LibraryTab' }) }]
      );
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save track to library: ' + err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      <LinearGradient
        colors={['#831843', '#9D174D', '#BE185D', '#D946EF', '#1E40AF']}
        locations={[0, 0.35, 0.65, 0.85, 1.0]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top Header with Back button and GPU Check */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFFFFF" size={22} />
            <Text style={[styles.backText, { color: '#FFFFFF' }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.healthBadge, { backgroundColor: isGPUOnline ? '#DCFCE7' : '#FEF3C7', borderColor: isGPUOnline ? '#22C55E' : '#F59E0B' }]} onPress={verifyHealth}>
            <ShieldCheck color={isGPUOnline ? '#166534' : '#92400E'} size={14} />
            <Text style={[styles.healthText, { color: isGPUOnline ? '#166534' : '#92400E' }]}>
              {isGPUOnline === null ? 'Checking...' : isGPUOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Centered Logo & Title */}
        <View style={styles.heroSection}>
          <View style={styles.logoRow}>
            <Music color={COLORS.white} size={28} />
            <Text style={styles.logoText}>Gandharva AI</Text>
          </View>
          <Text style={styles.heroTitle}>Begin your musical{'\n'}journey.</Text>
        </View>

        {/* Attached Lyrics Banner if navigated from Lyrics Generator */}
        {attachedLyrics ? (
          <GlassCard style={{ marginBottom: 16, padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, borderWidth: 1, borderColor: mode === 'bgm' ? '#F59E0B' : '#FFD700' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {mode === 'bgm' ? <Music color="#F59E0B" size={20} /> : <Mic color="#FFD700" size={20} />}
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginLeft: 8 }} numberOfLines={1}>
                  {mode === 'bgm' ? `🎶 Pure BGM: ${songTitle || 'Instrumental'}` : `🎤 AI Voice Song: ${songTitle || 'Lyrics Attached'}`}
                </Text>
              </View>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                onPress={() => setShowLyricsPreview(!showLyricsPreview)}
              >
                {showLyricsPreview ? <EyeOff color="#FFD700" size={14} /> : <Eye color="#FFD700" size={14} />}
                <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginLeft: 4 }}>
                  {showLyricsPreview ? 'Hide' : 'Preview'}
                </Text>
              </TouchableOpacity>
            </View>

            {showLyricsPreview && (
              <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 10, marginBottom: 10, maxHeight: 120 }}>
                <ScrollView nestedScrollEnabled>
                  <Text style={{ color: '#E5E7EB', fontSize: 12, lineHeight: 18, fontStyle: 'italic' }}>
                    {attachedLyrics}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* If Vocal Mode, show AI Voice selector. If BGM mode, show Pure Instrumental message */}
            {mode === 'bgm' ? (
              <Text style={{ color: '#FCD34D', fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                ✨ Mode: Pure Instrumental Background Music (No vocal recording required).
              </Text>
            ) : (
              <>
                <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>Select AI Singing Voice:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {AI_VOICES.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 6 }, selectedVoice === v && { backgroundColor: '#FFD700' }]}
                      onPress={() => setSelectedVoice(v)}
                    >
                      <Text style={[{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }, selectedVoice === v && { color: '#000000', fontWeight: 'bold' }]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </GlassCard>
        ) : null}

        {/* Big White Search Box */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Create a fast-paced electronic track for a video game scene."
            placeholderTextColor="#666"
            multiline
            style={styles.searchInput}
            value={prompt}
            onChangeText={setPrompt}
          />
          <View style={styles.searchBoxFooter}>
            <View style={styles.searchOptions}>
              <TouchableOpacity style={styles.optionBtn}>
                <Clock size={18} color="#000" />
                <Text style={styles.optionText}>{selectedDuration}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionBtn} onPress={handleSurpriseMe}>
                <Sparkles size={18} color="#000" />
                <Text style={styles.optionText}>Ideas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionBtn} onPress={handleEnhancePrompt} disabled={isEnhancing || isGenerating || magicCooldown > 0}>
                {isEnhancing ? <ActivityIndicator size="small" color="#000" /> : <Wand2 size={18} color={magicCooldown > 0 ? "#999" : "#000"} />}
                <Text style={[styles.optionText, magicCooldown > 0 && {color: "#999"}]}>
                  {magicCooldown > 0 ? `Wait ${magicCooldown}s` : 'Magic'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.generateBtnNew} onPress={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.generateBtnText}>Generate</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration Selector */}
        <View style={styles.durationWrapper}>
          <Text style={styles.durationTitle}>Track Duration:</Text>
          <View style={styles.durationGridNew}>
            {DURATIONS.map((dur) => (
              <TouchableOpacity
                key={dur}
                onPress={() => setSelectedDuration(dur)}
                style={[
                  styles.durChipNew,
                  selectedDuration === dur && styles.durChipActiveNew
                ]}
              >
                <Text style={[
                  styles.durTextNew,
                  selectedDuration === dur && styles.durTextActiveNew
                ]}>{dur}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Optional Variations Toggle */}
        <View style={styles.toggleRowNew}>
          <View>
            <Text style={styles.toggleLabelNew}>Generate Variations</Text>
            <Text style={styles.toggleDescNew}>Creates 3 alternate tracks simultaneously</Text>
          </View>
          <Switch
            value={enableVariations}
            onValueChange={setEnableVariations}
            trackColor={{ false: '#333333', true: '#3B82F6' }}
            thumbColor={'#fff'}
          />
        </View>

        {isGenerating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loadingText, { fontWeight: 'bold', fontSize: 15, marginTop: 10 }]}>
              {stepStatusText}
            </Text>
            <Text style={[styles.loadingText, { fontSize: 13, opacity: 0.85, marginTop: 4 }]}>
              Dual-Brain GPU Active • {generationSeconds}s elapsed
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result Area */}
        {musicResult && activeVariation && !isGenerating && (
          <View style={styles.resultContainer}>
            {/* Variation Tab Selectors (Displays ONLY if multiple variations generated) */}
            {musicResult.variations.length > 1 && (
              <View style={styles.varRow}>
                {musicResult.variations.map((v, index) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.varTab, selectedVarIndex === index && styles.varTabActive]}
                    onPress={async () => {
                      setSelectedVarIndex(index);
                      await playSound(v.audio_url);
                    }}
                  >
                    <Text style={[styles.varText, selectedVarIndex === index && styles.varTextActive]}>
                      {v.variation_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <GlassCard style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.artPlaceholder}>
                  <Music color={COLORS.primary} size={30} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{(musicResult?.prompt || prompt || 'AI Music Composition').substring(0, 24)}...</Text>
                  <Text style={styles.resultMeta}>
                    {activeVariation.variation_name} • Seed: {activeVariation.seed}
                  </Text>
                </View>
              </View>

              {/* Touch-Sensitive Waveform Track */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleWaveformPress}
                onLayout={(e) => setWaveformWidth(e.nativeEvent.layout.width)}
                style={styles.waveformContainer}
              >
                {WAVEFORM_HEIGHTS.map((height, i) => {
                  const totalBars = WAVEFORM_HEIGHTS.length;
                  const barProgress = i / (totalBars - 1);
                  const currentProgress = durationMillis > 0 ? positionMillis / durationMillis : 0;
                  const isPast = barProgress <= currentProgress;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveformBar,
                        {
                          height: isPlaying && isPast ? Math.max(12, height * (0.85 + 0.3 * Math.sin(i * 1.4))) : height,
                          backgroundColor: isPast ? COLORS.primary : 'rgba(255, 255, 255, 0.22)',
                        }
                      ]}
                    />
                  );
                })}
              </TouchableOpacity>

              {/* Touch-Sensitive Timeline Scrubber */}
              <View style={styles.scrubberRow}>
                <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={durationMillis || 10000}
                  value={positionMillis}
                  onValueChange={(val) => {
                    setIsSeeking(true);
                    setPositionMillis(val);
                  }}
                  onSlidingComplete={async (val) => {
                    setIsSeeking(false);
                    await handleSeek(val);
                  }}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                  thumbTintColor={COLORS.white}
                />
                <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
              </View>

              {/* Music Player Control Actions */}
              <View style={styles.controls} pointerEvents="auto">
                <View style={styles.leftControls} pointerEvents="auto">
                  <TouchableOpacity 
                    style={styles.controlBtn} 
                    onPress={togglePlayback}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    {isPlaying ? (
                      <Pause color={COLORS.white} size={26} fill={COLORS.white} />
                    ) : (
                      <Play color={COLORS.white} size={26} fill={COLORS.white} style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>

                  {/* Replay Button */}
                  <TouchableOpacity 
                    style={styles.replayBtn} 
                    onPress={handleReplay}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <RotateCcw color={COLORS.white} size={20} />
                  </TouchableOpacity>
                </View>

                <View style={styles.controlRight} pointerEvents="auto">
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={handleSave}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Heart color={COLORS.accent} size={22} fill={COLORS.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={handleDownload}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Download color={COLORS.white} size={22} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={handleShare}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Share2 color={COLORS.white} size={22} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    onPress={async () => {
                      if (sound) {
                        try { await sound.unloadAsync(); } catch(e){}
                        setSound(null);
                        setIsPlaying(false);
                      }
                      navigation.navigate('MusicEditor', {
                        audioUrl: activeVariation.audio_url,
                        title: musicResult.prompt,
                        trackId: activeVariation.id,
                        projectId: musicResult.project_id
                      });
                    }}
                  >
                    <SlidersHorizontal color={COLORS.white} size={22} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  healthText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  searchInput: {
    fontSize: 18,
    color: '#000',
    marginBottom: 20,
    lineHeight: 26,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  searchBoxFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
  },
  optionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  generateBtnNew: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  durationWrapper: {
    marginTop: 24,
    paddingHorizontal: 10,
  },
  durationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  durationGridNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durChipNew: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: 10,
  },
  durChipActiveNew: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  durTextNew: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  durTextActiveNew: {
    color: '#000000',
  },
  toggleRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  toggleLabelNew: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleDescNew: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: COLORS.error + '15',
    padding: SPACING.md,
    borderRadius: SIZES.radius_md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: SIZES.font_sm,
  },
  resultContainer: {
    marginTop: SPACING.md,
  },
  varRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  varTab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: SIZES.radius_md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  varTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  varText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
  },
  varTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  resultCard: {
    padding: SPACING.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  artPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  resultTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
  },
  resultMeta: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
    marginTop: 2,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 58,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 4,
    marginBottom: SPACING.xs,
  },
  waveformBar: {
    width: 5,
    borderRadius: 2.5,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: -4,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    width: 34,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 24,
    marginHorizontal: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    zIndex: 100,
    elevation: 8,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 101,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  replayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 101,
  },
  actionBtn: {
    padding: 6,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: SIZES.font_sm,
    fontWeight: '600',
  },
});

export default GenerateMusicScreen;
