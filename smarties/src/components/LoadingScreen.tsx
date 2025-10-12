import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles/constants';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Initializing SMARTIES...' 
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryBlue} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.black,
    textAlign: 'center',
  },
});
