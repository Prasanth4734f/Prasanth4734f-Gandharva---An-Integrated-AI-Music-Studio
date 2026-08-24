import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Sparkles, Activity, Waves } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const PAD_SIZE = Math.min(width - 48, 340);

export const TouchKaossPad = ({
  onModulate,
  accentColor = '#A855F7',
}) => {
  const [touchPos, setTouchPos] = useState({ x: PAD_SIZE / 2, y: PAD_SIZE / 2 });
  const [isHolding, setIsHolding] = useState(false);

  // Normalized values: 0.0 to 1.0
  const normalizedX = Math.max(0, Math.min(1, touchPos.x / PAD_SIZE));
  const normalizedY = Math.max(0, Math.min(1, (PAD_SIZE - touchPos.y) / PAD_SIZE));

  // Audio parameters computed from touch
  const cutoffHz = Math.round(20 + Math.pow(normalizedX, 2) * 19980);
  const resonanceWet = Math.round(normalizedY * 100);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const clampedX = Math.max(10, Math.min(PAD_SIZE - 10, locationX));
        const clampedY = Math.max(10, Math.min(PAD_SIZE - 10, locationY));
        setTouchPos({ x: clampedX, y: clampedY });
        setIsHolding(true);
        if (onModulate) {
          onModulate({
            cutoffHz: Math.round(20 + Math.pow(clampedX / PAD_SIZE, 2) * 19980),
            resonanceWet: Math.round(((PAD_SIZE - clampedY) / PAD_SIZE) * 100),
          });
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const clampedX = Math.max(10, Math.min(PAD_SIZE - 10, locationX));
        const clampedY = Math.max(10, Math.min(PAD_SIZE - 10, locationY));
        setTouchPos({ x: clampedX, y: clampedY });
        if (onModulate) {
          onModulate({
            cutoffHz: Math.round(20 + Math.pow(clampedX / PAD_SIZE, 2) * 19980),
            resonanceWet: Math.round(((PAD_SIZE - clampedY) / PAD_SIZE) * 100),
          });
        }
      },
      onPanResponderRelease: () => {
        setIsHolding(false);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Waves color="#C084FC" size={16} />
          <Text style={styles.headerTitle}>REAL-TIME TOUCH KAOSS MODULATOR</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.liveGlowDot, isHolding && styles.liveGlowDotActive]} />
          <Text style={styles.liveBadgeText}>
            {isHolding ? 'LIVE TOUCH ACTIVE' : 'TOUCH & DRAG'}
          </Text>
        </View>
      </View>

      <Text style={styles.subText}>
        Slide your finger across the 2D surface to sweep filter cutoff & resonance harmonics in real time.
      </Text>

      {/* Touch Sensitive Kaoss Pad Canvas */}
      <View style={[styles.padBox, { width: PAD_SIZE, height: PAD_SIZE }]} {...panResponder.panHandlers}>
        <Svg width={PAD_SIZE} height={PAD_SIZE}>
          <Defs>
            <RadialGradient id="touchGlow" cx={touchPos.x} cy={touchPos.y} r={PAD_SIZE * 0.4} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#A855F7" stopOpacity={isHolding ? '0.7' : '0.35'} />
              <Stop offset="50%" stopColor="#00E5FF" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#0A0C16" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Grid Background */}
          <Rect x={0} y={0} width={PAD_SIZE} height={PAD_SIZE} fill="#0A0C16" rx={16} />
          <Rect x={0} y={0} width={PAD_SIZE} height={PAD_SIZE} fill="url(#touchGlow)" rx={16} />

          {/* Grid Crosshair Lines */}
          {[0.25, 0.5, 0.75].map((ratio, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={PAD_SIZE * ratio}
                y1={0}
                x2={PAD_SIZE * ratio}
                y2={PAD_SIZE}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4,4"
              />
              <Line
                x1={0}
                y1={PAD_SIZE * ratio}
                x2={PAD_SIZE}
                y2={PAD_SIZE * ratio}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4,4"
              />
            </React.Fragment>
          ))}

          {/* Live Finger Crosshair Tracking Lines */}
          <Line
            x1={touchPos.x}
            y1={0}
            x2={touchPos.x}
            y2={PAD_SIZE}
            stroke="#00E5FF"
            strokeWidth={1}
            opacity={isHolding ? 0.8 : 0.3}
          />
          <Line
            x1={0}
            y1={touchPos.y}
            x2={PAD_SIZE}
            y2={touchPos.y}
            stroke="#A855F7"
            strokeWidth={1}
            opacity={isHolding ? 0.8 : 0.3}
          />

          {/* Touch Glowing Rings */}
          <Circle
            cx={touchPos.x}
            cy={touchPos.y}
            r={isHolding ? 28 : 18}
            fill="rgba(192, 132, 252, 0.3)"
            stroke="#C084FC"
            strokeWidth={2}
          />
          <Circle
            cx={touchPos.x}
            cy={touchPos.y}
            r={isHolding ? 10 : 7}
            fill="#FFF"
          />
        </Svg>

        {/* Floating Parameter Readout Tag */}
        <View style={[styles.floatingTag, { left: Math.min(PAD_SIZE - 120, Math.max(10, touchPos.x - 55)), top: Math.min(PAD_SIZE - 45, Math.max(10, touchPos.y - 45)) }]}>
          <Text style={styles.tagText}>
            {cutoffHz >= 1000 ? `${(cutoffHz / 1000).toFixed(1)} kHz` : `${cutoffHz} Hz`} • {resonanceWet}% Wet
          </Text>
        </View>
      </View>

      {/* Bottom Axis Labels */}
      <View style={styles.axisLabelsRow}>
        <Text style={styles.axisLabel}>◀ 20Hz Low Filter</Text>
        <Text style={[styles.axisLabel, { color: '#C084FC' }]}>X: Cutoff • Y: Resonance</Text>
        <Text style={styles.axisLabel}>20kHz High Air ▶</Text>
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
    borderColor: 'rgba(168, 85, 247, 0.25)',
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  liveGlowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  liveGlowDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowRadius: 6,
    shadowOpacity: 1,
  },
  liveBadgeText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '800',
  },
  subText: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  padBox: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    position: 'relative',
  },
  floatingTag: {
    position: 'absolute',
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E5FF',
    pointerEvents: 'none',
  },
  tagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  axisLabelsRow: {
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

export default TouchKaossPad;
