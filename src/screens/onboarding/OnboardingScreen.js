import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Music, FileText, Mic, ChevronRight } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'generate',
    title: 'Prompt to Music',
    description: 'Transform your thoughts into professional tracks with AI music generation.',
    icon: Music,
    color: COLORS.primary,
    route: 'Generate',
  },
  {
    id: 'lyrics',
    title: 'AI Lyrics Studio',
    description: 'Never face writer\'s block again. Generate soulful lyrics in seconds.',
    icon: FileText,
    color: COLORS.secondary,
    route: 'LyricsGenerator',
  },
  {
    id: 'vocal',
    title: 'Vocal AI Mix',
    description: 'Upload your vocals and let AI create the perfect background music for you.',
    icon: Mic,
    color: COLORS.accent,
    route: 'VocalUpload',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.replace('Main');
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        {/* Interactive Slide Card */}
        <TouchableOpacity 
          style={styles.slideCard} 
          activeOpacity={0.88}
          onPress={() => navigation.navigate(slide.route)}
        >
          <View style={[styles.iconCircle, { backgroundColor: slide.color + '20' }]}>
            <slide.icon color={slide.color} size={80} />
          </View>
          
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
          <Text style={[styles.tapToExplore, { color: slide.color }]}>Tap card to explore feature →</Text>
        </TouchableOpacity>

        {/* Slide Indicators */}
        <View style={styles.indicatorRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrentSlide(i)}>
              <View 
                style={[
                  styles.indicator, 
                  currentSlide === i ? { backgroundColor: slide.color, width: 24 } : { backgroundColor: COLORS.surfaceLight }
                ]} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.replace('Main')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: slide.color }]} 
          onPress={handleNext}
        >
          <ChevronRight color={COLORS.white} size={24} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    width: '100%',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  tapToExplore: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
  },
  indicatorRow: {
    flexDirection: 'row',
    marginTop: SPACING.xxl,
  },
  indicator: {
    height: 6,
    width: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
    fontWeight: '600',
  },
  nextBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default OnboardingScreen;
