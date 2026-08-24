import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ChevronLeft, Play, Square, Trash2, Save, Music } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { Audio } from 'expo-av';
import { SOUND_MAP } from './SoundMap';
import { supabase } from '../../services/supabase';

// We removed MOCK_STORAGE since we're using Supabase now

import { saveProjectToLibrary, getSavedProjects, deleteProjectFromLibrary } from '../../services/libraryStorage';

const RecordingLibraryScreen = ({ navigation, route }) => {
  const [recordings, setRecordings] = useState([]);
  const [isPlayingId, setIsPlayingId] = useState(null);
  const [playbackTime, setPlaybackTime] = useState(0);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    // 1. Fetch from libraryStorage (AsyncStorage + Cloud)
    const allProjects = await getSavedProjects();
    const studioRecs = allProjects.filter(p => p.recordings && p.recordings.length > 0);
    
    // Also try fetching from Supabase table if available
    try {
      const { data } = await supabase
        .from('studio_recordings')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data && data.length > 0) {
        const cloudFormatted = data.map(d => ({
          id: d.id || `rec-${Date.now()}`,
          name: d.name || `My ${d.instrument} Take`,
          instrument: d.instrument,
          duration: d.duration,
          data: d.data,
          recordings: [{ instrument: d.instrument, data: d.data }],
          created_at: d.created_at
        }));
        
        const map = new Map();
        studioRecs.forEach(r => map.set(r.id, r));
        cloudFormatted.forEach(r => map.set(r.id, r));
        setRecordings(Array.from(map.values()));
        return;
      }
    } catch (e) {}

    setRecordings(studioRecs);
  };

  useEffect(() => {
    // If navigated from studio with a new recording
    if (route.params?.newRecording) {
      const saveRecording = async () => {
        const { instrument, data } = route.params.newRecording;
        const duration = data.length > 0 ? Math.max(...data.map(d => d.time + d.duration)) : 0;
        
        const newProj = {
          id: `rec-${Date.now()}`,
          name: `My ${instrument} Take`,
          genre: instrument,
          mood: 'Studio Take',
          recordings: [{ instrument, data, duration }],
          duration: duration,
          data: data,
          created_at: new Date().toISOString()
        };

        await saveProjectToLibrary(newProj);
        
        // Try saving to Supabase
        try {
          await supabase.from('studio_recordings').insert([{
            name: newProj.name,
            instrument,
            data,
            duration
          }]);
        } catch (e) {}

        Alert.alert("Recording Saved", `Your ${instrument} take has been saved to your Library!`);
        fetchRecordings();
        navigation.setParams({ newRecording: null });
      };
      
      saveRecording();
    }
  }, [route.params]);

  const deleteRecording = async (id) => {
    await deleteProjectFromLibrary(id);
    try {
      await supabase.from('studio_recordings').delete().eq('id', id);
    } catch (e) {}
    fetchRecordings();
  };

  const playRecording = async (rec) => {
    if (isPlayingId === rec.id) {
      setIsPlayingId(null);
      return; // Stop logic
    }
    
    setIsPlayingId(rec.id);
    setPlaybackTime(0);

    // Naive MVP sequencer playback
    // In a production app, we would use a robust scheduler or convert to audio file first.
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setPlaybackTime(elapsed);
      
      if (elapsed > rec.duration + 0.5) {
        clearInterval(interval);
        setIsPlayingId(null);
      }
    }, 100);

    // Play notes
    rec.data.forEach(async (event) => {
      setTimeout(async () => {
        if (isPlayingId !== rec.id) return; // cancelled
        try {
          let assetMap;
          if (rec.instrument === 'Piano') {
             assetMap = SOUND_MAP[event.note] || SOUND_MAP['C4']; 
          } else {
             assetMap = require('../../../assets/sounds/drums/kick.wav');
          }
          const { sound } = await Audio.Sound.createAsync(assetMap);
          await sound.playAsync();
          
          setTimeout(() => {
            sound.unloadAsync();
          }, event.duration * 1000);

        } catch (e) {
          console.log(e);
        }
      }, event.time * 1000);
    });
  };

  const importToEditor = (rec) => {
    // Navigate back to Editor and pass the sequence
    navigation.navigate('MusicEditor', { importedSequence: rec });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Recording Library</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {recordings.length === 0 ? (
          <Text style={styles.emptyText}>No recordings saved yet. Play an instrument to record a take!</Text>
        ) : (
          recordings.map(rec => (
            <GlassCard key={rec.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Music color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.recName}>{rec.name}</Text>
                  <Text style={styles.recMeta}>{new Date(rec.created_at).toLocaleDateString()} • {rec.duration ? rec.duration.toFixed(1) : 0}s • {rec.data ? rec.data.length : 0} notes</Text>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => playRecording(rec)}
                >
                  {isPlayingId === rec.id ? <Square color={COLORS.white} size={18} /> : <Play color={COLORS.white} size={18} />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} 
                  onPress={() => importToEditor(rec)}
                >
                  <Text style={styles.actionText}>Import to Editor</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: 'rgba(255,0,0,0.2)' }]}
                  onPress={() => deleteRecording(rec.id)}
                >
                  <Trash2 color="red" size={18} />
                </TouchableOpacity>
              </View>

              {isPlayingId === rec.id && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min(100, (playbackTime / rec.duration) * 100)}%` }]} />
                </View>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
  },
  backBtn: {
    marginRight: SPACING.s,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.xl,
    fontWeight: 'bold',
  },
  list: {
    padding: SPACING.m,
  },
  emptyText: {
    color: COLORS.lightGray,
    textAlign: 'center',
    marginTop: 50,
  },
  card: {
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  infoBox: {
    flex: 1,
  },
  recName: {
    color: COLORS.white,
    fontSize: SIZES.l,
    fontWeight: 'bold',
  },
  recMeta: {
    color: COLORS.lightGray,
    fontSize: SIZES.s,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: SPACING.m,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  }
});

export default RecordingLibraryScreen;
