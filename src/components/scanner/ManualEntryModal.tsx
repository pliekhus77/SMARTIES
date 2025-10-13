import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { BarcodeDetectionService } from '../../services/barcode/BarcodeDetectionService';
import { BarcodeFormat } from '../../types/barcode';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeEntered: (barcode: string) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  visible,
  onClose,
  onBarcodeEntered,
}) => {
  const [barcode, setBarcode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  const detectionService = new BarcodeDetectionService();

  const handleSubmit = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setIsValidating(true);

    try {
      // Validate the entered barcode
      const format = detectBarcodeFormat(barcode);
      const validation = detectionService.validateBarcode(barcode, format);

      if (!validation.isValid) {
        Alert.alert('Invalid Barcode', validation.error || 'Please check the barcode and try again');
        setIsValidating(false);
        return;
      }

      const normalizedBarcode = validation.normalized || barcode;
      onBarcodeEntered(normalizedBarcode);
      handleClose();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to validate barcode');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setBarcode('');
    setIsValidating(false);
    onClose();
  };

  const detectBarcodeFormat = (value: string): BarcodeFormat => {
    const digits = value.replace(/\D/g, '');
    
    switch (digits.length) {
      case 8: return BarcodeFormat.EAN_8;
      case 12: return BarcodeFormat.UPC_A;
      case 13: return BarcodeFormat.EAN_13;
      default: return BarcodeFormat.UNKNOWN;
    }
  };

  const formatBarcode = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 13 digits
    const limited = digits.slice(0, 13);
    
    setBarcode(limited);
  };

  const getBarcodeHint = () => {
    const length = barcode.length;
    if (length === 0) return 'Enter 8, 12, or 13 digit barcode';
    if (length === 8) return 'EAN-8 format detected';
    if (length === 12) return 'UPC-A format detected';
    if (length === 13) return 'EAN-13 format detected';
    if (length < 8) return `${8 - length} more digits needed`;
    if (length > 8 && length < 12) return `${12 - length} more digits for UPC-A`;
    if (length > 12 && length < 13) return `${13 - length} more digit for EAN-13`;
    return 'Too many digits';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Enter Barcode Manually</Text>
          
          <Text style={styles.subtitle}>
            Type the barcode numbers found on the product
          </Text>

          <TextInput
            style={styles.input}
            value={barcode}
            onChangeText={formatBarcode}
            placeholder="123456789012"
            keyboardType="numeric"
            maxLength={13}
            autoFocus={true}
            accessibilityLabel="Barcode input field"
            accessibilityHint="Enter the product barcode numbers"
          />

          <Text style={styles.hint}>{getBarcodeHint()}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isValidating}
              accessibilityLabel="Cancel manual entry"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (!barcode || isValidating) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={!barcode || isValidating}
              accessibilityLabel="Submit barcode"
            >
              <Text style={styles.submitButtonText}>
                {isValidating ? 'Validating...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>
            Common barcode formats:{'\n'}
            • EAN-8: 8 digits{'\n'}
            • UPC-A: 12 digits{'\n'}
            • EAN-13: 13 digits
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
});
