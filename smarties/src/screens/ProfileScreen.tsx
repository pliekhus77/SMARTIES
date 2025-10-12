import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native'; // Available for future use

// Import enhanced profile components
import { 
  RestrictionCard, 
  AddRestrictionButton,
  AllergenSelectionModal
} from '../components/profile';

// Import enhanced types
import { 
  DietaryRestriction, 
  SeverityLevel, 
  AllergenType,
  ReligiousType,
  LifestyleType,
  RestrictionType,
  ProfileScreenState,
  createDietaryRestriction,
  getRestrictionDisplayName,
  getRestrictionCategory
} from '../types/profile';

// Import profile service
import { ProfileService } from '../services/profile/ProfileService';

/**
 * Enhanced User Dietary Profile Management Screen
 * 
 * Modern, intuitive interface for managing dietary restrictions with visual 
 * consistency matching the ScanScreen design. Features blue gradient background,
 * prominent SMARTIES logo, and interactive controls for managing allergen 
 * severity levels with accessibility support.
 */
export const ProfileScreen: React.FC = () => {
  // const navigation = useNavigation(); // Available for future use
  const [state, setState] = useState<ProfileScreenState>({
    restrictions: [],
    isLoading: true,
    isEditing: false,
    selectedRestriction: null
  });

  const [showAllergenSelection, setShowAllergenSelection] = useState(false);

  const profileService = new ProfileService();

  useEffect(() => {
    loadUserRestrictions();
  }, []);

  const loadUserRestrictions = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const restrictions = await profileService.getUserRestrictions();
      setState(prev => ({ 
        ...prev, 
        restrictions,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Failed to load user restrictions:', error);
      
      // Create sample restrictions for demo - including all categories
      const sampleRestrictions: DietaryRestriction[] = [
        {
          id: '1',
          ...createDietaryRestriction('Peanuts', AllergenType.PEANUTS, getRestrictionCategory(AllergenType.PEANUTS), SeverityLevel.ANAPHYLACTIC),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          ...createDietaryRestriction('Milk', AllergenType.MILK, getRestrictionCategory(AllergenType.MILK), SeverityLevel.SEVERE),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          ...createDietaryRestriction('Halal', ReligiousType.HALAL, getRestrictionCategory(ReligiousType.HALAL), SeverityLevel.SEVERE),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          ...createDietaryRestriction('Vegan', LifestyleType.VEGAN, getRestrictionCategory(LifestyleType.VEGAN), SeverityLevel.SEVERE),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setState(prev => ({ 
        ...prev, 
        restrictions: sampleRestrictions,
        isLoading: false 
      }));
    }
  };

  const handleSeverityChange = async (id: string, severity: SeverityLevel) => {
    try {
      const restriction = state.restrictions.find(r => r.id === id);
      if (!restriction) return;

      const updatedRestriction = {
        ...restriction,
        severity,
        updatedAt: new Date()
      };

      await profileService.updateRestriction(updatedRestriction);
      
      setState(prev => ({
        ...prev,
        restrictions: prev.restrictions.map(r => 
          r.id === id ? updatedRestriction : r
        )
      }));
    } catch (error) {
      console.error('Failed to update severity:', error);
      Alert.alert('Error', 'Failed to update severity level. Please try again.');
    }
  };



  const handleDelete = async (id: string) => {
    const restriction = state.restrictions.find(r => r.id === id);
    if (!restriction) return;

    Alert.alert(
      'Delete Restriction',
      `Are you sure you want to delete ${restriction.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.deleteRestriction(id);
              setState(prev => ({
                ...prev,
                restrictions: prev.restrictions.filter(r => r.id !== id)
              }));
            } catch (error) {
              console.error('Failed to delete restriction:', error);
              Alert.alert('Error', 'Failed to delete restriction. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleAddRestriction = () => {
    // Check if there are available restriction types to add
    const allTypes = [
      ...Object.values(AllergenType),
      ...Object.values(ReligiousType),
      ...Object.values(LifestyleType)
    ];
    
    const availableTypes = allTypes.filter(type => 
      !state.restrictions.some(r => r.type === type)
    );

    if (availableTypes.length === 0) {
      Alert.alert('All Set!', 'You have already added all available dietary restrictions.');
      return;
    }

    // Open the restriction selection modal
    setShowAllergenSelection(true);
  };

  const handleRestrictionSelected = async (restrictionType: RestrictionType) => {
    const restrictionId = Date.now().toString();
    const category = getRestrictionCategory(restrictionType);
    
    try {
      const newRestriction: DietaryRestriction = {
        id: restrictionId,
        ...createDietaryRestriction(
          getRestrictionDisplayName(restrictionType),
          restrictionType,
          category,
          SeverityLevel.SEVERE
        ),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to local state immediately for better UX
      setState(prev => ({
        ...prev,
        restrictions: [...prev.restrictions, newRestriction]
      }));

      // Save to service
      await profileService.addRestriction(newRestriction);
    } catch (error) {
      console.error('Failed to save new restriction:', error);
      Alert.alert('Error', 'Failed to add restriction. Please try again.');
      
      // Remove from local state if save failed
      setState(prev => ({
        ...prev,
        restrictions: prev.restrictions.filter(r => r.id !== restrictionId)
      }));
    }
  };

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/smarties-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>MY DIETARY</Text>
          <Text style={styles.title}>RESTRICTIONS</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {state.restrictions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Restrictions Added</Text>
            <Text style={styles.emptyStateText}>
              Add your dietary restrictions to get personalized product safety alerts
            </Text>
          </View>
        ) : (
          state.restrictions.map((restriction) => (
            <RestrictionCard
              key={restriction.id}
              restriction={restriction}
              onSeverityChange={handleSeverityChange}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Add Restriction Button */}
        <AddRestrictionButton 
          onPress={handleAddRestriction}
          disabled={state.isLoading}
        />

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Restriction Selection Modal */}
      <AllergenSelectionModal
        visible={showAllergenSelection}
        onClose={() => setShowAllergenSelection(false)}
        onSelectRestriction={handleRestrictionSelected}
        excludeTypes={state.restrictions.map(r => r.type)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5', // Primary blue gradient background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for bottom navigation
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 40,
  },
});
