/**
 * All Clear Screen
 * Implements Requirements 5.1, 5.2, 5.3, 5.4, 5.5 from SMARTIES API integration specification
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

interface Props {
  product: Product;
  onDone: () => void;
  onSaveToHistory: () => void;
}

export const AllClearScreen: React.FC<Props> = ({
  product,
  onDone,
  onSaveToHistory
}) => {
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    // Trigger success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate checkmark appearance
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={['#4CAF50', '#45A049', '#388E3C']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark-circle" size={80} color="white" />
        </Animated.View>

        <Text style={styles.title}>ALL CLEAR</Text>
        <Text style={styles.subtitle}>No Issues Detected</Text>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.upc}>UPC: {product.upc}</Text>
          {product.brand && (
            <Text style={styles.brand}>Brand: {product.brand}</Text>
          )}
        </View>

        <View style={styles.safetyMessage}>
          <Ionicons name="shield-checkmark" size={24} color="white" />
          <Text style={styles.safetyText}>
            This product appears safe for your dietary restrictions
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onSaveToHistory}>
            <Ionicons name="bookmark-outline" size={20} color="white" />
            <Text style={styles.secondaryButtonText}>Save to History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={onDone}>
            <Text style={styles.primaryButtonText}>Done</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Always read ingredient labels carefully. This analysis is based on available data.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 30,
  },
  productInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
    alignItems: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  upc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  brand: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  safetyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  safetyText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  disclaimer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 5,
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});