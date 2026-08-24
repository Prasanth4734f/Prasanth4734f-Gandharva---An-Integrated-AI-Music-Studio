import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Play,
  Pause,
  Square,
  Rewind,
  FastForward,
  Repeat,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatTimecode } from '../../services/timelineModel';

export const TransportControls = ({
  isPlaying = false,
  currentTime = 0,
  duration = 30,
  onPlay,
  onPause,
  onStop,
  onSeekRelative,
  playbackSpeed = 1.0,
  onChangeSpeed,
  isLooping = false,
  onToggleLoop,
  bpm = 120,
  accentColor = '#10B981',
}) => {
  const speeds = [0.5, 0.8, 1.0, 1.25, 1.5];

  return (
    <View style={styles.transportContainer}>
      {/* Left: GarageBand Style LED Digital Timecode Deck */}
      <View style={styles.leftInfoGroup}>
        <View style={styles.digitalLedDeck}>
          <View style={styles.bpmTag}>
            <Text style={styles.bpmText}>{bpm} BPM</Text>
          </View>
          <Text style={styles.ledTimeText}>
            {formatTimecode(currentTime, true)}
          </Text>
          <Text style={styles.ledDurationDivider}>/</Text>
          <Text style={styles.ledDurationText}>{formatTimecode(duration)}</Text>
        </View>

        {onChangeSpeed && (
          <TouchableOpacity
            style={styles.speedSelectorBtn}
            onPress={() => {
              const currentIdx = speeds.indexOf(playbackSpeed);
              const nextIdx = (currentIdx + 1) % speeds.length;
              onChangeSpeed(speeds[nextIdx]);
            }}
            activeOpacity={0.7}
          >
            <Zap color="#F59E0B" size={11} />
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Center: Glowing Hero Transport Controls */}
      <View style={styles.centerControls}>
        <TouchableOpacity
          style={styles.transportMiniBtn}
          onPress={() => onSeekRelative && onSeekRelative(-5)}
          activeOpacity={0.7}
        >
          <Rewind color="#E2E8F0" size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.heroPlayBtn}
          onPress={isPlaying ? onPause : onPlay}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isPlaying ? ['#EF4444', '#DC2626'] : ['#00E5FF', '#0284C7']}
            style={styles.heroPlayGrad}
          >
            {isPlaying ? (
              <Pause color="#FFF" size={22} fill="#FFF" />
            ) : (
              <Play color="#000" size={22} fill="#000" style={{ marginLeft: 3 }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.transportMiniBtn}
          onPress={() => onSeekRelative && onSeekRelative(5)}
          activeOpacity={0.7}
        >
          <FastForward color="#E2E8F0" size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.transportMiniBtn}
          onPress={onStop}
          activeOpacity={0.7}
        >
          <Square color="#94A3B8" size={13} fill="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Right: Loop Indicator */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={[styles.loopBtn, isLooping && styles.loopBtnActive]}
          onPress={onToggleLoop}
          activeOpacity={0.7}
        >
          <Repeat color={isLooping ? '#00E5FF' : '#64748B'} size={15} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  transportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0A0C13',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  digitalLedDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  bpmTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    marginRight: 4,
  },
  bpmText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
  },
  ledTimeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  ledDurationDivider: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  ledDurationText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  speedSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  speedText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  heroPlayGrad: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  loopBtnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
});
export default TransportControls;
