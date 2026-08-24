import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SPACING } from '../../constants/theme';

const StudioControlPanel = ({ children }) => {
  return (
    <View style={styles.controlsGrid}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
});

export default StudioControlPanel;
