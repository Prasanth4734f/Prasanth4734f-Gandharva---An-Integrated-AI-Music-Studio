import React, { useState } from 'react';
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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Sliders, Activity, Zap } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playSynthWave } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 2-OCTAVE SYNTH KEYBOARD
const SYNTH_KEYS = [
  { note: 'C4', isBlack: false, label: 'C4' },
  { note: 'C#4', isBlack: true, label: 'C#' },
  { note: 'D4', isBlack: false, label: 'D4' },
  { note: 'D#4', isBlack: true, label: 'D#' },
  { note: 'E4', isBlack: false, label: 'E4' },
  { note: 'F4', isBlack: false, label: 'F4' },
  { note: 'F#4', isBlack: true, label: 'F#' },
  { note: 'G4', isBlack: false, label: 'G4' },
  { note: 'G#4', isBlack: true, label: 'G#' },
  { note: 'A4', isBlack: false, label: 'A4' },
  { note: 'A#4', isBlack: true, label: 'A#' },
  { note: 'B4', isBlack: false, label: 'B4' },
  { note: 'C5', isBlack: false, label: 'C5' },
  { note: 'C#5', isBlack: true, label: 'C#' },
  { note: 'D5', isBlack: false, label: 'D5' },
  { note: 'D#5', isBlack: true, label: 'D#' },
  { note: 'E5', isBlack: false, label: 'E5' },
  { note: 'F5', isBlack: false, label: 'F5' },
  { note: 'F#5', isBlack: true, label: 'F#' },
  { note: 'G5', isBlack: false, label: 'G5' },
  { note: 'G#5', isBlack: true, label: 'G#' },
  { note: 'A5', isBlack: false, label: 'A5' },
  { note: 'A#5', isBlack: true, label: 'A#' },
  { note: 'B5', isBlack: false, label: 'B5' },
  { note: 'C6', isBlack: false, label: 'C6' },
];

const OSCILLATORS = [
  { type: 'sawtooth', name: '🪚 Sawtooth', desc: 'Buzzy, bright & rich' },
  { type: 'square', name: '⬛ Square', desc: 'Hollow, retro 8-bit' },
  { type: 'sine', name: '〰️ Sine', desc: 'Pure fundamental' },
  { type: 'triangle', name: '🔺 Triangle', desc: 'Soft flute-like warmth' },
];

export default function SynthStudioScreen({ navigation }) {
  const [oscType, setOscType] = useState('sawtooth');
  const [cutoffFreq, setCutoffFreq] = useState(2400);
  const [activeKey, setActiveKey] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const triggerKey = (note) => {
    setActiveKey(note);
    playSynthWave(note, oscType, cutoffFreq, 1.8);
    setTimeout(() => setActiveKey(null), 250);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#070B14' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎹 Synthesizer & Electronic Studio</Text>
            <Text style={styles.subtitle}>Subtractive Synthesis & Lowpass Filters</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#38BDF8" size={16} />
            <Text style={styles.infoBtnText}>Anatomy</Text>
          </TouchableOpacity>
        </View>

        {/* Oscillator Waveform Selector */}
        <Text style={styles.sectionTitle}>Waveform Oscillator Engine</Text>
        <View style={styles.oscRow}>
          {OSCILLATORS.map((osc) => (
            <TouchableOpacity
              key={osc.type}
              style={[styles.oscCard, oscType === osc.type && styles.oscCardActive]}
              onPress={() => setOscType(osc.type)}
            >
              <Text style={[styles.oscName, oscType === osc.type && styles.oscNameActive]}>
                {osc.name}
              </Text>
              <Text style={styles.oscDesc}>{osc.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lowpass Filter Cutoff Slider */}
        <View style={styles.filterCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.filterTitle}>24dB Lowpass Filter Cutoff</Text>
            <Text style={styles.filterVal}>{cutoffFreq} Hz</Text>
          </View>
          <Slider
            value={cutoffFreq}
            minimumValue={200}
            maximumValue={8000}
            step={50}
            onValueChange={setCutoffFreq}
            minimumTrackTintColor="#38BDF8"
            maximumTrackTintColor="#1E293B"
            thumbTintColor="#38BDF8"
          />
        </View>

        {/* Chromatic Piano Keyboard */}
        <Text style={styles.sectionTitle}>25-Key Polyphonic Synthesizer Keyboard</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.keyboardScroll}>
          <View style={styles.keyboardContainer}>
            {SYNTH_KEYS.map((k) => {
              const isPressed = activeKey === k.note;
              if (k.isBlack) {
                return (
                  <TouchableOpacity
                    key={k.note}
                    style={[styles.blackKey, isPressed && styles.blackKeyActive]}
                    onPress={() => triggerKey(k.note)}
                  >
                    <Text style={styles.blackKeyText}>{k.label}</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={k.note}
                  style={[styles.whiteKey, isPressed && styles.whiteKeyActive]}
                  onPress={() => triggerKey(k.note)}
                >
                  <Text style={styles.whiteKeyText}>{k.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

      </ScrollView>

      {/* ========================================================= */}
      {/* SYNTHESIZER SCIENCE & ANATOMY MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🎹 Synthesizer Science & Architecture</Text>
                <Text style={styles.modalSubtitle}>Subtractive Synthesis, Harmonic Spectrum & VCF Filters</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. Subtractive Synthesis Architecture</Text>
              <Text style={styles.infoBody}>
                Pioneered by <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Bob Moog</Text>, subtractive synthesis starts with harmonically dense waveforms and subtracts frequencies using Voltage-Controlled Filters (VCF).
              </Text>

              <Text style={styles.infoSectionTitle}>2. Harmonic Profiles of Core Waveforms</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Sawtooth:</Text> Contains ALL integer harmonics (1/1, 1/2, 1/3, 1/4...). Ideal for bright leads, brass, and thick string pads.
                {'\n'}• <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Square / Pulse:</Text> Contains only ODD harmonics (1, 3, 5, 7...). Produces hollow clarinet and vintage 8-bit video game sounds.
                {'\n'}• <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Triangle / Sine:</Text> Soft fundamental energy with minimal upper overtones for pure sub-bass and flute tones.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Envelope Generators (ADSR)</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#A78BFA' }}>Attack:</Text> How quickly the note reaches full volume.
                {'\n'}• <Text style={{ color: '#A78BFA' }}>Decay:</Text> Fall from peak to sustained level.
                {'\n'}• <Text style={{ color: '#A78BFA' }}>Sustain:</Text> Held amplitude while key is down.
                {'\n'}• <Text style={{ color: '#A78BFA' }}>Release:</Text> Fadeout time after releasing the key.
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
    color: '#38BDF8',
    fontSize: 11,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  infoBtnText: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  oscRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  oscCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
  },
  oscCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  oscName: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  oscNameActive: {
    color: '#FFF',
  },
  oscDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  filterTitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  filterVal: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  keyboardScroll: {
    paddingVertical: 8,
  },
  keyboardContainer: {
    flexDirection: 'row',
    height: 160,
    backgroundColor: '#000',
    padding: 4,
    borderRadius: 12,
  },
  whiteKey: {
    width: 44,
    height: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    marginRight: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  whiteKeyActive: {
    backgroundColor: '#38BDF8',
  },
  whiteKeyText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  blackKey: {
    width: 28,
    height: 100,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    marginLeft: -14,
    marginRight: -14,
    zIndex: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  blackKeyActive: {
    backgroundColor: '#0284C7',
  },
  blackKeyText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
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
    backgroundColor: '#0B132B',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
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
    color: '#38BDF8',
    fontSize: 11,
    marginTop: 2,
  },
  infoSectionTitle: {
    color: '#7DD3FC',
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
