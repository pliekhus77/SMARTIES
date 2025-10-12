/**
 * AddRestrictionButton Component
 * 
 * Circular "+" button for adding new dietary restrictions
 * with proper styling, press animations, and visual feedback.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AddRestrictionButtonProps } from '../../types/profile';

export const AddRestrictionButton: React.FC<AddRestrictionButtonProps> = ({
  onPress,
  disabled = false
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.plusIcon, disabled && styles.disabledText]}>
        +
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  plusIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  disabledText: {
    color: 'rgba(30, 136, 229, 0.5)',
  },
});