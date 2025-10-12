import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Haptics } from 'expo-haptics';
import { SeverityLevel } from '../../types/DietaryRestriction';

interface SeveritySliderProps {
  value: SeverityLevel;
  onChange: (value: SeverityLevel) => void;
}

const severityConfig = {
  [SeverityLevel.MILD]: { color: '#2ECC40', label: 'Mild' },
  [SeverityLevel.MODERATE]: { color: '#FFDC00', label: 'Moderate' },
  [SeverityLevel.SEVERE]: { color: '#FF4136', label: 'Severe' },
};

export const SeveritySlider: React.FC<SeveritySliderProps> = ({
  value,
  onChange,
}) => {
  const handlePress = async (severity: SeverityLevel) => {
    if (severity !== value) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(severity);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Severity Level</Text>
      
      <View style={styles.slider}>
        {Object.entries(severityConfig).map(([severity, config]) => {
          const isSelected = severity === value;
          
          return (
            <TouchableOpacity
              key={severity}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? config.color : '#F0F0F0',
                  borderColor: config.color,
                  borderWidth: isSelected ? 2 : 1,
                }
              ]}
              onPress={() => handlePress(severity as SeverityLevel)}
              accessibilityLabel={`Set severity to ${config.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? '#FFFFFF' : '#666' }
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  slider: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
