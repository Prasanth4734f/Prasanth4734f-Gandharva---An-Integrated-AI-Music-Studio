import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { Volume2, VolumeX, Shield, Radio, Sparkles } from 'lucide-react-native';

export const CINEMATIC_FILM_STEMS = [
  { id: 'strings', name: '🎻 Orchestral Strings', type: 'Violin / Cello Legato', color: '#8B5CF6' },
  { id: 'brass', name: '🎺 Cinematic Brass', type: 'French Horns & Braam', color: '#FF3366' },
  { id: 'percussion', name: '🥁 Epic Taiko & Hits', type: 'Trailer Booms & 808', color: '#FF9F0A' },
  { id: 'drones', name: '🌌 Ambient Drones', type: 'Ethereal Sci-Fi Pads', color: '#00E5FF' },
  { id: 'choir', name: '🎙️ Choir & Vocals', type: 'Sacred Vocal Harmonies', color: '#EC4899' },
  { id: 'foley', name: '🔊 Foley & Impacts', type: 'Whoosh & Risers FX', color: '#10B981' },
];

export const FilmStemsMixer = ({
  stemStates = {},
  onUpdateStem,
  accentColor = '#A855F7',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>CINEMATIC ORCHESTRAL STEM MIXER</Text>
        <Text style={styles.headerSub}>6 Independent Film Scoring Channels</Text>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        {CINEMATIC_FILM_STEMS.map((stem) => {
          const state = stemStates[stem.id] || {
            volume: 1.0,
            pan: 0.0,
            muted: false,
            solo: false,
            ducking: true,
          };

          return (
            <View key={stem.id} style={[styles.stemRowCard, { borderLeftColor: stem.color }]}>
              {/* Header inside Card */}
              <View style={styles.cardTopRow}>
                <View style={styles.infoBox}>
                  <Text style={[styles.stemName, { color: '#FFF' }]}>{stem.name}</Text>
                  <Text style={styles.stemType}>{stem.type}</Text>
                </View>

                {/* Hardware Switches (Mute, Solo, Auto-Ducking) */}
                <View style={styles.switchesGroup}>
                  {/* Auto-Ducking for Dialogue */}
                  <TouchableOpacity
                    style={[styles.duckBtn, state.ducking && styles.duckBtnActive]}
                    onPress={() =>
                      onUpdateStem &&
                      onUpdateStem(stem.id, { ducking: !state.ducking })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.duckText, state.ducking && { color: '#000' }]}>
                      🦆 Auto-Duck
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.miniBtn, state.muted && styles.miniBtnMuteActive]}
                    onPress={() =>
                      onUpdateStem &&
                      onUpdateStem(stem.id, { muted: !state.muted })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.miniBtnText, state.muted && { color: '#FFF' }]}>M</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.miniBtn, state.solo && styles.miniBtnSoloActive]}
                    onPress={() =>
                      onUpdateStem &&
                      onUpdateStem(stem.id, { solo: !state.solo })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.miniBtnText, state.solo && { color: '#000' }]}>S</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Faders Row */}
              <View style={styles.fadersRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.sliderLabelRow}>
                    <Text style={styles.faderLabel}>Level Gain</Text>
                    <Text style={[styles.faderVal, { color: stem.color }]}>
                      {Math.round(state.volume * 100)}%
                    </Text>
                  </View>
                  <Slider
                    value={state.volume}
                    minimumValue={0}
                    maximumValue={1.5}
                    step={0.05}
                    onValueChange={(v) => onUpdateStem && onUpdateStem(stem.id, { volume: v })}
                    minimumTrackTintColor={stem.color}
                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                    thumbTintColor="#FFF"
                    style={{ height: 26 }}
                  />
                </View>

                <View style={{ width: 85, marginLeft: 12 }}>
                  <View style={styles.sliderLabelRow}>
                    <Text style={styles.faderLabel}>Pan</Text>
                    <Text style={styles.faderVal}>
                      {state.pan === 0 ? 'C' : state.pan < 0 ? `L${Math.round(Math.abs(state.pan) * 100)}` : `R${Math.round(state.pan * 100)}`}
                    </Text>
                  </View>
                  <Slider
                    value={state.pan}
                    minimumValue={-1.0}
                    maximumValue={1.0}
                    step={0.1}
                    onValueChange={(p) => onUpdateStem && onUpdateStem(stem.id, { pan: p })}
                    minimumTrackTintColor="#38BDF8"
                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                    thumbTintColor="#FFF"
                    style={{ height: 26 }}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121526',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 12,
  },
  headerRow: {
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  scrollList: {
    maxHeight: 380,
  },
  stemRowCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoBox: {
    flex: 1,
  },
  stemName: {
    fontSize: 12,
    fontWeight: '800',
  },
  stemType: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  switchesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  duckBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  duckBtnActive: {
    backgroundColor: '#F59E0B',
  },
  duckText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
  },
  miniBtn: {
    width: 22,
    height: 20,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBtnMuteActive: {
    backgroundColor: '#EF4444',
  },
  miniBtnSoloActive: {
    backgroundColor: '#F59E0B',
  },
  miniBtnText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
  },
  fadersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  faderLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  faderVal: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default FilmStemsMixer;
