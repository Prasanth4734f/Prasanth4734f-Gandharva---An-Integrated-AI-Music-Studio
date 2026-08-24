import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { Waves, Compass, RotateCw, Sparkles, Volume2 } from 'lucide-react-native';

export const Spatial3DPanner = ({
  activeStem = 'vocals',
  posX = 0.0, // -1.0 to 1.0 (Left/Right)
  posY = 0.5, // -1.0 to 1.0 (Rear/Front)
  posZ = 0.2, // 0.0 to 1.0 (Height/Overhead)
  onPositionChange,
  accentColor = '#A855F7',
}) => {
  const [coords, setCoords] = useState({ x: posX, y: posY, z: posZ });
  const [surroundMode, setSurroundMode] = useState('5.1'); // 'Binaural 3D' | '5.1' | 'Dolby Atmos'

  const updateCoord = (key, val) => {
    const updated = { ...coords, [key]: val };
    setCoords(updated);
    if (onPositionChange) onPositionChange(updated);
  };

  // Convert normalized -1..1 to SVG circle coordinates
  const radius = 70;
  const centerX = 80;
  const centerY = 80;
  const dotX = centerX + coords.x * (radius - 12);
  const dotY = centerY - coords.y * (radius - 12);

  const speakerNodes = [
    { label: 'FL', x: centerX - 50, y: centerY - 50, color: '#38BDF8' },
    { label: 'C', x: centerX, y: centerY - 60, color: '#FF3366' },
    { label: 'FR', x: centerX + 50, y: centerY - 50, color: '#38BDF8' },
    { label: 'SL', x: centerX - 55, y: centerY + 20, color: '#8B5CF6' },
    { label: 'SR', x: centerX + 55, y: centerY + 20, color: '#8B5CF6' },
    { label: 'LFE', x: centerX, y: centerY + 45, color: '#FF9F0A' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Waves color="#C084FC" size={16} />
          <Text style={styles.headerTitle}>3D SPATIAL & SURROUND PANNER</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modesRow}>
          {['Binaural 3D', '5.1 Film', 'Dolby Atmos'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeBtn, surroundMode === mode && styles.modeBtnActive]}
              onPress={() => setSurroundMode(mode)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeText, surroundMode === mode && styles.modeTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bodyRow}>
        {/* SVG 3D Radar Circle */}
        <View style={styles.radarBox}>
          <Svg width={160} height={160}>
            {/* Outer Boundary Circles */}
            <Circle cx={centerX} cy={centerY} r={radius} stroke="rgba(168, 85, 247, 0.4)" strokeWidth={1.5} fill="#0A0C16" />
            <Circle cx={centerX} cy={centerY} r={radius * 0.65} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={1} fill="transparent" />
            <Circle cx={centerX} cy={centerY} r={radius * 0.3} stroke="rgba(255, 255, 255, 0.08)" strokeWidth={1} fill="transparent" />

            {/* Crosshairs */}
            <Line x1={centerX - radius} y1={centerY} x2={centerX + radius} y2={centerY} stroke="rgba(255, 255, 255, 0.12)" strokeWidth={1} />
            <Line x1={centerX} y1={centerY - radius} x2={centerX} y2={centerY + radius} stroke="rgba(255, 255, 255, 0.12)" strokeWidth={1} />

            {/* Speaker Node Indicators */}
            {speakerNodes.map((s, idx) => (
              <G key={idx}>
                <Circle cx={s.x} cy={s.y} r={7} fill={`${s.color}30`} stroke={s.color} strokeWidth={1} />
                <SvgText x={s.x} y={s.y + 3} fill="#FFF" fontSize="6" fontWeight="bold" textAnchor="middle">
                  {s.label}
                </SvgText>
              </G>
            ))}

            {/* Listener Position (Head Center) */}
            <Circle cx={centerX} cy={centerY} r={5} fill="#64748B" />

            {/* Current Active Stem Panned Object */}
            <Circle cx={dotX} cy={dotY} r={10} fill="#C084FC" />
            <Circle cx={dotX} cy={dotY} r={14} stroke="#FFF" strokeWidth={1.5} fill="transparent" />
          </Svg>
        </View>

        {/* Spatial Coordinate Sliders */}
        <View style={styles.slidersCol}>
          {/* X Pan (Left/Right) */}
          <View style={styles.sliderBox}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Pan (L/R)</Text>
              <Text style={styles.sliderVal}>
                {coords.x === 0 ? 'Center' : coords.x < 0 ? `L${Math.round(Math.abs(coords.x) * 100)}` : `R${Math.round(coords.x * 100)}`}
              </Text>
            </View>
            <Slider
              value={coords.x}
              minimumValue={-1.0}
              maximumValue={1.0}
              step={0.05}
              onValueChange={(v) => updateCoord('x', v)}
              minimumTrackTintColor="#38BDF8"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#FFF"
              style={{ height: 24 }}
            />
          </View>

          {/* Y Depth (Front/Rear) */}
          <View style={styles.sliderBox}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Depth (Rear/Front)</Text>
              <Text style={styles.sliderVal}>
                {coords.y === 0 ? 'Middle' : coords.y > 0 ? `Front ${Math.round(coords.y * 100)}%` : `Rear ${Math.round(Math.abs(coords.y) * 100)}%`}
              </Text>
            </View>
            <Slider
              value={coords.y}
              minimumValue={-1.0}
              maximumValue={1.0}
              step={0.05}
              onValueChange={(v) => updateCoord('y', v)}
              minimumTrackTintColor="#A855F7"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#FFF"
              style={{ height: 24 }}
            />
          </View>

          {/* Z Height (Overhead Atmos) */}
          <View style={styles.sliderBox}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Height (Overhead)</Text>
              <Text style={styles.sliderVal}>{Math.round(coords.z * 100)}%</Text>
            </View>
            <Slider
              value={coords.z}
              minimumValue={0.0}
              maximumValue={1.0}
              step={0.05}
              onValueChange={(v) => updateCoord('z', v)}
              minimumTrackTintColor="#FF9F0A"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#FFF"
              style={{ height: 24 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121526',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  modesRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 2,
    borderRadius: 8,
    gap: 2,
  },
  modeBtn: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  modeBtnActive: {
    backgroundColor: '#A855F7',
  },
  modeText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  modeTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radarBox: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slidersCol: {
    flex: 1,
    gap: 6,
  },
  sliderBox: {
    marginBottom: 2,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  sliderLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  sliderVal: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default Spatial3DPanner;
