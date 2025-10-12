/**
 * AllergenSelectionModal Component
 * 
 * Modal interface for selecting new dietary restrictions from available types.
 * Features tabbed interface for allergens, religious restrictions, and lifestyle choices.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  RestrictionType, 
  RestrictionCategory,
  AllergenType,
  ReligiousType,
  LifestyleType,
  getRestrictionDisplayName,
  getRestrictionCategory
} from '../../types/profile';
import { AllergenIcon } from './AllergenIcon';

interface AllergenSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRestriction: (restrictionType: RestrictionType) => void;
  excludeTypes: RestrictionType[]; // Already added restrictions to exclude
}

export const AllergenSelectionModal: React.FC<AllergenSelectionModalProps> = ({
  visible,
  onClose,
  onSelectRestriction,
  excludeTypes
}) => {
  const [activeTab, setActiveTab] = useState<RestrictionCategory>(RestrictionCategory.ALLERGEN);

  // Get available restrictions by category
  const getAvailableRestrictions = (category: RestrictionCategory): RestrictionType[] => {
    let allTypes: RestrictionType[] = [];
    
    switch (category) {
      case RestrictionCategory.ALLERGEN:
        allTypes = Object.values(AllergenType);
        break;
      case RestrictionCategory.RELIGIOUS:
        allTypes = Object.values(ReligiousType);
        break;
      case RestrictionCategory.LIFESTYLE:
        allTypes = Object.values(LifestyleType);
        break;
    }
    
    return allTypes.filter(type => !excludeTypes.includes(type));
  };

  const handleRestrictionSelect = (restrictionType: RestrictionType) => {
    onSelectRestriction(restrictionType);
    onClose();
  };

  const getTabIcon = (category: RestrictionCategory): string => {
    switch (category) {
      case RestrictionCategory.ALLERGEN:
        return 'warning-outline';
      case RestrictionCategory.RELIGIOUS:
        return 'library-outline';
      case RestrictionCategory.LIFESTYLE:
        return 'leaf-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTabLabel = (category: RestrictionCategory): string => {
    switch (category) {
      case RestrictionCategory.ALLERGEN:
        return 'Allergens';
      case RestrictionCategory.RELIGIOUS:
        return 'Religious';
      case RestrictionCategory.LIFESTYLE:
        return 'Lifestyle';
      default:
        return 'Other';
    }
  };

  const getRestrictionIcon = (type: RestrictionType): string => {
    const category = getRestrictionCategory(type);
    
    if (category === RestrictionCategory.ALLERGEN) {
      // Use existing allergen icons
      return type;
    } else if (category === RestrictionCategory.RELIGIOUS) {
      switch (type as ReligiousType) {
        case ReligiousType.HALAL:
          return '☪️';
        case ReligiousType.KOSHER:
          return '✡️';
        case ReligiousType.HINDU_VEGETARIAN:
          return '🕉️';
        case ReligiousType.JAIN:
          return '☸️';
        case ReligiousType.BUDDHIST:
          return '☸️';
        default:
          return '🙏';
      }
    } else if (category === RestrictionCategory.LIFESTYLE) {
      switch (type as LifestyleType) {
        case LifestyleType.VEGAN:
          return '🌱';
        case LifestyleType.VEGETARIAN:
          return '🥬';
        case LifestyleType.KETO:
          return '🥑';
        case LifestyleType.PALEO:
          return '🥩';
        case LifestyleType.ORGANIC_ONLY:
          return '🌿';
        case LifestyleType.NON_GMO:
          return '🌾';
        case LifestyleType.LOW_SODIUM:
          return '🧂';
        case LifestyleType.SUGAR_FREE:
          return '🚫';
        default:
          return '🍃';
      }
    }
    
    return '❓';
  };

  const availableRestrictions = getAvailableRestrictions(activeTab);
  const tabs = Object.values(RestrictionCategory);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Dietary Restriction</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={getTabIcon(tab) as any} 
                size={20} 
                color={activeTab === tab ? '#1E88E5' : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === tab && styles.activeTabText
              ]}>
                {getTabLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Select a {getTabLabel(activeTab).toLowerCase()} restriction to add to your profile:
          </Text>

          {availableRestrictions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                You have already added all available {getTabLabel(activeTab).toLowerCase()} restrictions!
              </Text>
            </View>
          ) : (
            <View style={styles.restrictionGrid}>
              {availableRestrictions.map((restrictionType) => (
                <TouchableOpacity
                  key={restrictionType}
                  style={styles.restrictionCard}
                  onPress={() => handleRestrictionSelect(restrictionType)}
                  activeOpacity={0.7}
                >
                  {getRestrictionCategory(restrictionType) === RestrictionCategory.ALLERGEN ? (
                    <AllergenIcon allergenType={restrictionType} size={64} />
                  ) : (
                    <View style={styles.iconContainer}>
                      <Text style={styles.emoji}>
                        {getRestrictionIcon(restrictionType)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.restrictionName}>
                    {getRestrictionDisplayName(restrictionType)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as close button for centering
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  restrictionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  restrictionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  restrictionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
});