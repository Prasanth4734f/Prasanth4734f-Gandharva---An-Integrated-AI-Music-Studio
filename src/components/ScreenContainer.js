import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const ScreenContainer = ({ children, style, useSafeArea = true }) => {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <View style={styles.outer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={COLORS.gradients.background}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <Container style={[styles.container, style]}>
        {children}
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
});

export default ScreenContainer;
