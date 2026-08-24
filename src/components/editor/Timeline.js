import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import TimelineRuler from './TimelineRuler';
import TrackControls from './TrackControls';
import AudioClip from './AudioClip';
import { Plus } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Timeline = ({
  project,
  currentTime = 0,
  zoomScale = 1.5,
  selectedClipId = null,
  selectedTrackId = null,
  onSelectClip,
  onMoveClip,
  onTrimClip,
  onSeek,
  onToggleMute,
  onToggleSolo,
  onToggleLock,
  onChangeVolume,
  onAddClipToTrack,
  onLongPressClip,
  onAddTrack,
  editorMode = 'simple',
  accentColor = '#10B981',
}) => {
  const basePxPerSec = 16;
  const zoomPxPerSec = basePxPerSec * zoomScale;
  const totalWidth = (project.duration || 60) * zoomPxPerSec;

  const horizontalScrollRef = useRef(null);

  // Playhead position
  const playheadX = currentTime * zoomPxPerSec;

  return (
    <View style={styles.timelineWrapper}>
      {/* Scrollable Timeline Lanes */}
      <View style={styles.tracksAndTimelineContainer}>
        {/* Fixed Left: Track Controls Headers */}
        <View style={styles.fixedHeadersColumn}>
          {/* Top empty spacer matching ruler height */}
          <View style={styles.rulerCornerSpacer}>
            <Text style={styles.tracksHeaderLabel}>TRACKS</Text>
          </View>

          {/* Track Headers */}
          {project.tracks.map((track) => (
            <TrackControls
              key={track.id}
              track={track}
              onToggleMute={onToggleMute}
              onToggleSolo={onToggleSolo}
              onToggleLock={onToggleLock}
              onChangeVolume={onChangeVolume}
              onAddClip={onAddClipToTrack}
              editorMode={editorMode}
            />
          ))}

          {/* Add Track Button */}
          {onAddTrack && (
            <TouchableOpacity style={styles.addTrackHeaderBtn} onPress={onAddTrack} activeOpacity={0.7}>
              <Plus color="#94A3B8" size={14} />
              <Text style={styles.addTrackHeaderText}>Add Track</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Right: Ruler + Track Lanes + Waveform Clips */}
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={[styles.timelineScrollContent, { width: totalWidth }]}
          scrollEventThrottle={16}
        >
          {/* 1. Timeline Ruler at Top */}
          <TimelineRuler
            duration={project.duration || 60}
            zoomPxPerSec={zoomPxPerSec}
            currentTime={currentTime}
            onSeek={onSeek}
            accentColor={accentColor}
          />

          {/* 2. Multitrack Lanes */}
          <View style={styles.lanesStack}>
            {project.tracks.map((track) => (
              <View key={track.id} style={styles.trackLaneRow}>
                {/* Background Grid Lines */}
                <View style={styles.laneGridBackground} />

                {/* Render Audio Clips */}
                {track.clips.map((clip) => (
                  <AudioClip
                    key={clip.id}
                    clip={clip}
                    trackId={track.id}
                    zoomPxPerSec={zoomPxPerSec}
                    isSelected={selectedClipId === clip.id}
                    onSelect={onSelectClip}
                    onMoveClip={onMoveClip}
                    onTrimClip={onTrimClip}
                    onLongPress={onLongPressClip}
                    trackColor={track.color || accentColor}
                    snapToGrid={project.snapToGrid}
                    gridSize={project.gridSize || 0.5}
                  />
                ))}

                {/* Empty Lane Placeholder */}
                {track.clips.length === 0 && (
                  <TouchableOpacity
                    style={styles.emptyLaneTouch}
                    onPress={() => onAddClipToTrack && onAddClipToTrack(track.id)}
                    activeOpacity={0.6}
                  >
                    <Plus color="rgba(255,255,255,0.2)" size={14} />
                    <Text style={styles.emptyLaneText}>Tap to add audio clip</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* 3. Global Playhead Line (Spans down across all tracks) */}
          <View
            pointerEvents="none"
            style={[
              styles.globalPlayheadLine,
              { left: playheadX, backgroundColor: accentColor },
            ]}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineWrapper: {
    flex: 1,
    backgroundColor: '#09090E',
  },
  tracksAndTimelineContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  fixedHeadersColumn: {
    width: 120,
    backgroundColor: '#0F121C',
    zIndex: 30,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  rulerCornerSpacer: {
    height: 28,
    backgroundColor: '#12121A',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tracksHeaderLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addTrackHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  addTrackHeaderText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  timelineScrollContent: {
    position: 'relative',
  },
  lanesStack: {
    flex: 1,
  },
  trackLaneRow: {
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    justifyContent: 'center',
  },
  laneGridBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 24, 0.5)',
  },
  emptyLaneTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70%',
    marginHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyLaneText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 11,
    fontWeight: '600',
  },
  globalPlayheadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 50,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
});
export default Timeline;
