import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Sliders, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = Math.min(width - 48, 340);
const GRAPH_HEIGHT = 160;

export const TouchParametricEQ = ({
  bands = [
    { id: 'sub', label: '60Hz', freq: 60, gain: 0, color: '#C084FC', x: 0.15 },
    { id: 'bass', label: '250Hz', freq: 250, gain: 0, color: '#FF9F0A', x: 0.32 },
    { id: 'mid', label: '1kHz', freq: 1000, gain: 0, color: '#38BDF8', x: 0.52 },
    { id: 'presence', label: '4kHz', freq: 4000, gain: 0, color: '#34D399', x: 0.72 },
    { id: 'air', label: '12kHz', freq: 12000, gain: 0, color: '#F472B6', x: 0.88 },
  ],
  onBandsChange,
}) => {
  const [eqNodes, setEqNodes] = useState(bands);
  const [activeNodeId, setActiveNodeId] = useState(null);

  const gainToY = (gainDb) => {
    // gainDb: -12 to +12
    const normalized = (-gainDb + 12) / 24; // 0 to 1
    return 16 + normalized * (GRAPH_HEIGHT - 32);
  };

  const yToGain = (yPos) => {
    const clampedY = Math.max(16, Math.min(GRAPH_HEIGHT - 16, yPos));
    const normalized = (clampedY - 16) / (GRAPH_HEIGHT - 32);
    return Math.round(12 - normalized * 24);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        // Find closest node within 40px
        let closest = null;
        let minDist = 45;
        eqNodes.forEach((node) => {
          const nodeX = node.x * GRAPH_WIDTH;
          const nodeY = gainToY(node.gain);
          const dist = Math.hypot(nodeX - locationX, nodeY - locationY);
          if (dist < minDist) {
            minDist = dist;
            closest = node;
          }
        });

        if (closest) {
          setActiveNodeId(closest.id);
          const newGain = yToGain(locationY);
          const updated = eqNodes.map((n) => (n.id === closest.id ? { ...n, gain: newGain } : n));
          setEqNodes(updated);
          if (onBandsChange) onBandsChange(updated);
        }
      },
      onPanResponderMove: (evt) => {
        if (!activeNodeId) return;
        const { locationY } = evt.nativeEvent;
        const newGain = yToGain(locationY);
        const updated = eqNodes.map((n) => (n.id === activeNodeId ? { ...n, gain: newGain } : n));
        setEqNodes(updated);
        if (onBandsChange) onBandsChange(updated);
      },
      onPanResponderRelease: () => {
        setActiveNodeId(null);
      },
    })
  ).current;

  // Build SVG cubic bezier path through the 5 nodes
  const pathD = useMemo(() => {
    const pts = [
      { x: 0, y: GRAPH_HEIGHT / 2 },
      ...eqNodes.map((n) => ({ x: n.x * GRAPH_WIDTH, y: gainToY(n.gain) })),
      { x: GRAPH_WIDTH, y: GRAPH_HEIGHT / 2 },
    ];

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [eqNodes]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Sliders color="#C084FC" size={16} />
          <Text style={styles.headerTitle}>REAL-TIME TOUCH PARAMETRIC EQ GRAPH</Text>
        </View>
        <Text style={styles.hintText}>Touch & drag glowing nodes</Text>
      </View>

      {/* SVG Interactive EQ Graph Canvas */}
      <View style={[styles.graphBox, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT }]} {...panResponder.panHandlers}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="eqFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#C084FC" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#00E5FF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#0A0C16" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>

          {/* Grid Lines */}
          <Line x1={0} y1={16} x2={GRAPH_WIDTH} y2={16} stroke="rgba(255, 255, 255, 0.05)" />
          <Line x1={0} y1={GRAPH_HEIGHT / 2} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT / 2} stroke="rgba(255, 255, 255, 0.15)" strokeWidth={1} strokeDasharray="3,3" />
          <Line x1={0} y1={GRAPH_HEIGHT - 16} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT - 16} stroke="rgba(255, 255, 255, 0.05)" />

          {/* Grid dB Labels */}
          <SvgText x={6} y={22} fill="#64748B" fontSize="8" fontWeight="bold">+12 dB</SvgText>
          <SvgText x={6} y={GRAPH_HEIGHT / 2 + 3} fill="#64748B" fontSize="8" fontWeight="bold">0 dB</SvgText>
          <SvgText x={6} y={GRAPH_HEIGHT - 8} fill="#64748B" fontSize="8" fontWeight="bold">-12 dB</SvgText>

          {/* Interactive EQ Curve Path */}
          <Path d={`${pathD} L ${GRAPH_WIDTH} ${GRAPH_HEIGHT} L 0 ${GRAPH_HEIGHT} Z`} fill="url(#eqFillGrad)" />
          <Path d={pathD} stroke="#00E5FF" strokeWidth={2.5} fill="transparent" />

          {/* 5 Touch Grab Nodes */}
          {eqNodes.map((node) => {
            const nodeX = node.x * GRAPH_WIDTH;
            const nodeY = gainToY(node.gain);
            const isGrabbed = activeNodeId === node.id;

            return (
              <React.Fragment key={node.id}>
                {/* Outer Touch Ring */}
                <Circle cx={nodeX} cy={nodeY} r={isGrabbed ? 16 : 10} fill={`${node.color}30`} stroke={node.color} strokeWidth={1.5} />
                {/* Center Solid Grab Dot */}
                <Circle cx={nodeX} cy={nodeY} r={4} fill="#FFF" />
                {/* Node Frequency & Gain Tag */}
                <SvgText x={nodeX} y={nodeY - 14} fill={node.color} fontSize="8" fontWeight="bold" textAnchor="middle">
                  {node.gain > 0 ? `+${node.gain}` : node.gain} dB
                </SvgText>
                <SvgText x={nodeX} y={GRAPH_HEIGHT - 4} fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="middle">
                  {node.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
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
    marginBottom: 8,
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
  hintText: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '700',
  },
  graphBox: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0A0C16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default TouchParametricEQ;
