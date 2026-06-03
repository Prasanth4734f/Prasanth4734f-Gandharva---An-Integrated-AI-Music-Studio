import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Share, Alert, Modal, Pressable } from 'react-native';
import { FileText, Wand2, Copy, Share2, Save, ChevronLeft, Globe, ChevronDown } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import * as Clipboard from 'expo-clipboard';

import { generateLyrics } from '../../services/lyricsService';

const GENRES = ['Pop', 'Lofi', 'Rock', 'Cinematic', 'Phonk', 'EDM'];
const MOODS = ['Happy', 'Sad', 'Romantic', 'Chill', 'Dark', 'Epic'];
const LANGUAGES = [
  { key: 'English',  label: 'English  🇬🇧', emoji: '🇬🇧' },
  { key: 'Hindi',    label: 'हिन्दी  🇮🇳', emoji: '🇮🇳' },
  { key: 'Telugu',   label: 'తెలుగు  🇮🇳', emoji: '🇮🇳' },
];

const MODELS = [
  { key: 'auto', label: 'Auto (Best Available)' },
  { key: 'gemini', label: 'Free Tier (Gemini)' },
  { key: 'openai', label: 'Premium (GPT-4o)' },
  { key: 'anthropic', label: 'Premium (Claude)' },
  { key: 'local', label: 'Local Inference' }
];

const LyricsGeneratorScreen = ({ navigation }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Pop');
  const [selectedMood, setSelectedMood] = useState('Melancholic');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lyricsResult, setLyricsResult] = useState(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [isModelDropdownVisible, setIsModelDropdownVisible] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Incomplete', 'Please describe what your lyrics should be about.');
      return;
    }
    
    setIsGenerating(true);
    setLyricsResult(null);
    setSelectedVersionIndex(0);

    try {
      const data = await generateLyrics(prompt, selectedGenre, selectedMood, selectedLanguage, selectedModel);
      setLyricsResult(data);
    } catch (err) {
      console.error('[Lyrics] Generation failed', err);
      Alert.alert('AI Error', err.message || 'Could not connect to lyrics generation service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!lyricsResult) return;
    const currentDraft = lyricsResult.variations[selectedVersionIndex];
    const fullText = `${currentDraft.title}\n\n${currentDraft.lyrics_text}`;
    await Clipboard.setStringAsync(fullText);
    Alert.alert('Copied!', 'Lyrics copied to your device clipboard.');
  };

  const handleShare = async () => {
    if (!lyricsResult) return;
    const currentDraft = lyricsResult.variations[selectedVersionIndex];
    try {
      await Share.share({
        title: currentDraft.title,
        message: `${currentDraft.title}\n\n${currentDraft.lyrics_text}`,
      });
    } catch (error) {
      console.error('[Lyrics] Sharing failed', error);
    }
  };

  const handleSave = () => {
    if (!lyricsResult) return;
    Alert.alert(
      'Lyrics Saved!',
      `"${lyricsResult.title}" has been successfully added to your project library.`,
      [{ text: 'Done', onPress: () => navigation.navigate('Main', { screen: 'LibraryTab' }) }]
    );
  };

  const currentDraft = lyricsResult ? lyricsResult.variations[selectedVersionIndex] : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 50 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#171717" size={24} />
          <Text style={[styles.backText, { color: '#171717' }]}>Back</Text>
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
            placeholderTextColor={COLORS.textMuted}
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
            <Globe color={COLORS.secondary} size={14} />  Lyrics Language
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
            <Wand2 color={COLORS.secondary} size={14} />  AI Model
          </Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setIsModelDropdownVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {MODELS.find(m => m.key === selectedModel)?.label || 'Select Model'}
            </Text>
            <ChevronDown color={COLORS.textMuted} size={20} />
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

        {/* Generate Button */}
        <GradientButton
          title={isGenerating ? "Writing Verses..." : "Generate Lyrics"}
          onPress={handleGenerate}
          loading={isGenerating}
          icon={Wand2}
          colors={['#EF4444', '#DC2626']}
        />

        {/* Generated Result Container */}
        {lyricsResult && currentDraft && !isGenerating && (
          <View style={styles.resultContainer}>
            {/* Version Variation Tabs */}
            <View style={styles.versionRow}>
              {lyricsResult.variations.map((v, index) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.versionTab, selectedVersionIndex === index && styles.versionTabActive]}
                  onPress={() => setSelectedVersionIndex(index)}
                >
                  <Text style={[styles.versionText, selectedVersionIndex === index && styles.versionTextActive]}>
                    {v.version_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lyrics Sheet */}
            <GlassCard style={styles.lyricsCard}>
              <View style={styles.lyricsHeader}>
                <View>
                  <Text style={styles.lyricsTitle}>{currentDraft.title}</Text>
                  {currentDraft.engine && (
                    <Text style={styles.engineText}>
                      Generated via {currentDraft.engine}
                      {currentDraft.fallback_used && ' (Fallback)'}
                    </Text>
                  )}
                  {currentDraft.fallback_reason && (
                    <Text style={styles.fallbackReasonText}>
                      ⚠️ {currentDraft.fallback_reason}
                    </Text>
                  )}
                </View>
                <FileText color={COLORS.secondary} size={20} />
              </View>
              <ScrollView style={styles.lyricsScroll} nestedScrollEnabled>
                <Text style={styles.lyricsContent}>{currentDraft.lyrics_text}</Text>
              </ScrollView>
            </GlassCard>

            {/* Quick Actions Panel */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.iconAction} onPress={handleCopy}>
                <Copy color={COLORS.white} size={20} />
                <Text style={styles.iconActionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction} onPress={handleSave}>
                <Save color={COLORS.white} size={20} />
                <Text style={styles.iconActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction} onPress={handleShare}>
                <Share2 color="#EF4444" size={20} />
                <Text style={styles.iconActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
    color: COLORS.white,
    marginLeft: 4,
    fontSize: SIZES.font_md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: '#171717',
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: SIZES.font_sm,
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: SIZES.radius_lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    color: '#171717',
    fontSize: SIZES.font_sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  textInput: {
    color: '#171717',
    fontSize: SIZES.font_md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radius_md,
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  chipText: {
    color: '#6B7280',
    fontSize: SIZES.font_xs,
  },
  chipTextActive: {
    color: '#EF4444',
    fontWeight: 'bold',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  langChipActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  langChipText: {
    color: '#6B7280',
    fontSize: SIZES.font_xs,
    fontWeight: '500',
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownTitle: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#4B5563',
  },
  dropdownItemTextActive: {
    color: '#111827',
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: SIZES.radius_md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versionTabActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary + '15',
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
  },
  versionTextActive: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  lyricsCard: {
    padding: SPACING.lg,
    maxHeight: 400,
  },
  lyricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  lyricsTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
  },
  engineText: {
    color: COLORS.secondary,
    fontSize: SIZES.font_xs,
    marginTop: 2,
  },
  fallbackReasonText: {
    color: '#ff6b6b',
    fontSize: SIZES.font_xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  lyricsScroll: {
    minHeight: 150,
  },
  lyricsContent: {
    color: COLORS.textSecondary,
    fontSize: SIZES.font_md,
    lineHeight: 24,
    fontStyle: 'italic',
    paddingBottom: SPACING.xl,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
  },
  iconAction: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  iconActionText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
    marginTop: 4,
  },
});

export default LyricsGeneratorScreen;
