/**
 * RestrictionCard Component
 * 
 * Individual card displaying allergen information with interactive controls
 * including severity slider and delete functionality.
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  RestrictionCardProps, 
  getSeverityColor, 
  getSeverityDisplayName, 
  RestrictionCategory,
  getRestrictionCategory,
  ReligiousType,
  LifestyleType
} from '../../types/profile';
import { AllergenIcon, SeveritySlider } from './';

export const RestrictionCard: React.FC<RestrictionCardProps> = ({
  restriction,
  onSeverityChange,
  onDelete
}) => {

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Restriction',
      `Are you sure you want to delete ${restriction.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(restriction.id)
        }
      ]
    );
  };

  const severityColor = getSeverityColor(restriction.severity);
  const category = getRestrictionCategory(restriction.type);
  const showSeveritySlider = category === RestrictionCategory.ALLERGEN;

  // Get appropriate icon for non-allergen restrictions
  const getRestrictionIcon = () => {
    if (category === RestrictionCategory.ALLERGEN) {
      return (
        <AllergenIcon 
          allergenType={restriction.type} 
          size={48}
        />
      );
    }

    let emoji = '❓';
    if (category === RestrictionCategory.RELIGIOUS) {
      switch (restriction.type as ReligiousType) {
        case ReligiousType.HALAL:
          emoji = '☪️';
          break;
        case ReligiousType.KOSHER:
          emoji = '✡️';
          break;
        case ReligiousType.HINDU_VEGETARIAN:
          emoji = '🕉️';
          break;
        case ReligiousType.JAIN:
        case ReligiousType.BUDDHIST:
          emoji = '☸️';
          break;
        default:
          emoji = '🙏';
      }
    } else if (category === RestrictionCategory.LIFESTYLE) {
      switch (restriction.type as LifestyleType) {
        case LifestyleType.VEGAN:
          emoji = '🌱';
          break;
        case LifestyleType.VEGETARIAN:
          emoji = '🥬';
          break;
        case LifestyleType.KETO:
          emoji = '🥑';
          break;
        case LifestyleType.PALEO:
          emoji = '🥩';
          break;
        case LifestyleType.ORGANIC_ONLY:
          emoji = '🌿';
          break;
        case LifestyleType.NON_GMO:
          emoji = '🌾';
          break;
        case LifestyleType.LOW_SODIUM:
          emoji = '🧂';
          break;
        case LifestyleType.SUGAR_FREE:
          emoji = '🚫';
          break;
        default:
          emoji = '🍃';
      }
    }

    return (
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with icon, name, and delete button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {getRestrictionIcon()}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{restriction.name}</Text>
            {showSeveritySlider && (
              <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                <Text style={styles.severityText}>
                  {getSeverityDisplayName(restriction.severity)}
                </Text>
              </View>
            )}
            {!showSeveritySlider && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeletePress}
          testID="delete-button"
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Severity Slider - Only for allergens */}
      {showSeveritySlider && (
        <View style={styles.sliderSection}>
          <Text style={styles.sectionLabel}>Severity Level</Text>
          <SeveritySlider
            value={restriction.severity}
            onChange={(severity) => onSeverityChange(restriction.id, severity)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50', // Green for active
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  sliderSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
});