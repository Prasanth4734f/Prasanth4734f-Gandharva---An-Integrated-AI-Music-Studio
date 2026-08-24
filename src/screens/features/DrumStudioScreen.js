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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Music, Play, Pause } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playDrumSound } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// DRUM KIT PADS
const DRUM_PADS = [
  { id: 'kick', name: 'Bass Kick', tag: 'Sub Low', soundType: 'kick', color: '#FF2D55' },
  { id: 'snare', name: 'Snare Drum', tag: 'Center Hit', soundType: 'snare', color: '#FF9F0A' },
  { id: 'hihat', name: 'Closed Hi-Hat', tag: 'Tight Click', soundType: 'hihat', color: '#30D158' },
  { id: 'hihat_open', name: 'Open Hi-Hat', tag: 'Sizzle', soundType: 'hihat_open', color: '#00E5FF' },
  { id: 'tom_high', name: 'High Tom', tag: 'Rack 1', soundType: 'snare', color: '#AF52DE' },
  { id: 'tom_floor', name: 'Floor Tom', tag: 'Deep Thump', soundType: 'kick', color: '#FF375F' },
  { id: 'crash', name: 'Crash Cymbal', tag: 'Explosive', soundType: 'hihat_open', color: '#FCD34D' },
  { id: 'ride', name: 'Ride Cymbal', tag: 'Ping Bell', soundType: 'hihat', color: '#38BDF8' },
];

// INDIAN TABLA PADS
const TABLA_PADS = [
  { id: 'dha', name: 'Dha (ధా)', tag: 'Combined Bass + Slap', soundType: 'tabla_bayan', color: '#F59E0B' },
  { id: 'dhin', name: 'Dhin (ధిన్)', tag: 'Resonant Bayan', soundType: 'tabla_bayan', color: '#D97706' },
  { id: 'ge', name: 'Ge / Ga (గే)', tag: 'Deep Modulated Bass', soundType: 'tabla_bayan', color: '#B45309' },
  { id: 'na', name: 'Na / Ta (నా)', tag: 'Crisp Rim Stroke', soundType: 'tabla_dayan', color: '#38BDF8' },
  { id: 'tin', name: 'Tin (తిన్)', tag: 'Open Dayan Bell', soundType: 'tabla_dayan', color: '#818CF8' },
  { id: 'ka', name: 'Ka / Ke (క)', tag: 'Muted Slap', soundType: 'snare', color: '#94A3B8' },
];

export default function DrumStudioScreen({ navigation }) {
  const [kitMode, setKitMode] = useState('acoustic'); // 'acoustic' | 'tabla'
  const [activePadId, setActivePadId] = useState(null);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [velocity, setVelocity] = useState(1.0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const metronomeTimer = useRef(null);

  // Metronome Loop
  useEffect(() => {
    if (metronomeActive) {
      const intervalMs = (60 / bpm) * 1000;
      metronomeTimer.current = setInterval(() => {
        playDrumSound('hihat', 0.8);
      }, intervalMs);
    } else {
      if (metronomeTimer.current) clearInterval(metronomeTimer.current);
    }
    return () => {
      if (metronomeTimer.current) clearInterval(metronomeTimer.current);
    };
  }, [metronomeActive, bpm]);

  const triggerPad = (pad) => {
    setActivePadId(pad.id);
    playDrumSound(pad.soundType, velocity);
    setTimeout(() => setActivePadId(null), 180);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090E' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🥁 Drums & Tabla Studio</Text>
            <Text style={styles.subtitle}>Multi-Velocity Acoustic Kit & Indian Tala</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#FF9F0A" size={16} />
            <Text style={styles.infoBtnText}>Anatomy</Text>
          </TouchableOpacity>
        </View>

        {/* Kit Mode Switcher */}
        <View style={styles.kitModeTabs}>
          <TouchableOpacity
            style={[styles.kitModeTab, kitMode === 'acoustic' && styles.kitModeTabActive]}
            onPress={() => setKitMode('acoustic')}
          >
            <Text style={[styles.kitModeTabText, kitMode === 'acoustic' && styles.kitModeTabTextActive]}>
              🥁 Acoustic Drum Kit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kitModeTab, kitMode === 'tabla' && styles.kitModeTabActive]}
            onPress={() => setKitMode('tabla')}
          >
            <Text style={[styles.kitModeTabText, kitMode === 'tabla' && styles.kitModeTabTextActive]}>
              🪘 Indian Classical Tabla
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metronome & Velocity Bar */}
        <View style={styles.tempoCard}>
          <View style={styles.metronomeRow}>
            <TouchableOpacity
              style={[styles.metronomeBtn, metronomeActive && styles.metronomeBtnActive]}
              onPress={() => setMetronomeActive(!metronomeActive)}
            >
              {metronomeActive ? <Pause color="#000" size={16} fill="#000" /> : <Play color="#FFF" size={16} fill="#FFF" />}
              <Text style={[styles.metronomeBtnText, metronomeActive && { color: '#000' }]}>
                {metronomeActive ? 'Stop Click' : 'Metronome'}
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={styles.bpmText}>Tempo: {bpm} BPM</Text>
              <Slider
                value={bpm}
                minimumValue={60}
                maximumValue={200}
                step={1}
                onValueChange={setBpm}
                minimumTrackTintColor="#FF9F0A"
                maximumTrackTintColor="#333"
                thumbTintColor="#FF9F0A"
              />
            </View>
          </View>
        </View>

        {/* Playable Velocity Pads */}
        <Text style={styles.sectionTitle}>
          {kitMode === 'acoustic' ? 'Acoustic Kit Velocity Pads' : 'Indian Tabla Bol Pads'}
        </Text>
        
        <View style={styles.padsGrid}>
          {(kitMode === 'acoustic' ? DRUM_PADS : TABLA_PADS).map((pad) => {
            const isHit = activePadId === pad.id;
            return (
              <TouchableOpacity
                key={pad.id}
                activeOpacity={0.8}
                style={[
                  styles.drumPadCard,
                  isHit && { transform: [{ scale: 0.94 }], borderColor: pad.color },
                ]}
                onPress={() => triggerPad(pad)}
              >
                <LinearGradient
                  colors={isHit ? [pad.color, '#000'] : ['#1E1E2A', '#12121A']}
                  style={styles.padGradient}
                >
                  <View style={[styles.padIndicatorDot, { backgroundColor: pad.color }]} />
                  <Text style={[styles.padName, isHit && { color: '#FFF' }]}>{pad.name}</Text>
                  <Text style={[styles.padTag, isHit && { color: '#FFF' }]}>{pad.tag}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* DRUMS & TABLA ANATOMY MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🥁 Percussion & Tala Anatomy</Text>
                <Text style={styles.modalSubtitle}>Acoustic Shell Resonance & Indian Tabla Syahi Physics</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. Acoustic Drum Shell Dynamics</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#FF9F0A', fontWeight: 'bold' }}>Bass Kick:</Text> Large wooden cylinder producing heavy fundamental frequencies between 40–80 Hz with punch attack around 2–4 kHz.
                {'\n'}• <Text style={{ color: '#FF9F0A', fontWeight: 'bold' }}>Snare Drum:</Text> Tensioned metal coiled wires vibrating against the bottom resonant skin create a crisp crack.
                {'\n'}• <Text style={{ color: '#FF9F0A', fontWeight: 'bold' }}>Cymbals:</Text> B20 bronze alloy generating rich inharmonic metallic clusters.
              </Text>

              <Text style={styles.infoSectionTitle}>2. Indian Classical Tabla & The Syahi Black Spot</Text>
              <Text style={styles.infoBody}>
                The Indian Tabla pair consists of:
                {'\n'}• <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Dayan (Right Drum):</Text> Carved from heavy wood, tuned precisely to the tonic pitch (Sa). The central black spot (<Text style={{ color: '#F59E0B' }}>Syahi</Text>), made of iron filings and starch paste, damps non-harmonic frequencies so the drum rings like a metallic bell.
                {'\n'}• <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Bayan (Left Bass Drum):</Text> Made of copper or brass, producing modulated deep vocal bass glides by pressing the heel of the palm.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Classical Indian Tala Cycles</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#34D399' }}>Teentaal:</Text> 16 beats (4+4+4+4) — the king of classical Hindustani rhythm.
                {'\n'}• <Text style={{ color: '#34D399' }}>Adi Tala:</Text> 8 beats (4+2+2) — foundational rhythmic cycle of Carnatic music.
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
    color: '#FF9F0A',
    fontSize: 11,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderColor: '#FF9F0A',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  infoBtnText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
  },
  kitModeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  kitModeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  kitModeTabActive: {
    backgroundColor: '#FF9F0A',
  },
  kitModeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  kitModeTabTextActive: {
    color: '#000',
  },
  tempoCard: {
    backgroundColor: '#161622',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  metronomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metronomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  metronomeBtnActive: {
    backgroundColor: '#FF9F0A',
  },
  metronomeBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bpmText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  padsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  drumPadCard: {
    width: '48%',
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  padGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  padIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  padName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  padTag: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
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
    backgroundColor: '#14141E',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF9F0A',
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
    color: '#FF9F0A',
    fontSize: 11,
    marginTop: 2,
  },
  infoSectionTitle: {
    color: '#FCD34D',
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
