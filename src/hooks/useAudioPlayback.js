import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Multitrack Audio Playback Orchestrator
 * Controls sound playback and synchronizes the visual playhead
 */
export const useAudioPlayback = (project) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Current position in seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  const soundRef = useRef(null);
  const playheadTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);

  // Keep refs in sync
  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlaybackTimer();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  /**
   * Start 60fps playhead timer
   */
  const startPlaybackTimer = useCallback(() => {
    stopPlaybackTimer();
    const startTime = Date.now();
    const initialPlayhead = currentTimeRef.current;

    playheadTimerRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;
      const elapsed = (Date.now() - startTime) / 1000 * playbackSpeed;
      const nextTime = initialPlayhead + elapsed;
      const maxDuration = project.duration || 60;

      if (nextTime >= maxDuration) {
        if (isLooping) {
          seekTo(0);
        } else {
          stop();
        }
      } else {
        setCurrentTime(nextTime);
      }
    }, 50);
  }, [playbackSpeed, project.duration, isLooping]);

  const stopPlaybackTimer = () => {
    if (playheadTimerRef.current) {
      clearInterval(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
  };

  /**
   * Load and play primary audio stream
   */
  const play = useCallback(async () => {
    // Find primary clip with audioSource
    let primarySource = null;
    for (const t of project.tracks) {
      if (!t.muted && t.clips.length > 0) {
        const found = t.clips.find((c) => c.audioSource);
        if (found) {
          primarySource = found.audioSource;
          break;
        }
      }
    }

    setIsPlaying(true);
    startPlaybackTimer();

    if (primarySource) {
      try {
        if (!soundRef.current) {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });

          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: primarySource },
            {
              shouldPlay: true,
              positionMillis: Math.floor(currentTimeRef.current * 1000),
              rate: playbackSpeed,
              shouldCorrectPitch: true,
            }
          );
          soundRef.current = newSound;
        } else {
          await soundRef.current.setPositionAsync(Math.floor(currentTimeRef.current * 1000));
          await soundRef.current.setRateAsync(playbackSpeed, true);
          await soundRef.current.playAsync();
        }
      } catch (err) {
        console.warn('[AudioPlayback] Failed to start native audio, continuing visual sync', err);
      }
    }
  }, [project.tracks, playbackSpeed, startPlaybackTimer]);

  /**
   * Pause playback
   */
  const pause = useCallback(async () => {
    setIsPlaying(false);
    stopPlaybackTimer();

    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
      } catch (e) {}
    }
  }, []);

  /**
   * Stop and return to start or 0
   */
  const stop = useCallback(async () => {
    setIsPlaying(false);
    stopPlaybackTimer();
    setCurrentTime(0);

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
      } catch (e) {}
    }
  }, []);

  /**
   * Seek playhead to specific seconds
   */
  const seekTo = useCallback(async (targetSeconds) => {
    const clamped = Math.max(0, Math.min(project.duration || 60, targetSeconds));
    setCurrentTime(clamped);

    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(Math.floor(clamped * 1000));
      } catch (e) {}
    }

    if (isPlayingRef.current) {
      startPlaybackTimer();
    }
  }, [project.duration, startPlaybackTimer]);

  /**
   * Change playback speed
   */
  const changePlaybackSpeed = useCallback(async (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(newSpeed, true);
      } catch (e) {}
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    playbackSpeed,
    isLooping,
    play,
    pause,
    stop,
    seekTo,
    changePlaybackSpeed,
    setIsLooping,
  };
};
