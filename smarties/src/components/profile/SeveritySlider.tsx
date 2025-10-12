/**
 * SeveritySlider Component
 * 
 * Custom slider component for selecting allergen severity levels
 * with three-point scale, color-coded feedback, and smooth sliding interaction.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SeveritySliderProps, SeverityLevel, getSeverityColor } from '../../types/profile';

export const SeveritySlider: React.FC<SeveritySliderProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const severityLevels = [
    { level: SeverityLevel.IRRITATION, label: 'Mild', position: 0 },
    { level: SeverityLevel.SEVERE, label: 'Severe', position: 0.5 },
    { level: SeverityLevel.ANAPHYLACTIC, label: 'Critical', position: 1 }
  ];

  const currentIndex = Math.max(0, severityLevels.findIndex(item => item.level === value));
  const currentColor = getSeverityColor(value);

  const handleLevelPress = (level: SeverityLevel) => {
    if (!disabled) {
      onChange(level);
    }
  };

  return (
    <View style={styles.container}>
      {/* Labels */}
      <View style={styles.labelsContainer}>
        {severityLevels.map((item) => (
          <Text 
            key={item.level}
            style={[
              styles.label, 
              value === item.level && styles.activeLabel
            ]}
          >
            {item.label}
          </Text>
        ))}
      </View>

      {/* Slider Track */}
      <View style={styles.sliderContainer}>
        <View style={styles.track}>
          {/* Active track portion */}
          <View 
            style={[
              styles.activeTrack, 
              { 
                width: `${(currentIndex / (severityLevels.length - 1)) * 100}%`,
                backgroundColor: currentColor + '60' // Add transparency
              }
            ]} 
          />
          
          {/* Position markers */}
          {severityLevels.map((item, index) => (
            <View 
              key={item.level}
              style={[
                styles.marker, 
                { left: `${(index / (severityLevels.length - 1)) * 100}%` }
              ]} 
            />
          ))}
          
          {/* Slider thumb */}
          <TouchableOpacity
            style={[
              styles.thumb,
              { 
                left: `${(currentIndex / (severityLevels.length - 1)) * 100}%`,
                backgroundColor: currentColor,
                opacity: disabled ? 0.5 : 1
              }
            ]}
            onPress={() => {
              // Cycle to next severity level
              const nextIndex = (currentIndex + 1) % severityLevels.length;
              const nextLevel = severityLevels[nextIndex];
              if (nextLevel) {
                handleLevelPress(nextLevel.level);
              }
            }}
            disabled={disabled}
          />
        </View>
      </View>

      {/* Tap zones for easy selection */}
      <View style={styles.tapZones}>
        {severityLevels.map((item) => (
          <TouchableOpacity
            key={item.level}
            style={styles.tapZone}
            onPress={() => handleLevelPress(item.level)}
            disabled={disabled}
          />
        ))}
      </View>

      {/* Current value display */}
      <Text style={[styles.currentValue, { color: currentColor }]}>
        {severityLevels[currentIndex]?.label || 'Severe'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    marginBottom: 12,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderContainer: {
    width: 280,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    position: 'relative',
    width: '100%',
  },
  activeTrack: {
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  marker: {
    position: 'absolute',
    width: 3,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1.5,
    top: -4,
    marginLeft: -1.5,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: -8,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  tapZones: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
  },
  tapZone: {
    flex: 1,
    height: '100%',
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});