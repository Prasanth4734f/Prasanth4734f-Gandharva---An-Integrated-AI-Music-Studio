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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Disc, Sliders } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playOrganNote } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 8 DRAWBAR FOOTAGES
const DRAWBARS_CONFIG = [
  { footage: "16'", name: 'Sub-Octave', color: '#B91C1C', defaultVal: 8 },
  { footage: "8'", name: 'Principal (Unison)', color: '#FFFFFF', defaultVal: 8 },
  { footage: "5 1/3'", name: 'Quint (5th)', color: '#000000', defaultVal: 6 },
  { footage: "4'", name: 'Octave', color: '#FFFFFF', defaultVal: 8 },
  { footage: "2 2/3'", name: 'Nazard (12th)', color: '#000000', defaultVal: 0 },
  { footage: "2'", name: 'Blockflöte (15th)', color: '#FFFFFF', defaultVal: 4 },
  { footage: "1 3/5'", name: 'Tierce (17th)', color: '#000000', defaultVal: 0 },
  { footage: "1'", name: 'Sifflöte (22nd)', color: '#FFFFFF', defaultVal: 2 },
];

// ORGAN KEYS
const ORGAN_KEYS = [
  { note: 'C3', isBlack: false, label: 'C3' },
  { note: 'C#3', isBlack: true, label: 'C#' },
  { note: 'D3', isBlack: false, label: 'D3' },
  { note: 'D#3', isBlack: true, label: 'D#' },
  { note: 'E3', isBlack: false, label: 'E3' },
  { note: 'F3', isBlack: false, label: 'F3' },
  { note: 'F#3', isBlack: true, label: 'F#' },
  { note: 'G3', isBlack: false, label: 'G3' },
  { note: 'G#3', isBlack: true, label: 'G#' },
  { note: 'A3', isBlack: false, label: 'A3' },
  { note: 'A#3', isBlack: true, label: 'A#' },
  { note: 'B3', isBlack: false, label: 'B3' },
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
];

export default function OrganStudioScreen({ navigation }) {
  const [drawbars, setDrawbars] = useState([8, 8, 6, 8, 0, 4, 0, 2]);
  const [leslieRotaryFast, setLeslieRotaryFast] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const updateDrawbar = (index, val) => {
    const next = [...drawbars];
    next[index] = val;
    setDrawbars(next);
  };

  const triggerKey = (note) => {
    setActiveKey(note);
    playOrganNote(note, drawbars, 2.2);
    setTimeout(() => setActiveKey(null), 280);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0805' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>⛪ Cathedral Pipe Organ</Text>
            <Text style={styles.subtitle}>Harmonic Drawbars & Leslie Rotary Speaker</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#D97706" size={16} />
            <Text style={styles.infoBtnText}>Anatomy</Text>
          </TouchableOpacity>
        </View>

        {/* Leslie Rotary Speaker Toggle */}
        <TouchableOpacity
          style={[styles.leslieBtn, leslieRotaryFast && styles.leslieBtnActive]}
          onPress={() => setLeslieRotaryFast(!leslieRotaryFast)}
        >
          <Disc color={leslieRotaryFast ? '#000' : '#F59E0B'} size={18} />
          <Text style={[styles.leslieBtnText, leslieRotaryFast && { color: '#000' }]}>
            {leslieRotaryFast ? 'Leslie Speaker: TREMOLO (Fast)' : 'Leslie Speaker: CHORALE (Slow)'}
          </Text>
        </TouchableOpacity>

        {/* 8 Mechanical Drawbars */}
        <Text style={styles.sectionTitle}>8 Harmonic Pipe Drawbars</Text>
        <View style={styles.drawbarsContainer}>
          {DRAWBARS_CONFIG.map((db, idx) => (
            <View key={db.footage} style={styles.drawbarColumn}>
              <Text style={styles.drawbarVal}>{drawbars[idx]}</Text>
              <View style={styles.sliderVerticalWrapper}>
                <Slider
                  value={drawbars[idx]}
                  minimumValue={0}
                  maximumValue={8}
                  step={1}
                  onValueChange={(v) => updateDrawbar(idx, v)}
                  minimumTrackTintColor="#F59E0B"
                  maximumTrackTintColor="#3E2718"
                  thumbTintColor="#F59E0B"
                />
              </View>
              <Text style={styles.footageText}>{db.footage}</Text>
              <Text style={styles.drawbarName} numberOfLines={1}>{db.name}</Text>
            </View>
          ))}
        </View>

        {/* Dual-Octave Organ Keybed */}
        <Text style={styles.sectionTitle}>Dual-Octave Organ Keybed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.keyboardScroll}>
          <View style={styles.keyboardContainer}>
            {ORGAN_KEYS.map((k) => {
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
      {/* ORGAN ANATOMY & ACOUSTICS MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>⛪ Pipe Organ Anatomy & Science</Text>
                <Text style={styles.modalSubtitle}>Mechanical Drawbars, Flue Pipes & Additive Harmonics</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. Additive Harmonic Synthesis</Text>
              <Text style={styles.infoBody}>
                Long before electronic synthesizers, pipe organs pioneered <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Additive Synthesis</Text>. By combining different lengths of pipes (measured in traditional feet: 16', 8', 4', 2'...), players construct complex musical timbres.
              </Text>

              <Text style={styles.infoSectionTitle}>2. Drawbar Footage Ratios</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>16' Sub-Bass:</Text> Sounds one octave BELOW concert pitch for majestic rumble.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>8' Fundamental:</Text> Concert pitch unison (piano equivalence).
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>5 1/3' & 2 2/3':</Text> Mutation stops introducing fifths (harmonic 3) for reedy brightness.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>1' Sifflöte:</Text> 4 octaves above unison for soaring cathedral brilliance.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Leslie Rotary Doppler Effect</Text>
              <Text style={styles.infoBody}>
                The Leslie speaker employs rotating horns and acoustic baffles, creating continuous <Text style={{ color: '#38BDF8' }}>Doppler frequency shifts, amplitude tremolo, and spatial phase chorus</Text>.
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
    color: '#D97706',
    fontSize: 11,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: '#D97706',
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
  leslieBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E120A',
    borderWidth: 1.2,
    borderColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  leslieBtnActive: {
    backgroundColor: '#F59E0B',
  },
  leslieBtnText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  drawbarsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A0E07',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D1D0E',
    padding: 12,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  drawbarColumn: {
    alignItems: 'center',
    width: 34,
  },
  drawbarVal: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  sliderVerticalWrapper: {
    width: 32,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footageText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  drawbarName: {
    color: '#94A3B8',
    fontSize: 7,
    marginTop: 2,
    textAlign: 'center',
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
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    marginRight: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  whiteKeyActive: {
    backgroundColor: '#F59E0B',
  },
  whiteKeyText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  blackKey: {
    width: 28,
    height: 100,
    backgroundColor: '#26140B',
    borderRadius: 4,
    marginLeft: -14,
    marginRight: -14,
    zIndex: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: '#140803',
  },
  blackKeyActive: {
    backgroundColor: '#D97706',
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
    backgroundColor: '#1A0E07',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D97706',
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
