import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { RadioTower, Activity, Disc } from 'lucide-react-native';

export const TouchPitchRibbon = ({ onPitchBend, onModWheel, accentColor = '#A855F7' }) => {
  const [pitchOffset, setPitchOffset] = useState(0); // -100 to +100
  const [modValue, setModValue] = useState(20); // 0 to 100
  const [isBending, setIsBending] = useState(false);

  const ribbonWidth = 240;
  const ribbonHeight = 50;

  const pitchPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsBending(true);
        const { locationX } = evt.nativeEvent;
        const normalized = ((locationX / ribbonWidth) - 0.5) * 2;
        const clamped = Math.max(-1, Math.min(1, normalized));
        const semitones = clamped * 2;
        setPitchOffset(Math.round(clamped * 100));
        if (onPitchBend) onPitchBend(semitones);
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const normalized = ((locationX / ribbonWidth) - 0.5) * 2;
        const clamped = Math.max(-1, Math.min(1, normalized));
        const semitones = clamped * 2;
        setPitchOffset(Math.round(clamped * 100));
        if (onPitchBend) onPitchBend(semitones);
      },
      onPanResponderRelease: () => {
        setIsBending(false);
        setPitchOffset(0);
        if (onPitchBend) onPitchBend(0);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <RadioTower color="#38BDF8" size={16} />
          <Text style={styles.headerTitle}>REAL-TIME TOUCH PITCH RIBBON</Text>
        </View>
        <Text style={[styles.bendText, isBending && { color: '#00E5FF', fontWeight: '900' }]}>
          {pitchOffset === 0 ? 'Center (0 st)' : pitchOffset > 0 ? `+${(pitchOffset / 50).toFixed(1)} st` : `${(pitchOffset / 50).toFixed(1)} st`}
        </Text>
      </View>

      <Text style={styles.subText}>
        Touch and slide horizontally to pitch-bend notes. Automatically returns to center on release.
      </Text>

      {/* Touch Ribbon Controller */}
      <View style={[styles.ribbonCanvasBox, { width: ribbonWidth, height: ribbonHeight }]} {...pitchPanResponder.panHandlers}>
        <Svg width={ribbonWidth} height={ribbonHeight}>
          <Rect x={0} y={0} width={ribbonWidth} height={ribbonHeight} rx={12} fill="#0A0C16" stroke="rgba(56, 189, 248, 0.4)" strokeWidth={1.5} />
          
          {/* Center Zero Line */}
          <Line x1={ribbonWidth / 2} y1={0} x2={ribbonWidth / 2} y2={ribbonHeight} stroke="#38BDF8" strokeWidth={2} />

          {/* Touch Indicator Needle */}
          {(() => {
            const needleX = (ribbonWidth / 2) + (pitchOffset / 100) * (ribbonWidth / 2 - 14);
            return (
              <>
                <Line x1={needleX} y1={4} x2={needleX} y2={ribbonHeight - 4} stroke="#FFF" strokeWidth={3} />
                <Circle cx={needleX} cy={ribbonHeight / 2} r={7} fill="#38BDF8" />
              </>
            );
          })()}
        </Svg>
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.axisLabel}>-2 Semitones</Text>
        <Text style={[styles.axisLabel, { color: '#38BDF8' }]}>Spring-Loaded Pitch Bend</Text>
        <Text style={styles.axisLabel}>+2 Semitones</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121526',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 12,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  subText: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  ribbonCanvasBox: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  labelsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  axisLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default TouchPitchRibbon;
