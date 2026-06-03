import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SIZES } from '../constants/theme';

const GradientButton = ({ 
  onPress, 
  title, 
  colors = COLORS.gradients.primary, 
  style, 
  textStyle,
  loading = false,
  disabled = false,
  icon: Icon
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={disabled ? [COLORS.surfaceLight, COLORS.surface] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            {Icon && <Icon size={20} color={COLORS.white} style={{ marginRight: 8 }} />}
            <Text style={[styles.text, textStyle]}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius_md,
    overflow: 'hidden',
    height: 56,
    width: '100%',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  text: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default GradientButton;
