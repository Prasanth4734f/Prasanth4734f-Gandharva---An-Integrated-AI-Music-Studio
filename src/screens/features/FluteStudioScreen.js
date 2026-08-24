import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import {
  ChevronLeft,
  Sparkles,
  BookOpen,
  Volume2,
  X,
  Wind,
  Music,
  Radio,
  Disc,
  Play,
  Square,
  Repeat,
  Waves,
  Zap,
  Clock,
} from 'lucide-react-native';
import { FLUTE_SOUND_MAP } from './SoundMap';
import {
  playFluteNote,
  playFluteMeendGlide,
  startTanpuraDrone,
  stopTanpuraDrone,
} from '../../services/synthAudioEngine';

const { width } = Dimensions.get('window');

// 3 OCTAVE SAPTAKS OF FLUTE (Mandra, Madhya, Taar) WITH HOLE FINGERINGS (1=closed, 0=open, 0.5=half)
const FLUTE_NOTES = [
  // Mandra Saptak (Low)
  { note: 'G3', label: 'Pạ (G3)', swara: 'పా̣', octave: 'Mandra', holes: [1, 1, 1, 1, 1, 1], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali'] },
  { note: 'A3', label: 'Dhạ (A3)', swara: 'ధ̣', octave: 'Mandra', holes: [1, 1, 1, 1, 1, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bageshree'] },
  { note: 'B3', label: 'Nị (B3)', swara: 'ని̣', octave: 'Mandra', holes: [1, 1, 1, 1, 0, 0], ragas: ['All', 'Yaman', 'Bhairav'] },
  
  // Madhya Saptak (Mid)
  { note: 'C4', label: 'Sa (C4)', swara: 'సా', octave: 'Madhya', holes: [1, 1, 1, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'C#4', label: 'Komal Re', swara: 'రి़', octave: 'Madhya', holes: [1, 1, 0.5, 0, 0, 0], ragas: ['All', 'Bhairav'] },
  { note: 'D4', label: 'Shuddha Re', swara: 'రి', octave: 'Madhya', holes: [1, 1, 0, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'D#4', label: 'Komal Ga', swara: 'గ़', octave: 'Madhya', holes: [1, 0.5, 0, 0, 0, 0], ragas: ['All', 'Bageshree'] },
  { note: 'E4', label: 'Shuddha Ga', swara: 'గ', octave: 'Madhya', holes: [1, 0, 0, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bilawal'] },
  { note: 'F4', label: 'Shuddha Ma', swara: 'మ', octave: 'Madhya', holes: [0.5, 0, 0, 0, 0, 0], ragas: ['All', 'Bhairav', 'Bageshree', 'Bilawal'] },
  { note: 'F#4', label: 'Teevra Ma', swara: 'మ́', octave: 'Madhya', holes: [0, 0, 0, 0, 0, 0], ragas: ['All', 'Yaman'] },
  { note: 'G4', label: 'Pa (G4)', swara: 'పా', octave: 'Madhya', holes: [1, 1, 1, 1, 1, 1], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'G#4', label: 'Komal Dha', swara: 'ధ़', octave: 'Madhya', holes: [1, 1, 1, 1, 1, 0.5], ragas: ['All', 'Bhairav'] },
  { note: 'A4', label: 'Shuddha Dha', swara: 'ధ', octave: 'Madhya', holes: [1, 1, 1, 1, 1, 0], ragas: ['All', 'Yaman', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'A#4', label: 'Komal Ni', swara: 'ని़', octave: 'Madhya', holes: [1, 1, 1, 1, 0.5, 0], ragas: ['All', 'Bageshree'] },
  { note: 'B4', label: 'Shuddha Ni', swara: 'ని', octave: 'Madhya', holes: [1, 1, 1, 1, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bilawal'] },

  // Taar Saptak (High Overblown)
  { note: 'C5', label: 'Sa° (C5)', swara: 'సా°', octave: 'Taar', holes: [1, 1, 1, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'C#5', label: 'Komal Re°', swara: 'రి़°', octave: 'Taar', holes: [1, 1, 0.5, 0, 0, 0], ragas: ['All', 'Bhairav'] },
  { note: 'D5', label: 'Shuddha Re°', swara: 'రి°', octave: 'Taar', holes: [1, 1, 0, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'D#5', label: 'Komal Ga°', swara: 'గ़°', octave: 'Taar', holes: [1, 0.5, 0, 0, 0, 0], ragas: ['All', 'Bageshree'] },
  { note: 'E5', label: 'Shuddha Ga°', swara: 'గ°', octave: 'Taar', holes: [1, 0, 0, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bilawal'] },
  { note: 'F5', label: 'Shuddha Ma°', swara: 'మ°', octave: 'Taar', holes: [0.5, 0, 0, 0, 0, 0], ragas: ['All', 'Bhairav', 'Bageshree', 'Bilawal'] },
  { note: 'F#5', label: 'Teevra Ma°', swara: 'మ́°', octave: 'Taar', holes: [0, 0, 0, 0, 0, 0], ragas: ['All', 'Yaman'] },
  { note: 'G5', label: 'Pa° (G5)', swara: 'పా°', octave: 'Taar', holes: [1, 1, 1, 1, 1, 1], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali', 'Bageshree'] },
  { note: 'G#5', label: 'Komal Dha°', swara: 'ధ़°', octave: 'Taar', holes: [1, 1, 1, 1, 1, 0.5], ragas: ['All', 'Bhairav'] },
  { note: 'A5', label: 'Shuddha Dha°', swara: 'ధ°', octave: 'Taar', holes: [1, 1, 1, 1, 1, 0], ragas: ['All', 'Yaman', 'Bhupali', 'Bageshree', 'Bilawal'] },
  { note: 'A#5', label: 'Komal Ni°', swara: 'ని़°', octave: 'Taar', holes: [1, 1, 1, 1, 0.5, 0], ragas: ['All', 'Bageshree'] },
  { note: 'B5', label: 'Shuddha Ni°', swara: 'ని°', octave: 'Taar', holes: [1, 1, 1, 1, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bilawal'] },
  { note: 'C6', label: 'Sa°° (C6)', swara: 'సా°°', octave: 'Taar', holes: [1, 1, 1, 0, 0, 0], ragas: ['All', 'Yaman', 'Bhairav', 'Bhupali'] },
];

const RAGAS = [
  { id: 'All', name: 'All 12 Swaras', desc: 'Full chromatic gamut' },
  { id: 'Yaman', name: 'Raag Yaman', desc: 'Kalyan Thaat • Evening romantic' },
  { id: 'Bhairav', name: 'Raag Bhairav', desc: 'Dawn devotional • Komal Re & Dha' },
  { id: 'Bhupali', name: 'Raag Bhupali', desc: '5-Note pure Pentatonic' },
  { id: 'Bageshree', name: 'Raag Bageshree', desc: 'Midnight longing • Komal Ga & Ni' },
];

// 5 BEAUTIFUL DEMO PLAYS (7s to 15s)
const DEMO_DHUNS = [
  {
    id: 'krishna_dhun',
    title: '🪈 1. Krishna Divine Flute (Venu Dhun)',
    desc: 'Mystical Vrindavan flute melody',
    durationLabel: '10s',
    notes: [
      { note: 'G4', dur: 0.5, gap: 0.6 },
      { note: 'E4', dur: 0.5, gap: 0.6 },
      { note: 'D4', dur: 0.5, gap: 0.6 },
      { note: 'C4', dur: 0.8, gap: 0.9 },
      { note: 'D4', dur: 0.4, gap: 0.5 },
      { note: 'E4', dur: 0.4, gap: 0.5 },
      { note: 'G4', dur: 0.6, gap: 0.7 },
      { note: 'A4', dur: 0.6, gap: 0.7 },
      { note: 'C5', dur: 1.0, gap: 1.1 },
      { note: 'A4', dur: 0.5, gap: 0.6 },
      { note: 'G4', dur: 0.6, gap: 0.7 },
      { note: 'E4', dur: 0.6, gap: 0.7 },
      { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'C4', dur: 1.4, gap: 1.6 },
    ],
  },
  {
    id: 'raag_bhupali',
    title: '🌅 2. Raag Bhupali Morning Alap',
    desc: 'Serene sunrise pentatonic scale',
    durationLabel: '11s',
    notes: [
      { note: 'C4', dur: 0.6, gap: 0.7 },
      { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'E4', dur: 0.8, gap: 0.9 },
      { note: 'G4', dur: 0.6, gap: 0.7 },
      { note: 'A4', dur: 0.8, gap: 0.9 },
      { note: 'C5', dur: 1.2, gap: 1.3 },
      { note: 'D5', dur: 0.8, gap: 0.9 },
      { note: 'C5', dur: 0.8, gap: 0.9 },
      { note: 'A4', dur: 0.7, gap: 0.8 },
      { note: 'G4', dur: 0.8, gap: 0.9 },
      { note: 'E4', dur: 0.7, gap: 0.8 },
      { note: 'D4', dur: 0.7, gap: 0.8 },
      { note: 'C4', dur: 1.5, gap: 1.6 },
    ],
  },
  {
    id: 'raag_yaman',
    title: '🌙 3. Raag Yaman Romantic Evening',
    desc: 'Kalyan Thaat with Teevra Ma',
    durationLabel: '12s',
    notes: [
      { note: 'B3', dur: 0.7, gap: 0.8 },
      { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'E4', dur: 0.7, gap: 0.8 },
      { note: 'F#4', dur: 0.9, gap: 1.0 },
      { note: 'A4', dur: 0.7, gap: 0.8 },
      { note: 'B4', dur: 0.8, gap: 0.9 },
      { note: 'C5', dur: 1.2, gap: 1.3 },
      { note: 'B4', dur: 0.7, gap: 0.8 },
      { note: 'A4', dur: 0.7, gap: 0.8 },
      { note: 'F#4', dur: 0.8, gap: 0.9 },
      { note: 'E4', dur: 0.7, gap: 0.8 },
      { note: 'D4', dur: 0.7, gap: 0.8 },
      { note: 'C4', dur: 1.6, gap: 1.8 },
    ],
  },
  {
    id: 'raag_megh',
    title: '🌧️ 4. Raag Megh (Monsoon Rain Dhun)',
    desc: 'Lush rainy season longing',
    durationLabel: '12s',
    notes: [
      { note: 'C4', dur: 0.6, gap: 0.7 },
      { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'F4', dur: 0.8, gap: 0.9 },
      { note: 'G4', dur: 0.8, gap: 0.9 },
      { note: 'A#4', dur: 0.8, gap: 0.9 },
      { note: 'C5', dur: 1.3, gap: 1.4 },
      { note: 'D5', dur: 0.8, gap: 0.9 },
      { note: 'C5', dur: 0.8, gap: 0.9 },
      { note: 'A#4', dur: 0.7, gap: 0.8 },
      { note: 'G4', dur: 0.8, gap: 0.9 },
      { note: 'F4', dur: 0.8, gap: 0.9 },
      { note: 'D4', dur: 0.7, gap: 0.8 },
      { note: 'C4', dur: 1.6, gap: 1.8 },
    ],
  },
  {
    id: 'cinematic_flute',
    title: '🎬 5. Cinematic Film Theme (Score)',
    desc: 'Epic Hans Zimmer & ARR style',
    durationLabel: '14s',
    notes: [
      { note: 'G3', dur: 0.6, gap: 0.7 },
      { note: 'C4', dur: 0.7, gap: 0.8 },
      { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'D#4', dur: 0.9, gap: 1.0 },
      { note: 'G4', dur: 1.1, gap: 1.2 },
      { note: 'D#4', dur: 0.6, gap: 0.7 },
      { note: 'F4', dur: 0.7, gap: 0.8 },
      { note: 'D4', dur: 0.7, gap: 0.8 },
      { note: 'C4', dur: 1.0, gap: 1.1 },
      { note: 'G4', dur: 0.7, gap: 0.8 },
      { note: 'C5', dur: 1.4, gap: 1.5 },
      { note: 'A#4', dur: 0.7, gap: 0.8 },
      { note: 'G4', dur: 0.8, gap: 0.9 },
      { note: 'F4', dur: 0.7, gap: 0.8 },
      { note: 'D#4', dur: 0.7, gap: 0.8 },
      { note: 'D4', dur: 0.7, gap: 0.8 },
      { note: 'C4', dur: 1.8, gap: 2.0 },
    ],
  },
];

export default function FluteStudioScreen({ navigation }) {
  const [selectedOctave, setSelectedOctave] = useState('All');
  const [selectedRaag, setSelectedRaag] = useState('All');
  const [breathPressure, setBreathPressure] = useState(0.5);
  const [vibratoSpeed, setVibratoSpeed] = useState(5.5);
  const [isOverblown, setIsOverblown] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [currentHoles, setCurrentHoles] = useState([1, 1, 1, 0, 0, 0]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Live Tanpura Drone State
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState(false);
  const [tanpuraRoot, setTanpuraRoot] = useState('C3');

  // Demo Playing State
  const [activeDemoId, setActiveDemoId] = useState(null);
  const demoTimeoutsRef = useRef([]);

  // Preloaded Expo AV sounds cache
  const soundObjectsRef = useRef({});

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    // Preload basic octaves asynchronously in background
    const preloadList = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'];
    preloadList.forEach((n) => {
      const asset = FLUTE_SOUND_MAP[n];
      if (asset && !soundObjectsRef.current[n]) {
        Audio.Sound.createAsync(asset, { shouldPlay: false })
          .then(({ sound }) => {
            soundObjectsRef.current[n] = sound;
          })
          .catch(() => {});
      }
    });

    return () => {
      stopTanpuraDrone();
      stopDemo();
      Object.values(soundObjectsRef.current).forEach((sound) => {
        sound?.unloadAsync().catch(() => {});
      });
      soundObjectsRef.current = {};
    };
  }, []);

  // Handle Tanpura Drone toggle
  const toggleTanpura = () => {
    if (isTanpuraPlaying) {
      stopTanpuraDrone();
      setIsTanpuraPlaying(false);
    } else {
      startTanpuraDrone(tanpuraRoot, 'Pa');
      setIsTanpuraPlaying(true);
    }
  };

  // ZERO-LATENCY FAST NOTE TRIGGER (onPressIn for instant <5ms response)
  const handleFastNoteTrigger = useCallback((noteObj) => {
    setActiveNote(noteObj.note);
    setCurrentHoles(noteObj.holes || [1, 1, 1, 0, 0, 0]);

    const finalBreath = isOverblown ? Math.min(1.0, breathPressure * 1.5) : breathPressure;
    const duration = isOverblown ? 1.5 : 2.2;

    // 1. Instant zero-latency Web Audio Synthesizer (fires on immediate tick)
    playFluteNote(noteObj.note, finalBreath, vibratoSpeed, duration);

    // 2. Concurrently fire sample on mobile if preloaded
    const cachedSound = soundObjectsRef.current[noteObj.note];
    if (cachedSound) {
      cachedSound.replayAsync({ volume: finalBreath }).catch(() => {});
    } else {
      const sampleAsset = FLUTE_SOUND_MAP[noteObj.note];
      if (sampleAsset) {
        Audio.Sound.createAsync(sampleAsset, { shouldPlay: true, volume: finalBreath })
          .then(({ sound }) => {
            soundObjectsRef.current[noteObj.note] = sound;
          })
          .catch(() => {});
      }
    }
  }, [isOverblown, breathPressure, vibratoSpeed]);

  const handleNoteRelease = () => {
    setTimeout(() => setActiveNote(null), 180);
  };

  // Play Demo Song
  const playDemo = (dhun) => {
    if (activeDemoId === dhun.id) {
      stopDemo();
      return;
    }

    stopDemo();
    setActiveDemoId(dhun.id);

    let cumulativeDelay = 0;
    dhun.notes.forEach((item, idx) => {
      const timeout = setTimeout(() => {
        const targetObj = FLUTE_NOTES.find((n) => n.note === item.note) || { note: item.note, holes: [1, 1, 1, 0, 0, 0] };
        handleFastNoteTrigger(targetObj);
        setTimeout(() => setActiveNote(null), item.dur * 800);

        if (idx === dhun.notes.length - 1) {
          setTimeout(() => setActiveDemoId(null), item.gap * 1000);
        }
      }, cumulativeDelay);

      demoTimeoutsRef.current.push(timeout);
      cumulativeDelay += item.gap * 1000;
    });
  };

  const stopDemo = () => {
    demoTimeoutsRef.current.forEach((t) => clearTimeout(t));
    demoTimeoutsRef.current = [];
    setActiveDemoId(null);
  };

  // Filter notes by octave and raaga scale
  const filteredNotes = FLUTE_NOTES.filter((n) => {
    const matchesOctave = selectedOctave === 'All' || n.octave === selectedOctave;
    const matchesRaag = selectedRaag === 'All' || (n.ragas && n.ragas.includes(selectedRaag));
    return matchesOctave && matchesRaag;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ========================================================= */}
        {/* 1. STUDIO HEADER (WHITE BG & CHOCOLATE ACCENTS) */}
        {/* ========================================================= */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft color="#451A03" size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🪈 Live Bansuri Flute Studio</Text>
            <Text style={styles.subtitle}>Instant Zero-Latency Swara Resonator</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)} activeOpacity={0.75}>
            <BookOpen color="#78350F" size={15} />
            <Text style={styles.infoBtnText}>Anatomy & Ragas</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* 2. LIVE TANPURA DRONE & EMBOUCHURE CONTROLS */}
        {/* ========================================================= */}
        <View style={styles.droneCard}>
          <View style={styles.droneHeaderRow}>
            <View style={styles.droneTitleBox}>
              <Radio color="#78350F" size={16} />
              <Text style={styles.droneTitle}>Tanpura Drone (Sa-Pa Background)</Text>
            </View>

            <TouchableOpacity
              style={[styles.droneToggleBtn, isTanpuraPlaying && styles.droneToggleBtnActive]}
              onPress={toggleTanpura}
              activeOpacity={0.8}
            >
              <Text style={[styles.droneToggleText, isTanpuraPlaying && { color: '#FFF', fontWeight: '900' }]}>
                {isTanpuraPlaying ? '● DRONE ON' : '○ START DRONE'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Root Key Selector */}
          <View style={styles.tanpuraKeysRow}>
            {['C3', 'C#3', 'D3', 'D#3', 'G3', 'A3'].map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.tanpuraKeyPill, tanpuraRoot === k && styles.tanpuraKeyPillActive]}
                onPress={() => {
                  setTanpuraRoot(k);
                  if (isTanpuraPlaying) startTanpuraDrone(k, 'Pa');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tanpuraKeyText, tanpuraRoot === k && { color: '#FFF', fontWeight: '900' }]}>
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Breath, Vibrato & Overblow Controls */}
        <View style={styles.controlsCard}>
          <View style={styles.controlRow}>
            <View style={styles.controlLabelRow}>
              <Text style={styles.controlLabel}>💨 Breath Air Velocity: {Math.round(breathPressure * 100)}%</Text>
              <TouchableOpacity
                style={[styles.overblowBtn, isOverblown && styles.overblowBtnActive]}
                onPress={() => setIsOverblown(!isOverblown)}
                activeOpacity={0.7}
              >
                <Zap color={isOverblown ? '#FFF' : '#78350F'} size={12} />
                <Text style={[styles.overblowText, isOverblown && { color: '#FFF' }]}>
                  {isOverblown ? 'Taar Overblow (High)' : 'Normal Breath'}
                </Text>
              </TouchableOpacity>
            </View>
            <Slider
              value={breathPressure}
              minimumValue={0.1}
              maximumValue={1.0}
              onValueChange={setBreathPressure}
              minimumTrackTintColor="#78350F"
              maximumTrackTintColor="#E7D9D0"
              thumbTintColor="#451A03"
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>〰️ Lip Vibrato LFO: {vibratoSpeed.toFixed(1)} Hz</Text>
            <Slider
              value={vibratoSpeed}
              minimumValue={2.0}
              maximumValue={9.0}
              onValueChange={setVibratoSpeed}
              minimumTrackTintColor="#B45309"
              maximumTrackTintColor="#E7D9D0"
              thumbTintColor="#451A03"
            />
          </View>
        </View>

        {/* ========================================================= */}
        {/* 3. RAAGA SCALE & SAPTAK SELECTOR */}
        {/* ========================================================= */}
        <Text style={styles.sectionHeading}>Classical Indian Raaga Scale</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.raagScroll}>
          {RAGAS.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.raagCard, selectedRaag === r.id && styles.raagCardActive]}
              onPress={() => setSelectedRaag(r.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.raagName, selectedRaag === r.id && { color: '#FFF' }]}>{r.name}</Text>
              <Text style={[styles.raagDesc, selectedRaag === r.id && { color: '#FED7AA' }]}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Octave Saptak Filters */}
        <View style={styles.saptakTabsRow}>
          {['All', 'Mandra', 'Madhya', 'Taar'].map((oct) => (
            <TouchableOpacity
              key={oct}
              style={[styles.saptakTab, selectedOctave === oct && styles.saptakTabActive]}
              onPress={() => setSelectedOctave(oct)}
              activeOpacity={0.7}
            >
              <Text style={[styles.saptakTabText, selectedOctave === oct && styles.saptakTabTextActive]}>
                {oct === 'All' ? 'All 3 Octaves' : `${oct} Saptak`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ========================================================= */}
        {/* 4. REAL-TIME BAMBOO BANSURI FINGER HOLE VISUALIZER */}
        {/* ========================================================= */}
        <View style={styles.bambooGraphicCard}>
          <Text style={styles.bambooCardTitle}>Acoustic Finger Holes (Live Embouchure)</Text>
          <View style={styles.bambooBodyContainer}>
            {/* Embouchure Mouthpiece Hole */}
            <View style={styles.mouthpieceHole}>
              <Wind color="#451A03" size={14} />
              <Text style={styles.mouthpieceText}>Blow</Text>
            </View>

            {/* 6 Finger Holes */}
            <View style={styles.holesRow}>
              {currentHoles.map((holeStatus, idx) => (
                <View key={idx} style={styles.holeItem}>
                  <View
                    style={[
                      styles.fluteHoleCircle,
                      holeStatus === 1 && styles.holeClosed,
                      holeStatus === 0.5 && styles.holeHalf,
                      holeStatus === 0 && styles.holeOpen,
                    ]}
                  />
                  <Text style={styles.holeNumText}>H{idx + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 5. MEEND GLIDE TOUCH STRIP (CHOCOLATE BUTTONS) */}
        {/* ========================================================= */}
        <View style={styles.meendCard}>
          <View style={styles.meendHeaderRow}>
            <Waves color="#78350F" size={16} />
            <Text style={styles.meendTitle}>Real-Time Meend Portamento Glide</Text>
          </View>
          <Text style={styles.meendSub}>
            Tap a quick glissando between Sa ➔ Pa or Ga ➔ Dha with unbroken vocal continuity.
          </Text>

          <View style={styles.meendBtnsRow}>
            {[
              { label: 'Sa ➔ Pa Glide', from: 'C4', to: 'G4' },
              { label: 'Re ➔ Dha Glide', from: 'D4', to: 'A4' },
              { label: 'Ga ➔ Ni Glide', from: 'E4', to: 'B4' },
              { label: 'Pa ➔ Sa° Glide', from: 'G4', to: 'C5' },
            ].map((m, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.meendPillBtn}
                onPressIn={() => playFluteMeendGlide(m.from, m.to, 1.2, breathPressure)}
                activeOpacity={0.8}
              >
                <Sparkles color="#78350F" size={12} />
                <Text style={styles.meendPillText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ========================================================= */}
        {/* 6. 5 BEAUTIFUL DEMO PLAYS (7s - 15s) */}
        {/* ========================================================= */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeaderRow}>
            <View style={styles.demoTitleGroup}>
              <Music color="#78350F" size={16} />
              <Text style={styles.demoTitle}>5 Beautiful Demo Dhuns (7s - 15s)</Text>
            </View>
            {activeDemoId && (
              <TouchableOpacity style={styles.stopAllBtn} onPress={stopDemo} activeOpacity={0.75}>
                <Square color="#DC2626" size={11} fill="#DC2626" />
                <Text style={styles.stopAllText}>Stop Playing</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.demoCardSub}>
            Tap to listen to classical Indian and cinematic flute performances with real-time hole animations.
          </Text>

          <View style={styles.demoList}>
            {DEMO_DHUNS.map((dhun) => {
              const isPlayingThis = activeDemoId === dhun.id;

              return (
                <TouchableOpacity
                  key={dhun.id}
                  style={[styles.demoListItem, isPlayingThis && styles.demoListItemActive]}
                  onPress={() => playDemo(dhun)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.demoPlayIconBox, isPlayingThis && styles.demoPlayIconBoxActive]}>
                    {isPlayingThis ? (
                      <Square color="#FFF" size={14} fill="#FFF" />
                    ) : (
                      <Play color="#78350F" size={14} fill="#78350F" style={{ marginLeft: 2 }} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.demoListTitle, isPlayingThis && { color: '#FFF' }]} numberOfLines={1}>
                      {dhun.title}
                    </Text>
                    <Text style={[styles.demoListDesc, isPlayingThis && { color: '#FED7AA' }]} numberOfLines={1}>
                      {dhun.desc}
                    </Text>
                  </View>

                  <View style={[styles.demoDurationPill, isPlayingThis && styles.demoDurationPillActive]}>
                    <Clock color={isPlayingThis ? '#FFF' : '#78350F'} size={10} />
                    <Text style={[styles.demoDurationText, isPlayingThis && { color: '#FFF' }]}>
                      {dhun.durationLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================= */}
        {/* 7. SWARA KEYS GRID (INSTANT ZERO-LATENCY TOUCH TRIGGER) */}
        {/* ========================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Finger Holes (Instant Touch Response)</Text>
          <Text style={styles.noteCountText}>{filteredNotes.length} Swaras</Text>
        </View>

        <View style={styles.notesGrid}>
          {filteredNotes.map((item) => {
            const isPlaying = activeNote === item.note;
            return (
              <TouchableOpacity
                key={item.note}
                style={[styles.noteHoleCard, isPlaying && styles.noteHoleCardActive]}
                onPressIn={() => handleFastNoteTrigger(item)}
                onPressOut={handleNoteRelease}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={
                    isPlaying
                      ? ['#5C2C16', '#3E1F10']
                      : ['#FFFFFF', '#FDFBF9']
                  }
                  style={styles.holeGradient}
                >
                  <View
                    style={[
                      styles.holeCircle,
                      isPlaying ? { backgroundColor: '#FFD7A8', borderColor: '#FFF' } : { backgroundColor: '#F5EBE6', borderColor: '#78350F' },
                    ]}
                  />
                  <Text style={[styles.swaraText, isPlaying ? { color: '#FFF' } : { color: '#451A03' }]}>
                    {item.swara}
                  </Text>
                  <Text style={[styles.noteNameText, isPlaying ? { color: '#FED7AA' } : { color: '#78350F' }]}>
                    {item.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ========================================================= */}
      {/* 8. ANATOMY & RAGAS MODAL */}
      {/* ========================================================= */}
      <Modal visible={showInfoModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🪈 Bansuri Anatomy & Acoustics</Text>
                <Text style={styles.modalSubtitle}>Lord Krishna Lore, Saptaks & Microtonal Gamak</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X color="#451A03" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoSectionTitle}>1. Mythological Lore & Lord Krishna</Text>
              <Text style={styles.infoBody}>
                The Bansuri is one of the world's most sacred instruments. In Indian philosophy, <Text style={{ color: '#78350F', fontWeight: 'bold' }}>Lord Krishna</Text> played the divine flute (Venu / Murali) to harmonize the universe and evoke divine love.
              </Text>

              <Text style={styles.infoSectionTitle}>2. Acoustic Physics & Standing Waves</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ color: '#78350F', fontWeight: 'bold' }}>Embouchure (Mukha-randhra):</Text> Air splits over the sharp outer bamboo lip, creating oscillating vortices.
                {'\n'}• <Text style={{ color: '#78350F', fontWeight: 'bold' }}>6 Svara Holes:</Text> Covering 3 holes produces fundamental tonic <Text style={{ color: '#B45309', fontWeight: 'bold' }}>Sa (C4)</Text>.
                {'\n'}• <Text style={{ color: '#78350F', fontWeight: 'bold' }}>Overblowing:</Text> Doubling blowing velocity excites the 2nd harmonic, jumping the flute an octave higher into Taar Saptak.
              </Text>

              <Text style={styles.infoSectionTitle}>3. Microtonal Half-Hole (Komal / Teevra)</Text>
              <Text style={styles.infoBody}>
                By partially sliding finger pads across hole edges (Gamak / Meend), flutists produce continuous microtonal pitch bends.
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
    padding: 16,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    marginRight: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    color: '#451A03',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#78350F',
    fontSize: 10,
    fontWeight: '600',
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7C2B4',
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBtnText: {
    color: '#78350F',
    fontSize: 10,
    fontWeight: '700',
  },
  droneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7E1',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  droneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  droneTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  droneTitle: {
    color: '#451A03',
    fontSize: 12,
    fontWeight: '800',
  },
  droneToggleBtn: {
    backgroundColor: '#F7F2EF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#78350F',
  },
  droneToggleBtnActive: {
    backgroundColor: '#78350F',
    borderColor: '#451A03',
  },
  droneToggleText: {
    color: '#78350F',
    fontSize: 10,
    fontWeight: '800',
  },
  tanpuraKeysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tanpuraKeyPill: {
    flex: 1,
    backgroundColor: '#F9F6F3',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7D9D0',
  },
  tanpuraKeyPillActive: {
    backgroundColor: '#78350F',
    borderColor: '#451A03',
  },
  tanpuraKeyText: {
    color: '#5C3827',
    fontSize: 10,
    fontWeight: '800',
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7E1',
    padding: 14,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  controlRow: {},
  controlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  controlLabel: {
    color: '#451A03',
    fontSize: 11,
    fontWeight: '800',
  },
  overblowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F2EF',
    borderColor: '#78350F',
    borderWidth: 1.5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  overblowBtnActive: {
    backgroundColor: '#78350F',
    borderColor: '#451A03',
  },
  overblowText: {
    color: '#78350F',
    fontSize: 9,
    fontWeight: '800',
  },
  sectionHeading: {
    color: '#451A03',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
    marginTop: 4,
  },
  raagScroll: {
    marginBottom: 12,
  },
  raagCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7D9D0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    minWidth: 130,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  raagCardActive: {
    borderColor: '#451A03',
    backgroundColor: '#78350F',
  },
  raagName: {
    color: '#451A03',
    fontSize: 11,
    fontWeight: '900',
  },
  raagDesc: {
    color: '#8C6753',
    fontSize: 9,
    marginTop: 2,
  },
  saptakTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EFE7E1',
    padding: 3,
    borderRadius: 12,
    marginBottom: 14,
    gap: 4,
  },
  saptakTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
  },
  saptakTabActive: {
    backgroundColor: '#78350F',
  },
  saptakTabText: {
    color: '#5C3827',
    fontSize: 10,
    fontWeight: '800',
  },
  saptakTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  bambooGraphicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7E1',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bambooCardTitle: {
    color: '#78350F',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  bambooBodyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8DC',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#D7C2B4',
  },
  mouthpieceHole: {
    alignItems: 'center',
    backgroundColor: '#E4D3C2',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#78350F',
  },
  mouthpieceText: {
    color: '#451A03',
    fontSize: 8,
    fontWeight: '900',
  },
  holesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  holeItem: {
    alignItems: 'center',
    gap: 3,
  },
  fluteHoleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#451A03',
  },
  holeClosed: {
    backgroundColor: '#451A03',
  },
  holeHalf: {
    backgroundColor: '#B45309',
    borderColor: '#451A03',
  },
  holeOpen: {
    backgroundColor: '#FFFFFF',
    borderColor: '#78350F',
  },
  holeNumText: {
    color: '#78350F',
    fontSize: 8,
    fontWeight: '800',
  },
  meendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7E1',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  meendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  meendTitle: {
    color: '#451A03',
    fontSize: 12,
    fontWeight: '900',
  },
  meendSub: {
    color: '#78350F',
    fontSize: 9,
    marginBottom: 10,
  },
  meendBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  meendPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
    borderWidth: 1.5,
    borderColor: '#D7C2B4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
  },
  meendPillText: {
    color: '#451A03',
    fontSize: 10,
    fontWeight: '800',
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7E1',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoTitle: {
    color: '#451A03',
    fontSize: 12,
    fontWeight: '900',
  },
  stopAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    gap: 4,
  },
  stopAllText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  demoCardSub: {
    color: '#78350F',
    fontSize: 9,
    marginBottom: 10,
  },
  demoList: {
    gap: 8,
  },
  demoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
    borderWidth: 1.5,
    borderColor: '#E7D9D0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
  },
  demoListItemActive: {
    backgroundColor: '#78350F',
    borderColor: '#451A03',
  },
  demoPlayIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7C2B4',
  },
  demoPlayIconBoxActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  demoListTitle: {
    color: '#451A03',
    fontSize: 11,
    fontWeight: '900',
  },
  demoListDesc: {
    color: '#8C6753',
    fontSize: 9,
    marginTop: 1,
  },
  demoDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7C2B4',
    gap: 4,
  },
  demoDurationPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'transparent',
  },
  demoDurationText: {
    color: '#78350F',
    fontSize: 9,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#451A03',
    fontSize: 13,
    fontWeight: '900',
  },
  noteCountText: {
    color: '#78350F',
    fontSize: 11,
    fontWeight: '800',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteHoleCard: {
    width: '31%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E7D9D0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  noteHoleCardActive: {
    borderColor: '#451A03',
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.2,
  },
  holeGradient: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  holeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginBottom: 5,
  },
  swaraText: {
    fontSize: 16,
    fontWeight: '900',
  },
  noteNameText: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 24, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D7C2B4',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#451A03',
    fontSize: 16,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#78350F',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  infoSectionTitle: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 4,
  },
  infoBody: {
    color: '#451A03',
    fontSize: 11,
    lineHeight: 17,
  },
});
