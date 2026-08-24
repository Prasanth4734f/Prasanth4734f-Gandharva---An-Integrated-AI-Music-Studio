import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING, COLORS } from '../../constants/theme';

const CHORDS = [
  ['C', 'Am', 'F'],
  ['G', 'Dm', 'Em'],
  ['A', 'E', 'D']
];

const ChordGrid = ({ activeChord, onSelectChord }) => {
  return (
    <View style={styles.container}>
      {CHORDS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((chord) => {
            const isActive = activeChord === chord;
            return (
              <TouchableOpacity
                key={chord}
                style={[styles.chordBtn, isActive && styles.activeBtn]}
                onPress={() => onSelectChord(chord)}
              >
                <Text style={[styles.chordText, isActive && styles.activeText]}>
                  {chord}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: '#1B1D21',
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  chordBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#25282D',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#33363B',
  },
  activeBtn: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  chordText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#FFF',
  }
});

export default ChordGrid;
