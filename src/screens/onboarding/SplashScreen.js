import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Music2 } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { COLORS, SIZES } from '../../constants/theme';

const SplashScreen = ({ navigation }) => {
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenContainer style={styles.container}>
      <Animated.View style={[
        styles.logoContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        <View style={styles.iconCircle}>
          <Music2 color={COLORS.white} size={60} />
        </View>
        <Text style={styles.title}>GANDHARVA</Text>
        <Text style={styles.tagline}>AI Music Universe</Text>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
    letterSpacing: 2,
    marginTop: 8,
  },
});

export default SplashScreen;
