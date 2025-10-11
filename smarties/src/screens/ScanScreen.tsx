import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Primary barcode scanning interface
 * This screen will contain the main barcode scanning functionality
 */
export const ScanScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Screen</Text>
      <Text style={styles.subtitle}>Barcode scanning functionality will be implemented here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
});