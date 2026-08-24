import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { Sparkles, Building, Landmark, Compass, Disc, Shield } from 'lucide-react-native';

export const ConvolutionReverb = ({
  onSpaceChange,
  accentColor = '#A855F7',
}) => {
  const [selectedSpace, setSelectedSpace] = useState('abbey_road');
  const [predelay, setPredelay] = useState(25); // ms
  const [decayTime, setDecayTime] = useState(2.8); // s
  const [mixWet, setMixWet] = useState(35); // %
  const [highDamp, setHighDamp] = useState(40); // %

  const spaces = [
    {
      id: 'abbey_road',
      name: '🏛️ Abbey Road Scoring Stage',
      desc: 'Legendary symphonic hall with warm string bloom',
      decay: 2.8,
      predelay: 25,
      color: '#A855F7',
    },
    {
      id: 'cathedral',
      name: '⛪ Cathedral of St. Jude',
      desc: 'Massive sacred stone space for epic choir & brass',
      decay: 4.5,
      predelay: 40,
      color: '#EC4899',
    },
    {
      id: 'canyon',
      name: '🏜️ Desert Canyon Echo',
      desc: 'Vast outdoor landscape with natural slap reflections',
      decay: 3.4,
      predelay: 65,
      color: '#FF9F0A',
    },
    {
      id: 'foley',
      name: '🎬 Intimate ADR & Foley Booth',
      desc: 'Treated dead studio for crisp dialogue presence',
      decay: 0.7,
      predelay: 8,
      color: '#10B981',
    },
    {
      id: 'nebula',
      name: '🌌 Deep Space Hyper-Drone',
      desc: 'Infinite synthetic shimmer for sci-fi atmosphere',
      decay: 8.0,
      predelay: 80,
      color: '#38BDF8',
    },
  ];

  const handleSelectSpace = (space) => {
    setSelectedSpace(space.id);
    setDecayTime(space.decay);
    setPredelay(space.predelay);
    if (onSpaceChange) onSpaceChange(space);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Sparkles color="#C084FC" size={16} />
        <Text style={styles.headerTitle}>CONVOLUTION ACOUSTIC SCORING SPACES</Text>
      </View>

      {/* Acoustic Space Selector Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.spacesScroll}>
        {spaces.map((sp) => {
          const isSelected = selectedSpace === sp.id;
          return (
            <TouchableOpacity
              key={sp.id}
              style={[
                styles.spaceCard,
                isSelected && { borderColor: sp.color, backgroundColor: `${sp.color}15` },
              ]}
              onPress={() => handleSelectSpace(sp)}
              activeOpacity={0.8}
            >
              <Text style={[styles.spaceName, isSelected && { color: sp.color }]}>{sp.name}</Text>
              <Text style={styles.spaceDesc}>{sp.desc}</Text>
              <View style={styles.spaceBadgeRow}>
                <Text style={styles.spaceBadgeText}>Decay: {sp.decay}s</Text>
                <Text style={styles.spaceBadgeText}>Pre: {sp.predelay}ms</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Impulse Response Parameters */}
      <View style={styles.controlsGrid}>
        {/* Dry / Wet Mix */}
        <View style={styles.sliderBox}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Wet Scoring Mix</Text>
            <Text style={styles.sliderVal}>{mixWet}%</Text>
          </View>
          <Slider
            value={mixWet}
            minimumValue={0}
            maximumValue={100}
            step={1}
            onValueChange={setMixWet}
            minimumTrackTintColor="#C084FC"
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor="#FFF"
            style={{ height: 26 }}
          />
        </View>

        {/* Decay Time */}
        <View style={styles.sliderBox}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Decay Tail</Text>
            <Text style={[styles.sliderVal, { color: '#FF9F0A' }]}>{decayTime.toFixed(1)}s</Text>
          </View>
          <Slider
            value={decayTime}
            minimumValue={0.4}
            maximumValue={10.0}
            step={0.1}
            onValueChange={setDecayTime}
            minimumTrackTintColor="#FF9F0A"
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor="#FFF"
            style={{ height: 26 }}
          />
        </View>

        {/* Predelay */}
        <View style={styles.sliderBox}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Predelay Offset</Text>
            <Text style={[styles.sliderVal, { color: '#38BDF8' }]}>{predelay}ms</Text>
          </View>
          <Slider
            value={predelay}
            minimumValue={0}
            maximumValue={120}
            step={5}
            onValueChange={setPredelay}
            minimumTrackTintColor="#38BDF8"
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor="#FFF"
            style={{ height: 26 }}
          />
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
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  spacesScroll: {
    marginBottom: 12,
  },
  spaceCard: {
    width: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
    justifyContent: 'space-between',
  },
  spaceName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  spaceDesc: {
    color: '#94A3B8',
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 6,
  },
  spaceBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spaceBadgeText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
  },
  controlsGrid: {
    gap: 8,
  },
  sliderBox: {
    marginBottom: 2,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
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

export default ConvolutionReverb;
