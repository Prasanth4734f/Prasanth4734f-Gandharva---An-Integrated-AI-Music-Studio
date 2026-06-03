import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, Share } from 'react-native';
import { Play, Pause, Trash2, Search, FileText, Music, Share2, Sparkles, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import CONFIG from '../../config/api.config';
import { getProjects, deleteProject } from '../../services/lyricsService';

const LibraryScreen = () => {
  const isFocused = useIsFocused();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Audio Playback states for Library
  const [sound, setSound] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const data = await getProjects();
      // Reverse to show newest first
      const sortedData = data.reverse();
      setProjects(sortedData);
      applyFilterAndSearch(sortedData, activeTab, searchQuery);
    } catch (err) {
      console.error('[Library] Fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when screen is focused or tab/search changes
  useEffect(() => {
    if (isFocused) {
      fetchLibrary();
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [isFocused]);

  const applyFilterAndSearch = (data, tab, search) => {
    let result = [...data];

    // 1. Tab Filter
    if (tab === 'Music') {
      result = result.filter(p => p.music && p.music.length > 0);
    } else if (tab === 'Lyrics') {
      result = result.filter(p => p.lyrics && p.lyrics.length > 0);
    } else if (tab === 'Favorites') {
      // Show projects that have BOTH music and lyrics as premium favorites
      result = result.filter(p => p.music.length > 0 && p.lyrics.length > 0);
    }

    // 2. Search Query filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.genre && p.genre.toLowerCase().includes(query)) ||
        (p.mood && p.mood.toLowerCase().includes(query))
      );
    }

    setFilteredProjects(result);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    applyFilterAndSearch(projects, tab, searchQuery);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilterAndSearch(projects, activeTab, text);
  };

  // Inline Audio Playback for Library
  const handlePlayMusic = async (project) => {
    if (!project.music || project.music.length === 0) return;
    const track = project.music[0]; // Play the first variation

    try {
      if (playingTrackId === track.id && sound) {
        // Toggle play/pause
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setPlayingTrackId(null);
        } else {
          if (status.isLoaded && status.positionMillis >= status.durationMillis - 100) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setPlayingTrackId(track.id);
        }
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const targetUrl = track.audio_url.startsWith('http') ? track.audio_url : `${CONFIG.BASE_URL}${track.audio_url}`;
      setPlayingTrackId(track.id);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: targetUrl },
        { shouldPlay: true }
      );

      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingTrackId(null);
        }
      });
    } catch (err) {
      console.error('[Library Play] failed', err);
      Alert.alert('Playback Failed', 'Could not play audio composition.');
    }
  };

  const handleDelete = async (projectId) => {
    Alert.alert(
      'Delete Project',
      'Are you absolutely sure you want to permanently delete this project and all generated media files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (sound) {
                await sound.unloadAsync();
                setSound(null);
                setPlayingTrackId(null);
              }
              await deleteProject(projectId);
              await fetchLibrary();
            } catch (err) {
              Alert.alert('Delete failed', err.message);
            }
          }
        }
      ]
    );
  };

  const handleExport = async (project) => {
    try {
      if (project.music && project.music.length > 0) {
        // Export Music Audio
        const track = project.music[0];
        const targetUrl = track.audio_url.startsWith('http') ? track.audio_url : `${CONFIG.BASE_URL}${track.audio_url}`;

        const ext = targetUrl.split('.').pop() || 'wav';
        const localUri = `${FileSystem.documentDirectory}${project.name.replace(/\s+/g, '_')}.${ext}`;

        Alert.alert('Exporting Music', 'Downloading audio file for export...');
        const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
        await Sharing.shareAsync(uri);
      } else if (project.lyrics && project.lyrics.length > 0) {
        // Export Lyrics Text
        const lyric = project.lyrics[0];
        await Share.share({
          title: lyric.title,
          message: `${lyric.title}\n\n${lyric.lyrics_text}`,
        });
      }
    } catch (err) {
      Alert.alert('Export failed', err.message);
    }
  };

  const renderItem = ({ item }) => {
    const hasMusic = item.music && item.music.length > 0;
    const hasLyrics = item.lyrics && item.lyrics.length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.itemLeft}>
          <TouchableOpacity
            style={[
              styles.iconBox,
              { backgroundColor: hasMusic ? '#EC4899' + '40' : 'rgba(255,255,255,0.1)' }
            ]}
            onPress={() => hasMusic ? handlePlayMusic(item) : null}
          >
            {hasMusic ? (
              playingTrackId === item.music[0].id ? (
                <Pause color="#EC4899" size={20} fill="#EC4899" />
              ) : (
                <Play color="#EC4899" size={20} fill="#EC4899" />
              )
            ) : (
              <FileText color="#EC4899" size={20} />
            )}
          </TouchableOpacity>

          <View style={styles.itemInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {hasMusic && hasLyrics ? 'Complete Project' : hasMusic ? 'Music Track' : 'Lyric Draft'}
              {item.genre ? ` • ${item.genre}` : ''}
              {item.mood ? ` • ${item.mood}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleExport(item)}>
            <Share2 color="#666" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { marginLeft: SPACING.md }]} onPress={() => handleDelete(item.id)}>
            <Trash2 color="#ff4a4a" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#000000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Library</Text>
          <Text style={styles.headerSubtitle}>{projects.length} saved creations</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLibrary}>
          <RefreshCw color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Dynamic Search Bar */}
      <View style={styles.searchContainer}>
        <Search color="rgba(255,255,255,0.6)" size={18} />
        <TextInput
          placeholder="Search your music studio..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {['All', 'Music', 'Lyrics', 'Favorites'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabChange(tab)}
            style={[styles.tabNew, activeTab === tab && styles.tabActiveNew]}
          >
            <Text style={[styles.tabTextNew, activeTab === tab && styles.tabTextActiveNew]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Library History List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={styles.loadingText}>Loading studio archive...</Text>
        </View>
      ) : filteredProjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles color="#EC4899" size={40} style={{ marginBottom: SPACING.md }} />
          <Text style={styles.emptyTitle}>Studio is empty</Text>
          <Text style={styles.emptyText}>Go to Generate tab to create your first track.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: SIZES.font_sm,
    marginTop: 4,
  },
  refreshBtn: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 50,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: '#fff',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  tabNew: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabActiveNew: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  tabTextNew: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActiveNew: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: SIZES.radius_lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemInfo: {
    justifyContent: 'center',
    flex: 1,
    paddingRight: 10,
  },
  itemMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LibraryScreen;
