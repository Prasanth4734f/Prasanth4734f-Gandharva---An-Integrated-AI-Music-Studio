import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic, Upload, Music, Play, Pause, Download, Share2, ChevronLeft } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

import { uploadVocalAndMix } from '../../services/uploadService';
import { Alert } from 'react-native';

const VocalUploadScreen = ({ navigation }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    // In a real app, you'd use expo-document-picker here.
    // For this demonstration, we'll simulate picking a file and then calling the real API.

    setIsUploading(true);
    setError(null);

    try {
      // Simulate picker delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsUploading(false);
      setIsProcessing(true);

      // Call the actual backend endpoint
      const data = await uploadVocalAndMix('mock-uri', 'vocal_sample.m4a');

      setResult({
        title: data.title,
        duration: data.duration,
        url: data.audioUrl,
      });
    } catch (err) {
      console.error('[Vocal Studio] Failed', err);
      setError(err.message);
      Alert.alert('Studio Error', err.message);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };


  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={24} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Vocal AI Studio</Text>
          <Text style={styles.subtitle}>Upload vocals and let AI generate the perfect backtrack</Text>
        </View>

        <TouchableOpacity onPress={handleUpload} disabled={isUploading || isProcessing}>
          <GlassCard style={styles.uploadBox}>
            {isUploading ? (
              <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.uploadText}>Uploading Vocals... 65%</Text>
              </View>
            ) : isProcessing ? (
              <View style={styles.center}>
                <ActivityIndicator color={COLORS.secondary} size="large" />
                <Text style={styles.uploadText}>AI is composing backtrack...</Text>
              </View>
            ) : (
              <View style={styles.center}>
                <View style={styles.iconCircle}>
                  <Upload color={COLORS.white} size={32} />
                </View>
                <Text style={styles.uploadTitle}>Tap to Upload Audio</Text>
                <Text style={styles.uploadSub}>MP3, WAV, M4A up to 10MB</Text>
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.recordBtn}>
          <Mic color={COLORS.white} size={24} />
          <Text style={styles.recordText}>Start Recording</Text>
        </TouchableOpacity>

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Generated Mix</Text>
            <GlassCard style={styles.resultCard}>
              <View style={styles.resultInfo}>
                <View style={styles.artBox}>
                  <Music color={COLORS.secondary} size={24} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultSub}>Mixed with Deep House Beat • {result.duration}</Text>
                </View>
              </View>

              <View style={styles.waveformPlaceholder}>
                {[...Array(30)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { height: Math.random() * 30 + 5, backgroundColor: i < 15 ? COLORS.secondary : COLORS.surfaceLight }
                    ]}
                  />
                ))}
              </View>

              <View style={styles.playerActions}>
                <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause color={COLORS.white} size={24} /> : <Play color={COLORS.white} size={24} fill={COLORS.white} />}
                </TouchableOpacity>
                <View style={styles.rightActions}>
                  <TouchableOpacity style={styles.actionIcon}>
                    <Download color={COLORS.white} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon}>
                    <Share2 color={COLORS.white} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.primary + '50',
  },
  center: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '30',
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
  uploadText: {
    color: COLORS.text,
    marginTop: SPACING.md,
    fontSize: SIZES.font_md,
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
  recordBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    height: 56,
    borderRadius: SIZES.radius_md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordText: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  resultContainer: {
    marginTop: SPACING.xxl,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  resultCard: {
    padding: SPACING.lg,
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
    backgroundColor: COLORS.surfaceLight,
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
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
  },
  waveformPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    marginBottom: SPACING.lg,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: SPACING.lg,
  }
});

export default VocalUploadScreen;
