import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { ScanScreen } from './src/screens';

/**
 * Main SMARTIES Application Component
 * 
 * This is the root component that will eventually include:
 * - Navigation setup
 * - Global state management
 * - Theme provider
 * - Error boundaries
 * 
 * For now, it displays the main scan screen as a placeholder
 * during the hackathon setup phase.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SMARTIES</Text>
        <Text style={styles.headerSubtitle}>Scan-based Mobile Allergen Risk Tracking</Text>
      </View>
      
      <View style={styles.content}>
        <ScanScreen />
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1168bd',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
