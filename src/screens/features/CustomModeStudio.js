import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Mic, Sliders, ChevronLeft, ChevronRight, Music, Play, CheckCircle2, Star } from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import apiClient from '../../services/apiClient';

// Wizard Steps Mapping
const STEPS = {
  ANALYZING: 'analyzing',
  DREAM_SONG: 'dream_song',
  TIMELINE: 'timeline',
  ATMOSPHERE: 'atmosphere',
  GENRE: 'genre',
  INSTRUMENTS: 'instruments',
  ENERGY: 'energy',
  BLUEPRINTS: 'blueprints',
  GENERATING: 'generating',
  DONE: 'done'
};

const ATMOSPHERES = ['🌧 Rain', '🌃 Midnight', '🌊 Ocean', '🌄 Sunrise', '🏞 Village', '🏛 Temple', '🌌 Space'];
const GENRES = ['❤️ Romantic', '🎬 Cinematic', '🎻 Classical', '🔥 Mass', '🌴 Folk', '🎧 Lo-Fi', '🌧 Sad Melody'];
const INSTRUMENTS_LIST = ['Piano', 'Violin', 'Strings', 'Guitar', 'Flute', 'Drums', 'Bass', 'Tabla', 'Veena'];

export default function CustomModeStudio({ vocalFile, onReset }) {
  const [step, setStep] = useState(STEPS.ANALYZING);
  const [jobId, setJobId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [blueprints, setBlueprints] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  // User Choices State
  const [dreamSong, setDreamSong] = useState('');
  const [selectedAtmosphere, setSelectedAtmosphere] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState([]);
  const [selectedInstruments, setSelectedInstruments] = useState({});
  const [energyCurve, setEnergyCurve] = useState({ intro: 'Medium', verse: 'Medium', chorus: 'Medium', outro: 'Medium' });

  useEffect(() => {
    if (vocalFile && step === STEPS.ANALYZING) {
      startAnalysis();
    }
  }, []);

  const startAnalysis = async () => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: vocalFile.uri,
        name: vocalFile.name || 'vocal.wav',
        type: vocalFile.mimeType || 'audio/wav',
      });
      
      const response = await apiClient.post('/vocal-studio/custom/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.status === 'success') {
        setJobId(response.data.job_id);
        setAnalysis(response.data.analysis);
        setStep(STEPS.DREAM_SONG);
      }
    } catch (err) {
      Alert.alert('Analysis Failed', err.message);
      onReset();
    }
  };

  const generateBlueprints = async () => {
    setStep(STEPS.BLUEPRINTS);
    try {
      const response = await apiClient.post('/vocal-studio/custom/blueprints', {
        job_id: jobId,
        dream_prompt: dreamSong,
        atmosphere: selectedAtmosphere,
        genre: selectedGenre,
        instruments: selectedInstruments,
        energy_curve: energyCurve
      });
      
      if (response.data.status === 'success') {
        setBlueprints(response.data.blueprints);
      }
    } catch (err) {
      Alert.alert('Failed to generate blueprints', err.message);
      setStep(STEPS.ENERGY); // go back
    }
  };

  const selectBlueprintAndGenerate = async (candidateKey) => {
    setStep(STEPS.GENERATING);
    try {
      const response = await apiClient.post('/vocal-studio/custom/generate', {
        job_id: jobId,
        selected_candidate: candidateKey
      });
      
      // Normally we'd poll here, but for UI mockup we wait 10s and fetch dummy or mock
      setTimeout(() => {
         setStep(STEPS.DONE);
         // setFinalResult(...)
      }, 5000);
    } catch (err) {
      Alert.alert('Generation failed', err.message);
      setStep(STEPS.BLUEPRINTS);
    }
  };

  const renderWizardHeader = (title, current, total) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onReset} style={styles.backBtn}>
        <ChevronLeft color={COLORS.white} size={24} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(current / total) * 100}%` }]} />
        </View>
      </View>
    </View>
  );

  if (step === STEPS.ANALYZING) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
        <Text style={styles.loadingText}>Analyzing Vocal Personality...</Text>
      </View>
    );
  }

  if (step === STEPS.DREAM_SONG) {
    return (
      <View style={styles.container}>
        {renderWizardHeader('Dream Song Input', 1, 6)}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>✨ Describe your dream song</Text>
          <Text style={styles.cardSub}>Example: Rain at midnight. Missing someone. Need emotional violin. Slow healing.</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="Like a rainy night. Lonely. Heart touching..."
            placeholderTextColor="#666"
            value={dreamSong}
            onChangeText={setDreamSong}
          />
        </GlassCard>
        <GradientButton title="Next: Atmosphere" onPress={() => setStep(STEPS.ATMOSPHERE)} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (step === STEPS.ATMOSPHERE) {
    return (
      <View style={styles.container}>
        {renderWizardHeader('Atmosphere', 2, 6)}
        <Text style={styles.cardTitle}>Choose Atmosphere</Text>
        <View style={styles.grid}>
          {ATMOSPHERES.map(atm => (
            <TouchableOpacity 
              key={atm} 
              style={[styles.gridItem, selectedAtmosphere.includes(atm) && styles.gridItemActive]}
              onPress={() => setSelectedAtmosphere([atm])}
            >
              <Text style={styles.gridText}>{atm}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton title="Next: Genre" onPress={() => setStep(STEPS.GENRE)} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (step === STEPS.GENRE) {
    return (
      <View style={styles.container}>
        {renderWizardHeader('Genre', 3, 6)}
        <Text style={styles.cardTitle}>Choose Genre</Text>
        <View style={styles.grid}>
          {GENRES.map(g => (
            <TouchableOpacity 
              key={g} 
              style={[styles.gridItem, selectedGenre.includes(g) && styles.gridItemActive]}
              onPress={() => setSelectedGenre([g])}
            >
              <Text style={styles.gridText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton title="Next: Instruments" onPress={() => setStep(STEPS.INSTRUMENTS)} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (step === STEPS.INSTRUMENTS) {
    return (
      <View style={styles.container}>
        {renderWizardHeader('Instrument Studio', 4, 6)}
        <Text style={styles.cardTitle}>Choose Instruments</Text>
        <View style={styles.grid}>
          {INSTRUMENTS_LIST.map(inst => {
            const isSelected = selectedInstruments[inst];
            return (
              <TouchableOpacity 
                key={inst} 
                style={[styles.gridItem, isSelected && styles.gridItemActive]}
                onPress={() => setSelectedInstruments({...selectedInstruments, [inst]: !isSelected})}
              >
                <Text style={styles.gridText}>{inst}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <GradientButton title="Next: Energy Curve" onPress={() => setStep(STEPS.ENERGY)} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (step === STEPS.ENERGY) {
    return (
      <View style={styles.container}>
        {renderWizardHeader('Energy Curve', 5, 6)}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Song Energy</Text>
          {['intro', 'verse', 'chorus', 'outro'].map(part => (
            <View key={part} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, width: 60, textTransform: 'capitalize' }}>{part}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Low', 'Medium', 'High'].map(level => (
                  <TouchableOpacity 
                    key={level}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: energyCurve[part] === level ? COLORS.primary : 'rgba(255,255,255,0.1)', borderRadius: 4 }}
                    onPress={() => setEnergyCurve({...energyCurve, [part]: level})}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </GlassCard>
        <GradientButton title="Generate 3 Blueprints" onPress={generateBlueprints} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (step === STEPS.BLUEPRINTS) {
    if (!blueprints) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
          <Text style={styles.loadingText}>AI is designing 3 Blueprints based on your inputs...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        {renderWizardHeader('Choose Blueprint', 6, 6)}
        <Text style={styles.cardTitle}>AI Generated 3 Blueprints</Text>
        {Object.keys(blueprints).map(key => {
          const bp = blueprints[key];
          return (
            <TouchableOpacity key={key} onPress={() => selectBlueprintAndGenerate(key)} style={{ marginBottom: 16 }}>
              <GlassCard style={{ padding: 16 }}>
                <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>{bp.title}</Text>
                <Text style={{ color: COLORS.primary, marginTop: 4 }}>{bp.instruments.join(', ')}</Text>
                <Text style={{ color: '#888', marginTop: 8 }}>{bp.prompt}</Text>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (step === STEPS.GENERATING) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.success} style={{ marginTop: 100 }} />
        <Text style={styles.loadingText}>Generating NEW BGM from scratch...</Text>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 8 }}>AI Generator is running. This may take 1-2 minutes.</Text>
      </View>
    );
  }

  if (step === STEPS.DONE) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <Text style={{ fontSize: 24, textAlign: 'center' }}>🎉</Text>
          <Text style={[styles.cardTitle, { textAlign: 'center', marginTop: 8 }]}>Custom Studio Complete</Text>
          <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 8 }}>Your final custom track is ready for review.</Text>
          <GradientButton title="Back to Start" onPress={onReset} style={{ marginTop: 24 }} />
        </GlassCard>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { marginRight: 16 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  loadingText: { color: COLORS.white, textAlign: 'center', marginTop: 16, fontSize: 16 },
  card: { padding: 20 },
  cardTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  cardSub: { color: '#aaa', fontSize: 14, marginBottom: 16 },
  textArea: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, color: COLORS.white, height: 120, textAlignVertical: 'top' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  gridItemActive: { backgroundColor: 'rgba(138, 43, 226, 0.2)', borderColor: COLORS.primary },
  gridText: { color: COLORS.white, fontSize: 16 }
});
