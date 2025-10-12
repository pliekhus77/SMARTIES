/**
 * Mild Warning Result Screen Wrapper
 * Handles navigation params and integrates with the core MildWarningScreen component
 */

import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MildWarningScreen } from './MildWarningScreen';
import { ScanStackParamList, Product } from '../types';
import { AllergenAnalysisResult } from '../services/AllergenService';

type MildWarningRouteProp = RouteProp<ScanStackParamList, 'MildWarningResultScreen'>;

export const MildWarningResultScreen: React.FC = () => {
  const route = useRoute<MildWarningRouteProp>();
  const navigation = useNavigation();
  
  const { product: productInfo, violations } = route.params;

  // Create Product object from navigation params
  const product: Product = {
    upc: productInfo.upc,
    name: productInfo.name,
    brand: productInfo.brand || '',
    category: '',
    ingredients: [],
    allergenInfo: violations.map(v => v.allergen),
    nutritionFacts: undefined,
    certifications: [],
    embedding: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Create analysis result from navigation params
  const analysis: AllergenAnalysisResult = {
    severity: 'mild',
    violations: violations.map(v => ({
      allergen: v.allergen,
      type: v.type as any,
      severity: 'medium' as any,
      ingredients: [v.allergen],
      userRestriction: {
        id: '1',
        name: v.allergen,
        type: v.allergen.toLowerCase() as any,
        category: 'allergen' as any,
        severity: 'severe' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })),
    riskLevel: 'Moderate Risk',
    recommendations: [
      'Exercise caution - Product contains allergens you should avoid',
      'Consider finding alternative products'
    ]
  };

  const handleSaveToHistory = () => {
    // TODO: Implement save to history
    console.log('Save to history:', product.upc);
  };

  const handleReportIssue = () => {
    // TODO: Implement report issue
    console.log('Report issue for:', product.upc);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <MildWarningScreen
      product={product}
      analysis={analysis}
      onSaveToHistory={handleSaveToHistory}
      onReportIssue={handleReportIssue}
      onGoBack={handleGoBack}
    />
  );
};