import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  PanResponder,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import Slider from '@react-native-community/slider';
import {
  ChevronLeft,
  Circle,
  Square,
  Clock,
  Sparkles,
  ChevronDown,
  Play,
  X,
  Volume2,
} from 'lucide-react-native';
import { SOUND_MAP } from './SoundMap';
import { playPianoNote } from '../../services/synthAudioEngine';

const DEFAULT_KEY_WIDTH = 56;
const SOUND_POOL_LIMIT = 60;

const SCALES = {
  Off: [],
  'C Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'A Minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  'G Major': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  Pentatonic: ['C', 'D', 'E', 'G', 'A'],
  Blues: ['C', 'D#', 'F', 'F#', 'G', 'A#'],
};

const PRESETS = ['Grand', 'Studio', 'Vintage'];

const DEMO_SONGS = [
  {
    title: '🎂 Happy Birthday',
    octave: 4,
    notes: [
      { note: 'C4', dur: 0.3, gap: 0.4 }, { note: 'C4', dur: 0.3, gap: 0.4 }, { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'C4', dur: 0.6, gap: 0.7 }, { note: 'F4', dur: 0.6, gap: 0.7 }, { note: 'E4', dur: 1.0, gap: 1.1 },
      { note: 'C4', dur: 0.3, gap: 0.4 }, { note: 'C4', dur: 0.3, gap: 0.4 }, { note: 'D4', dur: 0.6, gap: 0.7 },
      { note: 'C4', dur: 0.6, gap: 0.7 }, { note: 'G4', dur: 0.6, gap: 0.7 }, { note: 'F4', dur: 1.0, gap: 1.1 },
      { note: 'C4', dur: 0.3, gap: 0.4 }, { note: 'C4', dur: 0.3, gap: 0.4 }, { note: 'C5', dur: 0.6, gap: 0.7 },
      { note: 'A4', dur: 0.6, gap: 0.7 }, { note: 'F4', dur: 0.6, gap: 0.7 }, { note: 'E4', dur: 0.6, gap: 0.7 }, { note: 'D4', dur: 1.0, gap: 1.1 },
      { note: 'A#4', dur: 0.3, gap: 0.4 }, { note: 'A#4', dur: 0.3, gap: 0.4 }, { note: 'A4', dur: 0.6, gap: 0.7 },
      { note: 'F4', dur: 0.6, gap: 0.7 }, { note: 'G4', dur: 0.6, gap: 0.7 }, { note: 'F4', dur: 1.2, gap: 1.3 },
    ],
  },
  {
    title: '🌟 Twinkle Twinkle Little Star',
    octave: 4,
    notes: [
      { note: 'C4', dur: 0.4, gap: 0.5 }, { note: 'C4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.4, gap: 0.5 },
      { note: 'A4', dur: 0.4, gap: 0.5 }, { note: 'A4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.8, gap: 0.9 },
      { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.4, gap: 0.5 },
      { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'C4', dur: 0.8, gap: 0.9 },
    ],
  },
  {
    title: '🎼 Für Elise (Beethoven)',
    octave: 4,
    notes: [
      { note: 'E5', dur: 0.3, gap: 0.35 }, { note: 'D#5', dur: 0.3, gap: 0.35 }, { note: 'E5', dur: 0.3, gap: 0.35 },
      { note: 'D#5', dur: 0.3, gap: 0.35 }, { note: 'E5', dur: 0.3, gap: 0.35 }, { note: 'B4', dur: 0.3, gap: 0.35 },
      { note: 'D5', dur: 0.3, gap: 0.35 }, { note: 'C5', dur: 0.3, gap: 0.35 }, { note: 'A4', dur: 0.7, gap: 0.8 },
      { note: 'C4', dur: 0.3, gap: 0.35 }, { note: 'E4', dur: 0.3, gap: 0.35 }, { note: 'A4', dur: 0.3, gap: 0.35 }, { note: 'B4', dur: 0.7, gap: 0.8 },
    ],
  },
  {
    title: '🔔 Jingle Bells',
    octave: 4,
    notes: [
      { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'E4', dur: 0.6, gap: 0.7 },
      { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'E4', dur: 0.6, gap: 0.7 },
      { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'G4', dur: 0.3, gap: 0.4 }, { note: 'C4', dur: 0.3, gap: 0.4 },
      { note: 'D4', dur: 0.3, gap: 0.4 }, { note: 'E4', dur: 0.9, gap: 1.0 },
    ],
  },
  {
    title: '🎺 Ode to Joy (Beethoven)',
    octave: 4,
    notes: [
      { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.4, gap: 0.5 },
      { note: 'G4', dur: 0.4, gap: 0.5 }, { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 },
      { note: 'C4', dur: 0.4, gap: 0.5 }, { note: 'C4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.4, gap: 0.5 },
      { note: 'E4', dur: 0.6, gap: 0.7 }, { note: 'D4', dur: 0.2, gap: 0.3 }, { note: 'D4', dur: 0.8, gap: 0.9 },
    ],
  },
  {
    title: '🐑 Mary Had a Little Lamb',
    octave: 4,
    notes: [
      { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'C4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 },
      { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'E4', dur: 0.8, gap: 0.9 },
      { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.8, gap: 0.9 },
      { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.8, gap: 0.9 },
    ],
  },
  {
    title: '🚣 Row Row Row Your Boat',
    octave: 4,
    notes: [
      { note: 'C4', dur: 0.6, gap: 0.7 }, { note: 'C4', dur: 0.6, gap: 0.7 }, { note: 'C4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.2, gap: 0.3 },
      { note: 'E4', dur: 0.6, gap: 0.7 }, { note: 'E4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.2, gap: 0.3 }, { note: 'E4', dur: 0.4, gap: 0.5 },
      { note: 'F4', dur: 0.2, gap: 0.3 }, { note: 'G4', dur: 1.0, gap: 1.1 },
    ],
  },
  {
    title: '🚜 Old MacDonald Had a Farm',
    octave: 4,
    notes: [
      { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'F4', dur: 0.4, gap: 0.5 }, { note: 'C4', dur: 0.4, gap: 0.5 },
      { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'D4', dur: 0.4, gap: 0.5 }, { note: 'C4', dur: 0.8, gap: 0.9 },
      { note: 'A4', dur: 0.4, gap: 0.5 }, { note: 'A4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.4, gap: 0.5 }, { note: 'G4', dur: 0.4, gap: 0.5 },
      { note: 'F4', dur: 0.8, gap: 0.9 },
    ],
  },
  {
    title: '🏛️ Canon in D (Pachelbel)',
    octave: 4,
    notes: [
      { note: 'F#5', dur: 0.5, gap: 0.6 }, { note: 'E5', dur: 0.5, gap: 0.6 }, { note: 'D5', dur: 0.5, gap: 0.6 }, { note: 'C#5', dur: 0.5, gap: 0.6 },
      { note: 'B4', dur: 0.5, gap: 0.6 }, { note: 'A4', dur: 0.5, gap: 0.6 }, { note: 'B4', dur: 0.5, gap: 0.6 }, { note: 'C#5', dur: 0.5, gap: 0.6 },
    ],
  },
  {
    title: '🎷 Pink Panther Theme',
    octave: 4,
    notes: [
      { note: 'D#4', dur: 0.2, gap: 0.3 }, { note: 'E4', dur: 0.5, gap: 0.6 },
      { note: 'F#4', dur: 0.2, gap: 0.3 }, { note: 'G4', dur: 0.5, gap: 0.6 },
      { note: 'D#4', dur: 0.2, gap: 0.3 }, { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'F#4', dur: 0.2, gap: 0.3 }, { note: 'G4', dur: 0.3, gap: 0.4 },
      { note: 'C5', dur: 0.3, gap: 0.4 }, { note: 'B4', dur: 0.3, gap: 0.4 }, { note: 'E4', dur: 0.3, gap: 0.4 }, { note: 'G4', dur: 0.3, gap: 0.4 }, { note: 'B4', dur: 0.8, gap: 0.9 },
    ],
  },
];

const generate88Notes = () => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let result = [];
  
  result.push({ note: 'A', octave: 0, id: 'A0' });
  result.push({ note: 'A#', octave: 0, id: 'A#0' });
  result.push({ note: 'B', octave: 0, id: 'B0' });
  
  for (let oct = 1; oct <= 7; oct++) {
    notes.forEach((n) => result.push({ note: n, octave: oct, id: `${n}${oct}` }));
  }
  
  result.push({ note: 'C', octave: 8, id: 'C8' });
  return result;
};

export default function PianoStudioScreen({ navigation }) {
  const [activeKeys, setActiveKeys] = useState({});
  const [isSustainOn, setIsSustainOn] = useState(false);
  const [activePreset, setActivePreset] = useState('Grand');
  const [selectedScale, setSelectedScale] = useState('Off');
  
  // Metronome State
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatPulse, setBeatPulse] = useState(false);

  // Demo Song Auto-Play State
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [activeDemoIndex, setActiveDemoIndex] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const demoTimeoutsRef = useRef([]);

  const soundRefs = useRef({});
  const soundUsageOrder = useRef([]);
  const [keyWidth] = useState(DEFAULT_KEY_WIDTH);

  const scrollViewRef = useRef(null);
  const scrollOffset = useRef(0);
  const currentPlayingKey = useRef(null);

  const [volume, setVolume] = useState(0.9);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [currentRecording, setCurrentRecording] = useState([]);
  const activeNotesTiming = useRef({});

  const keys = useRef(generate88Notes()).current;
  const totalWhiteKeys = keys.filter((k) => !k.note.includes('#')).length; // 52
  const totalKeyboardWidth = totalWhiteKeys * keyWidth;
  const { width: screenW, height: screenH } = useWindowDimensions();
  const maxScrollOffset = Math.max(0, totalKeyboardWidth - screenW);

  useEffect(() => {
    const setupAudioAndOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {}
    };
    setupAudioAndOrientation();

    // Preload essential octaves 3, 4, 5 in background
    const preloadList = [
      'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6',
    ];
    preloadList.forEach((noteId) => {
      const audioAsset = SOUND_MAP[noteId];
      if (audioAsset) {
        Audio.Sound.createAsync(audioAsset, { shouldPlay: false })
          .then(({ sound }) => {
            soundRefs.current[noteId] = sound;
            soundUsageOrder.current.push(noteId);
          })
          .catch(() => {});
      }
    });

    return () => {
      stopDemo();
      ScreenOrientation.unlockAsync().catch(() => {});
      Object.values(soundRefs.current).forEach((sound) => sound?.unloadAsync().catch(() => {}));
      soundRefs.current = {};
      soundUsageOrder.current = [];
    };
  }, []);

  // Metronome Timer Engine
  useEffect(() => {
    let interval = null;
    if (isMetronomeOn) {
      const intervalMs = (60 / bpm) * 1000;
      interval = setInterval(() => {
        setBeatPulse(true);
        setTimeout(() => setBeatPulse(false), 100);

        playPianoNote('C7', 0.25, false, 0.1);
      }, intervalMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMetronomeOn, bpm]);

  const stopDemo = () => {
    demoTimeoutsRef.current.forEach((t) => clearTimeout(t));
    demoTimeoutsRef.current = [];
    setIsPlayingDemo(false);
    setActiveDemoIndex(null);
    setActiveKeys({});
  };

  const playDemoSong = (index) => {
    stopDemo();
    const song = DEMO_SONGS[index];
    if (!song) return;

    setActiveDemoIndex(index);
    setIsPlayingDemo(true);
    setIsDemoModalOpen(false);

    jumpToOctave(song.octave);

    let cumulativeDelay = 300;

    song.notes.forEach((item, nIdx) => {
      const t1 = setTimeout(() => {
        playNote(item.note);
        setActiveKeys({ [item.note]: true });

        const t2 = setTimeout(() => {
          setActiveKeys({});
        }, item.dur * 1000);

        demoTimeoutsRef.current.push(t2);

        if (nIdx === song.notes.length - 1) {
          const tEnd = setTimeout(() => {
            setIsPlayingDemo(false);
            setActiveDemoIndex(null);
            setActiveKeys({});
          }, item.gap * 1000 + 400);
          demoTimeoutsRef.current.push(tEnd);
        }
      }, cumulativeDelay);

      demoTimeoutsRef.current.push(t1);
      cumulativeDelay += item.gap * 1000;
    });
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setCurrentRecording([]);
      activeNotesTiming.current = {};
    } else {
      setIsRecording(false);
      if (currentRecording.length > 0) {
        navigation.navigate('RecordingLibrary', { 
          newRecording: { instrument: 'Piano', data: currentRecording },
        });
      }
    }
  };

  // FAST ZERO-LATENCY NOTE PLAY (<3ms Response)
  const playNote = useCallback((noteId) => {
    setActiveKeys((prev) => ({ ...prev, [noteId]: true }));
    
    if (isRecording) {
      activeNotesTiming.current[noteId] = Date.now();
    }

    // 1. Instant zero-latency physical modeling synthesizer
    playPianoNote(noteId, volume, isSustainOn, 2.8);

    // 2. Concurrently fire acoustic master sample if available
    try {
      const cachedSound = soundRefs.current[noteId];
      if (cachedSound) {
        soundUsageOrder.current = soundUsageOrder.current.filter((id) => id !== noteId);
        soundUsageOrder.current.push(noteId);
        cachedSound.replayAsync({ positionMillis: 0, shouldPlay: true, volume: volume }).catch(() => {});
      } else {
        if (soundUsageOrder.current.length >= SOUND_POOL_LIMIT) {
          const evictedId = soundUsageOrder.current.shift();
          if (evictedId && soundRefs.current[evictedId]) {
            soundRefs.current[evictedId].unloadAsync().catch(() => {});
            delete soundRefs.current[evictedId];
          }
        }

        const audioAsset = SOUND_MAP[noteId] || SOUND_MAP['C4'];
        if (audioAsset) {
          Audio.Sound.createAsync(audioAsset, { shouldPlay: true, volume: volume })
            .then(({ sound: newSound }) => {
              soundRefs.current[noteId] = newSound;
              soundUsageOrder.current.push(noteId);
            })
            .catch(() => {});
        }
      }
    } catch (e) {}
  }, [volume, isSustainOn, isRecording]);

  const releaseNote = useCallback((noteId) => {
    if (!isSustainOn) {
      setActiveKeys((prev) => ({ ...prev, [noteId]: false }));
    } else {
      setTimeout(() => {
        setActiveKeys((prev) => ({ ...prev, [noteId]: false }));
      }, 700);
    }

    if (isRecording && activeNotesTiming.current[noteId] !== undefined) {
      const startTime = activeNotesTiming.current[noteId];
      const duration = (Date.now() - startTime) / 1000;
      const relativeTime = (startTime - recordingStartTime) / 1000;
      
      setCurrentRecording((prev) => [
        ...prev,
        { note: noteId, time: relativeTime, duration: duration },
      ]);
      delete activeNotesTiming.current[noteId];
    }
  }, [isSustainOn, isRecording, recordingStartTime]);

  const jumpToOctave = (octaveNum) => {
    const whiteKeysBefore = 2 + (octaveNum - 1) * 7;
    let newOffset = whiteKeysBefore * keyWidth;
    newOffset = Math.max(0, Math.min(newOffset, maxScrollOffset));
    
    scrollViewRef.current?.scrollTo({ x: newOffset, animated: true });
    scrollOffset.current = newOffset;
  };

  const isNoteInSelectedScale = (noteName) => {
    const targetScale = SCALES[selectedScale];
    if (!targetScale || targetScale.length === 0) return false;
    return targetScale.includes(noteName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color="#FFF" size={26} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleRecording} 
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            activeOpacity={0.75}
          >
            {isRecording ? <Square color="#FFF" size={14} /> : <Circle color="#FFF" size={14} fill="#ff4444" />}
            <Text style={styles.recordBtnText}>{isRecording ? 'STOP' : 'REC'}</Text>
          </TouchableOpacity>

          {/* Sustain Pedal Toggle Button */}
          <TouchableOpacity 
            onPress={() => setIsSustainOn(!isSustainOn)} 
            style={[styles.sustainBtn, isSustainOn && styles.sustainBtnActive]}
            activeOpacity={0.75}
          >
            <View style={[styles.ledIndicator, isSustainOn && styles.ledActive]} />
            <Text style={[styles.sustainText, isSustainOn && { color: '#FFD700' }]}>
              {isSustainOn ? 'SUSTAIN ON' : 'SUSTAIN OFF'}
            </Text>
          </TouchableOpacity>

          {/* Metronome Toggle Button */}
          <TouchableOpacity 
            onPress={() => setIsMetronomeOn(!isMetronomeOn)} 
            style={[styles.metroBtn, isMetronomeOn && styles.metroBtnActive]}
            activeOpacity={0.75}
          >
            <Clock color={isMetronomeOn ? '#00E5FF' : '#AAA'} size={14} />
            <View style={[styles.ledIndicator, beatPulse && styles.beatActive]} />
            <Text style={[styles.metroText, isMetronomeOn && { color: '#00E5FF' }]}>
              {bpm} BPM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tone Preset Switcher */}
        <View style={styles.presetGroup}>
          {PRESETS.map((p) => (
            <TouchableOpacity 
              key={p} 
              onPress={() => setActivePreset(p)} 
              style={[styles.presetPill, activePreset === p && styles.presetPillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.presetText, activePreset === p && styles.presetTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 10 Song Demo Selector & Volume */}
        <View style={styles.settingsContainer}>
          {isPlayingDemo ? (
            <TouchableOpacity style={styles.stopDemoBtn} onPress={stopDemo} activeOpacity={0.8}>
              <Square color="#FFF" size={13} fill="#FFF" />
              <Text style={styles.stopDemoText}>Stop Demo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.demoDropdownBtn} onPress={() => setIsDemoModalOpen(true)} activeOpacity={0.8}>
              <Play color="#FFD700" size={13} fill="#FFD700" />
              <Text style={styles.demoDropdownText}>
                {activeDemoIndex !== null ? DEMO_SONGS[activeDemoIndex].title : 'Select Demo Song'}
              </Text>
              <ChevronDown color="#FFD700" size={14} />
            </TouchableOpacity>
          )}

          {/* Volume Control */}
          <View style={styles.sliderRow}>
            <Volume2 color="#FFF" size={13} />
            <Slider 
              style={{ width: 75, height: 20 }} 
              minimumValue={0.1}
              maximumValue={1.0}
              value={volume} 
              onValueChange={setVolume}
              minimumTrackTintColor="#FFD700"
              maximumTrackTintColor="#555"
              thumbTintColor="#FFF"
            />
          </View>
        </View>
      </View>

      {/* GANDHARVA Brand Badge */}
      <View style={styles.brandPlate}>
        <View style={styles.brandLineLeft} />
        <Sparkles color="#FF2D55" size={13} />
        <Text style={styles.brandTitle}>G A N D H A R V A</Text>
        <Text style={styles.brandSubtitle}>PIANO STUDIO</Text>
        <Sparkles color="#FF69B4" size={13} />
        <View style={styles.brandLineRight} />
      </View>

      {/* Octave & Scale Guide Jumper */}
      <View style={styles.octaveJumperContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.octaveJumperContent}>
          {/* Octave Jumps */}
          {[1, 2, 3, 4, 5, 6, 7].map((oct) => (
            <TouchableOpacity key={oct} style={styles.octaveBtn} onPress={() => jumpToOctave(oct)} activeOpacity={0.7}>
              <Text style={styles.octaveBtnText}>Oct {oct}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.vDivider} />

          {/* Scale Guide Selector */}
          <Text style={styles.scaleGuideLabel}>Scale Guide:</Text>
          {Object.keys(SCALES).map((s) => (
            <TouchableOpacity 
              key={s} 
              style={[styles.scalePill, selectedScale === s && styles.scalePillActive]} 
              onPress={() => setSelectedScale(s)}
              activeOpacity={0.75}
            >
              <Text style={[styles.scalePillText, selectedScale === s && styles.scalePillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Keyboard Area with Direct Pressable Keys */}
      <View style={styles.keyboardWrapper}>
        <ScrollView 
          horizontal 
          ref={scrollViewRef}
          scrollEnabled={!isPlayingDemo} 
          onScroll={(e) => {
            scrollOffset.current = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          style={styles.keyboardScroll} 
          showsHorizontalScrollIndicator={false} 
          bounces={false}
        >
          {/* 1. White Keys Row */}
          <View style={styles.keyboard}>
            {keys.filter((k) => !k.note.includes('#')).map((k) => {
              const isActive = !!activeKeys[k.id];
              const isHighlighted = isNoteInSelectedScale(k.note);

              return (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.whiteKeyContainer, { width: keyWidth }]}
                  onPressIn={() => playNote(k.id)}
                  onPressOut={() => releaseNote(k.id)}
                  activeOpacity={1}
                >
                  <LinearGradient
                    colors={isActive ? ['#D0D0D0', '#A0A0A0'] : ['#FFFFFF', '#E0E0E0']}
                    style={styles.whiteKeyGradient}
                  >
                    <View style={styles.whiteKeyInnerShadow} />
                    {isHighlighted && <View style={styles.scaleDotWhite} />}
                    <Text style={[styles.whiteKeyText, isActive && { color: '#000', fontWeight: '900' }]}>
                      {k.id}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Black Keys Floating Row */}
          <View style={styles.blackKeysContainer} pointerEvents="box-none">
            {(() => {
              let whiteIndex = 0;
              return keys.map((k) => {
                if (k.note.includes('#')) {
                  const leftPos = (whiteIndex * keyWidth) - ((keyWidth * 0.68) / 2);
                  const isActive = !!activeKeys[k.id];
                  const isHighlighted = isNoteInSelectedScale(k.note.replace('#', ''));

                  return (
                    <TouchableOpacity
                      key={k.id}
                      style={{
                        position: 'absolute',
                        left: leftPos,
                        width: keyWidth * 0.68,
                        height: '62%',
                        zIndex: 100,
                      }}
                      onPressIn={() => playNote(k.id)}
                      onPressOut={() => releaseNote(k.id)}
                      activeOpacity={1}
                    >
                      <View style={[styles.blackKeyWrapper, { width: '100%' }]}>
                        <View style={[styles.blackKeyContainer, isActive && styles.blackKeyActive]}>
                          <View style={styles.blackKeyHighlight} />
                          {isHighlighted && <View style={styles.scaleDotBlack} />}
                          <View style={styles.blackKeyBottomReflect} />
                          <Text style={[styles.blackKeyText, isActive && { color: '#FFD700' }]}>
                            {k.id}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                } else {
                  whiteIndex++;
                  return null;
                }
              });
            })()}
          </View>
        </ScrollView>
      </View>

      {/* 10 Song Demo Selection Modal */}
      <Modal
        visible={isDemoModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDemoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎵 10 Classic Piano Song Demos</Text>
              <TouchableOpacity onPress={() => setIsDemoModalOpen(false)}>
                <X color="#FFF" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {DEMO_SONGS.map((song, idx) => (
                <TouchableOpacity
                  key={song.title}
                  style={[styles.songItem, activeDemoIndex === idx && styles.songItemActive]}
                  onPress={() => playDemoSong(idx)}
                >
                  <Text style={[styles.songItemText, activeDemoIndex === idx && { color: '#FFD700' }]}>
                    {song.title}
                  </Text>
                  <Play color={activeDemoIndex === idx ? '#FFD700' : '#AAA'} size={15} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 52,
    backgroundColor: '#0A0A0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#444',
    gap: 5,
  },
  recordBtnActive: {
    backgroundColor: '#990000',
    borderColor: '#FF0000',
  },
  recordBtnText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sustainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  sustainBtnActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  metroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#444',
    gap: 4,
  },
  metroBtnActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  metroText: {
    color: '#AAA',
    fontSize: 9,
    fontWeight: 'bold',
  },
  ledIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
    marginRight: 4,
  },
  ledActive: {
    backgroundColor: '#FFD700',
  },
  beatActive: {
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowRadius: 5,
    elevation: 4,
  },
  sustainText: {
    color: '#AAA',
    fontSize: 9,
    fontWeight: 'bold',
  },
  presetGroup: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  presetPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presetPillActive: {
    backgroundColor: '#333',
  },
  presetText: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
  },
  presetTextActive: {
    color: '#FFF',
  },
  settingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  demoDropdownText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stopDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  stopDemoText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandPlate: {
    height: 24,
    backgroundColor: '#080808',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  brandLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
    marginRight: 10,
  },
  brandLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
    marginLeft: 10,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: '#FF69B4',
    fontSize: 8,
    fontWeight: 'bold',
  },
  octaveJumperContainer: {
    height: 38,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  octaveJumperContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  octaveBtn: {
    backgroundColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  octaveBtnText: {
    color: '#CCC',
    fontSize: 9,
    fontWeight: 'bold',
  },
  vDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  scaleGuideLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 2,
  },
  scalePill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  scalePillActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  scalePillText: {
    color: '#AAA',
    fontSize: 9,
  },
  scalePillTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  keyboardWrapper: {
    flex: 1,
    backgroundColor: '#050505',
  },
  keyboardScroll: {
    flex: 1,
  },
  keyboard: {
    flexDirection: 'row',
    height: '100%',
  },
  whiteKeyContainer: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRightWidth: 1,
    borderRightColor: '#BBB',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  whiteKeyGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  whiteKeyInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  whiteKeyText: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
  },
  blackKeysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blackKeyWrapper: {
    height: '100%',
  },
  blackKeyContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 8,
  },
  blackKeyActive: {
    backgroundColor: '#333',
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700',
  },
  blackKeyHighlight: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
  },
  blackKeyBottomReflect: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#000',
  },
  blackKeyText: {
    color: '#888',
    fontSize: 8,
    fontWeight: '700',
  },
  scaleDotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
    marginBottom: 4,
  },
  scaleDotBlack: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E5FF',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 340,
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#222',
    marginBottom: 6,
  },
  songItemActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  songItemText: {
    color: '#EEE',
    fontSize: 11,
    fontWeight: '600',
  },
});
