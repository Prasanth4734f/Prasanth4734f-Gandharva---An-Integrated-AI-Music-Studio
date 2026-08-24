import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, CheckCircle2, ChevronLeft, Music, Edit3, Mic, Download, Type } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const ShowcaseScreen = ({ navigation }) => {
  const [step, setStep] = useState(-1);

  const steps = [
    { title: 'Text to Music Prompt', desc: 'Analyzing "Epic cinematic orchestral battle theme"', icon: <Type color={COLORS.secondary} size={24} /> },
    { title: 'AI Music Generation', desc: 'Composing multi-instrumental 44.1kHz track...', icon: <Music color={COLORS.secondary} size={24} /> },
    { title: 'AI Lyrics Generation', desc: 'Writing thematic rhyming verses...', icon: <Edit3 color={COLORS.secondary} size={24} /> },
    { title: 'Vocal Synthesis & Studio', desc: 'Mixing vocals with backtrack automatically...', icon: <Mic color={COLORS.secondary} size={24} /> },
    { title: 'Export Ready', desc: 'Formatting for Instagram Reel & YouTube Short...', icon: <Download color={COLORS.secondary} size={24} /> },
  ];

  const startDemo = () => {
    setStep(0);
  };

  useEffect(() => {
    if (step >= 0 && step < steps.length) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 2500); // 2.5 seconds per step for demo speed
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={24} />
          <Text style={styles.backText}>Exit Showcase</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Gandharva Showcase</Text>
          <Text style={styles.subtitle}>60-second ecosystem demo</Text>
        </View>

        {step === -1 ? (
          <TouchableOpacity style={styles.startBtn} onPress={startDemo}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Play color={COLORS.white} size={24} />
              <Text style={styles.startText}>Start Full Pipeline Demo</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.timeline}>
            {steps.map((s, idx) => {
              const isActive = step === idx;
              const isPast = step > idx;
              
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.iconCol}>
                    <View style={[styles.circle, isActive && styles.circleActive, isPast && styles.circlePast]}>
                      {isPast ? <CheckCircle2 color={COLORS.success} size={24} /> : isActive ? <ActivityIndicator color={COLORS.white} size="small" /> : s.icon}
                    </View>
                    {idx < steps.length - 1 && <View style={[styles.line, (isActive || isPast) && styles.lineActive]} />}
                  </View>
                  <GlassCard style={[styles.contentCard, isActive && styles.contentCardActive]}>
                    <Text style={[styles.stepTitle, (isActive || isPast) && { color: COLORS.white }]}>{s.title}</Text>
                    {isActive ? (
                      <Text style={styles.stepDescActive}>{s.desc}</Text>
                    ) : isPast ? (
                      <Text style={styles.stepDescPast}>Completed</Text>
                    ) : (
                      <Text style={styles.stepDesc}>Waiting...</Text>
                    )}
                  </GlassCard>
                </View>
              );
            })}
            
            {step === steps.length && (
              <View style={styles.successBox}>
                <CheckCircle2 color={COLORS.success} size={48} />
                <Text style={styles.successTitle}>Pipeline Complete</Text>
                <Text style={styles.successSub}>A full production-ready track was created.</Text>
                
                <TouchableOpacity style={styles.restartBtn} onPress={() => setStep(-1)}>
                  <Text style={styles.restartText}>Restart Demo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backText: {
    color: COLORS.white,
    marginLeft: 4,
    fontSize: SIZES.font_md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.primary,
    fontSize: SIZES.font_sm,
    marginTop: 4,
  },
  startBtn: {
    marginTop: SPACING.xxl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  startText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  timeline: {
    marginTop: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconCol: {
    alignItems: 'center',
    width: 40,
    marginRight: SPACING.md,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  circleActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  circlePast: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  line: {
    width: 2,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  lineActive: {
    backgroundColor: COLORS.secondary,
  },
  contentCard: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    opacity: 0.5,
  },
  contentCardActive: {
    opacity: 1,
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  stepTitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  stepDescActive: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  stepDescPast: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: 4,
  },
  successBox: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  successTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  successSub: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  restartBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  restartText: {
    color: COLORS.white,
    fontWeight: 'bold',
  }
});

export default ShowcaseScreen;
