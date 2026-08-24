import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Music } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playViolinNote } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 4 ORCHESTRAL VIOLIN STRINGS & FINGER POSITIONS
const VIOLIN_STRINGS = [
  {
    stringName: 'E5 (Chanterelle)',
    baseNote: 'E5',
    color: '#38BDF8',
    gauge: 1.5,
    positions: [
      { label: 'Open E5', note: 'E5', finger: '0' },
      { label: 'F5 (1st Finger)', note: 'F5', finger: '1' },
      { label: 'G5 (2nd Finger)', note: 'G5', finger: '2' },
      { label: 'A5 (3rd Finger)', note: 'A5', finger: '3' },
      { label: 'B5 (4th Finger)', note: 'B5', finger: '4' },
      { label: 'C6 (High Shift)', note: 'C6', finger: '5' },
    ],
  },
  {
    stringName: 'A4 (Second String)',
    baseNote: 'A4',
    color: '#A78BFA',
    gauge: 2.2,
    positions: [
      { label: 'Open A4', note: 'A4', finger: '0' },
      { label: 'B4 (1st Finger)', note: 'B4', finger: '1' },
      { label: 'C5 (2nd Finger)', note: 'C5', finger: '2' },
      { label: 'D5 (3rd Finger)', note: 'D5', finger: '3' },
      { label: 'E5 (4th Finger)', note: 'E5', finger: '4' },
      { label: 'F5 (Shift)', note: 'F5', finger: '5' },
    ],
  },
  {
    stringName: 'D4 (Third String)',
    baseNote: 'D4',
    color: '#34D399',
    gauge: 3.0,
    positions: [
      { label: 'Open D4', note: 'D4', finger: '0' },
      { label: 'E4 (1st Finger)', note: 'E4', finger: '1' },
      { label: 'F4 (2nd Finger)', note: 'F4', finger: '2' },
      { label: 'G4 (3rd Finger)', note: 'G4', finger: '3' },
      { label: 'A4 (4th Finger)', note: 'A4', finger: '4' },
      { label: 'B4 (Shift)', note: 'B4', finger: '5' },
    ],
  },
  {
    stringName: 'G3 (Silver Bass String)',
    baseNote: 'G3',
    color: '#F59E0B',
    gauge: 3.8,
    positions: [
      { label: 'Open G3', note: 'G3', finger: '0' },
      { label: 'A3 (1st Finger)', note: 'A3', finger: '1' },
      { label: 'B3 (2nd Finger)', note: 'B3', finger: '2' },
      { label: 'C4 (3rd Finger)', note: 'C4', finger: '3' },
      { label: 'D4 (4th Finger)', note: 'D4', finger: '4' },
      { label: 'E4 (Shift)', note: 'E4', finger: '5' },
    ],
  },
];

export default function ViolinStudioScreen({ navigation }) {
  const [playStyle, setPlayStyle] = useState('bow'); // 'bow' | 'pizzicato'
  const [vibratoActive, setVibratoActive] = useState(true);
  const [activeNote, setActiveNote] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const playNote = (note) => {
    setActiveNote(note);
    playViolinNote(note, playStyle === 'pizzicato', vibratoActive, 2.8);
    setTimeout(() => setActiveNote(null), 350);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0C0608' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎻 Classical Violin Studio</Text>
            <Text style={styles.subtitle}>Fretless Fingerboard & Orchestral Bowing</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#EC4899" size={16} />
            <Text style={styles.infoBtnText}>Anatomy</Text>
          </TouchableOpacity>
        </View>

        {/* Style Selector & Vibrato Toggle */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.styleBtn, playStyle === 'bow' && styles.styleBtnActive]}
            onPress={() => setPlayStyle('bow')}
          >
            <Text style={[styles.styleBtnText, playStyle === 'bow' && styles.styleBtnTextActive]}>
              🎻 Bowed Legato (Arco)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.styleBtn, playStyle === 'pizzicato' && styles.styleBtnActive]}
            onPress={() => setPlayStyle('pizzicato')}
          >
            <Text style={[styles.styleBtnText, playStyle === 'pizzicato' && styles.styleBtnTextActive]}>
              🤏 Plucked (Pizzicato)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.vibratoPill, vibratoActive && styles.vibratoPillActive]}
            onPress={() => setVibratoActive(!vibratoActive)}
          >
            <Sparkles color={vibratoActive ? '#000' : '#EC4899'} size={14} />
            <Text style={[styles.vibratoPillText, vibratoActive && styles.vibratoPillTextActive]}>
              {vibratoActive ? 'Vibrato On' : 'Vibrato Off'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fretless 4-String Fingerboard */}
        <Text style={styles.sectionTitle}>Interactive Fretless Fingerboard Positions</Text>
        <View style={styles.fingerboardContainer}>
          {VIOLIN_STRINGS.map((str) => (
            <View key={str.baseNote} style={styles.stringColumn}>
              <View style={[styles.stringHeader, { borderBottomColor: str.color }]}>
                <Text style={[styles.stringHeaderText, { color: str.color }]}>{str.stringName}</Text>
              </View>

              <View style={styles.fingerPositionsList}>
                {str.positions.map((pos) => {
                  const isPressed = activeNote === pos.note;
                  return (
                    <TouchableOpacity
                      key={pos.note}
                      style={[
                        styles.posBtn,
                        isPressed && { backgroundColor: str.color, borderColor: str.color },
                      ]}
                      onPress={() => playNote(pos.note)}
                    >
                      <Text style={[styles.fingerNum, isPressed && { color: '#000' }]}>
                        {pos.finger === '0' ? 'OPEN' : `F${pos.finger}`}
                      </Text>
                      <Text style={[styles.posNoteText, isPressed && { color: '#000' }]}>
                        {pos.note}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* VIOLIN ANATOMY & ACOUSTICS MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🎻 Violin Anatomy & Physics</Text>
                <Text style={styles.modalSubtitle}>Stradivarius Heritage, F-Holes & Harmonic Physics</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. String Tuning in Perfect 5ths</Text>
              <Text style={styles.infoBody}>
                The violin is tuned in perfect fifth intervals:
                {'\n'}• 4th String (G3): 196.0 Hz (Deepest warm orchestral voice)
                {'\n'}• 3rd String (D4): 293.7 Hz
                {'\n'}• 2nd String (A4): 440.0 Hz (Universal orchestral concert pitch)
                {'\n'}• 1st String (E5): 659.3 Hz (Brilliant singing lead register)
              </Text>

              <Text style={styles.infoSectionTitle}>2. Acoustic Resonance & Soundpost</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#EC4899', fontWeight: 'bold' }}>The Soundpost (L'Âme):</Text> Known in French as the "Soul of the Violin", this tiny spruce cylinder inside the body transfers bridge vibrations to the back plate.
                {'\n'}• <Text style={{ color: '#EC4899', fontWeight: 'bold' }}>F-Holes:</Text> The dual stylized openings enhance the flexibility of the carved spruce soundboard top.
                {'\n'}• <Text style={{ color: '#EC4899', fontWeight: 'bold' }}>Horsehair Bow (Arco):</Text> Treated with rosin to create friction against steel/gut strings, exciting standing Helmholtz waves.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Fretless Pitch Expression</Text>
              <Text style={styles.infoBody}>
                Because the fingerboard has no metal frets, the violinist commands infinite microtonal intonation, expressive <Text style={{ color: '#38BDF8' }}>Vibrato</Text>, and seamless <Text style={{ color: '#38BDF8' }}>Portamento (vocal glissando)</Text>.
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
    color: '#EC4899',
    fontSize: 11,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#EC4899',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  infoBtnText: {
    color: '#F472B6',
    fontSize: 11,
    fontWeight: '700',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  styleBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  styleBtnActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
  },
  styleBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  styleBtnTextActive: {
    color: '#FFF',
  },
  vibratoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  vibratoPillActive: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  vibratoPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  vibratoPillTextActive: {
    color: '#000',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  fingerboardContainer: {
    flexDirection: 'row',
    backgroundColor: '#160B0F',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D1524',
    padding: 12,
    gap: 8,
  },
  stringColumn: {
    flex: 1,
  },
  stringHeader: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    marginBottom: 8,
    alignItems: 'center',
  },
  stringHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  fingerPositionsList: {
    gap: 8,
  },
  posBtn: {
    backgroundColor: '#241018',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerNum: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
  },
  posNoteText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
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
    backgroundColor: '#1E0C15',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EC4899',
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
    color: '#EC4899',
    fontSize: 11,
    marginTop: 2,
  },
  infoSectionTitle: {
    color: '#F472B6',
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
