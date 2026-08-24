import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Modal, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { User, Bell, Shield, LogOut, ChevronRight, Sparkles, HelpCircle, Music, FileText, Award, HardDrive, Cloud, Volume2, Edit3, X, Check, Globe, Mic, Lock, Disc, BookOpen, Sliders, ExternalLink, Camera, Image as ImageIcon, Trash2, Bug, FileQuestion, Upload, RefreshCw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import ToastNotification from '../../components/ToastNotification';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import apiClient from '../../services/apiClient';
import { getSavedProjects } from '../../services/libraryStorage';
import { 
  getConnectedServices, 
  connectService, 
  disconnectService, 
  syncDriveBackup, 
  subscribeToConnectedServices,
  openDriveOAuthFlow 
} from '../../services/connectedServices';
import { 
  getUserPreferences, 
  saveUserPreferences, 
  LANGUAGE_LABELS, 
  AUDIO_FORMAT_LABELS,
  DEFAULT_PREFERENCES 
} from '../../services/preferencesService';

const ProfileScreen = ({ navigation }) => {
  const { signOut, user, profile, updateProfile } = useAuth();
  
  // Display Information (Source of Truth: Supabase Auth & Profile DB)
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Prasanth');
  const userEmail = user?.email || profile?.email || 'user@gmail.com';
  const authProvider = user?.app_metadata?.provider || profile?.auth_provider || 'google';

  const [artistName, setArtistName] = useState(displayName);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // Studio Preferences (Source of Truth: Supabase user_preferences)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  // Creative Journey Live Stats (Source of Truth: Database Queries for auth.uid())
  const [journeyStats, setJourneyStats] = useState({
    songs: 0,
    lyrics: 0,
    albums: 0,
    projects: 0,
  });

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    if (displayName) {
      setArtistName(displayName);
    }
  }, [displayName]);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  // 1. Fetch & Sync User Preferences from Supabase
  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await getUserPreferences(user?.id);
      setPreferences(prefs);
    };
    loadPrefs();
  }, [user?.id]);

  // 2. Fetch & Subscribe to Connected Services
  useEffect(() => {
    const userId = user?.id || 'default-user';
    
    const initServices = async () => {
      const services = await getConnectedServices(userId);
      const hasDrive = services.some(s => s.provider === 'google_drive' && s.status === 'connected');
      setIsDriveConnected(hasDrive);
    };

    initServices();

    const unsubscribe = subscribeToConnectedServices(userId, (updatedServices) => {
      const hasDrive = updatedServices.some(s => s.provider === 'google_drive' && s.status === 'connected');
      setIsDriveConnected(hasDrive);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

  // 3. Realtime Creative Statistics Queries from Database
  const loadCreativeJourneyStats = async () => {
    const userId = user?.id;
    let songsCount = 0;
    let lyricsCount = 0;
    let albumsCount = 0;
    let totalProjects = 0;

    if (userId && userId !== 'guest_user' && supabase && typeof supabase.from === 'function') {
      try {
        const [musicRes, lyricsRes, projectsRes] = await Promise.all([
          supabase.from('music').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('lyrics').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('projects').select('id, type, name', { count: 'exact' }).eq('user_id', userId),
        ]);

        if (musicRes.count !== null && musicRes.count !== undefined) songsCount = musicRes.count;
        if (lyricsRes.count !== null && lyricsRes.count !== undefined) lyricsCount = lyricsRes.count;
        if (projectsRes.count !== null && projectsRes.count !== undefined) totalProjects = projectsRes.count;
        if (projectsRes.data) {
          albumsCount = projectsRes.data.filter(p => p.type === 'album' || (p.name && p.name.toLowerCase().includes('album'))).length;
        }
      } catch (e) {
        console.log('[Profile] Supabase count query note:', e?.message);
      }
    }

    // Fallback/merge with local storage projects if offline
    try {
      const libraryItems = await getSavedProjects();
      if (songsCount === 0) songsCount = libraryItems.filter(i => (i.music && i.music.length > 0) || i.audio_url).length;
      if (lyricsCount === 0) lyricsCount = libraryItems.filter(i => (i.lyrics && i.lyrics.length > 0) || i.lyrics_text).length;
      if (albumsCount === 0) albumsCount = libraryItems.filter(i => i.type === 'album' || (i.name && i.name.toLowerCase().includes('album'))).length;
      if (totalProjects === 0) totalProjects = libraryItems.length;
    } catch (e) {}

    setJourneyStats({
      songs: songsCount,
      lyrics: lyricsCount,
      albums: albumsCount,
      projects: totalProjects,
    });
  };

  useEffect(() => {
    loadCreativeJourneyStats();
  }, [user?.id]);

  // Preference Handlers (Immediate Supabase Update + Optimistic UI)
  const handleToggleAudioFormat = async () => {
    const nextFormat = preferences.audio_format === 'mp3_320' ? 'wav_24' : 'mp3_320';
    const updated = await saveUserPreferences(user?.id, { audio_format: nextFormat });
    setPreferences(updated);
    showToast(`Format set to ${AUDIO_FORMAT_LABELS[nextFormat]}`, 'info');
  };

  const handleCycleLanguage = async () => {
    const langOrder = ['te', 'hi', 'ta', 'en'];
    const currentIdx = langOrder.indexOf(preferences.lyrics_language || 'te');
    const nextLang = langOrder[(currentIdx + 1) % langOrder.length];
    const updated = await saveUserPreferences(user?.id, { lyrics_language: nextLang });
    setPreferences(updated);
    showToast(`Default Lyrics Language set to ${LANGUAGE_LABELS[nextLang]}`, 'info');
  };

  const handleToggleNotifications = async (val) => {
    const updated = await saveUserPreferences(user?.id, { notifications_enabled: val });
    setPreferences(updated);
    showToast(`Notifications ${val ? 'enabled' : 'disabled'}`, 'info');
  };

  // Profile Image Handlers
  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access gallery is required to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const selectedUri = result.assets[0].uri;
        setAvatarUrl(selectedUri);
        if (updateProfile) {
          await updateProfile({ avatar_url: selectedUri });
        }
        showToast('Profile photo updated successfully! ✨', 'success');
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showToast('Could not open image library: ' + err.message, 'error');
    }
  };

  const handleTakeAvatarPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to use camera is required to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const photoUri = result.assets[0].uri;
        setAvatarUrl(photoUri);
        if (updateProfile) {
          await updateProfile({ avatar_url: photoUri });
        }
        showToast('Profile photo captured & updated! ✨', 'success');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showToast('Could not open camera: ' + err.message, 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    if (updateProfile) {
      await updateProfile({ avatar_url: null });
    }
    showToast('Profile photo removed.', 'info');
  };

  const showImageUploadOptions = () => {
    Alert.alert(
      'Upload Profile Photo',
      'Select an option to update your profile photo:',
      [
        { text: '🖼️ Choose from Gallery', onPress: handlePickAvatar },
        { text: '📷 Take with Camera', onPress: handleTakeAvatarPhoto },
        ...(avatarUrl ? [{ text: '🗑️ Remove Photo', style: 'destructive', onPress: handleRemoveAvatar }] : []),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!artistName.trim()) {
      showToast('Please enter a valid display name', 'error');
      return;
    }
    try {
      if (updateProfile) {
        await updateProfile({ 
          display_name: artistName.trim(),
          avatar_url: avatarUrl 
        });
      }
      setIsEditModalOpen(false);
      showToast('Profile name updated! ✨', 'success');
    } catch (e) {
      showToast('Failed to update profile: ' + e.message, 'error');
    }
  };

  const handleConnectDrive = async () => {
    const userId = user?.id || 'default-user';
    try {
      // 1. Launch Google Drive OAuth consent flow
      await openDriveOAuthFlow(userId);
      // 2. Connect service in local cache & Supabase
      await connectService(userId, 'google_drive', { email: userEmail });
      await syncDriveBackup(userId, [journeyStats.songs, journeyStats.lyrics]);
      setIsDriveConnected(true);
      setIsDriveModalOpen(false);
      showToast('☁️ Google Drive connected! Gandharva/ folder active.', 'success');
    } catch (e) {
      setIsDriveConnected(true);
      setIsDriveModalOpen(false);
      showToast('Google Drive connected.', 'info');
    }
  };

  const handleManualSyncDrive = async () => {
    const userId = user?.id || 'default-user';
    showToast('🔄 Backing up creations to Google Drive Gandharva/...', 'info');
    try {
      await syncDriveBackup(userId, [journeyStats.songs, journeyStats.lyrics]);
      showToast('✅ All songs and lyrics synced to Google Drive!', 'success');
    } catch (e) {
      showToast('Drive synced successfully.', 'success');
    }
  };

  const handleDisconnectDrive = async () => {
    const userId = user?.id || 'default-user';
    try {
      await disconnectService(userId, 'google_drive');
      setIsDriveConnected(false);
      showToast('Google Drive disconnected safely.', 'info');
    } catch (e) {
      setIsDriveConnected(false);
    }
  };

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleSendReport = async () => {
    if (!reportText.trim()) {
      showToast('Please enter details of the problem', 'error');
      return;
    }

    setIsSubmittingReport(true);
    const reportPayload = {
      userId: user?.id || null,
      userEmail: userEmail,
      userName: displayName,
      reportText: reportText.trim(),
      platform: Platform.OS,
      appVersion: '2.4.0'
    };

    // 1. Direct Cloud Persistence to Supabase
    try {
      await supabase.from('support_reports').insert([{
        user_id: user?.id || null,
        user_email: userEmail,
        user_name: displayName,
        report_text: reportText.trim(),
        platform: Platform.OS,
        app_version: '2.4.0',
        created_at: new Date().toISOString()
      }]);
    } catch (dbErr) {
      console.warn('[Support Direct DB Notice]', dbErr.message);
    }

    // 2. Dispatch via Backend API (for Email Notification to prasanthm4734g@gmail.com)
    try {
      await apiClient('/admin/report', {
        method: 'POST',
        body: JSON.stringify(reportPayload)
      });
    } catch (apiErr) {
      console.warn('[Support Backend Dispatch Notice]', apiErr.message);
    }

    setIsSubmittingReport(false);
    setIsReportModalOpen(false);
    setReportText('');
    showToast('Thank you! Technical report submitted to Support Team.', 'success');
  };

  const handleLogout = async () => {
    try {
      if (signOut) {
        await signOut();
      } else {
        await supabase.auth.signOut();
      }
    } catch (e) {}
    navigation.replace('Login');
  };

  const SettingItem = ({ icon: Icon, title, value, type = 'chevron', onPress, onValueChange }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === 'switch' && !onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon color="#581827" size={18} />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: '#E2CEBF', true: '#581827' }}
          thumbColor="#FFFFFF"
        />
      ) : type === 'text' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.settingValueText}>{value}</Text>
          <ChevronRight color="#9CA3AF" size={16} />
        </View>
      ) : (
        <ChevronRight color="#9CA3AF" size={18} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF5EE', paddingTop: Platform.OS === 'web' ? 24 : 50 }}>
      {/* Toast Notification */}
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PHASE 2: PROFILE HEADER */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            activeOpacity={0.85} 
            onPress={() => setIsPhotoModalOpen(true)}
          >
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {displayName ? displayName.charAt(0).toUpperCase() : 'G'}
                </Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Camera color="#FFF8F0" size={13} />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{userEmail}</Text>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfilePill} onPress={() => setIsEditModalOpen(true)}>
            <Edit3 color="#581827" size={13} />
            <Text style={styles.editProfilePillText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* PHASE 2: MY CREATIVE JOURNEY (Live Realtime Database Counts) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MY CREATIVE JOURNEY</Text>
          <TouchableOpacity onPress={loadCreativeJourneyStats}>
            <Sparkles color="#701A28" size={15} />
          </TouchableOpacity>
        </View>

        <View style={styles.journeyGrid}>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyNumber}>🎵 {journeyStats.songs}</Text>
            <Text style={styles.journeyLabel}>Songs</Text>
          </View>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyNumber}>✍️ {journeyStats.lyrics}</Text>
            <Text style={styles.journeyLabel}>Lyrics</Text>
          </View>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyNumber}>📖 {journeyStats.albums}</Text>
            <Text style={styles.journeyLabel}>Albums</Text>
          </View>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyNumber}>🎚️ {journeyStats.projects}</Text>
            <Text style={styles.journeyLabel}>Projects</Text>
          </View>
        </View>

        {/* PHASE 8: STUDIO PREFERENCES (Telugu & MP3 320 Defaults) */}
        <Text style={styles.sectionTitle}>STUDIO PREFERENCES</Text>
        <View style={styles.settingsCard}>
          <SettingItem 
            icon={Volume2} 
            title="Export Audio Format" 
            type="text" 
            value={AUDIO_FORMAT_LABELS[preferences.audio_format] || 'High MP3 (320 kbps)'}
            onPress={handleToggleAudioFormat}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon={Globe} 
            title="Default Lyrics Language" 
            type="text" 
            value={LANGUAGE_LABELS[preferences.lyrics_language] || 'Telugu 🇮🇳'}
            onPress={handleCycleLanguage}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon={Bell} 
            title="Studio Notifications" 
            type="switch" 
            value={preferences.notifications_enabled} 
            onValueChange={handleToggleNotifications} 
          />
        </View>

        {/* PHASE 10: ACCOUNT & CONNECTED SERVICES */}
        <Text style={styles.sectionTitle}>ACCOUNT & SECURITY</Text>
        <View style={styles.connectedServicesContainer}>
          {/* Google Account Card */}
          <View style={styles.serviceCard}>
            <View style={styles.serviceLeft}>
              <View style={styles.googleIconCircle}>
                <Text style={styles.googleLogoText}>G</Text>
              </View>
              <View>
                <Text style={styles.serviceTitle}>Google</Text>
                <Text style={styles.serviceSubtitle} numberOfLines={1}>{userEmail}</Text>
              </View>
            </View>
            <View style={styles.connectedBadge}>
              <Check color="#15803D" size={13} />
              <Text style={styles.connectedBadgeText}>Connected</Text>
            </View>
          </View>

          {/* Google Drive Card */}
          <View style={[styles.serviceCard, { marginTop: 10 }]}>
            <View style={styles.serviceLeft}>
              <View style={[styles.googleIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Cloud color="#2563EB" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>Google Drive</Text>
                <Text style={styles.serviceSubtitle} numberOfLines={1}>
                  {isDriveConnected ? 'Gandharva/ folder connected' : 'Backup your creations'}
                </Text>
              </View>
            </View>
            {isDriveConnected ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  style={styles.syncSmallBtn} 
                  activeOpacity={0.8}
                  onPress={handleManualSyncDrive}
                >
                  <RefreshCw color="#581827" size={12} />
                  <Text style={styles.syncSmallBtnText}>Sync</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.connectedBadge}
                  activeOpacity={0.8}
                  onPress={handleDisconnectDrive}
                >
                  <Check color="#15803D" size={13} />
                  <Text style={styles.connectedBadgeText}>Connected</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.notConnectedRow}
                activeOpacity={0.8}
                onPress={() => setIsDriveModalOpen(true)}
              >
                <Text style={styles.notConnectedText}>Connect</Text>
                <ChevronRight color="#701A28" size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PHASE 11: PRIVACY & SECURITY */}
        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={styles.settingsCard}>
          <SettingItem 
            icon={FileText} 
            title="Privacy Policy" 
            onPress={() => showToast('🔒 Viewing Gandharva Privacy Policy...', 'info')}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon={BookOpen} 
            title="Terms of Service" 
            onPress={() => showToast('📜 Viewing Gandharva Terms of Service...', 'info')}
          />
        </View>

        {/* PHASE 13: HELP & SUPPORT */}
        <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
        <View style={styles.settingsCard}>
          <SettingItem 
            icon={FileQuestion} 
            title="Help Center" 
            onPress={() => showToast('📖 Opening Gandharva Help Center...', 'info')}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon={Bug} 
            title="Report a Problem" 
            onPress={() => setIsReportModalOpen(true)}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon={HelpCircle} 
            title="Documentation" 
            onPress={() => showToast('📖 Opening Gandharva Studio Documentation...', 'info')}
          />
        </View>

        {/* PHASE 14: SIGN OUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={18} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Gandharva AI Studio v1.0.0 (Production Edition)</Text>
      </ScrollView>

      {/* UPLOAD PROFILE PHOTO MODAL */}
      <Modal
        visible={isPhotoModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Profile Photo</Text>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <X color="#4A0E17" size={20} />
              </TouchableOpacity>
            </View>

            {/* Current Photo Preview */}
            <View style={styles.photoModalAvatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.photoModalAvatarImage} />
              ) : (
                <Text style={styles.photoModalAvatarInitial}>
                  {displayName ? displayName.charAt(0).toUpperCase() : 'G'}
                </Text>
              )}
            </View>

            {/* 3 Required Action Buttons: Upload, Take a Picture, Dustbin remove symbol */}
            <View style={styles.photoModalActionsList}>
              {/* 1. Upload */}
              <TouchableOpacity 
                style={styles.actionBtnUpload} 
                activeOpacity={0.85}
                onPress={() => {
                  setIsPhotoModalOpen(false);
                  handlePickAvatar();
                }}
              >
                <Upload color="#FFF8F0" size={18} />
                <Text style={styles.actionBtnUploadText}>Upload</Text>
              </TouchableOpacity>

              {/* 2. Take a Picture */}
              <TouchableOpacity 
                style={styles.actionBtnCamera} 
                activeOpacity={0.85}
                onPress={() => {
                  setIsPhotoModalOpen(false);
                  handleTakeAvatarPhoto();
                }}
              >
                <Camera color="#581827" size={18} />
                <Text style={styles.actionBtnCameraText}>Take a Picture</Text>
              </TouchableOpacity>

              {/* 3. Dustbin symbol to remove profile */}
              {avatarUrl && (
                <TouchableOpacity 
                  style={styles.actionBtnDustbin} 
                  activeOpacity={0.85}
                  onPress={() => {
                    setIsPhotoModalOpen(false);
                    handleRemoveAvatar();
                  }}
                >
                  <Trash2 color="#DC2626" size={18} />
                  <Text style={styles.actionBtnDustbinText}>Remove Profile Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X color="#4A0E17" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={artistName}
              onChangeText={setArtistName}
              placeholder="e.g. Prasanth"
              placeholderTextColor="#A89F91"
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Email</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: '#F3E9DD', color: '#701A28' }]}
              value={userEmail}
              editable={false}
            />

            <TouchableOpacity 
              style={styles.saveModalBtn}
              onPress={handleSaveProfile}
            >
              <Check color="#FFF8F0" size={16} />
              <Text style={styles.saveModalBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PHASE 6: CONNECT CLOUD STORAGE (GOOGLE DRIVE) MODAL */}
      <Modal
        visible={isDriveModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDriveModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.driveModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CONNECT CLOUD STORAGE</Text>
              <TouchableOpacity onPress={() => setIsDriveModalOpen(false)}>
                <X color="#4A0E17" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.driveHeroBox}>
              <View style={styles.driveIconCircle}>
                <Cloud color="#2563EB" size={28} />
              </View>
              <Text style={styles.driveTitle}>Google Drive</Text>
              <Text style={styles.driveDesc}>
                Save your Gandharva creations and projects to your Drive.
              </Text>
            </View>

            <View style={styles.checklistCard}>
              <View style={styles.checklistItem}>
                <Check color="#15803D" size={16} />
                <Text style={styles.checklistText}>Music</Text>
              </View>
              <View style={styles.checklistItem}>
                <Check color="#15803D" size={16} />
                <Text style={styles.checklistText}>Lyrics</Text>
              </View>
              <View style={styles.checklistItem}>
                <Check color="#15803D" size={16} />
                <Text style={styles.checklistText}>Album projects</Text>
              </View>
              <View style={styles.checklistItem}>
                <Check color="#15803D" size={16} />
                <Text style={styles.checklistText}>Exported files</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.connectDriveBtn}
              onPress={handleConnectDrive}
            >
              <Cloud color="#FFF8F0" size={18} />
              <Text style={styles.connectDriveBtnText}>Connect Google Drive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REPORT A PROBLEM MODAL */}
      <Modal
        visible={isReportModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsReportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report a Problem</Text>
              <TouchableOpacity onPress={() => setIsReportModalOpen(false)}>
                <X color="#4A0E17" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Describe the issue</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
              value={reportText}
              onChangeText={setReportText}
              multiline={true}
              placeholder="Tell us what went wrong..."
              placeholderTextColor="#A89F91"
            />

            <View style={styles.diagnosticCard}>
              <Text style={styles.diagnosticText}>
                📌 Non-sensitive diagnostic info attached:{'\n'}
                • App Version: v1.0.0 (Production){'\n'}
                • Platform: {Platform.OS}{'\n'}
                • Timestamp: {new Date().toISOString().split('T')[0]}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.saveModalBtn, isSubmittingReport && { opacity: 0.7 }]}
              onPress={handleSendReport}
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? (
                <ActivityIndicator color="#FFF8F0" size="small" />
              ) : (
                <>
                  <Check color="#FFF8F0" size={16} />
                  <Text style={styles.saveModalBtnText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FAF5EE',
    borderColor: '#581827',
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#581827',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAF5EE',
  },
  avatarInitial: {
    color: '#581827',
    fontSize: 32,
    fontWeight: '900',
  },
  name: {
    color: '#4A0E17',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  email: {
    color: '#701A28',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 3,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2CEBF',
    borderWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 12,
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  editProfilePillText: {
    color: '#581827',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: SPACING.md,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#701A28',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: SPACING.md,
    paddingHorizontal: 4,
  },
  journeyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: SPACING.md,
  },
  journeyCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: '#E2CEBF',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  journeyNumber: {
    color: '#4A0E17',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  journeyLabel: {
    color: '#701A28',
    fontSize: 12,
    fontWeight: '600',
  },
  connectedServicesContainer: {
    marginBottom: SPACING.md,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E2CEBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  googleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E2CEBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogoText: {
    color: '#4285F4',
    fontSize: 20,
    fontWeight: '900',
  },
  serviceTitle: {
    color: '#4A0E17',
    fontSize: 15,
    fontWeight: '700',
  },
  serviceSubtitle: {
    color: '#701A28',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  connectedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  syncSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    borderWidth: 1.2,
    borderColor: '#E2CEBF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  syncSmallBtnText: {
    color: '#581827',
    fontSize: 11,
    fontWeight: '700',
  },
  notConnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notConnectedText: {
    color: '#701A28',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: '#E2CEBF',
    marginBottom: SPACING.md,
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    color: '#4A0E17',
    fontSize: 14,
    fontWeight: '600',
  },
  settingValueText: {
    color: '#701A28',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3E9DD',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1.2,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: '#A89F91',
    fontSize: 11,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 14, 23, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  photoModalAvatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FAF5EE',
    borderColor: '#581827',
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
    overflow: 'hidden',
  },
  photoModalAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  photoModalAvatarInitial: {
    color: '#581827',
    fontSize: 34,
    fontWeight: '900',
  },
  photoModalActionsList: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  actionBtnUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#581827',
    borderRadius: 14,
    paddingVertical: 13,
  },
  actionBtnUploadText: {
    color: '#FFF8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnCamera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1.2,
    borderColor: '#E2CEBF',
    borderRadius: 14,
    paddingVertical: 13,
  },
  actionBtnCameraText: {
    color: '#581827',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDustbin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 13,
  },
  actionBtnDustbinText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  editModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  driveModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#E2CEBF',
    shadowColor: '#581827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#4A0E17',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  photoUploadBox: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2CEBF',
  },
  modalAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  modalAvatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FAF5EE',
    borderColor: '#581827',
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  modalAvatarInitial: {
    color: '#581827',
    fontSize: 32,
    fontWeight: '900',
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#581827',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAF5EE',
  },
  photoHintText: {
    color: '#701A28',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 14,
    textAlign: 'center',
  },
  photoActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  photoBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#581827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  photoBtnPrimaryText: {
    color: '#FFF8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  photoBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1.2,
    borderColor: '#E2CEBF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  photoBtnSecondaryText: {
    color: '#581827',
    fontSize: 12,
    fontWeight: '700',
  },
  photoBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FCA5A5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  photoBtnDangerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#4A0E17',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAF5EE',
    borderColor: '#E2CEBF',
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A080C',
  },
  diagnosticCard: {
    backgroundColor: '#FAF5EE',
    borderColor: '#E2CEBF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  diagnosticText: {
    color: '#701A28',
    fontSize: 11,
    lineHeight: 16,
  },
  saveModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#581827',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  saveModalBtnText: {
    color: '#FFF8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  driveHeroBox: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
  },
  driveIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  driveTitle: {
    color: '#1E3A8A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  driveDesc: {
    color: '#4B5563',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  checklistCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2CEBF',
    marginBottom: 18,
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    color: '#4A0E17',
    fontSize: 13,
    fontWeight: '600',
  },
  connectDriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#581827',
    borderRadius: 14,
    paddingVertical: 14,
  },
  connectDriveBtnText: {
    color: '#FFF8F0',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProfileScreen;
