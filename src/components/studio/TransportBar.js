import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Circle, Square, Play, Pause } from 'lucide-react-native';
import { SPACING } from '../../constants/theme';

const THEME = {
  bg: '#111315',
  panel: '#1B1D21',
  accent: '#4A90E2',
  text: '#FFFFFF',
  secondary: '#888888',
};

const TransportBar = ({ 
  isRecording, 
  onToggleRecord,
  isPlaying,
  onPlay,
  onPause,
  onStop
}) => {
  return (
    <View style={styles.transportBar}>
      <TouchableOpacity 
        style={[styles.transportBtn, isRecording && styles.transportActive]} 
        onPress={onToggleRecord}
      >
        {isRecording ? <Square color="#E74C3C" size={16} fill="#E74C3C" /> : <Circle color="#E74C3C" size={16} fill="#E74C3C" />}
        <Text style={[styles.transportText, { color: isRecording ? '#E74C3C' : THEME.text }]}>Record</Text>
      </TouchableOpacity>
      
      {!isPlaying ? (
        <TouchableOpacity style={styles.transportBtn} onPress={onPlay}>
          <Play color={THEME.text} size={16} fill={THEME.text} />
          <Text style={styles.transportText}>Play</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.transportBtn} onPress={onPause}>
          <Pause color={THEME.text} size={16} fill={THEME.text} />
          <Text style={styles.transportText}>Pause</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.transportBtn} onPress={onStop}>
        <Square color={THEME.text} size={16} fill={THEME.text} />
        <Text style={styles.transportText}>Stop</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  transportBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2C2E33',
    paddingTop: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  transportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25282D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  transportActive: {
    backgroundColor: '#3D2022',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  transportText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default TransportBar;
