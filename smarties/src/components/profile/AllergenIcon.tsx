/**
 * AllergenIcon Component
 * 
 * Displays appropriate icon for each allergen type
 * with consistent sizing, color theming, and accessibility labels.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AllergenIconProps, AllergenType } from '../../types/profile';

export const AllergenIcon: React.FC<AllergenIconProps> = ({
  allergenType,
  size = 48
}) => {
  // Map allergen types to emoji icons
  const getAllergenEmoji = (type: string): string => {
    switch (type) {
      case AllergenType.PEANUTS:
        return '🥜';
      case AllergenType.TREE_NUTS:
        return '🌰';
      case AllergenType.MILK:
        return '🥛';
      case AllergenType.EGGS:
        return '🥚';
      case AllergenType.FISH:
        return '🐟';
      case AllergenType.SHELLFISH:
        return '🦐';
      case AllergenType.SOY:
        return '🫘';
      case AllergenType.WHEAT:
        return '🌾';
      case AllergenType.SESAME:
        return '🫘';
      case AllergenType.GLUTEN:
        return '🍞';
      default:
        return '⚠️';
    }
  };

  const emoji = getAllergenEmoji(allergenType);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>
        {emoji}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    textAlign: 'center',
  },
});