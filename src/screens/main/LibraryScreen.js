import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, Share, Modal, ScrollView } from 'react-native';
import { Play, Pause, Trash2, Search, FileText, Music, Share2, Sparkles, RefreshCw, SlidersHorizontal, Copy, X, Mic, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

import CONFIG from '../../config/api.config';
import { getProjects, deleteProject } from '../../services/lyricsService';
import { cacheAudioTrack, getPlaybackUri } from '../../services/audioCache';
import { getSavedProjects, deleteProjectFromLibrary } from '../../services/libraryStorage';

const LibraryScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Audio Playback states for Library
  const [sound, setSound] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // Notepad Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [isNotepadVisible, setIsNotepadVisible] = useState(false);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      // 1. Load from local + cloud libraryStorage
      let data = await getSavedProjects();

      // 2. Try fetching from server API as well if available
      try {
        const serverData = await getProjects();
        if (serverData && Array.isArray(serverData) && serverData.length > 0) {
          const map = new Map();
          data.forEach(p => map.set(p.id, p));
          serverData.forEach(p => map.set(p.id, p));
          data = Array.from(map.values());
        }
      } catch (e) {}

      // Sort newest first
      const sortedData = data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setProjects(sortedData);
      applyFilterAndSearch(sortedData, activeTab, searchQuery);

      // Background cache synchronizer for offline playback
      sortedData.forEach(proj => {
        if (proj.music) {
          proj.music.forEach(m => {
            if (m.audio_url) cacheAudioTrack(m.audio_url);
          });
        }
      });
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
      result = result.filter(p => p.music && p.music.length > 0 && p.lyrics && p.lyrics.length > 0);
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
    const track = project.music[0];

    try {
      if (playingTrackId === track.id && sound) {
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

      const targetUrl = await getPlaybackUri(track.audio_url);
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

  const handleOpenNotepad = (project) => {
    setSelectedProject(project);
    setIsNotepadVisible(true);
  };

  const handleCopyNotepadText = async (project) => {
    const textToCopy = project?.lyrics?.[0]?.lyrics_text || project?.prompt || project?.name || '';
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert('Copied to Notepad! 📋', 'Saved lyrics copied to your clipboard.');
  };

  const handleCreateSongFromSaved = (project) => {
    setIsNotepadVisible(false);
    const lyricsText = project?.lyrics?.[0]?.lyrics_text || project?.prompt || '';
    const bgmPrompt = project?.prompt || `High-quality ${project?.genre || 'Pop'} ${project?.mood || 'Romantic'} instrumental arrangement`;
    
    navigation.navigate('CreateSong', {
      lyrics: lyricsText,
      bgmPrompt: bgmPrompt,
      title: project?.name || 'Saved Song',
      genre: project?.genre || 'Pop',
      mood: project?.mood || 'Romantic',
      language: project?.language || 'English'
    });
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
              await deleteProjectFromLibrary(projectId);
              try {
                await deleteProject(projectId);
              } catch (e) {}
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
        const track = project.music[0];
        const targetUrl = track.audio_url.startsWith('http') ? track.audio_url : `${CONFIG.BASE_URL}${track.audio_url}`;
        const ext = targetUrl.split('.').pop()?.split('?')[0] || 'mp3';
        const filename = `${project.name.replace(/[^\w]/g, '_')}.${ext}`;

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = targetUrl;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Saved to Device Memory 💾', `Audio track downloaded to device Downloads folder:\n${filename}`);
        } else {
          const localUri = `${FileSystem.documentDirectory}${filename}`;
          Alert.alert('Saving to Device', 'Downloading audio composition to device memory...');
          const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { dialogTitle: `Save ${project.name} to Device` });
          }
          Alert.alert('Saved to Device Memory 💾', `Track audio saved to local device storage:\n${uri}`);
        }
      } else if (project.lyrics && project.lyrics.length > 0) {
        const lyric = project.lyrics[0];
        const text = `${lyric.title}\n\n${lyric.lyrics_text}`;
        const filename = `${project.name.replace(/[^\w]/g, '_')}_lyrics.txt`;

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert('Saved to Device Memory 💾', `Lyrics text downloaded as ${filename}`);
        } else {
          const localUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(localUri, text, { encoding: FileSystem.EncodingType.UTF8 });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, { mimeType: 'text/plain', dialogTitle: 'Save Lyrics File' });
          }
          Alert.alert('Saved to Device Memory 💾', `Lyrics text saved to device storage:\n${localUri}`);
        }
      }
    } catch (err) {
      Alert.alert('Export Error', 'Could not save file to device memory: ' + err.message);
    }
  };

  const handleOpenSavedItem = (item) => {
    // 1. Story to Album package
    if (item.type === 'album' || item.album || item.tracks) {
      navigation.navigate('StoryToAlbum', { savedAlbum: item });
      return;
    }

    // 2. Saved Lyrics Project -> Navigate to Lyrics Studio with lyrics pre-loaded
    if (item.lyrics && item.lyrics.length > 0) {
      const lyricObj = item.lyrics[0];
      navigation.navigate('LyricsGenerator', {
        savedLyrics: {
          id: item.id,
          title: lyricObj.title || item.name,
          lyrics_text: lyricObj.lyrics_text,
          genre: item.genre,
          mood: item.mood,
          language: item.language,
          prompt: item.prompt || item.name
        }
      });
      return;
    }

    // 3. Music Composition / Track -> Navigate to Music Editor
    if (item.music && item.music.length > 0) {
      const track = item.music[0];
      if (sound) {
        try { sound.unloadAsync(); } catch(e){}
        setSound(null);
        setPlayingTrackId(null);
      }
      navigation.navigate('MusicEditor', {
        audioUrl: track.audio_url,
        title: item.name,
        trackId: track.id,
        projectId: item.id
      });
      return;
    }

    // Default Notepad Sheet fallback
    setSelectedProject(item);
    setIsNotepadVisible(true);
  };

  const renderItem = ({ item }) => {
    const hasMusic = item.music && item.music.length > 0;
    const hasLyrics = item.lyrics && item.lyrics.length > 0;

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.itemLeft} onPress={() => handleOpenSavedItem(item)}>
          <TouchableOpacity
            style={[
              styles.iconBox,
              { backgroundColor: hasMusic ? '#FDF2F8' : '#EFF6FF' }
            ]}
            onPress={() => hasMusic ? handlePlayMusic(item) : handleOpenSavedItem(item)}
          >
            {hasMusic ? (
              playingTrackId === item.music[0].id ? (
                <Pause color="#DB2777" size={20} fill="#DB2777" />
              ) : (
                <Play color="#DB2777" size={20} fill="#DB2777" />
              )
            ) : (
              <FileText color="#2563EB" size={20} />
            )}
          </TouchableOpacity>

          <View style={styles.itemInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {hasMusic && hasLyrics ? 'Complete Project' : hasMusic ? 'Music Track' : 'Saved Lyrics'}
              {item.genre ? ` • ${item.genre}` : ''}
              {item.mood ? ` • ${item.mood}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.itemRight}>
          {hasMusic && (
            <TouchableOpacity 
              style={[styles.actionBtn, { marginRight: 6 }]} 
              onPress={async () => {
                if (sound) {
                  try { await sound.unloadAsync(); } catch(e){}
                  setSound(null);
                  setPlayingTrackId(null);
                }
                const track = item.music[0];
                navigation.navigate('MusicEditor', {
                  audioUrl: track.audio_url,
                  title: item.name,
                  trackId: track.id,
                  projectId: item.id
                });
              }}
            >
              <SlidersHorizontal color="#DB2777" size={18} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenNotepad(item)}>
            <Copy color="#2563EB" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { marginLeft: 6 }]} onPress={() => handleExport(item)}>
            <Share2 color="#6B7280" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { marginLeft: 6 }]} onPress={() => handleDelete(item.id)}>
            <Trash2 color="#EF4444" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Library</Text>
          <Text style={styles.headerSubtitle}>{projects.length} saved creations</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLibrary}>
          <RefreshCw color="#2563EB" size={18} />
        </TouchableOpacity>
      </View>

      {/* Dynamic Search Bar */}
      <View style={styles.searchContainer}>
        <Search color="#9CA3AF" size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, genre, mood..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['All', 'Lyrics', 'Music', 'Favorites'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#DB2777" size="large" />
          <Text style={styles.loadingText}>Loading library files...</Text>
        </View>
      ) : filteredProjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles color="#9CA3AF" size={48} />
          <Text style={styles.emptyTitle}>No Projects Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No creations match your search filter.' : 'Generate lyrics or music to save them here in your studio library.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Lyrics Notepad Modal */}
      <Modal
        visible={isNotepadVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotepadVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notepadCard}>
            
            {/* Notepad Header */}
            <View style={styles.notepadHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notepadTitle} numberOfLines={1}>
                  📝 {selectedProject?.name || 'Saved Lyrics'}
                </Text>
                <Text style={styles.notepadSub}>
                  {selectedProject?.genre ? `${selectedProject.genre} • ` : ''}
                  {selectedProject?.mood ? `${selectedProject.mood} • ` : ''}
                  Notepad Sheet
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsNotepadVisible(false)}>
                <X color="#374151" size={20} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Notepad Paper Area */}
            <ScrollView style={styles.notepadPaper} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              <Text style={styles.notepadText}>
                {selectedProject?.lyrics?.[0]?.lyrics_text || selectedProject?.prompt || 'No lyrics content found.'}
              </Text>
            </ScrollView>

            {/* Notepad Quick Action Buttons */}
            <View style={styles.notepadActionRow}>
              <TouchableOpacity 
                style={[styles.notepadBtn, { backgroundColor: '#9333EA' }]} 
                onPress={() => {
                  setIsNotepadVisible(false);
                  handleOpenSavedItem(selectedProject);
                }}
              >
                <FileText color="#FFFFFF" size={16} />
                <Text style={styles.notepadBtnText}>Open Studio</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.notepadBtn, { backgroundColor: '#2563EB' }]} 
                onPress={() => handleCopyNotepadText(selectedProject)}
              >
                <Copy color="#FFFFFF" size={16} />
                <Text style={styles.notepadBtnText}>Copy Text</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.notepadBtn, { backgroundColor: '#DB2777' }]} 
                onPress={() => handleCreateSongFromSaved(selectedProject)}
              >
                <Mic color="#FFFFFF" size={16} />
                <Text style={styles.notepadBtnText}>Create Song</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.notepadBtn, { backgroundColor: '#4B5563' }]} 
                onPress={() => handleExport(selectedProject)}
              >
                <Share2 color="#FFFFFF" size={16} />
                <Text style={styles.notepadBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    height: 44,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#DB2777',
    borderColor: '#BE185D',
  },
  tabText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
  cardTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemMeta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Modal Notepad Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notepadCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  notepadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  notepadTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  notepadSub: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  notepadPaper: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    maxHeight: 320,
    marginBottom: 16,
  },
  notepadText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 24,
  },
  notepadActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  notepadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  notepadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default LibraryScreen;
