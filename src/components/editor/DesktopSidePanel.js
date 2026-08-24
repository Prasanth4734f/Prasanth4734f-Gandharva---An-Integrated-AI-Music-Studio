import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sliders, Sparkles, Volume2, Music, Scissors, Zap } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { formatTimecode } from '../../services/timelineModel';

export const DesktopSidePanel = ({
  project,
  selectedClip,
  selectedTrackId,
  onUpdateClip,
  onUpdateProject,
  editorMode = 'simple',
  accentColor = '#10B981',
}) => {
  return (
    <View style={styles.sidePanelContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Selected Clip Inspector */}
        {selectedClip ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Scissors color={accentColor} size={16} />
              <Text style={styles.sectionTitle}>Clip Inspector</Text>
            </View>

            <View style={styles.propRow}>
              <Text style={styles.propLabel}>Title:</Text>
              <Text style={styles.propValue} numberOfLines={1}>{selectedClip.title}</Text>
            </View>

            <View style={styles.propRow}>
              <Text style={styles.propLabel}>Timeline Pos:</Text>
              <Text style={styles.propValue}>{formatTimecode(selectedClip.timelineStart, true)}</Text>
            </View>

            <View style={styles.propRow}>
              <Text style={styles.propLabel}>Clip Duration:</Text>
              <Text style={styles.propValue}>{formatTimecode(selectedClip.duration, true)}</Text>
            </View>

            {/* Volume */}
            <View style={styles.sliderBox}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabelTitle}>Clip Volume</Text>
                <Text style={styles.sliderLabelVal}>{Math.round((selectedClip.volume ?? 1) * 100)}%</Text>
              </View>
              <Slider
                value={selectedClip.volume ?? 1}
                minimumValue={0}
                maximumValue={2.0}
                step={0.05}
                onValueChange={(v) => onUpdateClip && onUpdateClip(selectedTrackId, selectedClip.id, { volume: v })}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor="rgba(255,255,255,0.1)"
                thumbTintColor="#FFF"
                style={{ height: 30 }}
              />
            </View>

            {/* Fades */}
            <View style={styles.sliderBox}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabelTitle}>Fade In</Text>
                <Text style={styles.sliderLabelVal}>{(selectedClip.fadeIn ?? 0.5).toFixed(1)}s</Text>
              </View>
              <Slider
                value={selectedClip.fadeIn ?? 0.5}
                minimumValue={0}
                maximumValue={3.0}
                step={0.1}
                onValueChange={(v) => onUpdateClip && onUpdateClip(selectedTrackId, selectedClip.id, { fadeIn: v })}
                minimumTrackTintColor="#F59E0B"
                maximumTrackTintColor="rgba(255,255,255,0.1)"
                thumbTintColor="#FFF"
                style={{ height: 30 }}
              />
            </View>

            <View style={styles.sliderBox}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabelTitle}>Fade Out</Text>
                <Text style={styles.sliderLabelVal}>{(selectedClip.fadeOut ?? 0.5).toFixed(1)}s</Text>
              </View>
              <Slider
                value={selectedClip.fadeOut ?? 0.5}
                minimumValue={0}
                maximumValue={3.0}
                step={0.1}
                onValueChange={(v) => onUpdateClip && onUpdateClip(selectedTrackId, selectedClip.id, { fadeOut: v })}
                minimumTrackTintColor="#F59E0B"
                maximumTrackTintColor="rgba(255,255,255,0.1)"
                thumbTintColor="#FFF"
                style={{ height: 30 }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyInspectorBox}>
            <Scissors color="#64748B" size={24} />
            <Text style={styles.emptyInspectorText}>Click or tap any clip on the timeline to inspect and edit properties.</Text>
          </View>
        )}

        {/* Project Master Settings */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Music color="#00E5FF" size={16} />
            <Text style={styles.sectionTitle}>Project Settings</Text>
          </View>

          <View style={styles.propRow}>
            <Text style={styles.propLabel}>BPM Tempo:</Text>
            <Text style={styles.propValue}>{project.bpm || 120} BPM</Text>
          </View>

          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Musical Key:</Text>
            <Text style={styles.propValue}>{project.key || 'C Major'}</Text>
          </View>

          {/* Snap to Grid Toggle */}
          <TouchableOpacity
            style={[styles.snapToggleBtn, project.snapToGrid && styles.snapToggleActive]}
            onPress={() => onUpdateProject && onUpdateProject({ snapToGrid: !project.snapToGrid })}
            activeOpacity={0.7}
          >
            <Zap color={project.snapToGrid ? '#10B981' : '#64748B'} size={14} />
            <Text style={[styles.snapToggleText, project.snapToGrid && { color: '#10B981' }]}>
              Snap to Grid ({project.gridSize || 0.5}s)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidePanelContainer: {
    width: 260,
    backgroundColor: '#0F121C',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  propLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  propValue: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sliderBox: {
    marginTop: 8,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sliderLabelTitle: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  sliderLabelVal: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyInspectorBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    gap: 10,
  },
  emptyInspectorText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  snapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  snapToggleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  snapToggleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
});
export default DesktopSidePanel;
