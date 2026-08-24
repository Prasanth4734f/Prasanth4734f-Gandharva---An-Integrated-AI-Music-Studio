/**
 * Timeline Audio Data Model & Helper Utilities
 * Non-destructive Multitrack Audio Engine for Gandharva Studio
 */

export const DEFAULT_TRACK_THEMES = {
  vocals: { name: 'Vocals', icon: '🎤', color: '#FF2D55', gradient: ['#FF2D55', '#FF375F'] },
  bgm: { name: 'BGM / Chords', icon: '🎼', color: '#AF52DE', gradient: ['#AF52DE', '#C66CFF'] },
  drums: { name: 'Drums / Beat', icon: '🥁', color: '#FF9F0A', gradient: ['#FF9F0A', '#FFB340'] },
  instruments: { name: 'Instruments', icon: '🎸', color: '#30D158', gradient: ['#30D158', '#34C759'] },
  custom: { name: 'Synth / FX', icon: '✨', color: '#00E5FF', gradient: ['#00E5FF', '#0284C7'] },
};

/**
 * Creates a clean default project structure
 */
export const createInitialProject = (name = 'New Song Master', initialAudioUrl = null, initialDuration = 30) => {
  const initialClips = initialAudioUrl
    ? [
        {
          id: 'clip-master-' + Date.now(),
          title: name || 'Master Audio',
          audioSource: initialAudioUrl,
          timelineStart: 0,
          sourceStart: 0,
          sourceEnd: initialDuration || 30,
          duration: initialDuration || 30,
          volume: 1.0,
          pan: 0.0,
          fadeIn: 0.5,
          fadeOut: 0.5,
          effects: { bass: 0, treble: 0, reverb: 0.1, echo: 0 },
        },
      ]
    : [];

  return {
    id: 'proj-' + Date.now(),
    name: name,
    bpm: 120,
    key: 'C Major',
    snapToGrid: true,
    gridSize: 0.5, // 0.5s or 1.0s snap
    duration: Math.max(30, initialDuration || 30),
    tracks: [
      {
        id: 'vocals',
        name: 'Vocals',
        icon: '🎤',
        type: 'vocals',
        color: DEFAULT_TRACK_THEMES.vocals.color,
        volume: 1.0,
        pan: 0.0,
        muted: false,
        solo: false,
        locked: false,
        clips: initialClips,
      },
      {
        id: 'bgm',
        name: 'BGM / Chords',
        icon: '🎼',
        type: 'bgm',
        color: DEFAULT_TRACK_THEMES.bgm.color,
        volume: 0.85,
        pan: 0.0,
        muted: false,
        solo: false,
        locked: false,
        clips: [],
      },
      {
        id: 'drums',
        name: 'Drums / Beat',
        icon: '🥁',
        type: 'drums',
        color: DEFAULT_TRACK_THEMES.drums.color,
        volume: 0.8,
        pan: 0.0,
        muted: false,
        solo: false,
        locked: false,
        clips: [],
      },
      {
        id: 'instruments',
        name: 'Instruments',
        icon: '🎸',
        type: 'instruments',
        color: DEFAULT_TRACK_THEMES.instruments.color,
        volume: 0.75,
        pan: 0.0,
        muted: false,
        solo: false,
        locked: false,
        clips: [],
      },
    ],
  };
};

/**
 * Format seconds to MM:SS.S or MM:SS
 */
export const formatTimecode = (seconds, includeFraction = false) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const fraction = Math.floor((seconds % 1) * 10);
  
  const minStr = String(mins).padStart(2, '0');
  const secStr = String(secs).padStart(2, '0');
  
  return includeFraction ? `${minStr}:${secStr}.${fraction}` : `${minStr}:${secStr}`;
};

/**
 * Non-destructively moves a clip
 */
export const moveClip = (project, trackId, clipId, newTimelineStart) => {
  const cleanStart = Math.max(0, newTimelineStart);
  return {
    ...project,
    tracks: project.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          return { ...c, timelineStart: cleanStart };
        }),
      };
    }),
  };
};

/**
 * Non-destructively trims a clip (left or right handle)
 */
export const trimClip = (project, trackId, clipId, newSourceStart, newSourceEnd, newTimelineStart) => {
  return {
    ...project,
    tracks: project.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          const start = Math.max(0, newSourceStart);
          const end = Math.max(start + 0.2, newSourceEnd);
          const dur = end - start;
          return {
            ...c,
            sourceStart: start,
            sourceEnd: end,
            duration: dur,
            timelineStart: newTimelineStart !== undefined ? Math.max(0, newTimelineStart) : c.timelineStart,
          };
        }),
      };
    }),
  };
};

/**
 * Splits a clip at the given playhead time
 */
export const splitClipAtTime = (project, trackId, clipId, splitTimeOnTimeline) => {
  let hasSplit = false;
  const nextTracks = project.tracks.map((t) => {
    if (t.id !== trackId) return t;
    const clipIndex = t.clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return t;

    const target = t.clips[clipIndex];
    const offsetInClip = splitTimeOnTimeline - target.timelineStart;

    // Validate that split is inside the clip with at least 0.2s on each side
    if (offsetInClip <= 0.2 || offsetInClip >= target.duration - 0.2) {
      return t; // Too close to edges
    }

    const clipA = {
      ...target,
      id: 'clip-' + Date.now() + '-a',
      sourceEnd: target.sourceStart + offsetInClip,
      duration: offsetInClip,
      fadeOut: Math.min(target.fadeOut, 0.2),
    };

    const clipB = {
      ...target,
      id: 'clip-' + Date.now() + '-b',
      timelineStart: splitTimeOnTimeline,
      sourceStart: target.sourceStart + offsetInClip,
      duration: target.duration - offsetInClip,
      fadeIn: Math.min(target.fadeIn, 0.2),
    };

    hasSplit = true;
    const nextClips = [...t.clips];
    nextClips.splice(clipIndex, 1, clipA, clipB);
    return { ...t, clips: nextClips };
  });

  return hasSplit ? { ...project, tracks: nextTracks } : project;
};

/**
 * Duplicates a clip on the same track
 */
export const duplicateClip = (project, trackId, clipId) => {
  return {
    ...project,
    tracks: project.tracks.map((t) => {
      if (t.id !== trackId) return t;
      const target = t.clips.find((c) => c.id === clipId);
      if (!target) return t;

      const dupClip = {
        ...target,
        id: 'clip-dup-' + Date.now(),
        title: `${target.title} (Copy)`,
        timelineStart: target.timelineStart + target.duration + 0.5,
      };

      return { ...t, clips: [...t.clips, dupClip] };
    }),
  };
};

/**
 * Deletes a clip from a track
 */
export const deleteClip = (project, trackId, clipId) => {
  return {
    ...project,
    tracks: project.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
    }),
  };
};

/**
 * Updates clip properties (volume, pan, fade, effects)
 */
export const updateClipProperties = (project, trackId, clipId, properties) => {
  return {
    ...project,
    tracks: project.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          return { ...c, ...properties };
        }),
      };
    }),
  };
};

/**
 * Calculates total project duration from clips
 */
export const calculateTotalDuration = (project) => {
  let maxTime = 30;
  project.tracks.forEach((t) => {
    t.clips.forEach((c) => {
      const end = c.timelineStart + c.duration;
      if (end > maxTime) maxTime = end;
    });
  });
  return Math.ceil(maxTime + 5); // Add a 5-second buffer at the end
};
