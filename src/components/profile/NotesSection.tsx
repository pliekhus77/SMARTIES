import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface NotesSectionProps {
  notes?: string;
  onChange: (notes: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes = '',
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(notes);
  const inputRef = useRef<TextInput>(null);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTempNotes(notes);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSave = () => {
    onChange(tempNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempNotes(notes);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Notes</Text>
      
      {isEditing ? (
        <View>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={tempNotes}
            onChangeText={setTempNotes}
            placeholder="Add notes about this restriction..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.notesDisplay}
          onPress={handleStartEdit}
          accessibilityLabel="Tap to edit notes"
        >
          <Text style={[styles.notesText, !notes && styles.placeholder]}>
            {notes || 'Tap to add notes...'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesDisplay: {
    minHeight: 60,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  input: {
    minHeight: 80,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0074D9',
    fontSize: 14,
    color: '#333',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  saveButton: {
    backgroundColor: '#0074D9',
  },
  cancelText: {
    color: '#666',
    fontWeight: '500',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
