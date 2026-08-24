import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2, Lock, Unlock, Plus } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

export const TrackControls = ({
  track,
  onToggleMute,
  onToggleSolo,
  onToggleLock,
  onChangeVolume,
  onAddClip,
  editorMode = 'simple',
}) => {
  const trackColor = track.color || '#10B981';

  return (
    <View style={[styles.channelStrip, { borderLeftColor: trackColor }]}>
      {/* Top: Instrument Icon Badge + Track Title */}
      <View style={styles.topInfoRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${trackColor}25`, borderColor: `${trackColor}50` }]}>
          <Text style={styles.trackIcon}>{track.icon || '🎵'}</Text>
        </View>
        <View style={styles.nameBox}>
          <Text style={[styles.trackName, { color: '#FFF' }]} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.trackSub}>{track.type?.toUpperCase() || 'AUDIO'}</Text>
        </View>
      </View>

      {/* Center: BandLab Style Hardware Buttons [ M ] [ S ] [ 🔒 ] */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.stripBtn,
            track.muted ? styles.btnMuteActive : styles.btnInactive,
          ]}
          onPress={() => onToggleMute && onToggleMute(track.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, track.muted && styles.btnTextMuteActive]}>M</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.stripBtn,
            track.solo ? styles.btnSoloActive : styles.btnInactive,
          ]}
          onPress={() => onToggleSolo && onToggleSolo(track.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, track.solo && styles.btnTextSoloActive]}>S</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stripBtn, styles.btnInactive, track.locked && styles.btnLockedActive]}
          onPress={() => onToggleLock && onToggleLock(track.id)}
          activeOpacity={0.7}
        >
          {track.locked ? <Lock color="#F59E0B" size={10} /> : <Unlock color="#64748B" size={10} />}
        </TouchableOpacity>

        {onAddClip && (
          <TouchableOpacity
            style={[styles.stripBtn, styles.btnAddClip]}
            onPress={() => onAddClip && onAddClip(track.id)}
            activeOpacity={0.7}
          >
            <Plus color={trackColor} size={11} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mini Volume Slider */}
      <View style={styles.volumeRow}>
        <Volume2 color="#64748B" size={10} />
        <Slider
          value={track.volume ?? 1.0}
          minimumValue={0}
          maximumValue={1.5}
          step={0.05}
          onValueChange={(val) => onChangeVolume && onChangeVolume(track.id, val)}
          minimumTrackTintColor={trackColor}
          maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
          thumbTintColor="#FFF"
          style={{ flex: 1, height: 14 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  channelStrip: {
    width: 130,
    height: 76,
    backgroundColor: '#121522',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3.5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackIcon: {
    fontSize: 10,
  },
  nameBox: {
    flex: 1,
  },
  trackName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  trackSub: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stripBtn: {
    width: 22,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnMuteActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  btnSoloActive: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  btnLockedActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  btnAddClip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
  },
  btnTextMuteActive: {
    color: '#FFF',
  },
  btnTextSoloActive: {
    color: '#000',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
export default TrackControls;
