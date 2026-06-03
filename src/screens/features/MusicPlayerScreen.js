import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Heart, Share2, Download, Volume2, ListMusic } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');
const ART_SIZE = width * 0.8;

const MusicPlayerScreen = ({ navigation, route }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronDown color={COLORS.white} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity>
          <ListMusic color={COLORS.white} size={24} />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artContainer}>
        <View style={styles.artWrapper}>
          <View style={styles.artPlaceholder}>
            <View style={styles.artCircle}>
              <View style={[styles.innerCircle, isPlaying && styles.playingCircle]} />
            </View>
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.songTitle}>Neon Shadows</Text>
          <Text style={styles.artistName}>AI Generated • Cinematic</Text>
        </View>
        <TouchableOpacity onPress={() => setIsLiked(!isLiked)}>
          <Heart color={isLiked ? COLORS.accent : COLORS.white} fill={isLiked ? COLORS.accent : 'transparent'} size={28} />
        </TouchableOpacity>
      </View>

      {/* Seekbar */}
      <View style={styles.seekContainer}>
        <View style={styles.seekTrack}>
          <View style={[styles.seekProgress, { width: '45%' }]} />
          <View style={[styles.seekKnob, { left: '45%' }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>1:12</Text>
          <Text style={styles.timeText}>2:45</Text>
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity>
          <Shuffle color={COLORS.textMuted} size={20} />
        </TouchableOpacity>
        <TouchableOpacity>
          <SkipBack color={COLORS.white} size={32} fill={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause color={COLORS.background} size={32} fill={COLORS.background} /> : <Play color={COLORS.background} size={32} fill={COLORS.background} style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
        <TouchableOpacity>
          <SkipForward color={COLORS.white} size={32} fill={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Repeat color={COLORS.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionItem}>
          <Share2 color={COLORS.white} size={22} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Download color={COLORS.white} size={22} />
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>
        <View style={styles.volumeRow}>
          <Volume2 color={COLORS.textMuted} size={20} />
          <View style={styles.volumeTrack}>
            <View style={[styles.volumeProgress, { width: '70%' }]} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  artContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  artWrapper: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: ART_SIZE / 2,
    backgroundColor: COLORS.surface,
    padding: 12,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  artPlaceholder: {
    flex: 1,
    borderRadius: ART_SIZE / 2,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  artCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  playingCircle: {
    transform: [{ scale: 1.2 }],
    backgroundColor: COLORS.secondary,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  artistName: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
    marginTop: 4,
  },
  seekContainer: {
    marginBottom: SPACING.xxl,
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
    elevation: 5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  volumeRow: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginLeft: 10,
  },
  volumeProgress: {
    height: '100%',
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
  }
});

export default MusicPlayerScreen;
