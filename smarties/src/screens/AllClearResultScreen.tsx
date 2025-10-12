/**
 * All Clear Result Screen Wrapper
 * Handles navigation params and integrates with the core AllClearScreen component
 */

import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AllClearScreen } from './AllClearScreen';
import { ScanStackParamList, Product } from '../types';


type AllClearRouteProp = RouteProp<ScanStackParamList, 'AllClearResultScreen'>;

export const AllClearResultScreen: React.FC = () => {
  const route = useRoute<AllClearRouteProp>();
  const navigation = useNavigation();
  
  const { product: productInfo } = route.params;

  // Create Product object from navigation params
  const product: Product = {
    upc: productInfo.upc,
    name: productInfo.name,
    brand: productInfo.brand || '',
    category: '',
    ingredients: [],
    allergenInfo: [],
    nutritionFacts: undefined,
    certifications: [],
    embedding: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const handleSaveToHistory = () => {
    // TODO: Implement save to history
    console.log('Save to history:', product.upc);
  };

  const handleDone = () => {
    navigation.goBack();
  };

  return (
    <AllClearScreen
      product={product}
      onSaveToHistory={handleSaveToHistory}
      onDone={handleDone}
    />
  );
};