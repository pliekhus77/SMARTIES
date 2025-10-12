import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SmartiesLogoProps {
  size?: number;
}

export const SmartiesLogo: React.FC<SmartiesLogoProps> = ({ size = 32 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.text, { fontSize: size * 0.6 }]}>S</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    color: '#0074D9',
  },
});
