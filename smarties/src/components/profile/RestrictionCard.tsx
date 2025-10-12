/**
 * RestrictionCard Component
 * 
 * Individual card displaying allergen information with interactive controls
 * including severity slider, notes editing, and delete functionality.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RestrictionCardProps, getSeverityColor, getSeverityDisplayName } from '../../types/profile';
import { AllergenIcon, SeveritySlider } from './';

export const RestrictionCard: React.FC<RestrictionCardProps> = ({
  restriction,
  onSeverityChange,
  onNotesChange,
  onDelete
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(restriction.notes);

  const handleNotesSubmit = () => {
    onNotesChange(restriction.id, notesText);
    setIsEditingNotes(false);
  };

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

  return (
    <View style={styles.container}>
      {/* Header with icon, name, and delete button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AllergenIcon 
            allergenType={restriction.type} 
            size={48}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{restriction.name}</Text>
            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              <Text style={styles.severityText}>
                {getSeverityDisplayName(restriction.severity)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeletePress}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Severity Slider */}
      <View style={styles.sliderSection}>
        <Text style={styles.sectionLabel}>Severity Level</Text>
        <SeveritySlider
          value={restriction.severity}
          onChange={(severity) => onSeverityChange(restriction.id, severity)}
        />
      </View>

      {/* Notes Section */}
      <View style={styles.notesSection}>
        <Text style={styles.sectionLabel}>Notes</Text>
        {isEditingNotes ? (
          <View style={styles.notesEditContainer}>
            <TextInput
              style={styles.notesInput}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Add notes about this restriction..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              autoFocus
              onBlur={handleNotesSubmit}
              onSubmitEditing={handleNotesSubmit}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.notesDisplay}
            onPress={() => setIsEditingNotes(true)}
          >
            <Text style={restriction.notes ? styles.notesText : styles.notesPlaceholder}>
              {restriction.notes || 'Tap to add notes...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  notesSection: {
    marginTop: 8,
  },
  notesEditContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  notesInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  notesDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  notesText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  notesPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});