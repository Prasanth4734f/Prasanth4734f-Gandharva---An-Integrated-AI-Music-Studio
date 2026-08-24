import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { ChevronLeft, Music, Mic, Sparkles, Disc, Sliders, Volume2, Radio, Activity, Bookmark, Layers } from 'lucide-react-native';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const instruments = [
  {
    id: 'piano',
    name: 'Grand Piano',
    description: '88-Key touch synthesizer with interactive notes, chords & live recorder.',
    icon: <Music color="#DB2777" size={26} />,
    bgColor: '#FDF2F8',
    borderColor: '#DB2777',
    route: 'PianoStudio'
  },
  {
    id: 'flute',
    name: 'Bansuri Flute',
    description: 'Expressive Indian Bansuri flute with Swara notes & smooth slide.',
    icon: <Mic color="#2563EB" size={26} />,
    bgColor: '#EFF6FF',
    borderColor: '#2563EB',
    route: 'FluteStudio'
  },
  {
    id: 'drums',
    name: 'MPC Drum Pad',
    description: '16-Pad drum sampler with beat sequencer, tempo tap & kit presets.',
    icon: <Disc color="#059669" size={26} />,
    bgColor: '#ECFDF5',
    borderColor: '#059669',
    route: 'DrumStudio'
  },
  {
    id: 'guitar',
    name: 'Acoustic Guitar',
    description: 'Strumming & fingerpicking guitar studio with chord pads & capo.',
    icon: <Volume2 color="#D97706" size={26} />,
    bgColor: '#FEFCE8',
    borderColor: '#D97706',
    route: 'GuitarStudio'
  },
  {
    id: 'synth',
    name: 'Analog Synthesizer',
    description: 'Cyberpunk polyphonic synth with filter sweep, arpeggiator & LFO.',
    icon: <Radio color="#7C3AED" size={26} />,
    bgColor: '#F3E8FF',
    borderColor: '#7C3AED',
    route: 'SynthStudio'
  },
  {
    id: 'organ',
    name: 'Church & Jazz Organ',
    description: 'Vintage Hammond organ with drawbar sliders & rotary Leslie speaker.',
    icon: <Sliders color="#9333EA" size={26} />,
    bgColor: '#FAF5FF',
    borderColor: '#9333EA',
    route: 'OrganStudio'
  },
  {
    id: 'bass',
    name: 'Sub Bass Synth',
    description: 'Heavy 808 & synth bass generator with sub-frequency controls.',
    icon: <Activity color="#DC2626" size={26} />,
    bgColor: '#FEF2F2',
    borderColor: '#DC2626',
    route: 'BassStudio'
  },
  {
    id: 'violin',
    name: 'Solo Orchestral Violin',
    description: 'Authentic orchestral violin with bow pressure & expression slider.',
    icon: <Music color="#4F46E5" size={26} />,
    bgColor: '#EEF2FF',
    borderColor: '#4F46E5',
    route: 'ViolinStudio'
  },
  {
    id: 'saxophone',
    name: 'Alto Saxophone',
    description: 'Smooth jazz alto saxophone with vibrato & breath dynamics.',
    icon: <Mic color="#EA580C" size={26} />,
    bgColor: '#FFF7ED',
    borderColor: '#EA580C',
    route: 'SaxophoneStudio'
  },
  {
    id: 'sitar',
    name: 'Classical Sitar',
    description: 'Traditional Sitar studio with Chikari strings, Raaga tuning & drone.',
    icon: <Layers color="#0891B2" size={26} />,
    bgColor: '#ECFEFF',
    borderColor: '#0891B2',
    route: 'SitarStudio'
  },
  {
    id: 'recordings',
    name: 'Saved Studio Recordings',
    description: 'Manage & re-export all recorded live instrument sessions.',
    icon: <Bookmark color="#059669" size={26} />,
    bgColor: '#F0FDF4',
    borderColor: '#059669',
    route: 'RecordingLibrary'
  }
];

export default function LiveStudioHomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'web' ? 16 : 40 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#111827" size={22} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Title */}
        <View style={styles.heroSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.title}>PlayGround Live Studio</Text>
            <Sparkles color="#DB2777" size={24} />
          </View>
          <Text style={styles.subtitle}>
            10+ Interactive virtual instrument suites for live performance, recording & sound synthesis.
          </Text>
        </View>

        {/* Instruments Grid (Rows x 2 Cols) */}
        <View style={styles.instrumentsContainer}>
          {instruments.map((inst) => (
            <TouchableOpacity
              key={inst.id}
              style={[
                styles.instrumentCard,
                { 
                  backgroundColor: inst.bgColor, 
                  borderColor: inst.borderColor,
                }
              ]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(inst.route)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  {inst.icon}
                </View>
                <Text style={styles.playTag}>Open →</Text>
              </View>

              <Text style={styles.instrumentName} numberOfLines={1}>{inst.name}</Text>
              <Text style={styles.instrumentDesc} numberOfLines={3}>{inst.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backText: {
    color: '#111827',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  heroSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  instrumentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  instrumentCard: {
    width: '48.5%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  playTag: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
  instrumentName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  instrumentDesc: {
    color: '#4B5563',
    fontSize: 11.5,
    lineHeight: 16,
  },
});
