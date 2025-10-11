import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Primary barcode scanning interface
 * This screen will contain the main barcode scanning functionality
 */
export const ScanScreen: React.FC = () => {
  const handleScanPress = () => {
    // TODO: Implement barcode scanning functionality
    console.log('Scan button pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.scanArea}>
          <Text style={styles.title}>Ready to Scan</Text>
          <Text style={styles.subtitle}>
            Point your camera at a product barcode to check for dietary restrictions
          </Text>
          
          <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
            <Text style={styles.scanButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to use:</Text>
          <Text style={styles.instructionText}>1. Tap "Start Scanning" above</Text>
          <Text style={styles.instructionText}>2. Point camera at product barcode</Text>
          <Text style={styles.instructionText}>3. Get instant dietary compliance results</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1168bd',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#1168bd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});