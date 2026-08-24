import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity, Platform } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { getCachedWaveform } from '../../services/waveformCache';
import { formatTimecode } from '../../services/timelineModel';

export const AudioClip = ({
  clip,
  trackId,
  zoomPxPerSec = 20,
  isSelected = false,
  onSelect,
  onMoveClip,
  onTrimClip,
  onLongPress,
  trackColor = '#10B981',
  snapToGrid = true,
  gridSize = 0.5,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionInfo, setInteractionInfo] = useState('');

  const clipWidth = Math.max(24, clip.duration * zoomPxPerSec);
  const clipLeft = clip.timelineStart * zoomPxPerSec;

  // Waveform peaks
  const peaks = useMemo(() => {
    return getCachedWaveform(clip.audioSource || clip.id, 45);
  }, [clip.audioSource, clip.id]);

  const snapVal = (valSec) => {
    if (!snapToGrid) return valSec;
    return Math.round(valSec / gridSize) * gridSize;
  };

  // 1. CLIP DRAG (Horizontal Move)
  const movePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isSelected,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 && isSelected,
        onPanResponderGrant: () => {
          setIsInteracting(true);
          setInteractionInfo(`Move: ${formatTimecode(clip.timelineStart)}`);
        },
        onPanResponderMove: (_, gesture) => {
          const deltaSec = gesture.dx / zoomPxPerSec;
          const targetStart = snapVal(Math.max(0, clip.timelineStart + deltaSec));
          setInteractionInfo(`Pos: ${formatTimecode(targetStart)}`);
        },
        onPanResponderRelease: (_, gesture) => {
          setIsInteracting(false);
          const deltaSec = gesture.dx / zoomPxPerSec;
          const finalStart = snapVal(Math.max(0, clip.timelineStart + deltaSec));
          onMoveClip && onMoveClip(trackId, clip.id, finalStart);
        },
      }),
    [isSelected, clip.timelineStart, clip.id, trackId, zoomPxPerSec, snapToGrid, gridSize, onMoveClip]
  );

  // 2. LEFT TRIM HANDLE
  const leftTrimResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3,
        onPanResponderGrant: () => {
          setIsInteracting(true);
          setInteractionInfo(`Trim Start: ${formatTimecode(clip.sourceStart)}`);
        },
        onPanResponderMove: (_, gesture) => {
          const deltaSec = gesture.dx / zoomPxPerSec;
          const newSourceStart = snapVal(Math.max(0, clip.sourceStart + deltaSec));
          const newTimelineStart = snapVal(Math.max(0, clip.timelineStart + deltaSec));
          const boundedStart = Math.min(clip.sourceEnd - 0.2, newSourceStart);
          setInteractionInfo(`Start: ${formatTimecode(boundedStart)} | Dur: ${formatTimecode(clip.sourceEnd - boundedStart)}`);
        },
        onPanResponderRelease: (_, gesture) => {
          setIsInteracting(false);
          const deltaSec = gesture.dx / zoomPxPerSec;
          const newSourceStart = snapVal(Math.max(0, clip.sourceStart + deltaSec));
          const newTimelineStart = snapVal(Math.max(0, clip.timelineStart + deltaSec));
          const boundedStart = Math.min(clip.sourceEnd - 0.2, newSourceStart);
          onTrimClip && onTrimClip(trackId, clip.id, boundedStart, clip.sourceEnd, newTimelineStart);
        },
      }),
    [clip.sourceStart, clip.sourceEnd, clip.timelineStart, clip.id, trackId, zoomPxPerSec, snapToGrid, gridSize, onTrimClip]
  );

  // 3. RIGHT TRIM HANDLE
  const rightTrimResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3,
        onPanResponderGrant: () => {
          setIsInteracting(true);
          setInteractionInfo(`Trim End: ${formatTimecode(clip.sourceEnd)}`);
        },
        onPanResponderMove: (_, gesture) => {
          const deltaSec = gesture.dx / zoomPxPerSec;
          const newSourceEnd = snapVal(Math.max(clip.sourceStart + 0.2, clip.sourceEnd + deltaSec));
          setInteractionInfo(`End: ${formatTimecode(newSourceEnd)} | Dur: ${formatTimecode(newSourceEnd - clip.sourceStart)}`);
        },
        onPanResponderRelease: (_, gesture) => {
          setIsInteracting(false);
          const deltaSec = gesture.dx / zoomPxPerSec;
          const newSourceEnd = snapVal(Math.max(clip.sourceStart + 0.2, clip.sourceEnd + deltaSec));
          onTrimClip && onTrimClip(trackId, clip.id, clip.sourceStart, newSourceEnd, clip.timelineStart);
        },
      }),
    [clip.sourceStart, clip.sourceEnd, clip.timelineStart, clip.id, trackId, zoomPxPerSec, snapToGrid, gridSize, onTrimClip]
  );

  return (
    <View
      style={[
        styles.clipCard,
        {
          left: clipLeft,
          width: clipWidth,
          backgroundColor: `${trackColor}25`,
          borderColor: isSelected ? '#FFF' : `${trackColor}60`,
          borderWidth: isSelected ? 2 : 1,
        },
        isSelected && styles.clipSelectedGlow,
      ]}
      {...movePanResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.clipBodyTouch}
        activeOpacity={0.9}
        onPress={() => onSelect && onSelect(clip.id, trackId)}
        onLongPress={() => onLongPress && onLongPress(clip, trackId)}
      >
        {/* Header Ribbon inside Clip */}
        <View style={[styles.clipHeaderRibbon, { backgroundColor: `${trackColor}40` }]}>
          <Text style={[styles.clipTitleText, { color: '#FFF' }]} numberOfLines={1}>
            {clip.title || 'Master Stem'}
          </Text>
          <Text style={styles.clipDurationBadge}>{formatTimecode(clip.duration)}</Text>
        </View>

        {/* Dynamic Waveform Visualization */}
        <View style={styles.waveformBox}>
          <Svg width="100%" height={36}>
            {peaks.map((peak, idx) => {
              const barWidth = Math.max(2.5, (clipWidth / peaks.length) - 1.8);
              const barHeight = Math.max(5, peak * 32);
              const xPos = (idx / peaks.length) * clipWidth;
              const yPos = (36 - barHeight) / 2;

              return (
                <Rect
                  key={idx}
                  x={xPos}
                  y={yPos}
                  width={barWidth}
                  height={barHeight}
                  rx={1.5}
                  fill={isSelected ? '#FFF' : trackColor}
                  opacity={isSelected ? 0.95 : 0.8}
                />
              );
            })}
          </Svg>
        </View>
      </TouchableOpacity>

      {/* LEFT TRIM HANDLE (Touch Hit Target >= 44px) */}
      {isSelected && (
        <View style={styles.leftHandleHitBox} {...leftTrimResponder.panHandlers}>
          <View style={[styles.handlePill, { backgroundColor: '#FFF' }]}>
            <View style={styles.handleKnobGrip} />
            <View style={styles.handleKnobGrip} />
          </View>
        </View>
      )}

      {/* RIGHT TRIM HANDLE (Touch Hit Target >= 44px) */}
      {isSelected && (
        <View style={styles.rightHandleHitBox} {...rightTrimResponder.panHandlers}>
          <View style={[styles.handlePill, { backgroundColor: '#FFF' }]}>
            <View style={styles.handleKnobGrip} />
            <View style={styles.handleKnobGrip} />
          </View>
        </View>
      )}

      {/* Live Tooltip Tooltip */}
      {isInteracting && (
        <View style={styles.tooltipBox}>
          <Text style={styles.tooltipText}>{interactionInfo}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  clipCard: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 10,
    overflow: 'visible',
    zIndex: 10,
  },
  clipSelectedGlow: {
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  clipBodyTouch: {
    flex: 1,
    borderRadius: 9,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  clipHeaderRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clipTitleText: {
    fontSize: 10,
    fontWeight: '900',
    flex: 1,
    letterSpacing: 0.2,
  },
  clipDurationBadge: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginLeft: 4,
  },
  waveformBox: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  leftHandleHitBox: {
    position: 'absolute',
    left: -22,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  rightHandleHitBox: {
    position: 'absolute',
    right: -22,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  handlePill: {
    width: 10,
    height: '85%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  handleKnobGrip: {
    width: 4,
    height: 2,
    backgroundColor: '#0F172A',
    borderRadius: 1,
  },
  tooltipBox: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
    zIndex: 100,
  },
  tooltipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
export default AudioClip;
