import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Scissors,
  Split,
  Volume2,
  Zap,
  Sparkles,
  Sliders,
  Radio,
  Mic,
  Copy,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const QuickActionChips = ({
  hasSelectedClip = false,
  onTrim,
  onSplit,
  onVolume,
  onBassBoost,
  onFades,
  onReverb,
  onLoFi,
  onVocalPolish,
  onDuplicate,
  onDelete,
  onAddTrack,
  accentColor = '#10B981',
}) => {
  const chips = [
    {
      id: 'split',
      icon: Split,
      label: 'Split',
      color: '#38BDF8',
      action: onSplit,
      requiresClip: true,
    },
    {
      id: 'volume',
      icon: Volume2,
      label: 'Volume',
      color: '#00E5FF',
      action: onVolume,
      requiresClip: true,
    },
    {
      id: 'bass',
      icon: Zap,
      label: 'Bass Boost',
      color: '#FF9F0A',
      action: onBassBoost,
      requiresClip: true,
    },
    {
      id: 'fades',
      icon: Sparkles,
      label: 'Fades',
      color: '#F59E0B',
      action: onFades,
      requiresClip: true,
    },
    {
      id: 'reverb',
      icon: Sliders,
      label: 'Reverb Space',
      color: '#A855F7',
      action: onReverb,
      requiresClip: true,
    },
    {
      id: 'lofi',
      icon: Radio,
      label: 'Lo-Fi Vintage',
      color: '#EC4899',
      action: onLoFi,
      requiresClip: true,
    },
    {
      id: 'vocal',
      icon: Mic,
      label: 'Vocal Master',
      color: '#FF2D55',
      action: onVocalPolish,
      requiresClip: true,
    },
    {
      id: 'duplicate',
      icon: Copy,
      label: 'Duplicate',
      color: '#34D399',
      action: onDuplicate,
      requiresClip: true,
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      color: '#EF4444',
      action: onDelete,
      requiresClip: true,
    },
    {
      id: 'add',
      icon: Plus,
      label: 'Add Track',
      color: '#10B981',
      action: onAddTrack,
      requiresClip: false,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerLabelRow}>
        <Text style={styles.headerLabel}>QUICK ACTIONS</Text>
        <Text style={styles.headerSub}>
          {hasSelectedClip ? 'Active Clip Controls' : 'Tap a clip to edit'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {chips.map((chip) => {
          const IconComp = chip.icon;
          const isDisabled = chip.requiresClip && !hasSelectedClip;

          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chipBtn,
                isDisabled && styles.chipBtnDisabled,
                !isDisabled && { borderColor: `${chip.color}50` },
              ]}
              onPress={chip.action}
              disabled={isDisabled}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isDisabled ? 'rgba(255,255,255,0.05)' : `${chip.color}25` },
                ]}
              >
                <IconComp color={isDisabled ? '#64748B' : chip.color} size={15} />
              </View>
              <Text
                style={[
                  styles.chipText,
                  { color: isDisabled ? '#64748B' : '#E2E8F0' },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E111A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
  },
  headerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  scrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipBtnDisabled: {
    opacity: 0.35,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
export default QuickActionChips;
