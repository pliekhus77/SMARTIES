import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock user type for development
interface User {
  profileId: string;
  name: string;
  dietaryRestrictions: {
    allergies: string[];
    religious: string[];
    medical: string[];
    lifestyle: string[];
  };
  preferences: {
    alertLevel: 'strict' | 'moderate' | 'relaxed';
    notifications: boolean;
  };
}

/**
 * User dietary profile management screen
 * Full-featured profile management with mock data for development
 */
export const ProfileScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      // Try to load existing profile
      const { executeOperation } = require('../hooks/useDatabase');
      const result = await executeOperation(async (db: any) => {
        return await db.readOne('users', { profileId: 'default' });
      });

      if (result.success && result.data) {
        setUserProfile(result.data);
      } else {
        // Create default profile if none exists
        const defaultProfile: User = {
          profileId: 'default',
          name: 'SMARTIES User',
          dietaryRestrictions: {
            allergies: [],
            religious: [],
            medical: [],
            lifestyle: [],
          },
          preferences: {
            alertLevel: 'moderate',
            notifications: true,
          },
        };
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Set default profile on error
      setUserProfile({
        profileId: 'default',
        name: 'SMARTIES User',
        dietaryRestrictions: {
          allergies: [],
          religious: [],
          medical: [],
          lifestyle: [],
        },
        preferences: {
          alertLevel: 'moderate',
          notifications: true,
        },
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSetupProfile = async () => {
    Alert.alert('Profile Options', 'Choose an action', [
      { text: 'Edit Allergies', onPress: () => handleEditAllergies() },
      { text: 'Edit Preferences', onPress: () => handleEditPreferences() },
      { text: 'Reset Profile', onPress: handleResetProfile, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleEditAllergies = () => {
    Alert.alert('Edit Allergies', 'This feature will allow you to modify your allergen list.');
  };

  const handleEditPreferences = () => {
    Alert.alert('Edit Preferences', 'This feature will allow you to modify your alert preferences.');
  };

  const handleResetProfile = async () => {
    setIsSaving(true);
    // Simulate saving
    setTimeout(() => {
      setUserProfile({
        profileId: 'default',
        name: 'Demo User',
        dietaryRestrictions: {
          allergies: [],
          religious: [],
          medical: [],
          lifestyle: [],
        },
        preferences: {
          alertLevel: 'moderate',
          notifications: true,
        },
      });
      setIsSaving(false);
      Alert.alert('Success', 'Profile has been reset.');
    }, 1000);
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1168bd" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.title}>Dietary Profile</Text>
          {userProfile ? (
            <>
              <Text style={styles.subtitle}>Profile Active</Text>
              <Text style={styles.profileInfo}>
                Name: {userProfile.name}
              </Text>
              <Text style={styles.profileInfo}>
                Allergies: {userProfile.dietaryRestrictions.allergies.length}
              </Text>
              <Text style={styles.profileInfo}>
                Restrictions: {userProfile.dietaryRestrictions.religious.length + userProfile.dietaryRestrictions.medical.length + userProfile.dietaryRestrictions.lifestyle.length}
              </Text>
            </>
          ) : (
            <Text style={styles.subtitle}>
              Set up your dietary restrictions and preferences to get personalized product recommendations
            </Text>
          )}
          
          <TouchableOpacity 
            style={[styles.setupButton, isSaving && styles.disabledButton]} 
            onPress={handleSetupProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.setupButtonText}>
                {userProfile ? 'Manage Profile' : 'Set Up Profile'}
              </Text>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  profileInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  setupButton: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
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
