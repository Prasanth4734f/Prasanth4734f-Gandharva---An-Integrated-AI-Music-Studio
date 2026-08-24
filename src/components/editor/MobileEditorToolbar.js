import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  Scissors,
  Split,
  Volume2,
  Sparkles,
  Sliders,
  Copy,
  Trash2,
  Plus,
} from 'lucide-react-native';

export const MobileEditorToolbar = ({
  hasSelectedClip = false,
  onTrim,
  onSplit,
  onOpenVolume,
  onOpenFade,
  onOpenEffects,
  onDuplicate,
  onDelete,
  onAddTrack,
  accentColor = '#10B981',
}) => {
  return (
    <View style={styles.toolbarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarScroll}>
        {/* Split Action */}
        <TouchableOpacity
          style={[styles.toolBtn, !hasSelectedClip && styles.toolBtnDisabled]}
          onPress={onSplit}
          disabled={!hasSelectedClip}
          activeOpacity={0.7}
        >
          <Split color={hasSelectedClip ? '#FFF' : '#64748B'} size={18} />
          <Text style={[styles.toolBtnText, hasSelectedClip && { color: '#FFF' }]}>Split</Text>
        </TouchableOpacity>

        {/* Volume Action */}
        <TouchableOpacity
          style={[styles.toolBtn, !hasSelectedClip && styles.toolBtnDisabled]}
          onPress={onOpenVolume}
          disabled={!hasSelectedClip}
          activeOpacity={0.7}
        >
          <Volume2 color={hasSelectedClip ? '#00E5FF' : '#64748B'} size={18} />
          <Text style={[styles.toolBtnText, hasSelectedClip && { color: '#00E5FF' }]}>Volume</Text>
        </TouchableOpacity>

        {/* Fade In/Out Action */}
        <TouchableOpacity
          style={[styles.toolBtn, !hasSelectedClip && styles.toolBtnDisabled]}
          onPress={onOpenFade}
          disabled={!hasSelectedClip}
          activeOpacity={0.7}
        >
          <Sparkles color={hasSelectedClip ? '#F59E0B' : '#64748B'} size={18} />
          <Text style={[styles.toolBtnText, hasSelectedClip && { color: '#F59E0B' }]}>Fade</Text>
        </TouchableOpacity>

        {/* Effects Action */}
        <TouchableOpacity
          style={[styles.toolBtn, !hasSelectedClip && styles.toolBtnDisabled]}
          onPress={onOpenEffects}
          disabled={!hasSelectedClip}
          activeOpacity={0.7}
        >
          <Sliders color={hasSelectedClip ? '#A855F7' : '#64748B'} size={18} />
          <Text style={[styles.toolBtnText, hasSelectedClip && { color: '#A855F7' }]}>Effects</Text>
        </TouchableOpacity>

        {/* Duplicate Action */}
        <TouchableOpacity
          style={[styles.toolBtn, !hasSelectedClip && styles.toolBtnDisabled]}
          onPress={onDuplicate}
          disabled={!hasSelectedClip}
          activeOpacity={0.7}
        >
          <Copy color={hasSelectedClip ? '#38BDF8' : '#64748B'} size={18} />
          <Text style={[styles.toolBtnText, hasSelectedClip && { color: '#38BDF8' }]}>Duplicate</Text>
        </TouchableOpacity>

        {/* Delete Action */}
        <TouchableOpacity
          style={[styles.toolBtn, !hasSelectedClip && styles.toolBtnDisabled]}
          onPress={onDelete}
          disabled={!hasSelectedClip}
          activeOpacity={0.7}
        >
          <Trash2 color={hasSelectedClip ? '#EF4444' : '#64748B'} size={18} />
          <Text style={[styles.toolBtnText, hasSelectedClip && { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>

        {/* Add Track Action */}
        {onAddTrack && (
          <TouchableOpacity style={styles.toolBtn} onPress={onAddTrack} activeOpacity={0.7}>
            <Plus color={accentColor} size={18} />
            <Text style={[styles.toolBtnText, { color: accentColor }]}>Add Track</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    backgroundColor: '#0C0C14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 64,
    gap: 4,
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  toolBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
});
export default MobileEditorToolbar;
