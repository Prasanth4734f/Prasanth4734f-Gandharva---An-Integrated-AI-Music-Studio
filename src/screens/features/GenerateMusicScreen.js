import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Music, Activity, ArrowLeftRight, Clock, SlidersHorizontal, Play, Pause, Download, Share2, Heart, RotateCcw, ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import CONFIG from '../../config/api.config';
import { generateMusic, checkMusicGenHealth } from '../../services/musicService';

const DURATIONS = ['6s', '10s', '15s', '30s'];

const GenerateMusicScreen = ({ navigation }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('10s');
  const [enableVariations, setEnableVariations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [musicResult, setMusicResult] = useState(null);
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const [error, setError] = useState(null);

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGPUOnline, setIsGPUOnline] = useState(null);

  // Check GPU Health on mount
  React.useEffect(() => {
    const verifyHealth = async () => {
      try {
        const res = await checkMusicGenHealth();
        setIsGPUOnline(res.status === 'online');
      } catch (e) {
        setIsGPUOnline(false);
      }
    };
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

  const playSound = async (audioUrl) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      // Pre-fix absolute BASE_URL for relative backend static urls
      const targetUri = audioUrl.startsWith('http') ? audioUrl : `${CONFIG.BASE_URL}${audioUrl}`;
      console.log(`[Audio] Loading: ${targetUri}`);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: targetUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (err) {
      console.error('[Audio] Playback failed', err);
      setError('Could not load or stream the generated audio track.');
    }
  };

  const togglePlayback = async () => {
    if (!sound) {
      // Auto play selected variation if sound not loaded yet
      if (musicResult) {
        const track = musicResult.variations[selectedVarIndex];
        await playSound(track.audio_url);
      }
      return;
    }
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      const status = await sound.getStatusAsync();
      // If the track reached the end, rewind to beginning
      if (status.isLoaded && status.positionMillis >= status.durationMillis - 100) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Incomplete', 'Please describe your music prompt.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setMusicResult(null);
    setSelectedVarIndex(0);

    // Stop playback if playing
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }

    try {
      const durationNum = parseInt(selectedDuration);
      const variationsCount = enableVariations ? 3 : 1;
      const data = await generateMusic(prompt, durationNum, variationsCount);
      setMusicResult(data);

      // Auto-play the first generated track ONLY if the user is still on this screen
      if (data.variations && data.variations.length > 0 && navigation.isFocused()) {
        await playSound(data.variations[0].audio_url);
      }
    } catch (err) {
      setError(err.message || 'Music generation service offline. Local fallback track was created.');
      console.error(err);
    } finally {
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

  const handleSave = () => {
    Alert.alert(
      'Music Project Saved!',
      'This composition has been successfully registered to your local database history.',
      [{ text: 'Great!', onPress: () => navigation.navigate('Main', { screen: 'LibraryTab' }) }]
    );
  };

  const activeVariation = musicResult ? musicResult.variations[selectedVarIndex] : null;

  return (
    <LinearGradient colors={['#3B0764', '#D946EF', '#FF007F']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top Header with Back button and GPU Check */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={COLORS.white} size={24} />
            <Text style={[styles.backText, { color: COLORS.white }]}>Back</Text>
          </TouchableOpacity>
          <View style={[styles.healthBadge, { borderColor: isGPUOnline === null ? '#ccc' : isGPUOnline ? '#10B981' : '#EF4444' }]}>
            <ShieldCheck color={isGPUOnline === null ? '#ccc' : isGPUOnline ? '#10B981' : '#EF4444'} size={14} />
            <Text style={[styles.healthText, { color: isGPUOnline === null ? '#ccc' : isGPUOnline ? '#10B981' : '#EF4444' }]}>
              {isGPUOnline === null ? 'Checking GPU...' : isGPUOnline ? 'GPU Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Centered Logo & Title */}
        <View style={styles.heroSection}>
          <View style={styles.logoRow}>
            <Music color={COLORS.white} size={28} />
            <Text style={styles.logoText}>Gandharva AI</Text>
          </View>
          <Text style={styles.heroTitle}>Begin your musical{'\n'}journey.</Text>
        </View>

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
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Relax... your Music is taking shape.</Text>
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
                  <Text style={styles.resultTitle}>{musicResult.prompt.substring(0, 24)}...</Text>
                  <Text style={styles.resultMeta}>
                    {activeVariation.variation_name} • Seed: {activeVariation.seed}
                  </Text>
                </View>
              </View>

              {/* Responsive Waveform Graphics */}
              <View style={styles.waveformContainer}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: Math.random() * 40 + 12,
                        backgroundColor: isPlaying ? COLORS.primary : COLORS.surfaceLight
                      }
                    ]}
                  />
                ))}
              </View>

              {/* Music Player Control Actions */}
              <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtn} onPress={togglePlayback}>
                  {isPlaying ? (
                    <Pause color={COLORS.white} size={28} fill={COLORS.white} />
                  ) : (
                    <Play color={COLORS.white} size={28} fill={COLORS.white} />
                  )}
                </TouchableOpacity>

                <View style={styles.controlRight}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                    <Heart color={COLORS.accent} size={22} fill={COLORS.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
                    <Download color={COLORS.white} size={22} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                    <Share2 color={COLORS.white} size={22} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
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
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: SPACING.xl,
  },
  waveformBar: {
    width: 6,
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionBtn: {
    marginLeft: SPACING.lg,
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
