/**
 * Severe Allergy Result Screen Wrapper
 * Handles navigation params and integrates with the core SevereAllergyScreen component
 */

import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SevereAllergyScreen } from './SevereAllergyScreen';
import { ScanStackParamList, Product } from '../types';
import { AllergenAnalysisResult } from '../services/AllergenService';

type SevereAllergyRouteProp = RouteProp<ScanStackParamList, 'SevereAllergyResultScreen'>;

export const SevereAllergyResultScreen: React.FC = () => {
  const route = useRoute<SevereAllergyRouteProp>();
  const navigation = useNavigation();
  
  const { product: productInfo, violation } = route.params;

  // Create Product object from navigation params
  const product: Product = {
    upc: productInfo.upc,
    name: productInfo.name,
    brand: productInfo.brand || '',
    category: '',
    ingredients: [],
    allergenInfo: [violation.allergen],
    nutritionFacts: undefined,
    certifications: [],
    embedding: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Create analysis result from navigation params
  const analysis: AllergenAnalysisResult = {
    severity: 'severe',
    violations: [{
      allergen: violation.allergen,
      type: 'contains',
      severity: 'high',
      ingredients: [violation.allergen],
      userRestriction: {
        id: '1',
        name: violation.allergen,
        type: violation.allergen.toLowerCase() as any,
        category: 'allergen' as any,
        severity: 'anaphylactic' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }],
    riskLevel: violation.riskLevel,
    recommendations: [
      'DO NOT CONSUME - Contains allergens that may cause severe reactions',
      'Consult your healthcare provider if accidentally consumed'
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
    <SevereAllergyScreen
      product={product}
      analysis={analysis}
      onSaveToHistory={handleSaveToHistory}
      onReportIssue={handleReportIssue}
      onGoBack={handleGoBack}
    />
  );
};