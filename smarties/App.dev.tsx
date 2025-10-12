import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Development version of SMARTIES App
 * Simplified for quick testing without external dependencies
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.title}>SMARTIES</Text>
        <Text style={styles.subtitle}>Scan-based Mobile Allergen Risk Tracking & Intelligence Suite</Text>
        <Text style={styles.status}>🚀 Development Mode</Text>
        <Text style={styles.info}>Ready for Android Emulator Testing</Text>
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1168bd',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  status: {
    fontSize: 24,
    marginBottom: 10,
  },
  info: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: '600',
  },
});