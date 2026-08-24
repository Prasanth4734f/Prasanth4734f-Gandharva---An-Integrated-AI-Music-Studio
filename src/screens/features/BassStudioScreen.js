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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Zap, Music } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playBassNote } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 4 HEAVY BASS STRINGS (Standard EADG Bass Tuning)
const BASS_STRINGS = [
  { stringNum: 1, name: 'G2 String (High)', note: 'G2', freq: '98.0 Hz', gauge: 2.2, color: '#A78BFA' },
  { stringNum: 2, name: 'D2 String (Mid)', note: 'D2', freq: '73.4 Hz', gauge: 3.2, color: '#818CF8' },
  { stringNum: 3, name: 'A1 String (Low)', note: 'A1', freq: '55.0 Hz', gauge: 4.2, color: '#6366F1' },
  { stringNum: 4, name: 'E1 String (Sub Bass)', note: 'E1', freq: '41.2 Hz', gauge: 5.5, color: '#4F46E5' },
];

const BASS_FRETS = [0, 1, 2, 3, 4, 5, 7, 9, 12];

const GROOVE_RIFFS = [
  { name: '⚡ Funk Slap Groove', notes: ['E1', 'E2', 'G2', 'A2', 'D2'], desc: 'Punchy thumb slap & index pop' },
  { name: '🌴 Reggae Dub Bass', notes: ['E1', 'G1', 'A1', 'B1'], desc: 'Warm, round sub-bass foundation' },
  { name: '🎸 Rock Drive Pick', notes: ['A1', 'A1', 'C2', 'D2', 'E2'], desc: 'Heavy aggressive overdriven drive' },
  { name: '🎷 Jazz Walking Line', notes: ['C2', 'E2', 'G2', 'A2', 'Bb2'], desc: 'Smooth swinging arpeggio pulse' },
];

export default function BassStudioScreen({ navigation }) {
  const [playStyle, setPlayStyle] = useState('finger'); // 'finger' | 'slap'
  const [selectedFret, setSelectedFret] = useState(0);
  const [activeString, setActiveString] = useState(null);
  const [activeRiff, setActiveRiff] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const pluckBass = (str) => {
    setActiveString(str.stringNum);
    playBassNote(str.note, playStyle === 'slap', 2.0);
    setTimeout(() => setActiveString(null), 300);
  };

  const playGrooveRiff = (riff) => {
    setActiveRiff(riff.name);
    riff.notes.forEach((note, idx) => {
      setTimeout(() => {
        playBassNote(note, playStyle === 'slap', 1.6);
      }, idx * 240);
    });
    setTimeout(() => setActiveRiff(null), riff.notes.length * 240 + 200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#070712' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎸 Bass Guitar Studio</Text>
            <Text style={styles.subtitle}>Sub-Bass Fundamentals & Slap Technique</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#818CF8" size={16} />
            <Text style={styles.infoBtnText}>Anatomy</Text>
          </TouchableOpacity>
        </View>

        {/* Style Selector: Fingerstyle vs Slap */}
        <View style={styles.styleToggleRow}>
          <TouchableOpacity
            style={[styles.styleBtn, playStyle === 'finger' && styles.styleBtnActive]}
            onPress={() => setPlayStyle('finger')}
          >
            <Text style={[styles.styleBtnText, playStyle === 'finger' && styles.styleBtnTextActive]}>
              👌 Warm Fingerstyle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.styleBtn, playStyle === 'slap' && styles.styleBtnActiveSlap]}
            onPress={() => setPlayStyle('slap')}
          >
            <Zap color={playStyle === 'slap' ? '#000' : '#818CF8'} size={14} />
            <Text style={[styles.styleBtnText, playStyle === 'slap' && styles.styleBtnTextActive]}>
              ⚡ Slap & Pop
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1-Tap Groove Riff Presets */}
        <Text style={styles.sectionTitle}>1-Tap Bassline Grooves</Text>
        <View style={styles.riffsGrid}>
          {GROOVE_RIFFS.map((riff) => {
            const isPlaying = activeRiff === riff.name;
            return (
              <TouchableOpacity
                key={riff.name}
                style={[
                  styles.riffCard,
                  isPlaying && { borderColor: '#818CF8', backgroundColor: 'rgba(129, 140, 248, 0.2)' },
                ]}
                onPress={() => playGrooveRiff(riff)}
              >
                <Text style={styles.riffName}>{riff.name}</Text>
                <Text style={styles.riffDesc}>{riff.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fret Selector */}
        <Text style={styles.sectionTitle}>
          Fretboard Position: {selectedFret === 0 ? 'Open Strings' : `Fret ${selectedFret}`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {BASS_FRETS.map((f) => (
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

        {/* Interactive 4-String Heavy Fretboard */}
        <Text style={styles.sectionTitle}>Heavy Steel Bass Strings (Tap to Pluck/Slap)</Text>
        <View style={styles.fretboardWood}>
          {BASS_STRINGS.map((str) => {
            const isPlucked = activeString === str.stringNum;
            return (
              <TouchableOpacity
                key={str.stringNum}
                activeOpacity={0.7}
                style={styles.stringLane}
                onPress={() => pluckBass(str)}
              >
                <View style={styles.stringLabelBox}>
                  <Text style={styles.stringLabel}>{str.name}</Text>
                  <Text style={styles.stringFreq}>{str.freq}</Text>
                </View>

                <View style={styles.stringWireWrapper}>
                  <View
                    style={[
                      styles.stringWire,
                      {
                        height: str.gauge,
                        backgroundColor: isPlucked ? '#FFF' : str.color,
                        shadowColor: isPlucked ? '#818CF8' : 'transparent',
                        shadowOpacity: isPlucked ? 0.8 : 0,
                        shadowRadius: 6,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.pluckBadge, isPlucked && styles.pluckBadgeActive]}>
                  <Text style={styles.pluckBadgeText}>{isPlucked ? 'BOOM' : 'STRIKE'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* BASS GUITAR ANATOMY MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🎸 Bass Guitar Anatomy & Low-End Physics</Text>
                <Text style={styles.modalSubtitle}>Sub-Bass Energy, Larry Graham Slap & Leo Fender History</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. The Harmonic Bridge of Modern Music</Text>
              <Text style={styles.infoBody}>
                The bass guitar bridges the rhythmic foundation of drums with the melodic chords of guitars and keys. In 1951, <Text style={{ color: '#818CF8', fontWeight: 'bold' }}>Leo Fender</Text> created the Precision Bass, revolutionizing modern music.
              </Text>

              <Text style={styles.infoSectionTitle}>2. Heavy String Gauge & Sub-Bass Hz</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#818CF8', fontWeight: 'bold' }}>Low E1 (41.2 Hz):</Text> Deepest fundamental tone felt physically in the chest cavity.
                {'\n'}• <Text style={{ color: '#818CF8', fontWeight: 'bold' }}>A1 (55.0 Hz):</Text> Foundational punch of modern rock and pop.
                {'\n'}• <Text style={{ color: '#818CF8', fontWeight: 'bold' }}>D2 (73.4 Hz) & G2 (98.0 Hz):</Text> Clear mid-bass definitions for melodic fills.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Slap & Pop Technique (Larry Graham Invention)</Text>
              <Text style={styles.infoBody}>
                Invented by <Text style={{ color: '#F59E0B' }}>Larry Graham</Text> of Sly & the Family Stone. The side of the thumb strikes strings against the metal frets (Slap) while the index finger snaps strings outward (Pop), mimicking a bass kick and snare drum simultaneously.
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
    color: '#818CF8',
    fontSize: 11,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: '#818CF8',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  infoBtnText: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
  },
  styleToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  styleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  styleBtnActive: {
    backgroundColor: '#4338CA',
  },
  styleBtnActiveSlap: {
    backgroundColor: '#818CF8',
  },
  styleBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  styleBtnTextActive: {
    color: '#FFF',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  riffsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  riffCard: {
    width: '48%',
    backgroundColor: '#121224',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  riffName: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  riffDesc: {
    color: '#64748B',
    fontSize: 10,
  },
  fretPill: {
    backgroundColor: '#121224',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#242442',
  },
  fretPillActive: {
    backgroundColor: '#818CF8',
    borderColor: '#818CF8',
  },
  fretPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  fretPillTextActive: {
    color: '#000',
  },
  fretboardWood: {
    backgroundColor: '#0F0F1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2D2D4A',
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  stringLane: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  stringLabelBox: {
    width: 100,
  },
  stringLabel: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
  },
  stringFreq: {
    color: '#64748B',
    fontSize: 9,
  },
  stringWireWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
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
    backgroundColor: '#818CF8',
  },
  pluckBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
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
    backgroundColor: '#121224',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#818CF8',
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
    color: '#818CF8',
    fontSize: 11,
    marginTop: 2,
  },
  infoSectionTitle: {
    color: '#C7D2FE',
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
