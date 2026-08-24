import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Check, Volume2, Sparkles, Sliders, Zap, Radio, Mic } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';

export const ClipActionSheet = ({
  visible = false,
  sheetType = 'volume', // 'volume' | 'bass' | 'fade' | 'reverb' | 'effects'
  clip = null,
  onClose,
  onApply,
  accentColor = '#10B981',
}) => {
  const [tempVolume, setTempVolume] = useState(1.0);
  const [tempBass, setTempBass] = useState(0);
  const [tempFadeIn, setTempFadeIn] = useState(0.5);
  const [tempFadeOut, setTempFadeOut] = useState(0.5);
  const [tempReverb, setTempReverb] = useState(0.2);
  const [selectedEffect, setSelectedEffect] = useState('studio');

  useEffect(() => {
    if (clip) {
      setTempVolume(clip.volume ?? 1.0);
      setTempBass(clip.effects?.bass ?? 0);
      setTempFadeIn(clip.fadeIn ?? 0.5);
      setTempFadeOut(clip.fadeOut ?? 0.5);
      setTempReverb(clip.effects?.reverb ?? 0.2);
      setSelectedEffect(clip.effects?.preset ?? 'studio');
    }
  }, [clip, visible]);

  if (!clip) return null;

  const handleDone = () => {
    if (sheetType === 'volume') {
      onApply && onApply({ volume: tempVolume });
    } else if (sheetType === 'bass') {
      onApply && onApply({ effects: { ...clip.effects, bass: tempBass } });
    } else if (sheetType === 'fade') {
      onApply && onApply({ fadeIn: tempFadeIn, fadeOut: tempFadeOut });
    } else if (sheetType === 'reverb') {
      onApply && onApply({ effects: { ...clip.effects, reverb: tempReverb } });
    } else if (sheetType === 'effects') {
      onApply && onApply({ effects: { ...clip.effects, preset: selectedEffect } });
    }
    onClose && onClose();
  };

  const effectsPresets = [
    { id: 'vocal', name: '🎤 Vocal Master', desc: 'Crisp presence & high air polish', color: '#FF2D55' },
    { id: 'bass', name: '💥 808 Bass Monster', desc: 'Deep sub-frequency drive', color: '#FF9F0A' },
    { id: 'lofi', name: '📻 Lo-Fi Vintage Tape', desc: 'Warm vinyl saturation & tape filter', color: '#EC4899' },
    { id: 'reverb', name: '🌌 Cathedral Spatial 3D', desc: 'Lush atmospheric acoustic room', color: '#A855F7' },
    { id: 'original', name: '✨ Original Flat', desc: 'Pure uncolored studio sound', color: '#00E5FF' },
  ];

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              {sheetType === 'volume' && <Volume2 color="#00E5FF" size={18} />}
              {sheetType === 'bass' && <Zap color="#FF9F0A" size={18} />}
              {sheetType === 'fade' && <Sparkles color="#F59E0B" size={18} />}
              {sheetType === 'reverb' && <Sliders color="#A855F7" size={18} />}
              {sheetType === 'effects' && <Sparkles color="#EC4899" size={18} />}
              <Text style={styles.sheetTitle}>
                {sheetType === 'volume' && 'Clip Gain & Loudness'}
                {sheetType === 'bass' && '808 Bass Boost'}
                {sheetType === 'fade' && 'Smooth Fade In & Out'}
                {sheetType === 'reverb' && '3D Reverb Space'}
                {sheetType === 'effects' && 'Sound FX Presets'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#94A3B8" size={18} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.sheetBody}>
            {/* 1. VOLUME SHEET */}
            {sheetType === 'volume' && (
              <View style={styles.sectionBox}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelText}>Master Gain Level</Text>
                  <Text style={[styles.labelValue, { color: '#00E5FF' }]}>{Math.round(tempVolume * 100)}%</Text>
                </View>
                <Slider
                  value={tempVolume}
                  minimumValue={0}
                  maximumValue={2.0}
                  step={0.05}
                  onValueChange={setTempVolume}
                  minimumTrackTintColor="#00E5FF"
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor="#FFF"
                  style={{ height: 40 }}
                />
                <View style={styles.scaleRow}>
                  <Text style={styles.scaleText}>0% (Mute)</Text>
                  <Text style={styles.scaleText}>100% (Unity)</Text>
                  <Text style={styles.scaleText}>200% (Boost)</Text>
                </View>
              </View>
            )}

            {/* 2. BASS BOOST SHEET */}
            {sheetType === 'bass' && (
              <View style={styles.sectionBox}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelText}>Low-End Punch (808 Sub)</Text>
                  <Text style={[styles.labelValue, { color: '#FF9F0A' }]}>{tempBass > 0 ? `+${tempBass}` : tempBass} dB</Text>
                </View>
                <Slider
                  value={tempBass}
                  minimumValue={-6}
                  maximumValue={12}
                  step={1}
                  onValueChange={setTempBass}
                  minimumTrackTintColor="#FF9F0A"
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor="#FFF"
                  style={{ height: 40 }}
                />
                <View style={styles.scaleRow}>
                  <Text style={styles.scaleText}>-6 dB (Cut)</Text>
                  <Text style={styles.scaleText}>0 dB (Flat)</Text>
                  <Text style={styles.scaleText}>+12 dB (Heavy 808)</Text>
                </View>
              </View>
            )}

            {/* 3. FADES SHEET */}
            {sheetType === 'fade' && (
              <View style={styles.sectionBox}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelText}>Fade In Duration</Text>
                  <Text style={[styles.labelValue, { color: '#F59E0B' }]}>{tempFadeIn.toFixed(1)}s</Text>
                </View>
                <Slider
                  value={tempFadeIn}
                  minimumValue={0}
                  maximumValue={Math.min(5.0, clip.duration / 2)}
                  step={0.1}
                  onValueChange={setTempFadeIn}
                  minimumTrackTintColor="#F59E0B"
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor="#FFF"
                  style={{ height: 40 }}
                />

                <View style={[styles.labelRow, { marginTop: 16 }]}>
                  <Text style={styles.labelText}>Fade Out Duration</Text>
                  <Text style={[styles.labelValue, { color: '#F59E0B' }]}>{tempFadeOut.toFixed(1)}s</Text>
                </View>
                <Slider
                  value={tempFadeOut}
                  minimumValue={0}
                  maximumValue={Math.min(5.0, clip.duration / 2)}
                  step={0.1}
                  onValueChange={setTempFadeOut}
                  minimumTrackTintColor="#F59E0B"
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor="#FFF"
                  style={{ height: 40 }}
                />
              </View>
            )}

            {/* 4. REVERB SPACE SHEET */}
            {sheetType === 'reverb' && (
              <View style={styles.sectionBox}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelText}>Cathedral Space Depth</Text>
                  <Text style={[styles.labelValue, { color: '#A855F7' }]}>{Math.round(tempReverb * 100)}%</Text>
                </View>
                <Slider
                  value={tempReverb}
                  minimumValue={0}
                  maximumValue={1.0}
                  step={0.05}
                  onValueChange={setTempReverb}
                  minimumTrackTintColor="#A855F7"
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor="#FFF"
                  style={{ height: 40 }}
                />
                <View style={styles.scaleRow}>
                  <Text style={styles.scaleText}>Dry (0%)</Text>
                  <Text style={styles.scaleText}>Medium Room</Text>
                  <Text style={styles.scaleText}>Deep Hall (100%)</Text>
                </View>
              </View>
            )}

            {/* 5. EFFECTS PRESETS */}
            {sheetType === 'effects' && (
              <View style={styles.effectsGrid}>
                {effectsPresets.map((eff) => (
                  <TouchableOpacity
                    key={eff.id}
                    style={[
                      styles.effectCard,
                      selectedEffect === eff.id && { borderColor: eff.color, backgroundColor: `${eff.color}15` },
                    ]}
                    onPress={() => setSelectedEffect(eff.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.effectCardTop}>
                      <Text style={[styles.effectCardTitle, { color: eff.color }]}>{eff.name}</Text>
                      {selectedEffect === eff.id && <Check color={eff.color} size={16} />}
                    </View>
                    <Text style={styles.effectCardSub}>{eff.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <LinearGradient colors={['#00E5FF', '#0284C7']} style={styles.doneBtnGrad}>
                <Check color="#000" size={16} />
                <Text style={styles.doneBtnText}>Apply to Clip</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121522',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBody: {
    marginBottom: 16,
  },
  sectionBox: {
    paddingVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  labelValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  effectsGrid: {
    gap: 10,
  },
  effectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
  },
  effectCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  effectCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  effectCardSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  doneBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  doneBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
});
export default ClipActionSheet;
