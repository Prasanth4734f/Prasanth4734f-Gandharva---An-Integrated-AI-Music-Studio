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
import { ChevronLeft, Sparkles, BookOpen, Volume2, X, Music, Radio } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { playSitarNote } from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 7 MAIN SITAR STRINGS
const SITAR_STRINGS = [
  { id: 1, name: 'Baj Tar (Main Melody)', note: 'F3', swara: 'మ (Ma)', color: '#F59E0B' },
  { id: 2, name: 'Jor Tar (Second String)', note: 'C3', swara: 'సా (Sa)', color: '#D97706' },
  { id: 3, name: 'Kharaj (Bass String 1)', note: 'G2', swara: 'పా (Pa)', color: '#B45309' },
  { id: 4, name: 'Laraj (Deep Bass String)', note: 'C2', swara: 'సా़ (Low Sa)', color: '#78350F' },
  { id: 5, name: 'Pancham (Fifth String)', note: 'G3', swara: 'పా (Pa)', color: '#FCD34D' },
  { id: 6, name: 'Chikari 1 (High Drone)', note: 'C4', swara: 'సా° (High Sa)', color: '#FDE68A' },
  { id: 7, name: 'Chikari 2 (Top Drone)', note: 'C5', swara: 'సా°° (Top Sa)', color: '#FFFBEB' },
];

// SWARA FRETS
const SWARA_FRETS = [
  { note: 'C4', swara: 'సా (Sa)', name: 'Shadja (C4)' },
  { note: 'C#4', swara: 'రి़ (Komal Re)', name: 'Komal Rishabh (C#4)' },
  { note: 'D4', swara: 'రి (Shuddha Re)', name: 'Shuddha Rishabh (D4)' },
  { note: 'D#4', swara: 'గ़ (Komal Ga)', name: 'Komal Gandhar (D#4)' },
  { note: 'E4', swara: 'గ (Shuddha Ga)', name: 'Shuddha Gandhar (E4)' },
  { note: 'F4', swara: 'మ (Shuddha Ma)', name: 'Shuddha Madhyam (F4)' },
  { note: 'F#4', swara: 'మ́ (Teevra Ma)', name: 'Teevra Madhyam (F#4)' },
  { note: 'G4', swara: 'పా (Pa)', name: 'Pancham (G4)' },
  { note: 'G#4', swara: 'ధ़ (Komal Dha)', name: 'Komal Dhaivat (G#4)' },
  { note: 'A4', swara: 'ధ (Shuddha Dha)', name: 'Shuddha Dhaivat (A4)' },
  { note: 'A#4', swara: 'ని़ (Komal Ni)', name: 'Komal Nishad (A#4)' },
  { note: 'B4', swara: 'ని (Shuddha Ni)', name: 'Shuddha Nishad (B4)' },
  { note: 'C5', swara: 'సా° (Taar Sa)', name: 'Taar Shadja (C5)' },
  { note: 'D5', swara: 'రి° (Taar Re)', name: 'Taar Rishabh (D5)' },
  { note: 'E5', swara: 'గ° (Taar Ga)', name: 'Taar Gandhar (E5)' },
];

// CLASSICAL RAGAS
const RAGA_PRESETS = [
  { name: 'Raga Yaman', notes: ['Sa', 'Re', 'Ga', 'Teevra Ma', 'Pa', 'Dha', 'Ni'], mood: 'Evening Serenity & Romantic' },
  { name: 'Raga Bhairav', notes: ['Sa', 'Komal Re', 'Ga', 'Ma', 'Pa', 'Komal Dha', 'Ni'], mood: 'Dawn Awakening & Devotion' },
  { name: 'Raga Kafi', notes: ['Sa', 'Re', 'Komal Ga', 'Ma', 'Pa', 'Dha', 'Komal Ni'], mood: 'Spring Joy & Folk Melody' },
  { name: 'Raga Darbari', notes: ['Sa', 'Re', 'Komal Ga', 'Ma', 'Pa', 'Komal Dha', 'Komal Ni'], mood: 'Midnight Royal Majesty' },
];

export default function SitarStudioScreen({ navigation }) {
  const [meendBend, setMeendBend] = useState(0); // -6 to +6 semitones
  const [activeStringId, setActiveStringId] = useState(null);
  const [activeFretNote, setActiveFretNote] = useState(null);
  const [tanpuraActive, setTanpuraActive] = useState(false);
  const [selectedRaga, setSelectedRaga] = useState('Raga Yaman');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const tanpuraTimer = useRef(null);

  // Tanpura Continuous Drone Loop
  useEffect(() => {
    if (tanpuraActive) {
      const droneNotes = ['G3', 'C4', 'C4', 'C3'];
      let step = 0;
      tanpuraTimer.current = setInterval(() => {
        playSitarNote(droneNotes[step % droneNotes.length], 0, true, 2.5);
        step++;
      }, 750);
    } else {
      if (tanpuraTimer.current) clearInterval(tanpuraTimer.current);
    }
    return () => {
      if (tanpuraTimer.current) clearInterval(tanpuraTimer.current);
    };
  }, [tanpuraActive]);

  const pluckSitarString = (str) => {
    setActiveStringId(str.id);
    playSitarNote(str.note, meendBend, str.name.includes('Chikari'), 3.0);
    setTimeout(() => setActiveStringId(null), 300);
  };

  const playSwaraFret = (fret) => {
    setActiveFretNote(fret.note);
    playSitarNote(fret.note, meendBend, false, 2.8);
    setTimeout(() => setActiveFretNote(null), 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#140804' }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🪕 Sitar & Tanpura Studio</Text>
            <Text style={styles.subtitle}>Indian Classical Jawari Resonance & Meend</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
            <BookOpen color="#F59E0B" size={16} />
            <Text style={styles.infoBtnText}>Vedic Lore</Text>
          </TouchableOpacity>
        </View>

        {/* Tanpura Drone Toggle & Meend Bend */}
        <View style={styles.topControlCard}>
          <TouchableOpacity
            style={[styles.tanpuraToggleBtn, tanpuraActive && styles.tanpuraToggleBtnActive]}
            onPress={() => setTanpuraActive(!tanpuraActive)}
          >
            <Radio color={tanpuraActive ? '#000' : '#F59E0B'} size={18} />
            <Text style={[styles.tanpuraToggleText, tanpuraActive && styles.tanpuraToggleTextActive]}>
              {tanpuraActive ? 'Tanpura Drone Playing (Sa-Pa)' : 'Start Tanpura Drone'}
            </Text>
          </TouchableOpacity>

          <View style={styles.meendSliderBox}>
            <View style={styles.rowBetween}>
              <Text style={styles.meendTitle}>Meend Lateral String Pull (Pitch Bend)</Text>
              <Text style={styles.meendVal}>{meendBend > 0 ? `+${meendBend}` : meendBend} semitones</Text>
            </View>
            <Slider
              value={meendBend}
              minimumValue={-6}
              maximumValue={6}
              step={1}
              onValueChange={setMeendBend}
              minimumTrackTintColor="#F59E0B"
              maximumTrackTintColor="#3E1C12"
              thumbTintColor="#F59E0B"
            />
          </View>
        </View>

        {/* Classical Raga Guide */}
        <Text style={styles.sectionTitle}>Classical Raga Scales</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {RAGA_PRESETS.map((raga) => (
            <TouchableOpacity
              key={raga.name}
              style={[styles.ragaChip, selectedRaga === raga.name && styles.ragaChipActive]}
              onPress={() => setSelectedRaga(raga.name)}
            >
              <Sparkles color={selectedRaga === raga.name ? '#000' : '#F59E0B'} size={14} />
              <View>
                <Text style={[styles.ragaChipName, selectedRaga === raga.name && styles.ragaChipNameActive]}>
                  {raga.name}
                </Text>
                <Text style={[styles.ragaChipMood, selectedRaga === raga.name && styles.ragaChipMoodActive]}>
                  {raga.mood}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 7 Main Plucked Strings (Baj, Jor, Kharaj, Chikari) */}
        <Text style={styles.sectionTitle}>7 Main Sitar Strings (Pluck for Resonance)</Text>
        <View style={styles.sitarStringsBox}>
          {SITAR_STRINGS.map((str) => {
            const isPlucked = activeStringId === str.id;
            return (
              <TouchableOpacity
                key={str.id}
                style={[styles.sitarStringRow, isPlucked && styles.sitarStringRowActive]}
                onPress={() => pluckSitarString(str)}
              >
                <View style={styles.swaraBadge}>
                  <Text style={styles.swaraBadgeText}>{str.swara}</Text>
                </View>
                <Text style={styles.sitarStringName}>{str.name}</Text>
                <View style={styles.stringWireCenter}>
                  <View style={[styles.goldWire, { backgroundColor: isPlucked ? '#FFF' : str.color }]} />
                </View>
                <View style={[styles.strokePill, isPlucked && styles.strokePillActive]}>
                  <Text style={styles.strokePillText}>{isPlucked ? 'DA / RA' : 'STRIKE'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Swara Notes Keyboard / Frets */}
        <Text style={styles.sectionTitle}>Curved Brass Frets (Parda Swaras)</Text>
        <View style={styles.swaraGrid}>
          {SWARA_FRETS.map((fret) => {
            const isActive = activeFretNote === fret.note;
            return (
              <TouchableOpacity
                key={fret.note}
                style={[styles.swaraCard, isActive && styles.swaraCardActive]}
                onPress={() => playSwaraFret(fret)}
              >
                <LinearGradient
                  colors={isActive ? ['#F59E0B', '#B45309'] : ['#2A1208', '#160904']}
                  style={styles.swaraCardGradient}
                >
                  <Text style={[styles.swaraGlyph, isActive && { color: '#000' }]}>{fret.swara}</Text>
                  <Text style={[styles.swaraName, isActive && { color: '#000' }]}>{fret.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* VEDIC SITAR ENCYCLOPEDIA & ANATOMY MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🪕 Sitar Anatomy & Vedic Lore</Text>
                <Text style={styles.modalSubtitle}>Jawari Resonance, Gandharva Sangeet & Tarab Strings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. Mythological Origin & Gandharvas</Text>
              <Text style={styles.infoBody}>
                The Sitar evolved from the ancient Vedic Veena (Tritantri Veena). In Indian mythology, the celestial Gandharvas utilized stringed instruments to manifest <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Nada Brahma</Text> (Sound as the Primordial Cosmic Vibration).
              </Text>

              <Text style={styles.infoSectionTitle}>2. Acoustic Anatomy & The Jawari Bridge</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Jawari (The Soul of Sitar):</Text> Unlike sharp Western guitar bridges, the Sitar bridge is gently curved and wide. As the string vibrates, it grazes against the bridge surface, generating infinite cascading harmonic overtones.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Tumba (Gourd Resonator):</Text> Crafted from dried pumpkin gourds to amplify low-frequency acoustic warmth.
                {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Tarab (Sympathetic Strings):</Text> 11–13 strings running beneath the frets that vibrate spontaneously without being touched, creating natural acoustic reverb.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Meend & Indian Classical Expression</Text>
              <Text style={styles.infoBody}>
                The curved movable frets allow the sitarist to pull strings laterally across the neck by up to 5 semitones, producing <Text style={{ color: '#38BDF8' }}>Meend (microtonal vocal glides)</Text> and <Text style={{ color: '#38BDF8' }}>Gamaks (oscillations)</Text> unique to Indian classical music.
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
  topControlCard: {
    backgroundColor: '#1E0E07',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3E1C12',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  tanpuraToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  tanpuraToggleBtnActive: {
    backgroundColor: '#F59E0B',
  },
  tanpuraToggleText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
  },
  tanpuraToggleTextActive: {
    color: '#000',
  },
  meendSliderBox: {
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  meendTitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  meendVal: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  ragaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E0E07',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3E1C12',
    marginRight: 8,
    gap: 8,
  },
  ragaChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  ragaChipName: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
  },
  ragaChipNameActive: {
    color: '#000',
  },
  ragaChipMood: {
    color: '#94A3B8',
    fontSize: 10,
  },
  ragaChipMoodActive: {
    color: '#1E0E07',
  },
  sitarStringsBox: {
    backgroundColor: '#1A0C06',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#451D0E',
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  sitarStringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  sitarStringRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  swaraBadge: {
    width: 70,
  },
  swaraBadgeText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },
  sitarStringName: {
    color: '#E2E8F0',
    fontSize: 11,
    width: 130,
  },
  stringWireCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  goldWire: {
    height: 2.5,
    borderRadius: 1,
  },
  strokePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  strokePillActive: {
    backgroundColor: '#F59E0B',
  },
  strokePillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  swaraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swaraCard: {
    width: '31%',
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swaraCardActive: {
    transform: [{ scale: 0.98 }],
  },
  swaraCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: '#3E1C12',
    borderRadius: 12,
  },
  swaraGlyph: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '900',
  },
  swaraName: {
    color: '#CBD5E1',
    fontSize: 9,
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
    backgroundColor: '#1E0E07',
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
