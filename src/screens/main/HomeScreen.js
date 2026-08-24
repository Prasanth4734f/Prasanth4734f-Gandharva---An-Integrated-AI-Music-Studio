import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, useWindowDimensions, AppState, Alert } from 'react-native';
import { FileText, Mic2, Sliders, Headphones, ChevronRight, User, Piano, Music2, Disc, Wand2, PlayCircle } from 'lucide-react-native';
import { checkMusicGenHealth } from '../../services/musicService';
import { useAuth } from '../../context/AuthContext';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const STUDIO_MODULES = [
  {
    id: 'ai-music-gen',
    title: 'AI Music Generator',
    subtitle: 'MusicGen 3-variations generator',
    badge: 'Generator',
    badgeBg: '#059669',
    cardBg: '#ECFDF5',
    borderColor: '#A7F3D0',
    accentColor: '#059669',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    icon: <Music2 color="#059669" size={16} />,
    route: 'Generate'
  },
  {
    id: 'ai-lyrics',
    title: 'AI Lyrics Studio',
    subtitle: 'Multilingual song lyrics writer',
    badge: 'Lyrics',
    badgeBg: '#9333EA',
    cardBg: '#F3E8FF',
    borderColor: '#E9D5FF',
    accentColor: '#9333EA',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop',
    icon: <FileText color="#9333EA" size={16} />,
    route: 'LyricsGenerator'
  },
  {
    id: 'story-to-album',
    title: 'Story to Album',
    subtitle: 'NIE + AGE narrative soundtrack',
    badge: 'NIE + AGE',
    badgeBg: '#7C3AED',
    cardBg: '#FAF5FF',
    borderColor: '#DDD6FE',
    accentColor: '#7C3AED',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    icon: <Disc color="#7C3AED" size={16} />,
    route: 'StoryToAlbum'
  },
  {
    id: 'ai-vocal-studio',
    title: 'AI Vocal Studio',
    subtitle: 'Vocal stem upload & BGM composer',
    badge: 'Vocal',
    badgeBg: '#E11D48',
    cardBg: '#FFF5F5',
    borderColor: '#FECDD3',
    accentColor: '#E11D48',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop',
    icon: <Mic2 color="#E11D48" size={16} />,
    route: 'VocalUpload'
  },
  {
    id: 'music-editor',
    title: 'Music Editor',
    subtitle: 'Multi-track DAW pitch & trim',
    badge: 'Editor',
    badgeBg: '#D97706',
    cardBg: '#FEFCE8',
    borderColor: '#FDE68A',
    accentColor: '#D97706',
    image: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=600&auto=format&fit=crop',
    icon: <Sliders color="#D97706" size={16} />,
    route: 'MusicEditor'
  },
  {
    id: 'playground-live',
    title: 'PlayGround Live',
    subtitle: '10+ Live instrument studios',
    badge: 'Live Studio',
    badgeBg: '#0284C7',
    cardBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    accentColor: '#0284C7',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop',
    icon: <Headphones color="#0284C7" size={16} />,
    route: 'LiveStudioHome'
  }
];

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user, profile } = useAuth();
  const [gpuStatus, setGpuStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  const displayName = profile?.display_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Prasanth');
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const isCheckingRef = useRef(false);
  const currentStatusRef = useRef('checking');

  const verifyGpuHealth = async (showChecking = false) => {
    if (isCheckingRef.current) return;
    try {
      isCheckingRef.current = true;
      if (showChecking) setGpuStatus('checking');
      const res = await checkMusicGenHealth();
      const nextStatus = (res && res.status === 'online') ? 'online' : 'offline';
      setGpuStatus(nextStatus);
      currentStatusRef.current = nextStatus;
    } catch (e) {
      setGpuStatus('offline');
      currentStatusRef.current = 'offline';
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // 1. Initial health check on mount
    verifyGpuHealth(true);

    // 2. Real-time fast-recovery auto-polling:
    // Checks every 3.5s when offline so it turns Green the moment backend is ON / cellular connected.
    // Checks every 15s when online.
    let isMounted = true;
    let timerId = null;

    const runSentinel = async () => {
      if (!isMounted) return;
      await verifyGpuHealth(false);
      if (isMounted) {
        const delay = currentStatusRef.current === 'online' ? 15000 : 8000;
        timerId = setTimeout(runSentinel, delay);
      }
    };

    timerId = setTimeout(runSentinel, 6000);

    // 3. React Native AppState listener (resumes from background or toggling mobile data)
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        verifyGpuHealth(false);
      }
    });

    // 4. Web Network Connectivity Event Listeners
    const handleNetworkOnline = () => {
      verifyGpuHealth(false);
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', handleNetworkOnline);
      window.addEventListener('focus', handleNetworkOnline);
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (appStateSub) appStateSub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', handleNetworkOnline);
        window.removeEventListener('focus', handleNetworkOnline);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.mainWrapper}>
          {/* Top Navigation Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={[
                styles.statusBadge,
                gpuStatus === 'checking' && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                gpuStatus === 'offline' && { backgroundColor: '#FEE2E2', borderColor: '#FECDD3' }
              ]}
              activeOpacity={0.7}
              onPress={verifyGpuHealth}
            >
              {gpuStatus === 'checking' ? (
                <ActivityIndicator size="small" color="#D97706" style={{ marginRight: 4 }} />
              ) : (
                <View style={[
                  styles.greenDot,
                  gpuStatus === 'offline' && { backgroundColor: '#EF4444' }
                ]} />
              )}
              <Text style={[
                styles.statusBadgeText,
                gpuStatus === 'checking' && { color: '#92400E' },
                gpuStatus === 'offline' && { color: '#991B1B' }
              ]}>
                {gpuStatus === 'checking' ? 'Checking...' : gpuStatus === 'online' ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>

            {/* Top Middle Title & Description */}
            <View style={styles.headerCenterCol}>
              <View style={styles.brandTitlePill}>
                <Svg height="26" width="135" viewBox="0 0 135 26">
                  <Defs>
                    <SvgGradient id="brownWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                      <Stop offset="35%" stopColor="#FEF3C7" stopOpacity="1" />
                      <Stop offset="70%" stopColor="#D97706" stopOpacity="1" />
                      <Stop offset="100%" stopColor="#78350F" stopOpacity="1" />
                    </SvgGradient>
                  </Defs>
                  <SvgText
                    fill="url(#brownWhiteGrad)"
                    fontSize="20"
                    fontWeight="900"
                    letterSpacing="1"
                    x="67.5"
                    y="19"
                    textAnchor="middle"
                  >
                    Gandharva
                  </SvgText>
                </Svg>
              </View>
              <Text style={styles.brandSubtitleText}>Create Music beyond imagination</Text>
            </View>

            <TouchableOpacity 
              style={styles.profileAvatar} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.profileAvatarInitial}>
                  {displayName ? displayName.charAt(0).toUpperCase() : 'G'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Welcome User Banner */}
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeRow}>
              <Text style={styles.violinEmoji}>🎻</Text>
              <Text style={styles.welcomeBackText}>Welcome back,</Text>
            </View>
            <Text style={styles.welcomeUsernameText}>{displayName}</Text>
          </View>

          {/* Strict 3 Rows x 2 Columns Grid */}
          <View style={styles.grid3Row2ColContainer}>
            {STUDIO_MODULES.map((module) => (
              <TouchableOpacity
                key={module.id}
                style={[
                  styles.squareCard3Row2Col,
                  {
                    width: Platform.OS === 'web' ? 'calc(50% - 44px)' : '46%',
                    height: Platform.OS === 'web' ? 200 : 180,
                    backgroundColor: '#FFFFFF',
                    borderColor: module.borderColor
                  }
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  if (module.id === 'ai-vocal-studio' || module.route === 'VocalUpload') {
                    Alert.alert(
                      'Under Development 🚀',
                      'AI Vocal Studio is currently under active development. Stay tuned for upcoming updates!'
                    );
                    return;
                  }
                  navigation.navigate(module.route);
                }}
              >
                {/* Enriched Realistic Image Container */}
                <View style={styles.imageBox} pointerEvents="none">
                  <Image
                    source={{ uri: module.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlayDark} />
                  
                  {/* Icon Badge */}
                  <View style={styles.iconCircleOnImage}>
                    {module.icon}
                  </View>

                  {/* Badge Pill */}
                  <View style={[styles.gridPillOnImage, { backgroundColor: module.badgeBg }]}>
                    <Text style={styles.gridPillText}>{module.badge}</Text>
                  </View>
                </View>

                {/* Enriched Title & Details Below Image */}
                <View style={styles.cardTextContentBelow} pointerEvents="none">
                  <View style={styles.titleRowBelow}>
                    <Text style={styles.squareTitle} numberOfLines={1}>{module.title}</Text>
                    <ChevronRight color={module.accentColor} size={15} />
                  </View>
                  <Text style={styles.squareSub} numberOfLines={1}>{module.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    paddingTop: Platform.OS === 'web' ? 16 : 28,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  headerCenterCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  brandTitlePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  brandPink: {
    color: '#EC4899',
    fontWeight: '900',
  },
  brandWhite: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  brandSubtitleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  welcomeBanner: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  violinEmoji: {
    fontSize: 20,
  },
  welcomeBackText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  welcomeUsernameText: {
    color: '#1E1B4B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginLeft: 28,
    marginTop: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  profileAvatarInitial: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '800',
  },
  greetingText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  userNameText: {
    color: '#1E1B4B',
    fontSize: 17,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  statusBadgeText: {
    color: '#15803D',
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  /* Clean Grid Container with Expanded Center Gap */
  grid3Row2ColContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 28,
    columnGap: Platform.OS === 'web' ? 88 : 28,
    width: '100%',
  },
  squareCard3Row2Col: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  imageBox: {
    width: '100%',
    height: '62%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  iconCircleOnImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  gridPillOnImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  gridPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardTextContentBelow: {
    height: '34%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  titleRowBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  squareTitle: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  squareSub: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
});

export default HomeScreen;
