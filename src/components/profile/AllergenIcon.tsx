import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AllergenType } from '../../types/DietaryRestriction';

interface AllergenIconProps {
  allergen: AllergenType;
  size?: number;
}

const allergenEmojis: Record<AllergenType, string> = {
  [AllergenType.PEANUTS]: '🥜',
  [AllergenType.TREE_NUTS]: '🌰',
  [AllergenType.MILK]: '🥛',
  [AllergenType.EGGS]: '🥚',
  [AllergenType.FISH]: '🐟',
  [AllergenType.SHELLFISH]: '🦐',
  [AllergenType.WHEAT]: '🌾',
  [AllergenType.SOY]: '🫘',
  [AllergenType.SESAME]: '🌱',
};

export const AllergenIcon: React.FC<AllergenIconProps> = ({ 
  allergen, 
  size = 24 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.7 }]}>
        {allergenEmojis[allergen] || '❓'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  emoji: {
    textAlign: 'center',
  },
});
