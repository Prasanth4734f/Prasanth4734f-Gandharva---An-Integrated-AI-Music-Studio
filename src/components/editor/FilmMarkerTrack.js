import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Film, Flag, Plus, Sparkles, Zap, Flame, ShieldAlert, Heart } from 'lucide-react-native';
import { formatTimecode } from '../../services/timelineModel';

export const FilmMarkerTrack = ({
  markers = [],
  currentTime = 0,
  duration = 30,
  onSeekTo,
  onAddMarker,
  accentColor = '#A855F7',
}) => {
  const defaultMarkers = [
    { id: 'm-1', time: 0, label: 'Act I: Intro Tension', mood: 'tension', icon: '🎭', color: '#8B5CF6' },
    { id: 'm-2', time: 8.5, label: 'Theme Exposition', mood: 'theme', icon: '🎻', color: '#00E5FF' },
    { id: 'm-3', time: 18.0, label: 'Trailer Hit / Action Cue', mood: 'action', icon: '💥', color: '#FF9F0A' },
    { id: 'm-4', time: 26.0, label: 'Climax & Brass Braam', mood: 'climax', icon: '🔥', color: '#FF2D55' },
  ];

  const activeMarkers = markers.length > 0 ? markers : defaultMarkers;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Film color="#C084FC" size={13} />
          <Text style={styles.headerTitle}>SCENE CUE SHEET & HITPOINTS</Text>
        </View>

        {onAddMarker && (
          <TouchableOpacity
            style={styles.addMarkerBtn}
            onPress={() => onAddMarker(currentTime)}
            activeOpacity={0.7}
          >
            <Plus color="#C084FC" size={12} />
            <Text style={styles.addMarkerText}>+ Marker @ {formatTimecode(currentTime)}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.markersScroll}
      >
        {activeMarkers.map((marker) => {
          const isPassed = currentTime >= marker.time;
          const isNear = Math.abs(currentTime - marker.time) < 2.0;

          return (
            <TouchableOpacity
              key={marker.id}
              style={[
                styles.markerCard,
                { borderColor: marker.color || '#A855F7' },
                isNear && { backgroundColor: `${marker.color}25`, borderColor: '#FFF' },
              ]}
              onPress={() => onSeekTo && onSeekTo(marker.time)}
              activeOpacity={0.75}
            >
              <View style={styles.markerTop}>
                <Text style={styles.markerIcon}>{marker.icon || '🎬'}</Text>
                <Text style={[styles.markerTime, { color: marker.color || '#FFF' }]}>
                  {formatTimecode(marker.time)}
                </Text>
              </View>
              <Text style={styles.markerLabel} numberOfLines={1}>
                {marker.label}
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
    backgroundColor: '#0D0F1B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.2)',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  addMarkerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMarkerText: {
    color: '#E9D5FF',
    fontSize: 9,
    fontWeight: '800',
  },
  markersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  markerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  markerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  markerIcon: {
    fontSize: 11,
  },
  markerTime: {
    fontSize: 9,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  markerLabel: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default FilmMarkerTrack;
