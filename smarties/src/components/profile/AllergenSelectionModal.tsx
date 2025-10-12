/**
 * AllergenSelectionModal Component
 * 
 * Modal interface for selecting new dietary restrictions from available allergen types.
 * Displays available allergens with icons and allows user to select which one to add.
 */

import React from 'react';
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
import { AllergenType, getAllergenDisplayName } from '../../types/profile';
import { AllergenIcon } from './AllergenIcon';

interface AllergenSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAllergen: (allergenType: AllergenType) => void;
  excludeTypes: AllergenType[]; // Already added allergens to exclude
}

export const AllergenSelectionModal: React.FC<AllergenSelectionModalProps> = ({
  visible,
  onClose,
  onSelectAllergen,
  excludeTypes
}) => {
  // Get all available allergen types that haven't been added yet
  const availableAllergens = Object.values(AllergenType).filter(
    type => !excludeTypes.includes(type)
  );

  const handleAllergenSelect = (allergenType: AllergenType) => {
    onSelectAllergen(allergenType);
    onClose();
  };

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

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Select an allergen or dietary restriction to add to your profile:
          </Text>

          {availableAllergens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                You have already added all available allergen types!
              </Text>
            </View>
          ) : (
            <View style={styles.allergenGrid}>
              {availableAllergens.map((allergenType) => (
                <TouchableOpacity
                  key={allergenType}
                  style={styles.allergenCard}
                  onPress={() => handleAllergenSelect(allergenType)}
                  activeOpacity={0.7}
                >
                  <AllergenIcon allergenType={allergenType} size={64} />
                  <Text style={styles.allergenName}>
                    {getAllergenDisplayName(allergenType)}
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
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  allergenCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  allergenName: {
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