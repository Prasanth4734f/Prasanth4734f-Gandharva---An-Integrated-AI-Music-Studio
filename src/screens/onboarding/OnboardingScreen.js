import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Music, FileText, Mic, ChevronRight } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Prompt to Music',
    description: 'Transform your thoughts into professional tracks with AI music generation.',
    icon: Music,
    color: COLORS.primary,
  },
  {
    title: 'AI Lyrics Studio',
    description: 'Never face writer\'s block again. Generate soulful lyrics in seconds.',
    icon: FileText,
    color: COLORS.secondary,
  },
  {
    title: 'Vocal AI Mix',
    description: 'Upload your vocals and let AI create the perfect background music for you.',
    icon: Mic,
    color: COLORS.accent,
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
        <View style={[styles.iconCircle, { backgroundColor: slide.color + '20' }]}>
          <slide.icon color={slide.color} size={80} />
        </View>
        
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        <View style={styles.indicatorRow}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.indicator, 
                currentSlide === i ? { backgroundColor: slide.color, width: 24 } : { backgroundColor: COLORS.surfaceLight }
              ]} 
            />
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
