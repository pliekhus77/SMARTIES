/**
 * Severe Allergy Warning Screen
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5 from SMARTIES API integration specification
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/product';
import { AllergenAnalysisResult } from '../services/AllergenService';

interface Props {
  product: Product;
  analysis: AllergenAnalysisResult;
  onSaveToHistory: () => void;
  onReportIssue: () => void;
  onGoBack: () => void;
}

export const SevereAllergyScreen: React.FC<Props> = ({
  product,
  analysis,
  onSaveToHistory,
  onReportIssue,
  onGoBack
}) => {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Start pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <LinearGradient
      colors={['#FF4444', '#CC0000', '#990000']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="warning" size={80} color="white" />
        </Animated.View>

        <Text style={styles.title}>DANGER</Text>
        <Text style={styles.subtitle}>Contains Severe Allergens</Text>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.upc}>UPC: {product.upc}</Text>
          <Text style={styles.riskLevel}>{analysis.riskLevel}</Text>
        </View>

        <View style={styles.violationsContainer}>
          {analysis.violations.map((violation, index) => (
            <View key={index} style={styles.violation}>
              <Text style={styles.violationText}>
                ⚠️ {violation.allergen}: {violation.type.replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onSaveToHistory}>
            <Ionicons name="bookmark" size={20} color="white" />
            <Text style={styles.actionText}>Save to History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onReportIssue}>
            <Ionicons name="flag" size={20} color="white" />
            <Text style={styles.actionText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backText}>Scan Another Product</Text>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  upc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  violationsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  violation: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  violationText: {
    color: 'white',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 25,
  },
  actionText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    borderRadius: 25,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
