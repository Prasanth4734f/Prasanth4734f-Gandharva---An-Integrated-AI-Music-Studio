import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { User, Mail, Lock, ChevronLeft } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const SignupScreen = ({ navigation }) => {
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the future of AI music creation</Text>
        </View>

        <GlassCard style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User color={COLORS.textMuted} size={20} />
              <TextInput
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail color={COLORS.textMuted} size={20} />
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock color={COLORS.textMuted} size={20} />
              <TextInput
                placeholder="Create a password"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                secureTextEntry
              />
            </View>
          </View>

          <GradientButton 
            title="Create Account" 
            onPress={() => navigation.replace('Main')}
            style={styles.signupBtn}
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
  },
  backBtn: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
    marginTop: 8,
  },
  formCard: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.font_sm,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_md,
    paddingHorizontal: SPACING.md,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.white,
    fontSize: SIZES.font_md,
  },
  signupBtn: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
  },
  loginText: {
    color: COLORS.primary,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
