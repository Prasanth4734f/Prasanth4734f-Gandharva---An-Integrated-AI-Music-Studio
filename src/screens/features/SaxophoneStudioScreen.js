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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Music, Flame } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playSaxNote } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// SAXOPHONE KEYS & REGISTERS
const SAX_KEYS = [
  { note: 'Bb3', label: 'Low Bb (Bb3)', register: 'Low Bell', color: '#B45309' },
  { note: 'B3', label: 'Low B (B3)', register: 'Low Bell', color: '#B45309' },
  { note: 'C4', label: 'Middle C (C4)', register: 'Mid', color: '#F59E0B' },
  { note: 'D4', label: 'D4 Key', register: 'Mid', color: '#F59E0B' },
  { note: 'Eb4', label: 'Eb4 Side', register: 'Mid', color: '#F59E0B' },
  { note: 'E4', label: 'E4 Key', register: 'Mid', color: '#F59E0B' },
  { note: 'F4', label: 'F4 Key', register: 'Mid', color: '#F59E0B' },
  { note: 'G4', label: 'G4 Key', register: 'Mid', color: '#F59E0B' },
  { note: 'A4', label: 'A4 Key', register: 'Mid', color: '#F59E0B' },
  { note: 'Bb4', label: 'Bis Bb (Bb4)', register: 'Mid', color: '#F59E0B' },
  { note: 'B4', label: 'B4 Key', register: 'Mid', color: '#F59E0B' },
  { note: 'C5', label: 'C5 Palm', register: 'High Palm', color: '#FCD34D' },
  { note: 'D5', label: 'High D (D5)', register: 'High Palm', color: '#FCD34D' },
  { note: 'Eb5', label: 'High Eb (Eb5)', register: 'High Palm', color: '#FCD34D' },
  { note: 'E5', label: 'High E (E5)', register: 'High Palm', color: '#FCD34D' },
  { note: 'F5', label: 'High F (F5)', register: 'Altissimo', color: '#FEF08A' },
];

export default function SaxophoneStudioScreen({ navigation }) {
  const [saxType, setSaxType] = useState('alto'); // 'alto' | 'tenor'
  const [growlActive, setGrowlActive] = useState(false);
  const [octaveShift, setOctaveShift] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const playKey = (item) => {
    setActiveNote(item.note);
    playSaxNote(item.note, growlActive, 2.0);
    setTimeout(() => setActiveNote(null), 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#140A02' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎷 Saxophone & Brass Studio</Text>
            <Text style={styles.subtitle}>Conical Bore & Jazz Reed Acoustics</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#F59E0B" size={16} />
            <Text style={styles.infoBtnText}>Anatomy</Text>
          </TouchableOpacity>
        </View>

        {/* Sax Type & Growl Toggles */}
        <View style={styles.controlsCard}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.typeBtn, saxType === 'alto' && styles.typeBtnActive]}
              onPress={() => setSaxType('alto')}
            >
              <Text style={[styles.typeBtnText, saxType === 'alto' && styles.typeBtnTextActive]}>
                🎷 Alto Saxophone (Eb)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, saxType === 'tenor' && styles.typeBtnActive]}
              onPress={() => setSaxType('tenor')}
            >
              <Text style={[styles.typeBtnText, saxType === 'tenor' && styles.typeBtnTextActive]}>
                🎷 Tenor Saxophone (Bb)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subToggleRow}>
            <TouchableOpacity
              style={[styles.growlPill, growlActive && styles.growlPillActive]}
              onPress={() => setGrowlActive(!growlActive)}
            >
              <Flame color={growlActive ? '#000' : '#F59E0B'} size={14} />
              <Text style={[styles.growlPillText, growlActive && styles.growlPillTextActive]}>
                {growlActive ? 'Growl / Flutter On' : 'Clean Tone'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.octavePill, octaveShift && styles.octavePillActive]}
              onPress={() => setOctaveShift(!octaveShift)}
            >
              <Sparkles color={octaveShift ? '#000' : '#FCD34D'} size={14} />
              <Text style={[styles.octavePillText, octaveShift && styles.octavePillTextActive]}>
                {octaveShift ? 'Octave Key Engaged (+12)' : 'Thumb Register Key'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saxophone Keypad Grid */}
        <Text style={styles.sectionTitle}>Padded Brass Keys (Tap to Play)</Text>
        <View style={styles.keysGrid}>
          {SAX_KEYS.map((item) => {
            const isPressed = activeNote === item.note;
            return (
              <TouchableOpacity
                key={item.note}
                style={[styles.saxKeyCard, isPressed && styles.saxKeyCardActive]}
                onPress={() => playKey(item)}
              >
                <LinearGradient
                  colors={isPressed ? ['#F59E0B', '#B45309'] : ['#2B1506', '#140A02']}
                  style={styles.keyGradient}
                >
                  <View style={[styles.pearlKeyCap, isPressed && { backgroundColor: '#FFF' }]} />
                  <Text style={[styles.keyNoteText, isPressed && { color: '#000' }]}>{item.note}</Text>
                  <Text style={[styles.keyRegisterText, isPressed && { color: '#000' }]}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* SAXOPHONE ANATOMY & ACOUSTICS MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🎷 Saxophone Anatomy & Physics</Text>
                <Text style={styles.modalSubtitle}>Adolphe Sax Invention, Conical Bore & Reed Acoustics</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. Invention by Adolphe Sax (1846)</Text>
              <Text style={styles.infoBody}>
                Belgian instrument designer <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Adolphe Sax</Text> sought to bridge the powerful projection of brass horns with the agile woodwind fingering of clarinets, inventing the saxophone family.
              </Text>

              <Text style={styles.infoSectionTitle}>2. Acoustic Conical Bore</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Conical Expansion:</Text> Unlike the cylindrical clarinet, the saxophone tube widens continuously towards the bell, causing all harmonic overtones (even and odd) to resonate evenly.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Single Reed Mouthpiece:</Text> Cane reed vibrates against the facing curve, injecting pressure pulses into the neck.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Octave Register Key:</Text> Opens a micro-vent near the neck, forcing standing waves to split into their 2nd harmonic octave.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Jazz & Expressive Embellishments</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#38BDF8' }}>Subtone:</Text> Loosening lower lip pressure for breathy, intimate ballad textures.
                {'\n'}• <Text style={{ color: '#38BDF8' }}>Growl:</Text> Humming simultaneously while blowing to create aggressive overdriven flutter.
                {'\n'}• <Text style={{ color: '#38BDF8' }}>Altissimo:</Text> Advanced overblown fingerings exceeding the standard 2.5 octave range.
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
  controlsCard: {
    backgroundColor: '#201004',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#45220C',
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  typeBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#000',
  },
  subToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  growlPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  growlPillActive: {
    backgroundColor: '#F59E0B',
  },
  growlPillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  growlPillTextActive: {
    color: '#000',
  },
  octavePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  octavePillActive: {
    backgroundColor: '#FCD34D',
  },
  octavePillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  octavePillTextActive: {
    color: '#000',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  keysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  saxKeyCard: {
    width: '23%',
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saxKeyCardActive: {
    transform: [{ scale: 0.96 }],
  },
  keyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: '#45220C',
    borderRadius: 12,
  },
  pearlKeyCap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FDE68A',
    borderWidth: 1,
    borderColor: '#B45309',
    marginBottom: 4,
  },
  keyNoteText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  keyRegisterText: {
    color: '#CBD5E1',
    fontSize: 8,
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
    backgroundColor: '#1E0C04',
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
