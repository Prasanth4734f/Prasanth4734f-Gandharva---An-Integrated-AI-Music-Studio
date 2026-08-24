import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Shield, Radio, Check, Activity, BarChart2, Film, Disc } from 'lucide-react-native';

export const FilmInspectorPanel = ({
  projectTitle = 'Film Score Master',
  currentTime = 0,
  duration = 30,
  accentColor = '#A855F7',
}) => {
  const [loudnessStandard, setLoudnessStandard] = useState('EBU R128 (-24 LUFS)');
  const [sampleRate, setSampleRate] = useState('48 kHz (Film)');
  const [bitDepth, setBitDepth] = useState('24-Bit BWF');
  const [sidechainSensitivity, setSidechainSensitivity] = useState(65); // %
  const [sidechainRelease, setSidechainRelease] = useState(250); // ms

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Film color="#C084FC" size={16} />
            <Text style={styles.sectionTitle}>Film Broadcast Inspector</Text>
          </View>

          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Audio Standard:</Text>
            <Text style={styles.propValue}>{sampleRate} • {bitDepth}</Text>
          </View>

          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Timecode Rate:</Text>
            <Text style={styles.propValue}>24.00 fps SMPTE Film</Text>
          </View>
        </View>

        {/* EBU R128 / ITU BS.1770 Broadcast Radar */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <BarChart2 color="#10B981" size={16} />
            <Text style={styles.sectionTitle}>Loudness Radar (Film Standard)</Text>
          </View>

          <View style={styles.radarDeck}>
            <View style={styles.radarStatBox}>
              <Text style={styles.radarNum}>-23.8</Text>
              <Text style={styles.radarUnit}>INTEGRATED LUFS</Text>
            </View>
            <View style={styles.radarStatBox}>
              <Text style={[styles.radarNum, { color: '#38BDF8' }]}>-0.1</Text>
              <Text style={styles.radarUnit}>TRUE PEAK dBTP</Text>
            </View>
          </View>

          <View style={styles.targetRow}>
            {['EBU R128 (-24 LUFS)', 'Streaming (-14 LUFS)'].map((std) => (
              <TouchableOpacity
                key={std}
                style={[styles.stdBtn, loudnessStandard === std && styles.stdBtnActive]}
                onPress={() => setLoudnessStandard(std)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stdText, loudnessStandard === std && styles.stdTextActive]}>
                  {std}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dialogue Auto-Sidechain Ducking */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Radio color="#FF9F0A" size={16} />
            <Text style={styles.sectionTitle}>Dialogue Sidechain Ducking</Text>
          </View>
          <Text style={styles.blockDesc}>
            Ducks background strings & taiko automatically whenever dialogue/ADR voiceover speaks.
          </Text>

          <View style={styles.sliderBox}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Ducking Sensitivity</Text>
              <Text style={[styles.sliderVal, { color: '#FF9F0A' }]}>{sidechainSensitivity}%</Text>
            </View>
            <Slider
              value={sidechainSensitivity}
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={setSidechainSensitivity}
              minimumTrackTintColor="#FF9F0A"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#FFF"
              style={{ height: 26 }}
            />
          </View>

          <View style={styles.sliderBox}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Release Time</Text>
              <Text style={[styles.sliderVal, { color: '#38BDF8' }]}>{sidechainRelease}ms</Text>
            </View>
            <Slider
              value={sidechainRelease}
              minimumValue={50}
              maximumValue={1000}
              step={25}
              onValueChange={setSidechainRelease}
              minimumTrackTintColor="#38BDF8"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#FFF"
              style={{ height: 26 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 270,
    backgroundColor: '#0C0E1A',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  sectionBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  blockDesc: {
    color: '#94A3B8',
    fontSize: 9,
    lineHeight: 13,
    marginBottom: 8,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  propLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  propValue: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  radarDeck: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  radarStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  radarNum: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '900',
  },
  radarUnit: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '800',
    marginTop: 2,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stdBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stdBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  stdText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  stdTextActive: {
    color: '#10B981',
    fontWeight: '900',
  },
  sliderBox: {
    marginTop: 4,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  sliderLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  sliderVal: {
    fontSize: 9,
    fontWeight: '800',
  },
});

export default FilmInspectorPanel;
