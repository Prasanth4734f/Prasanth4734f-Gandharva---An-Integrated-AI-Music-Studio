import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Zap, Disc, Volume2, Flame } from 'lucide-react-native';

const DRUM_PADS = [
  { id: 'sub_boom', label: '💥 808 Sub Boom', sub: 'Sub Drop', color: '#FF3366', pitch: '32 Hz' },
  { id: 'taiko_hit', label: '🥁 Taiko Hit', sub: 'Cinematic Hit', color: '#FF9F0A', pitch: 'Punch' },
  { id: 'braam', label: '🎺 Brass Braam', sub: 'Trailer Horn', color: '#8B5CF6', pitch: 'Low Brass' },
  { id: 'strings_hit', label: '🎻 Strings Hit', sub: 'Staccato', color: '#00E5FF', pitch: 'Orchestral' },
  { id: 'snare', label: '⚡ Snare Crack', sub: 'Trap Rim', color: '#10B981', pitch: 'Tight' },
  { id: 'hihat', label: '🎩 Hat Roll', sub: '1/16 Hat', color: '#F472B6', pitch: 'Crisp' },
  { id: 'vocal_chop', label: '🎙️ Vocal Chop', sub: 'Air Shot', color: '#EC4899', pitch: 'Ethereal' },
  { id: 'riser_fx', label: '🌊 Cymbal Riser', sub: 'Downlifter', color: '#38BDF8', pitch: 'FX Sweep' },
];

export const TouchMPCPads = ({ onTriggerPad, accentColor = '#A855F7' }) => {
  const [activePadId, setActivePadId] = useState(null);
  const [lastTriggered, setLastTriggered] = useState('Tap any pad to trigger');

  const handlePressIn = (pad) => {
    setActivePadId(pad.id);
    setLastTriggered(`Triggered: ${pad.label}`);
    if (onTriggerPad) onTriggerPad(pad);
  };

  const handlePressOut = () => {
    setActivePadId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Disc color="#FF9F0A" size={16} />
          <Text style={styles.headerTitle}>REAL-TIME TOUCH MPC DRUM PADS</Text>
        </View>
        <Text style={styles.statusText}>{lastTriggered}</Text>
      </View>

      {/* 8 Drum Pads Grid */}
      <View style={styles.grid}>
        {DRUM_PADS.map((pad) => {
          const isActive = activePadId === pad.id;

          return (
            <TouchableOpacity
              key={pad.id}
              style={[
                styles.padCard,
                { borderColor: pad.color },
                isActive && {
                  backgroundColor: pad.color,
                  shadowColor: pad.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                  elevation: 8,
                },
              ]}
              onPressIn={() => handlePressIn(pad)}
              onPressOut={handlePressOut}
              activeOpacity={1}
            >
              <Text style={[styles.padLabel, isActive && { color: '#000', fontWeight: '900' }]}>
                {pad.label}
              </Text>
              <View style={styles.padFooter}>
                <Text style={[styles.padSub, isActive && { color: '#000' }]}>{pad.sub}</Text>
                <Text style={[styles.padPitch, isActive && { color: '#000' }]}>{pad.pitch}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  statusText: {
    color: '#FF9F0A',
    fontSize: 10,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  padCard: {
    width: '23%',
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 6,
    justifyContent: 'space-between',
  },
  padLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
  },
  padFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  padSub: {
    color: '#94A3B8',
    fontSize: 7,
    fontWeight: '700',
  },
  padPitch: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '800',
  },
});

export default TouchMPCPads;
