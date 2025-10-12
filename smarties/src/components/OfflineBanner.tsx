import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/constants';

interface OfflineBannerProps {
  isVisible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline" size={16} color={colors.white} />
      <Text style={styles.text}>Offline Mode - Limited functionality</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.cautionYellow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
});
