import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DietaryRestriction } from '../types/DietaryRestriction';
import { MockProfileService } from '../services/ProfileService';
import { RestrictionCard } from '../components/profile/RestrictionCard';
import { AddRestrictionButton } from '../components/profile/AddRestrictionButton';
import { ProfileHeader } from '../components/profile/ProfileHeader';

export const ProfileScreen: React.FC = () => {
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const profileService = new MockProfileService();

  useEffect(() => {
    loadRestrictions();
  }, []);

  const loadRestrictions = async () => {
    try {
      const data = await profileService.getRestrictions();
      setRestrictions(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dietary restrictions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRestriction = async (id: string, updates: Partial<DietaryRestriction>) => {
    try {
      await profileService.updateRestriction(id, updates);
      setRestrictions(prev => 
        prev.map(r => r.id === id ? { ...r, ...updates } : r)
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update restriction');
    }
  };

  const handleDeleteRestriction = async (id: string) => {
    try {
      await profileService.deleteRestriction(id);
      setRestrictions(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete restriction');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0074D9', '#001f3f']}
        style={styles.gradient}
      >
        <ProfileHeader />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {restrictions.map((restriction) => (
              <RestrictionCard
                key={restriction.id}
                restriction={restriction}
                onUpdate={(updates) => handleUpdateRestriction(restriction.id, updates)}
                onDelete={() => handleDeleteRestriction(restriction.id)}
              />
            ))}
            
            <AddRestrictionButton
              onAdd={(restriction) => {
                setRestrictions(prev => [...prev, restriction]);
              }}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
    gap: 16,
  },
});
