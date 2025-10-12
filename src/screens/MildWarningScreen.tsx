/**
 * Mild Warning Screen
 * Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5 from SMARTIES API integration specification
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export const MildWarningScreen: React.FC<Props> = ({
  product,
  analysis,
  onSaveToHistory,
  onReportIssue,
  onGoBack
}) => {
  return (
    <LinearGradient
      colors={['#FFB347', '#FF8C00', '#FF7F00']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={60} color="white" />
        </View>

        <Text style={styles.title}>CAUTION</Text>
        <Text style={styles.subtitle}>Dietary Concerns Detected</Text>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.upc}>UPC: {product.upc}</Text>
          <Text style={styles.riskLevel}>{analysis.riskLevel}</Text>
        </View>

        <View style={styles.concernsContainer}>
          <Text style={styles.concernsTitle}>Detected Concerns:</Text>
          {analysis.violations.map((violation, index) => (
            <View key={index} style={styles.concern}>
              <Text style={styles.concernText}>
                ⚠️ {violation.allergen} ({violation.type.replace('_', ' ')})
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {analysis.recommendations.slice(0, 2).map((rec, index) => (
            <Text key={index} style={styles.recommendation}>• {rec}</Text>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onSaveToHistory}>
            <Ionicons name="bookmark-outline" size={18} color="white" />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onReportIssue}>
            <Ionicons name="flag-outline" size={18} color="white" />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={onGoBack}>
            <Text style={styles.primaryButtonText}>Continue Scanning</Text>
          </TouchableOpacity>
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
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 25,
  },
  productInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  upc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  riskLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  concernsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  concernsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  concern: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  concernText: {
    color: 'white',
    fontSize: 13,
  },
  recommendationsContainer: {
    width: '100%',
    marginBottom: 25,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  recommendation: {
    color: 'white',
    fontSize: 13,
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  actionText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 12,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
