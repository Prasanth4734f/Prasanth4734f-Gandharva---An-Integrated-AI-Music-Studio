import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Zap, Music } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playGuitarNote } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 6 GUITAR STRINGS (Standard EADGBE Tuning)
const GUITAR_STRINGS = [
  { stringNum: 1, name: 'E4 (High E)', note: 'E4', gauge: 1.5, color: '#E2E8F0' },
  { stringNum: 2, name: 'B3 (B String)', note: 'B3', gauge: 2.0, color: '#CBD5E1' },
  { stringNum: 3, name: 'G3 (G String)', note: 'G3', gauge: 2.5, color: '#FCD34D' },
  { stringNum: 4, name: 'D3 (D String)', note: 'D3', gauge: 3.0, color: '#F59E0B' },
  { stringNum: 5, name: 'A2 (A String)', note: 'A2', gauge: 3.8, color: '#B45309' },
  { stringNum: 6, name: 'E2 (Low E)', note: 'E2', gauge: 4.6, color: '#78350F' },
];

// CHORD STRUM PRESETS
const GUITAR_CHORDS = [
  { name: 'C Major', notes: ['C3', 'E3', 'G3', 'C4', 'E4'], color: '#38BDF8' },
  { name: 'G Major', notes: ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'], color: '#34D399' },
  { name: 'A Minor', notes: ['A2', 'E3', 'A3', 'C4', 'E4'], color: '#A78BFA' },
  { name: 'E Minor', notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], color: '#F472B6' },
  { name: 'D Major', notes: ['D3', 'A3', 'D4', 'F#4'], color: '#FB923C' },
  { name: 'F Major', notes: ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'], color: '#F87171' },
  { name: 'D Minor', notes: ['D3', 'A3', 'D4', 'F4'], color: '#FBBF24' },
  { name: 'E Major', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], color: '#4ADE80' },
];

const FRETS = [0, 1, 2, 3, 4, 5, 7, 9, 12];

export default function GuitarStudioScreen({ navigation }) {
  const [guitarMode, setGuitarMode] = useState('acoustic'); // 'acoustic' | 'electric'
  const [selectedFret, setSelectedFret] = useState(0);
  const [activeString, setActiveString] = useState(null);
  const [activeChord, setActiveChord] = useState(null);
  const [strumSpeed, setStrumSpeed] = useState(40); // ms delay between strings
  const [showInfoModal, setShowInfoModal] = useState(false);

  const strumChord = (chord) => {
    setActiveChord(chord.name);
    chord.notes.forEach((note, idx) => {
      setTimeout(() => {
        playGuitarNote(note, guitarMode, 2.5);
      }, idx * strumSpeed);
    });
    setTimeout(() => setActiveChord(null), chord.notes.length * strumSpeed + 200);
  };

  const pluckString = (str) => {
    setActiveString(str.stringNum);
    // Apply Fret Offset
    const semitoneOffset = selectedFret;
    playGuitarNote(str.note, guitarMode, 2.0);
    setTimeout(() => setActiveString(null), 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0806' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎸 Guitar Studio</Text>
            <Text style={styles.subtitle}>Acoustic & Overdrive Fretboard</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#F59E0B" size={16} />
            <Text style={styles.infoBtnText}>Anatomy & Lore</Text>
          </TouchableOpacity>
        </View>

        {/* Tone Selector: Acoustic vs Electric */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, guitarMode === 'acoustic' && styles.modeTabActive]}
            onPress={() => setGuitarMode('acoustic')}
          >
            <Text style={[styles.modeTabText, guitarMode === 'acoustic' && styles.modeTabTextActive]}>
              🌲 Acoustic Pluck
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, guitarMode === 'electric' && styles.modeTabActiveElectric]}
            onPress={() => setGuitarMode('electric')}
          >
            <Zap color={guitarMode === 'electric' ? '#000' : '#FF9F0A'} size={14} />
            <Text style={[styles.modeTabText, guitarMode === 'electric' && styles.modeTabTextActive]}>
              ⚡ Electric Overdrive
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1-Tap Chord Strumming Rack */}
        <Text style={styles.sectionHeading}>1-Tap Chord Strummer</Text>
        <View style={styles.chordsGrid}>
          {GUITAR_CHORDS.map((chord) => {
            const isPlaying = activeChord === chord.name;
            return (
              <TouchableOpacity
                key={chord.name}
                style={[
                  styles.chordCard,
                  isPlaying && { borderColor: chord.color, backgroundColor: `${chord.color}25` },
                ]}
                onPress={() => strumChord(chord)}
              >
                <Text style={[styles.chordName, { color: chord.color }]}>{chord.name}</Text>
                <Text style={styles.chordNotesText}>{chord.notes.join(' • ')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fretboard Fret Selector */}
        <Text style={styles.sectionHeading}>
          Fret Position: {selectedFret === 0 ? 'Open (Nut)' : `Fret ${selectedFret}`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {FRETS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.fretPill, selectedFret === f && styles.fretPillActive]}
              onPress={() => setSelectedFret(f)}
            >
              <Text style={[styles.fretPillText, selectedFret === f && styles.fretPillTextActive]}>
                {f === 0 ? 'Open' : `Fret ${f}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interactive Playable 6-String Fretboard */}
        <Text style={styles.sectionHeading}>Interactive 6-String Fretboard (Tap to Pluck)</Text>
        <View style={styles.fretboardWood}>
          {GUITAR_STRINGS.map((str) => {
            const isPlucked = activeString === str.stringNum;
            return (
              <TouchableOpacity
                key={str.stringNum}
                activeOpacity={0.7}
                style={styles.stringLane}
                onPress={() => pluckString(str)}
              >
                <View style={styles.stringLabelBox}>
                  <Text style={styles.stringLabel}>{str.name}</Text>
                </View>

                {/* Metal Wire String Visual */}
                <View style={styles.stringWireWrapper}>
                  <View
                    style={[
                      styles.stringWire,
                      {
                        height: str.gauge,
                        backgroundColor: isPlucked ? '#F59E0B' : str.color,
                        shadowColor: isPlucked ? '#F59E0B' : 'transparent',
                        shadowOpacity: isPlucked ? 0.8 : 0,
                        shadowRadius: 6,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.pluckBadge, isPlucked && styles.pluckBadgeActive]}>
                  <Text style={styles.pluckBadgeText}>{isPlucked ? 'VIBRATING' : 'PLUCK'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Strum Speed Setting */}
        <View style={styles.strumSpeedCard}>
          <Text style={styles.strumSpeedLabel}>Strumming Speed: {strumSpeed}ms</Text>
          <Slider
            value={strumSpeed}
            minimumValue={15}
            maximumValue={100}
            step={5}
            onValueChange={setStrumSpeed}
            minimumTrackTintColor="#F59E0B"
            maximumTrackTintColor="#333"
            thumbTintColor="#F59E0B"
          />
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* GUITAR ENCYCLOPEDIA & ANATOMY MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🎸 Guitar Anatomy & Science</Text>
                <Text style={styles.modalSubtitle}>Acoustics, Frequency Spectrum & Playing Styles</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. String Frequency Spectrum & Tuning</Text>
              <Text style={styles.infoBody}>
                Standard Spanish/Modern guitar uses 6 strings tuned in 4ths with one major 3rd:
                {'\n'}• 6th String (E2): 82.41 Hz (Deep bass foundation)
                {'\n'}• 5th String (A2): 110.00 Hz
                {'\n'}• 4th String (D3): 146.83 Hz
                {'\n'}• 3rd String (G3): 196.00 Hz (Warm middle resonance)
                {'\n'}• 2nd String (B3): 246.94 Hz
                {'\n'}• 1st String (E4): 329.63 Hz (High lead melodies)
              </Text>

              <Text style={styles.infoSectionTitle}>2. Acoustic Resonance vs Electric Overdrive</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Acoustic Guitar:</Text> Relies on the spruce soundboard top and hollow body air cavity (Helmholtz resonance) to naturally project standing soundwaves.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Electric Guitar:</Text> Uses electromagnetic wire-wound pickups to convert string vibrations into AC current, driven through tube amplifier saturation for heavy sustain.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Core Playing Techniques</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#38BDF8' }}>Hammer-on & Pull-off:</Text> Fretting without picking for rapid legato runs.
                {'\n'}• <Text style={{ color: '#38BDF8' }}>Fingerpicking:</Text> Plucking individual bass and treble strings with thumb and fingers (P-I-M-A).
                {'\n'}• <Text style={{ color: '#38BDF8' }}>Natural Harmonics:</Text> Touching string nodes at frets 5, 7, and 12 for chime-like bell tones.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F59E0B',
    fontSize: 11,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  infoBtnText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    borderRadius: 12,
    marginBottom: 18,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#78350F',
  },
  modeTabActiveElectric: {
    backgroundColor: '#FF9F0A',
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFF',
  },
  sectionHeading: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  chordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chordCard: {
    width: '23%',
    backgroundColor: '#1E1610',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chordName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  chordNotesText: {
    color: '#94A3B8',
    fontSize: 8,
  },
  fretPill: {
    backgroundColor: '#1E1610',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3E2718',
  },
  fretPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  fretPillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  fretPillTextActive: {
    color: '#000',
  },
  fretboardWood: {
    backgroundColor: '#1A120B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#45220C',
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  stringLane: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  stringLabelBox: {
    width: 90,
  },
  stringLabel: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  stringWireWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  stringWire: {
    borderRadius: 2,
  },
  pluckBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  pluckBadgeActive: {
    backgroundColor: '#F59E0B',
  },
  pluckBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  strumSpeedCard: {
    backgroundColor: '#1E1610',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3E2718',
  },
  strumSpeedLabel: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1A120B',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#F59E0B',
    fontSize: 11,
    marginTop: 2,
  },
  infoSectionTitle: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  infoBody: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
  },
});
