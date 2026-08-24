import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import { formatTimecode } from '../../services/timelineModel';

export const TimelineRuler = ({
  duration = 60,
  zoomPxPerSec = 20,
  currentTime = 0,
  onSeek,
  accentColor = '#10B981',
}) => {
  // Determine marker step interval in seconds based on zoom level
  const stepSec = useMemo(() => {
    if (zoomPxPerSec >= 40) return 2; // Every 2s for high zoom
    if (zoomPxPerSec >= 20) return 5; // Every 5s for medium zoom
    if (zoomPxPerSec >= 10) return 10; // Every 10s for low zoom
    return 15;
  }, [zoomPxPerSec]);

  const totalWidth = duration * zoomPxPerSec;
  const numMarkers = Math.ceil(duration / stepSec);

  // PanResponder to drag-scrub on the ruler
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const locationX = evt.nativeEvent.locationX;
          const targetSec = locationX / zoomPxPerSec;
          onSeek && onSeek(Math.max(0, Math.min(duration, targetSec)));
        },
        onPanResponderMove: (evt) => {
          const locationX = evt.nativeEvent.locationX;
          const targetSec = locationX / zoomPxPerSec;
          onSeek && onSeek(Math.max(0, Math.min(duration, targetSec)));
        },
      }),
    [zoomPxPerSec, duration, onSeek]
  );

  const markers = [];
  for (let i = 0; i <= numMarkers; i++) {
    const timeInSec = i * stepSec;
    if (timeInSec > duration) break;
    const xPos = timeInSec * zoomPxPerSec;

    markers.push(
      <View key={i} style={[styles.markerBox, { left: xPos }]}>
        <View style={styles.tickLine} />
        <Text style={styles.markerText}>{formatTimecode(timeInSec)}</Text>
      </View>
    );
  }

  // Playhead position
  const playheadX = currentTime * zoomPxPerSec;

  return (
    <View style={[styles.rulerContainer, { width: totalWidth }]} {...panResponder.panHandlers}>
      {markers}

      {/* Playhead Scrub Needle on Ruler */}
      <View style={[styles.rulerPlayheadHead, { left: playheadX - 6, backgroundColor: accentColor }]}>
        <View style={[styles.rulerPlayheadPoint, { borderTopColor: accentColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rulerContainer: {
    height: 28,
    backgroundColor: '#12121A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'visible',
  },
  markerBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingLeft: 2,
  },
  tickLine: {
    width: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  markerText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  rulerPlayheadHead: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 2,
    alignItems: 'center',
    zIndex: 100,
  },
  rulerPlayheadPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: 12,
  },
});
export default TimelineRuler;
