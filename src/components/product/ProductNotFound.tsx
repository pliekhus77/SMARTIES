import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface ProductNotFoundProps {
  barcode: string;
  onRetry: () => void;
  onManualEntry: () => void;
}

export const ProductNotFound: React.FC<ProductNotFoundProps> = ({
  barcode,
  onRetry,
  onManualEntry,
}) => {
  const handleContribute = async () => {
    const url = `https://world.openfoodfacts.org/cgi/product_jqm2.pl?code=${barcode}`;
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Not Found</Text>
      
      <Text style={styles.subtitle}>
        We couldn't find information for this product in our database.
      </Text>
      
      <Text style={styles.barcode}>Barcode: {barcode}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleContribute}
          accessibilityLabel="Add this product to Open Food Facts database"
        >
          <Text style={styles.primaryButtonText}>
            🌟 Be the first to add this product!
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onRetry}
          accessibilityLabel="Try scanning again"
        >
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onManualEntry}
          accessibilityLabel="Enter barcode manually"
        >
          <Text style={styles.secondaryButtonText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  barcode: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
