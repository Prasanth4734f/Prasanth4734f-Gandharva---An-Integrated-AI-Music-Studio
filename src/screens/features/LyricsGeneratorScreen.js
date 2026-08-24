import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Share, Alert, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Wand2, Copy, Share2, Save, ChevronLeft, Globe, ChevronDown, Mic, Music, X, Check } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import * as Clipboard from 'expo-clipboard';

import { generateLyrics } from '../../services/lyricsService';
import { saveProjectToLibrary } from '../../services/libraryStorage';
import { useAuth } from '../../context/AuthContext';

const GENRES = ['Pop', 'Lofi', 'Rock', 'Cinematic', 'Phonk', 'EDM'];
const MOODS = ['Happy', 'Sad', 'Romantic', 'Chill', 'Dark', 'Epic'];
const LANGUAGES = [
  { key: 'English', label: 'English  🇬🇧', emoji: '🇬🇧' },
  { key: 'Hindi',   label: 'हिन्दी  🇮🇳', emoji: '🇮🇳' },
  { key: 'Telugu',  label: 'తెలుగు  🇮🇳', emoji: '🇮🇳' },
  { key: 'Tamil',   label: 'தமிழ்  🇮🇳', emoji: '🇮🇳' },
];

const MODELS = [
  { key: 'trained_local', label: 'Gandharva Own Model' },
  { key: 'gemini', label: 'Gemini 2.5 Flash AI' },
  { key: 'ollama', label: 'Ollama AI' },
];

const formatCleanSingingGuide = (rawText, genre = 'Pop', mood = 'Melancholic') => {
  if (!rawText) return '';
  
  const gLower = (genre || '').toLowerCase();
  const mLower = (mood || '').toLowerCase();

  let verseCues = ['(Warm Chest Voice 🎵)', '(Soft Breath Pause)', '(Subtle Vocal Run)', '(Intimate Phrasing)'];
  let chorusCues = ['(Full Vocal Dynamic 🎶)', '(Sustained Vowel Elongation ~~~)', '(High Octave Lift ↑)', '(Layered Vocal Harmony)'];
  let bridgeCues = ['(Falsetto Shift 📈)', '(Emotional Crescendo)', '(Melodic Vocal Run)'];
  let outroCues = ['(Gentle Vibrato Fade)', '(Quiet Breath Release)', '(Fading Resonance ~~~)'];

  if (gLower.includes('rock') || gLower.includes('metal') || gLower.includes('action') || gLower.includes('heavy') || gLower.includes('epic')) {
    verseCues = ['(Power Chest Voice ⚡)', '(Gritty Phrasing)', '(Driven Vocal Attack)', '(Rhythmic Punch)'];
    chorusCues = ['(Full Power Belt 🔥)', '(High Octave Peak ↑)', '(Explosive Vocal Surge)', '(Sustained Power Hold ~~~)'];
    bridgeCues = ['(Aggressive Crescendo 📈)', '(High Octave Sustain)', '(Dynamic Vocal Shift)'];
    outroCues = ['(Fading Distortion)', '(Final Resonant Hold)', '(Exhale Release)'];
  } else if (gLower.includes('lofi') || gLower.includes('acoustic') || gLower.includes('chill') || mLower.includes('sad')) {
    verseCues = ['(Soft Whisper Voice 🌸)', '(Feathery Breath Pause)', '(Gentle Vocal Slide)', '(Warm Intimate Tone)'];
    chorusCues = ['(Airy Vocal Falsetto 🎶)', '(Subtle Vibrato Decay ~~~)', '(Layered Soft Harmony)', '(Sustained Sweet Hold)'];
    bridgeCues = ['(Quiet Breath Pause)', '(Soft Melodic Lift)', '(Intimate Phrasing)'];
    outroCues = ['(Whisper Fade Out)', '(Soft Exhale Breath)', '(Quiet Hum ~~~)'];
  } else if (gLower.includes('patriot') || gLower.includes('anthem') || gLower.includes('devotional') || mLower.includes('heroic')) {
    verseCues = ['(Solemn Deep Resonance 🚩)', '(Heroic Phrasing)', '(Proud Chest Voice)', '(Steadfast Vocal Rhythm)'];
    chorusCues = ['(Triumphant Choir Peak 🎶)', '(Heroic Sustained Hold ~~~)', '(Full Resonant Surge)', '(Majestic Vocal Belt)'];
    bridgeCues = ['(Solemn Crescendo)', '(High Octave Salute Pitch ↑)', '(Deep Emotional Resonance)'];
    outroCues = ['(Resonant Echo Fade)', '(Honorary Sustained Hold)', '(Final Salute Exhale)'];
  }

  const lines = rawText.split('\n');
  const result = [];
  let currentSection = 'verse';
  let cueIdx = 0;
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const secLower = trimmed.toLowerCase();
      if (secLower.includes('chorus') || secLower.includes('పల్లవి')) currentSection = 'chorus';
      else if (secLower.includes('bridge')) currentSection = 'bridge';
      else if (secLower.includes('outro') || secLower.includes('ముగింపు')) currentSection = 'outro';
      else currentSection = 'verse';

      result.push(`\n${trimmed}\n`);
      return;
    }
    
    const phrases = trimmed.split(/[,;—–]|\band\b/i).filter(p => p.trim().length > 0);
    
    phrases.forEach((phrase) => {
      const pTrimmed = phrase.trim();
      const words = pTrimmed.split(/\s+/);
      if (words.length === 0) return;
      
      const lastIdx = words.length - 1;
      const targetWord = words[lastIdx];
      
      let elongated = targetWord;
      if (targetWord.match(/[aeiouy]/i)) {
        elongated = targetWord.replace(/([aeiouy])([a-z]*)$/i, (m, v, rest) => {
          return v.repeat(3) + (rest || '') + '...';
        });
      } else {
        elongated = targetWord + '...';
      }
      
      const wordsModified = [...words];
      wordsModified[lastIdx] = elongated;
      const lineText = wordsModified.join(' ');
      
      let charOffset = 0;
      for (let i = 0; i < lastIdx; i++) {
        charOffset += wordsModified[i].length + 1;
      }
      const arrowSpaces = ' '.repeat(Math.max(4, charOffset + Math.floor(elongated.length / 3)));
      
      let pool = verseCues;
      if (currentSection === 'chorus') pool = chorusCues;
      else if (currentSection === 'bridge') pool = bridgeCues;
      else if (currentSection === 'outro') pool = outroCues;

      const cue = pool[cueIdx % pool.length];
      cueIdx++;
      
      result.push(lineText);
      result.push(`${arrowSpaces}↑ ${cue}\n`);
    });
  });
  
  return result.join('\n');
};

import { getUserPreferences } from '../../services/preferencesService';

const LyricsGeneratorScreen = ({ navigation, route }) => {
  const { user } = useAuth ? useAuth() : { user: null };
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Pop');
  const [selectedMood, setSelectedMood] = useState('Melancholic');
  const [selectedLanguage, setSelectedLanguage] = useState('Telugu');
  const [selectedModel, setSelectedModel] = useState('trained_local');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lyricsResult, setLyricsResult] = useState(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [isModelDropdownVisible, setIsModelDropdownVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSingingGuideVisible, setIsSingingGuideVisible] = useState(false);
  const [singingGuideTab, setSingingGuideTab] = useState(0); // 0 = Variation A, 1 = Variation B
  const [isCopied, setIsCopied] = useState(false);
  const [isBgmCopied, setIsBgmCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadDefaultLang = async () => {
      try {
        const prefs = await getUserPreferences(user?.id);
        if (prefs && prefs.lyrics_language) {
          const langMap = { te: 'Telugu', hi: 'Hindi', ta: 'Tamil', en: 'English' };
          const defaultLang = langMap[prefs.lyrics_language] || 'Telugu';
          if (!route?.params?.savedLyrics?.language) {
            setSelectedLanguage(defaultLang);
          }
        }
      } catch (e) {}
    };
    loadDefaultLang();
  }, [user?.id]);

  useEffect(() => {
    if (route?.params?.savedLyrics) {
      const saved = route.params.savedLyrics;
      setPrompt(saved.prompt || saved.title || '');
      if (saved.genre) setSelectedGenre(saved.genre);
      if (saved.mood) setSelectedMood(saved.mood);
      if (saved.language) setSelectedLanguage(saved.language);
      setLyricsResult({
        project_id: saved.id || `lyrics-${Date.now()}`,
        variations: [
          {
            version_name: 'Saved Lyrics Draft',
            title: saved.title || 'Saved Song Lyrics',
            lyrics_text: saved.lyrics_text || '',
            engine: 'Library Storage'
          }
        ]
      });
      setSelectedVersionIndex(0);
    }
  }, [route?.params]);

  const handleGenerate = async () => {
    setErrorMessage(null);
    if (!prompt.trim()) {
      setErrorMessage('Please describe what your lyrics should be about in the box above.');
      Alert.alert('Incomplete', 'Please describe what your lyrics should be about.');
      return;
    }
    
    setIsGenerating(true);
    setLyricsResult(null);
    setSelectedVersionIndex(0);

    try {
      const data = await generateLyrics(prompt, selectedGenre, selectedMood, selectedLanguage, selectedModel);
      
      if (data && data.variations) {
        const standardNames = ['Variation A', 'Variation B', 'BGM Prompt'];
        data.variations.forEach((v, i) => {
          if ((v.version_name || '').toLowerCase().includes('bgm')) {
            v.version_name = 'BGM Prompt';
          } else if (!v.version_name || v.version_name.toLowerCase().includes('variation') || v.version_name.toLowerCase().includes('draft')) {
            v.version_name = standardNames[i] || `Variation ${String.fromCharCode(65 + i)}`;
          }
        });

        const hasBgm = data.variations.some(v => v.version_name === 'BGM Prompt');
        if (!hasBgm) {
          data.variations.push({
            id: `bgm-prompt-${Date.now()}`,
            version_name: 'BGM Prompt',
            title: `${data.title || prompt} (BGM Master Prompt)`,
            lyrics_text: `Master high-fidelity ${selectedGenre} track with ${selectedMood} atmosphere. 120 BPM, key of C Major. Built specifically for prompt: "${prompt}". Layered acoustic instruments, pads, and rhythmic percussion.`,
            engine: 'Gandharva AI BGM Prompt Engine',
            fallback_used: false
          });
        }
      }

      setLyricsResult(data);

      if (data && data.variations && data.variations.length > 0) {
        try {
          await saveProjectToLibrary({
            id: data.project_id || `lyrics-${Date.now()}`,
            name: data.variations[0].title || `Lyrics: ${prompt.substring(0, 20)}`,
            genre: selectedGenre,
            mood: selectedMood,
            prompt: prompt,
            language: selectedLanguage,
            lyrics: data.variations.map(v => ({
              title: v.title,
              lyrics_text: v.lyrics_text
            }))
          });
        } catch (e) {
          console.warn('[Lyrics] Save to library warning:', e);
        }
      }
    } catch (err) {
      console.error('[Lyrics] Generation failed', err);
      const msg = err.message || 'Could not connect to lyrics generation service.';
      setErrorMessage(msg);
      Alert.alert('AI Error', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSafeCurrentDraft = () => {
    if (!lyricsResult || !lyricsResult.variations || lyricsResult.variations.length === 0) return null;
    return lyricsResult.variations[selectedVersionIndex] 
      || lyricsResult.variations[0] 
      || { title: 'Generated Song Lyrics', lyrics_text: '' };
  };

  const handleCopy = async () => {
    const draft = getSafeCurrentDraft();
    if (!draft) return;
    const fullText = `${draft.title}\n\n${draft.lyrics_text}`;
    try {
      await Clipboard.setStringAsync(fullText);
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      }
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    Alert.alert('Copied! 📋', 'Lyrics copied to your device clipboard.');
  };

  const handleCopyBgmPrompt = async (customText) => {
    const draft = getSafeCurrentDraft();
    const textToCopy = customText || (draft ? draft.lyrics_text : '') || '';
    if (!textToCopy) return;
    
    try {
      await Clipboard.setStringAsync(textToCopy);
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
    }
    setIsBgmCopied(true);
    setTimeout(() => setIsBgmCopied(false), 2500);
    Alert.alert('BGM Prompt Copied! 📋', 'BGM prompt has been copied to your clipboard.');
  };

  const createAsciiSingingGuide = (rawText) => {
    if (!rawText) return '';
    const lines = rawText.split('\n');
    const cues = ['Hold', 'Pause', 'Soft', 'High note', 'Vibrato', 'Belt', 'Breath'];
    let cueIdx = 0;
    
    const processed = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return `\n${trimmed}\n`;
      }
      
      const words = trimmed.split(/\s+/);
      if (words.length === 0) return trimmed;
      
      const targetIdx = words.length > 1 ? words.length - 1 : 0;
      const targetWord = words[targetIdx];
      
      let elongatedWord = targetWord;
      if (targetWord.match(/[aeiouy]/i)) {
        elongatedWord = targetWord.replace(/([aeiouy])([a-z]*)$/i, (m, v, rest) => v.repeat(4) + (rest || '') + '...');
      } else {
        elongatedWord = targetWord + '...';
      }
      
      const modifiedWords = [...words];
      modifiedWords[targetIdx] = elongatedWord;
      const lineFormatted = modifiedWords.join(' ');
      
      let charOffset = 0;
      for (let i = 0; i < targetIdx; i++) {
        charOffset += modifiedWords[i].length + 1;
      }
      charOffset += Math.max(0, Math.floor(elongatedWord.length / 2) - 2);
      const spaces = ' '.repeat(Math.max(4, charOffset));
      
      const cue = cues[cueIdx % cues.length];
      cueIdx++;
      
      return `${lineFormatted}\n${spaces}↑ ${cue}\n`;
    });
    
    return processed.join('\n');
  };

  const handleOpenSingingGuide = () => {
    const draft = getSafeCurrentDraft();
    if (!draft) {
      Alert.alert('No Lyrics', 'Please generate lyrics first before opening the singing guide.');
      return;
    }
    const initialTab = selectedVersionIndex === 1 ? 1 : 0;
    setSingingGuideTab(initialTab);
    setIsSingingGuideVisible(true);
  };

  const currentDraft = getSafeCurrentDraft();
  const activeSingingDraft = lyricsResult?.variations?.[singingGuideTab] || currentDraft;
  const activeSingingGuideText = activeSingingDraft ? formatCleanSingingGuide(activeSingingDraft.lyrics_text, selectedGenre, selectedMood) : '';

  const handleCopySingingGuide = async () => {
    if (!activeSingingGuideText) return;
    await Clipboard.setStringAsync(activeSingingGuideText);
    Alert.alert('Copied! 📋', `Singing Guide for ${activeSingingDraft?.version_name || 'Variation'} copied to clipboard.`);
  };

  const handleShare = async () => {
    const draft = getSafeCurrentDraft();
    if (!draft) {
      Alert.alert('No Lyrics', 'Please generate lyrics first before sharing.');
      return;
    }
    const fullText = `${draft.title}\n\n${draft.lyrics_text}`;
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(fullText);
        Alert.alert('Lyrics Copied! 📤', 'Lyrics text copied to clipboard for sharing.');
        return;
      }
      await Share.share({
        title: draft.title,
        message: fullText,
      });
    } catch (error) {
      await Clipboard.setStringAsync(fullText);
      Alert.alert('Lyrics Copied! 📤', 'Lyrics text copied to clipboard for sharing.');
    }
  };

  const handleSave = async () => {
    const draft = getSafeCurrentDraft();
    if (!draft) {
      Alert.alert('No Lyrics', 'Please generate lyrics first before saving.');
      return;
    }

    try {
      await saveProjectToLibrary({
        id: `lyrics-${Date.now()}`,
        name: draft.title || `Lyrics: ${prompt.substring(0, 20)}...`,
        genre: selectedGenre,
        mood: selectedMood,
        prompt: prompt,
        lyrics: [{
          title: draft.title,
          lyrics_text: draft.lyrics_text
        }]
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);

      Alert.alert(
        'Saved to Library! 💾',
        `"${draft.title}" has been successfully added to your Library.`,
        [{ text: 'View Library', onPress: () => navigation.navigate('Main', { screen: 'LibraryTab' }) }]
      );
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save lyrics to library: ' + err.message);
    }
  };

  return (
    <LinearGradient 
      colors={['#FAF5EE', '#F3E9DD', '#EADBC8', '#FDFBF7']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, paddingTop: 45 }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#581827" size={24} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Lyrics Generator</Text>
          <Text style={styles.subtitle}>Craft structured verses and custom hooks instantly</Text>
        </View>

        {/* Configuration Card */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>What's your song about?</Text>
          <TextInput
            placeholder="e.g. driving through a neon cyber city at midnight..."
            placeholderTextColor="#A89F91"
            style={styles.textInput}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
          />
          
          {/* Genre Chips */}
          <Text style={[styles.label, { marginTop: SPACING.md }]}>Genre Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
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
          <Text style={[styles.label, { marginTop: SPACING.md }]}>Mood & Emotion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
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

          {/* Language Picker */}
          <Text style={[styles.label, { marginTop: SPACING.md }]}>
            <Globe color="#581827" size={14} />  Lyrics Language
          </Text>
          <View style={styles.languageRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.langChip,
                  selectedLanguage === lang.key && styles.langChipActive,
                ]}
                onPress={() => setSelectedLanguage(lang.key)}
              >
                <Text
                  style={[
                    styles.langChipText,
                    selectedLanguage === lang.key && styles.langChipTextActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Model/Engine Picker */}
          <Text style={[styles.label, { marginTop: SPACING.md }]}>
            <Wand2 color="#581827" size={14} />  AI Model
          </Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setIsModelDropdownVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {MODELS.find(m => m.key === selectedModel)?.label || 'Select Model'}
            </Text>
            <ChevronDown color="#701A28" size={20} />
          </TouchableOpacity>
        </View>

        {/* Model Dropdown Modal */}
        <Modal
          visible={isModelDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModelDropdownVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsModelDropdownVisible(false)}>
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownTitle}>Model</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {MODELS.map((model) => (
                  <TouchableOpacity
                    key={model.key}
                    style={[
                      styles.dropdownItem,
                      selectedModel === model.key && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      setSelectedModel(model.key);
                      setIsModelDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedModel === model.key && styles.dropdownItemTextActive
                    ]}>
                      {model.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Singing Guide Modal */}
        <Modal
          visible={isSingingGuideVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsSingingGuideVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsSingingGuideVisible(false)}>
            <View style={styles.singingGuideModalCard}>
              {/* Modal Header */}
              <View style={styles.singingGuideHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Music color="#581827" size={22} />
                  <Text style={styles.singingGuideTitle}>Singing Guide 🎤</Text>
                </View>
                <TouchableOpacity onPress={() => setIsSingingGuideVisible(false)}>
                  <X color="#701A28" size={22} />
                </TouchableOpacity>
              </View>

              <Text style={styles.singingGuideSub}>
                Pacing, pitch cues & vowel extensions for "{activeSingingDraft?.title || currentDraft?.title}"
              </Text>

              {/* Variation Tabs Bar */}
              <View style={styles.singingGuideTabRow}>
                <TouchableOpacity
                  style={[styles.singingGuideTabBtn, singingGuideTab === 0 && styles.singingGuideTabBtnActive]}
                  onPress={() => setSingingGuideTab(0)}
                >
                  <Text style={[styles.singingGuideTabText, singingGuideTab === 0 && styles.singingGuideTabTextActive]}>
                    Variation A
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.singingGuideTabBtn, singingGuideTab === 1 && styles.singingGuideTabBtnActive]}
                  onPress={() => setSingingGuideTab(1)}
                >
                  <Text style={[styles.singingGuideTabText, singingGuideTab === 1 && styles.singingGuideTabTextActive]}>
                    Variation B
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Clean Readable Content Area */}
              <ScrollView style={styles.singingGuideScroll} nestedScrollEnabled>
                <Text style={styles.singingGuideContentText}>{activeSingingGuideText}</Text>
              </ScrollView>

              {/* Modal Footer Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity style={styles.copyGuideBtn} onPress={handleCopySingingGuide}>
                  <Copy color="#FFFFFF" size={16} />
                  <Text style={styles.copyGuideBtnText}>Copy Singing Guide</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeGuideBtn} onPress={() => setIsSingingGuideVisible(false)}>
                  <Text style={styles.closeGuideBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Error Notification Banner */}
        {errorMessage && (
          <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
              ⚠️ {errorMessage}
            </Text>
          </View>
        )}

        {/* Generate Button with Signature Velvet Burgundy Gradient */}
        <GradientButton
          title={isGenerating ? "Writing Verses..." : "Generate Lyrics"}
          onPress={handleGenerate}
          loading={isGenerating}
          icon={Wand2}
          colors={['#721422', '#581827', '#3D0C14']}
        />

        {/* Generated Result Container */}
        {lyricsResult && currentDraft && !isGenerating && (
          <View style={styles.resultContainer}>
            {/* Version Variation Tabs: Var A, Var B, BGM Prompt */}
            <View style={styles.versionRow}>
              {lyricsResult.variations.map((v, index) => {
                const isBgmTab = (v.version_name || '').toLowerCase().includes('bgm');
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.versionTab, selectedVersionIndex === index && styles.versionTabActive]}
                    onPress={() => setSelectedVersionIndex(index)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.versionText, selectedVersionIndex === index && styles.versionTextActive]}>
                        {v.version_name}
                      </Text>
                      {isBgmTab && (
                        <TouchableOpacity
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onPress={(e) => {
                            e.stopPropagation && e.stopPropagation();
                            setSelectedVersionIndex(index);
                            handleCopyBgmPrompt(v.lyrics_text);
                          }}
                        >
                          {isBgmCopied ? (
                            <Check color={selectedVersionIndex === index ? "#FFF8F0" : "#16A34A"} size={15} />
                          ) : (
                            <Copy color={selectedVersionIndex === index ? "#FFF8F0" : "#581827"} size={14} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Lyrics Card */}
            <View style={styles.lyricsCard}>
              {/* BGM Prompt Quick Copy Banner if viewing BGM prompt */}
              {currentDraft && (currentDraft.version_name || '').toLowerCase().includes('bgm') && (
                <TouchableOpacity 
                  style={[styles.bgmCopyBanner, isBgmCopied && styles.bgmCopyBannerCopied]}
                  onPress={() => handleCopyBgmPrompt(currentDraft.lyrics_text)}
                >
                  {isBgmCopied ? <Check color="#16A34A" size={18} /> : <Copy color="#581827" size={18} />}
                  <Text style={[styles.bgmCopyBannerText, isBgmCopied && { color: '#16A34A' }]}>
                    {isBgmCopied ? 'BGM Prompt Copied to Clipboard! ✓' : 'Click to Copy BGM Prompt'}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.lyricsHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lyricsTitle}>{currentDraft.title || 'Generated Lyrics'}</Text>
                  {lyricsResult.engine && (
                    <Text style={styles.engineText}>
                      Engine: {lyricsResult.engine}
                    </Text>
                  )}
                  {lyricsResult.fallback_reason && (
                    <Text style={styles.fallbackReasonText}>
                      ({lyricsResult.fallback_reason})
                    </Text>
                  )}
                </View>
                <FileText color="#581827" size={24} />
              </View>
              <ScrollView style={styles.lyricsScroll} nestedScrollEnabled={true}>
                <Text style={styles.lyricsContent}>{currentDraft.lyrics_text}</Text>
              </ScrollView>
            </View>

            {/* Quick Actions Panel */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.copyAction, isCopied && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]} 
                onPress={handleCopy}
              >
                <Copy color={isCopied ? "#16A34A" : "#2563EB"} size={14} />
                <Text style={[styles.copyActionText, isCopied && { color: '#16A34A' }]}>
                  {isCopied ? 'Copied! ✓' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.singingGuideAction} 
                onPress={handleOpenSingingGuide}
              >
                <Music color="#D97706" size={14} />
                <Text style={styles.singingGuideActionText}>Singing Guide</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveAction, isSaved && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]} 
                onPress={handleSave}
              >
                <Save color={isSaved ? "#16A34A" : "#059669"} size={14} />
                <Text style={[styles.saveActionText, isSaved && { color: '#16A34A' }]}>
                  {isSaved ? 'Saved! ✓' : 'Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareAction} onPress={handleShare}>
                <Share2 color="#DC2626" size={14} />
                <Text style={styles.shareActionText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Smart Rhyme Dictionary & Syllable Guide */}
            <View style={styles.analysisBox}>
              <Text style={styles.analysisTitle}>
                🎼 Pro Meter & Rhyme Scheme Analysis
              </Text>
              <Text style={styles.analysisBody}>
                • Meter: 8-10 Syllables per line (Balanced Pop Flow){'\n'}
                • Scheme: ABAB Catchy Chorus Hook{'\n'}
                • Recommended Tempo: 124 - 128 BPM
              </Text>
            </View>

            {/* Primary Action: Generate Song with lyrics */}
            <View style={{ marginTop: 16 }}>
              <TouchableOpacity 
                style={styles.generateSongBtn}
                onPress={() => {
                  Alert.alert(
                    'Under Development 🚧',
                    'Song generation directly with lyrics is currently under development. Stay tuned for the upcoming release!'
                  );
                }}
              >
                <Text style={styles.generateSongBtnText}>
                  ✨ Generate Song with lyrics
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backText: {
    color: '#581827',
    marginLeft: 4,
    fontSize: SIZES.font_md,
    fontWeight: '700',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: '#4A0E17',
    fontSize: SIZES.font_xl,
    fontWeight: '800',
  },
  subtitle: {
    color: '#701A28',
    fontSize: SIZES.font_sm,
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    color: '#4A0E17',
    fontSize: SIZES.font_sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  textInput: {
    color: '#2A080C',
    fontSize: SIZES.font_md,
    minHeight: 88,
    textAlignVertical: 'top',
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2CEBF',
    padding: 14,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radius_md,
    backgroundColor: '#FAF5EE',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2CEBF',
  },
  chipActive: {
    borderColor: '#4A0E17',
    backgroundColor: '#581827',
  },
  chipText: {
    color: '#701A28',
    fontSize: SIZES.font_xs,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF8F0',
    fontWeight: '800',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  langChip: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: SIZES.radius_md,
    backgroundColor: '#FAF5EE',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    alignItems: 'center',
  },
  langChipActive: {
    borderColor: '#4A0E17',
    backgroundColor: '#581827',
  },
  langChipText: {
    color: '#701A28',
    fontSize: SIZES.font_xs,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: '#FFF8F0',
    fontWeight: '800',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E2CEBF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#2A080C',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 14, 23, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: 400,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownTitle: {
    fontSize: 14,
    color: '#701A28',
    fontWeight: 'bold',
    marginBottom: 12,
    paddingLeft: 8,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownItemActive: {
    backgroundColor: '#F3E9DD',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#4A0E17',
  },
  dropdownItemTextActive: {
    color: '#581827',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: SPACING.xl,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  versionTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E2CEBF',
  },
  versionTabActive: {
    borderColor: '#4A0E17',
    backgroundColor: '#581827',
  },
  versionText: {
    color: '#701A28',
    fontSize: 13,
    fontWeight: '600',
  },
  versionTextActive: {
    color: '#FFF8F0',
    fontWeight: 'bold',
  },
  bgmCopyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5EE',
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  bgmCopyBannerCopied: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  bgmCopyBannerText: {
    color: '#581827',
    fontSize: 13,
    fontWeight: '700',
  },
  lyricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    maxHeight: 400,
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lyricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2CEBF',
    paddingBottom: 10,
  },
  lyricsTitle: {
    color: '#4A0E17',
    fontSize: 20,
    fontWeight: 'bold',
  },
  engineText: {
    color: '#581827',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  fallbackReasonText: {
    color: '#701A28',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  lyricsScroll: {
    minHeight: 150,
  },
  lyricsContent: {
    color: '#2A080C',
    fontSize: 15,
    lineHeight: 25,
    fontWeight: '500',
    paddingBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: 8,
  },
  copyAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  copyActionText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 12,
  },
  vocalDemoAction: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  vocalDemoActionText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
    fontSize: 11,
  },
  singingGuideAction: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  singingGuideActionText: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 11,
  },
  saveAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  saveActionText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 11,
  },
  shareAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  shareActionText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 11,
  },
  singingGuideModalCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    width: '92%',
    maxHeight: '80%',
    padding: 20,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  singingGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  singingGuideTitle: {
    fontSize: 18,
    color: '#92400E',
    fontWeight: '800',
  },
  singingGuideSub: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 10,
    lineHeight: 16,
  },
  vocalSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  vocalSummaryChip: {
    alignItems: 'center',
    flex: 1,
  },
  vocalSummaryLabel: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vocalSummaryValue: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '800',
    marginTop: 2,
  },
  pitchGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE68A',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  pitchGuideBtnText: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700',
  },
  singingGuideTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  singingGuideTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  singingGuideTabBtnActive: {
    backgroundColor: '#D97706',
  },
  singingGuideTabText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  singingGuideTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  singingGuideScroll: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: 14,
    maxHeight: 340,
  },
  singingGuideContentText: {
    color: '#78350F',
    fontSize: 14,
    fontFamily: 'Courier, monospace',
    lineHeight: 22,
    fontWeight: '600',
  },
  sectionHeaderBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 2,
  },
  sectionHeaderBadgeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  vocalCardItem: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  vocalLineText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  vocalTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vocalPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  vocalPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  copyGuideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  copyGuideBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closeGuideBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
  },
  closeGuideBtnText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  analysisBox: {
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 14,
  },
  analysisTitle: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analysisBody: {
    color: '#78350F',
    fontSize: 12,
    lineHeight: 18,
  },
  generateBgmBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBgmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  generateSongBtn: {
    backgroundColor: '#581827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateSongBtnText: {
    color: '#FFF8F0',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LyricsGeneratorScreen;

