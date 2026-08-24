import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Music, SkipForward, Sparkles, ChevronRight, Crown, Volume2, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SCENES = [
  {
    id: 1,
    sanskritTag: '॥ राज सभा समवेत ॥',
    category: 'CHAPTER I : THE ROYAL ASSEMBLY',
    title: 'Ministers & Courtiers Rise in Awe',
    subtitle: 'As the grand palace gates open, ministers, nobles, and the entire royal court stand out of their chairs with folded hands in profound reverence.',
    loreQuote: '“Even the mightiest kings rise from their thrones, for melody commands what swords cannot conquer.”',
    image: require('../../../assets/cinematic_intro/scene1_palace_court.jpg'),
    duration: 5000,
  },
  {
    id: 2,
    sanskritTag: '॥ दिव्य गन्धर्व प्रवेश ॥',
    category: 'CHAPTER II : THE CELESTIAL ENTRANCE',
    title: 'The Divine Gandharva Enters',
    subtitle: 'Radiating celestial golden light and adorned with the divine Veena, the Gandharva demigod steps upon the royal carpet.',
    loreQuote: '“Beings of Svarga and keepers of divine harmony, Gandharvas bridge the heavens and earth through sound.”',
    image: require('../../../assets/cinematic_intro/scene2_gandharva_arrival.jpg'),
    duration: 5200,
  },
  {
    id: 3,
    sanskritTag: '॥ नमन एवं समर्पण ॥',
    category: 'CHAPTER III : REVERENCE TO MUSIC',
    title: 'Thrones Bow Before Melody',
    subtitle: 'Raining celestial flowers shower the hall as the Emperor and ministers bow in solemn respect before the living embodiment of music.',
    loreQuote: '“In ancient Vedic lore, kings rule sovereign lands, but the Gandharva rules the eternal frequency of the soul.”',
    image: require('../../../assets/cinematic_intro/scene3_royal_reverence.jpg'),
    duration: 5200,
  },
  {
    id: 4,
    sanskritTag: '॥ नाद ब्रह्म सनातनम् ॥',
    category: 'CHAPTER IV : MYTHOLOGICAL ESSENCE',
    title: 'Master of Gandharva Veda',
    subtitle: 'Strumming the sacred resonance, the Gandharva awakens Nada Brahma—the primordial sound that birthed the universe.',
    loreQuote: '“Gandharva is the creator, the harmonizer, the supreme AI musical intelligence reborn for the modern age.”',
    image: require('../../../assets/cinematic_intro/scene4_nada_brahma.jpg'),
    duration: 5500,
  },
];

const SplashScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(24)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Finale animation
  const [showFinalLogo, setShowFinalLogo] = useState(false);
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.82)).current;

  const navigateToLogin = () => {
    navigation.replace('Login');
  };

  // Ambient pulsing glow for royal badges
  useEffect(() => {
    const pulseGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseGlow.start();
    return () => pulseGlow.stop();
  }, []);

  const timeoutRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    const playScene = (idx) => {
      if (isCancelled) return;

      if (idx >= SCENES.length) {
        setShowFinalLogo(true);
        Animated.parallel([
          Animated.timing(logoFadeAnim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.spring(logoScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start(() => {
          timeoutRef.current = setTimeout(() => {
            if (!isCancelled) navigateToLogin();
          }, 2000);
        });
        return;
      }

      setCurrentSceneIdx(idx);

      fadeAnim.setValue(0);
      scaleAnim.setValue(1);
      textFadeAnim.setValue(0);
      textSlideAnim.setValue(24);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.07,
          duration: SCENES[idx].duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(textFadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(textSlideAnim, {
              toValue: 0,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(progressAnim, {
          toValue: (idx + 1) / SCENES.length,
          duration: SCENES[idx].duration,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished && !isCancelled) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            if (!isCancelled) {
              playScene(idx + 1);
            }
          });
        }
      });
    };

    playScene(0);

    return () => {
      isCancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const currentScene = SCENES[currentSceneIdx] || SCENES[0];

  const handleNextScene = () => {
    if (currentSceneIdx < SCENES.length - 1) {
      setCurrentSceneIdx((prev) => prev + 1);
    } else {
      navigateToLogin();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {!showFinalLogo ? (
        <>
          {/* Panoramic Ken Burns Scene Art */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={currentScene.image}
              style={styles.bgImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Deep Royal Gold & Velvet Vignette Overlay */}
          <LinearGradient
            colors={[
              'rgba(10, 5, 2, 0.75)',
              'rgba(15, 7, 3, 0.2)',
              'rgba(10, 4, 1, 0.75)',
              'rgba(5, 2, 1, 0.98)',
            ]}
            locations={[0, 0.35, 0.7, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Ornamental Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.royalEmblemBox}>
              <Crown color="#F59E0B" size={16} />
              <Text style={styles.royalEmblemText}>GANDHARVA LORE</Text>
              <Animated.View style={[styles.glowDot, { opacity: glowAnim }]} />
            </View>

            <TouchableOpacity
              style={styles.skipBtn}
              activeOpacity={0.8}
              onPress={navigateToLogin}
            >
              <Text style={styles.skipBtnText}>Skip to Studio</Text>
              <SkipForward color="#FBBF24" size={14} />
            </TouchableOpacity>
          </View>

          {/* Chapter Step Indicators */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.chapterPillRow}>
              {SCENES.map((s, i) => (
                <View
                  key={s.id}
                  style={[
                    styles.chapterIndicatorPill,
                    i === currentSceneIdx && styles.chapterIndicatorPillActive,
                    i < currentSceneIdx && styles.chapterIndicatorPillPassed,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Bottom Royal Mythological Story Card */}
          <Animated.View
            style={[
              styles.subtitleBox,
              {
                opacity: textFadeAnim,
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            {/* Ornamental Sanskrit Banner */}
            <View style={styles.sanskritRibbon}>
              <View style={styles.goldLine} />
              <Text style={styles.sanskritText}>{currentScene.sanskritTag}</Text>
              <View style={styles.goldLine} />
            </View>

            <Text style={styles.categoryText}>{currentScene.category}</Text>
            <Text style={styles.sceneTitle}>{currentScene.title}</Text>
            <Text style={styles.sceneSubtitle}>{currentScene.subtitle}</Text>

            {/* Sacred Lore Epigraph */}
            <View style={styles.loreBox}>
              <Sparkles color="#F59E0B" size={14} style={{ marginTop: 2 }} />
              <Text style={styles.loreText}>{currentScene.loreQuote}</Text>
            </View>

            {/* Bottom Actions: Next Step Pill */}
            <TouchableOpacity
              style={styles.nextStepPill}
              activeOpacity={0.85}
              onPress={handleNextScene}
            >
              <Text style={styles.nextStepText}>
                {currentSceneIdx < SCENES.length - 1 ? 'Next Chapter' : 'Enter AI Music Studio'}
              </Text>
              <ChevronRight color="#0F172A" size={16} />
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        /* Grand Finale Royal Revelation */
        <Animated.View
          style={[
            styles.finaleContainer,
            {
              opacity: logoFadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          {/* Background Ambient Aura */}
          <LinearGradient
            colors={['#1E1035', '#0F091A', '#05020A']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Royal Crest Icon */}
          <LinearGradient
            colors={['#F59E0B', '#D97706', '#92400E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Crown color="#FFFBEB" size={48} />
          </LinearGradient>

          <Text style={styles.finaleSanskrit}>॥ नाद ब्रह्म परा शक्ति ॥</Text>
          <Text style={styles.finaleTitle}>GANDHARVA</Text>
          <Text style={styles.finaleTagline}>THE CELESTIAL AI MUSIC STUDIO</Text>

          <View style={styles.finaleDivider}>
            <View style={styles.goldLine} />
            <Sparkles color="#F59E0B" size={16} />
            <View style={styles.goldLine} />
          </View>

          <Text style={styles.finaleSubtext}>
            Mastering the divine resonance of Indian classical music & advanced AI generation.
          </Text>

          <TouchableOpacity
            style={styles.enterStudioBtn}
            activeOpacity={0.85}
            onPress={navigateToLogin}
          >
            <Text style={styles.enterStudioBtnText}>LAUNCH STUDIO LOGIN</Text>
            <ChevronRight color="#000000" size={18} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050201',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 38,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  royalEmblemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 9, 3, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  royalEmblemText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 10, 5, 0.8)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    gap: 6,
  },
  skipBtnText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarWrapper: {
    position: 'absolute',
    top: 88,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  chapterPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chapterIndicatorPill: {
    flex: 1,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
  },
  chapterIndicatorPillPassed: {
    backgroundColor: 'rgba(245, 158, 11, 0.7)',
  },
  chapterIndicatorPillActive: {
    backgroundColor: '#FBBF24',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  subtitleBox: {
    position: 'absolute',
    bottom: 36,
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(12, 6, 2, 0.88)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    paddingVertical: 18,
    paddingHorizontal: 22,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sanskritRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  goldLine: {
    width: 32,
    height: 1,
    backgroundColor: '#D97706',
  },
  sanskritText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  categoryText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  sceneTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sceneSubtitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 620,
    marginBottom: 10,
  },
  loreBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 8,
    marginBottom: 14,
    maxWidth: 620,
  },
  loreText: {
    flex: 1,
    color: '#FDE68A',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  nextStepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  nextStepText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  finaleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 14,
  },
  finaleSanskrit: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 6,
  },
  finaleTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 4,
  },
  finaleTagline: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 18,
  },
  finaleDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  finaleSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 20,
    marginBottom: 32,
  },
  enterStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  enterStudioBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

export default SplashScreen;
