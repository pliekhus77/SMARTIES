import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '../hooks/useDatabase';
import { User } from '../../../src/types/User';

/**
 * User dietary profile management screen
 * Task 7.3: Database service integration
 * This screen manages user dietary restrictions with database operations
 */
export const ProfileScreen: React.FC = () => {
  const { isLoading: dbLoading, error: dbError, executeOperation } = useDatabase();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoadingProfile(true);
    const result = await executeOperation(async (db) => {
      return await db.readOne<User>('users', { profileId: 'default' });
    });

    if (result.success && result.data) {
      setUserProfile(result.data);
    }
    setIsLoadingProfile(false);
  };

  const handleSetupProfile = async () => {
    if (userProfile) {
      Alert.alert('Profile Options', 'Choose an action', [
        { text: 'Edit Profile', onPress: () => console.log('Edit profile') },
        { text: 'Delete Profile', onPress: handleDeleteProfile, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      await handleCreateProfile();
    }
  };

  const handleCreateProfile = async () => {
    setIsSaving(true);
    const newProfile: User = {
      _id: 'user_default',
      profileId: 'default',
      dietaryRestrictions: {
        allergies: [],
        religious: [],
        medical: [],
        lifestyle: [],
      },
      preferences: {
        strictMode: true,
        notifications: {
          enabled: true,
          pushNotifications: true,
          emailAlerts: false,
        },
        language: 'en',
        units: 'metric',
      },
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
      },
    };

    const result = await executeOperation(async (db) => {
      return await db.create('users', newProfile);
    });

    if (result.success) {
      setUserProfile(newProfile);
      Alert.alert('Success', 'Profile created successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to create profile');
    }
    setIsSaving(false);
  };

  const handleDeleteProfile = async () => {
    if (!userProfile) return;

    setIsSaving(true);
    const result = await executeOperation(async (db) => {
      return await db.delete('users', { _id: userProfile._id });
    });

    if (result.success) {
      setUserProfile(null);
      Alert.alert('Success', 'Profile deleted successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to delete profile');
    }
    setIsSaving(false);
  };

  if (dbLoading || isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1168bd" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dbError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Database Error: {dbError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
                Created: {new Date(userProfile.metadata.createdAt).toLocaleDateString()}
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
