import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { DietaryRestriction } from '../../types/DietaryRestriction';
import { AllergenIcon } from './AllergenIcon';
import { SeveritySlider } from './SeveritySlider';
import { NotesSection } from './NotesSection';

interface RestrictionCardProps {
  restriction: DietaryRestriction;
  onUpdate: (updates: Partial<DietaryRestriction>) => void;
  onDelete: () => void;
}

export const RestrictionCard: React.FC<RestrictionCardProps> = ({
  restriction,
  onUpdate,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Restriction',
      `Are you sure you want to delete ${restriction.allergen}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.allergenInfo}>
          <AllergenIcon allergen={restriction.allergen} size={32} />
          <Text style={styles.allergenName}>
            {restriction.allergen.replace('_', ' ')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityLabel={`Delete ${restriction.allergen} restriction`}
        >
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>

      <SeveritySlider
        value={restriction.severity}
        onChange={(severity) => onUpdate({ severity })}
      />

      <NotesSection
        notes={restriction.notes}
        onChange={(notes) => onUpdate({ notes })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  allergenName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4136',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
