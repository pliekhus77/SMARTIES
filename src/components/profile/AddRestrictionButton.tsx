import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Haptics } from 'expo-haptics';
import { DietaryRestriction, AllergenType, SeverityLevel } from '../../types/DietaryRestriction';
import { AllergenIcon } from './AllergenIcon';
import { MockProfileService } from '../../services/ProfileService';

interface AddRestrictionButtonProps {
  onAdd: (restriction: DietaryRestriction) => void;
}

export const AddRestrictionButton: React.FC<AddRestrictionButtonProps> = ({
  onAdd,
}) => {
  const [showModal, setShowModal] = useState(false);
  const profileService = new MockProfileService();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModal(true);
  };

  const handleSelectAllergen = async (allergen: AllergenType) => {
    try {
      const newRestriction: DietaryRestriction = {
        id: Date.now().toString(),
        allergen,
        severity: SeverityLevel.MODERATE,
        notes: '',
      };

      await profileService.addRestriction(newRestriction);
      onAdd(newRestriction);
      setShowModal(false);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to add restriction');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        accessibilityLabel="Add new dietary restriction"
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Dietary Restriction</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.allergenList}>
            {Object.values(AllergenType).map((allergen) => (
              <TouchableOpacity
                key={allergen}
                style={styles.allergenOption}
                onPress={() => handleSelectAllergen(allergen)}
              >
                <AllergenIcon allergen={allergen} size={32} />
                <Text style={styles.allergenText}>
                  {allergen.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0074D9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  allergenList: {
    flex: 1,
    padding: 20,
  },
  allergenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  allergenText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
});
