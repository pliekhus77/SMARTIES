import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * User dietary profile management screen
 * This screen will allow users to set up and manage their dietary restrictions
 */
export const ProfileScreen: React.FC = () => {
  const handleSetupProfile = () => {
    // TODO: Implement profile setup functionality
    console.log('Setup profile pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.title}>Dietary Profile</Text>
          <Text style={styles.subtitle}>
            Set up your dietary restrictions and preferences to get personalized product recommendations
          </Text>
          
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupProfile}>
            <Text style={styles.setupButtonText}>Set Up Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Profile Features:</Text>
          <Text style={styles.infoText}>• Food allergies and intolerances</Text>
          <Text style={styles.infoText}>• Religious dietary requirements</Text>
          <Text style={styles.infoText}>• Medical dietary restrictions</Text>
          <Text style={styles.infoText}>• Lifestyle preferences (vegan, keto, etc.)</Text>
          <Text style={styles.infoText}>• Severity levels and alert preferences</Text>
        </View>
      </ScrollView>
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
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1168bd',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  setupButton: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});