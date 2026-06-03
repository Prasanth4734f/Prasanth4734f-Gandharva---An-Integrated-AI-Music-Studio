import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { User, Bell, Moon, Shield, LogOut, ChevronRight, Settings } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const ProfileScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const SettingItem = ({ icon: Icon, title, value, type = 'chevron', onValueChange }) => (
    <TouchableOpacity style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon color={COLORS.text} size={20} />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      ) : (
        <ChevronRight color={COLORS.textMuted} size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color={COLORS.white} size={40} />
            </View>
            <TouchableOpacity style={styles.editAvatar}>
              <Settings color={COLORS.white} size={14} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>Creative Mind</Text>
          <Text style={styles.email}>creator@gandharva.ai</Text>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingItem icon={Bell} title="Notifications" type="switch" value={notifications} onValueChange={setNotifications} />
          <View style={styles.divider} />
          <SettingItem icon={Moon} title="Dark Mode" type="switch" value={isDarkMode} onValueChange={setIsDarkMode} />
          <View style={styles.divider} />
          <SettingItem icon={Shield} title="Privacy & Security" />
        </GlassCard>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingItem icon={Settings} title="Help Center" />
          <View style={styles.divider} />
          <SettingItem icon={Shield} title="Terms of Service" />
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut color={COLORS.error} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Gandharva v1.0.0 Alpha</Text>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  editAvatar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  email: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
    marginTop: 4,
  },
  editProfileBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radius_full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editProfileText: {
    color: COLORS.white,
    fontSize: SIZES.font_xs,
    fontWeight: '600',
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingTitle: {
    color: COLORS.text,
    fontSize: SIZES.font_md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    padding: SPACING.md,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  version: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});

export default ProfileScreen;
