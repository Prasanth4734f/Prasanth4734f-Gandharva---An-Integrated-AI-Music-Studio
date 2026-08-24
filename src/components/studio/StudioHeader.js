import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { SPACING } from '../../constants/theme';

const THEME = {
  bg: '#111315',
  panel: '#1B1D21',
  accent: '#4A90E2',
  text: '#FFFFFF',
  secondary: '#888888',
};

const StudioHeader = ({ 
  title, 
  instrumentType, 
  mode, 
  sessionName = "New Session", 
  onBack, 
  onSettings 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft color={THEME.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={onSettings} style={styles.settingsBtn}>
          <MoreHorizontal color={THEME.secondary} size={24} />
        </TouchableOpacity>
      </View>
      
      {/* Metadata Row */}
      <View style={styles.metadataRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Instrument</Text>
          <Text style={styles.metaValue}>{instrumentType}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Mode</Text>
          <Text style={styles.metaValue}>{mode}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Session</Text>
          <Text style={styles.metaValue}>{sessionName}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  settingsBtn: {
    padding: SPACING.xs,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25282D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    color: THEME.secondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#33363B',
    marginHorizontal: 8,
  }
});

export default StudioHeader;
