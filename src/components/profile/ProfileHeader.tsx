import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SmartiesLogo } from '../common/SmartiesLogo';

export const ProfileHeader: React.FC = () => {
  return (
    <View style={styles.container}>
      <SmartiesLogo size={40} />
      <Text style={styles.title}>My Dietary Restrictions</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
});
