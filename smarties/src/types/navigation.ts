/**
 * Navigation type definitions for SMARTIES app
 * 
 * This file defines the navigation structure and parameter types
 * for type-safe navigation throughout the application.
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps } from '@react-navigation/native';

// Tab navigation types
export type RootTabParamList = {
  ScanStack: undefined;
  Profile: undefined;
  History: undefined;
  Settings: undefined;
};

// Stack navigation types for scan flow
export type ScanStackParamList = {
  Scanner: undefined;
  SevereAllergyResultScreen: {
    product: {
      upc: string;
      name: string;
      brand?: string;
    };
    violation: {
      allergen: string;
      riskLevel: string;
    };
  };
  MildWarningResultScreen: {
    product: {
      upc: string;
      name: string;
      brand?: string;
    };
    violations: {
      allergen: string;
      type: string;
    }[];
  };
  AllClearResultScreen: {
    product: {
      upc: string;
      name: string;
      brand?: string;
    };
  };
};

// Screen props types
export type TabScreenProps<T extends keyof RootTabParamList> = BottomTabScreenProps<RootTabParamList, T>;

export type ScanStackScreenProps<T extends keyof ScanStackParamList> = StackScreenProps<ScanStackParamList, T>;

// Composite navigation props for nested navigators
export type ScanScreenProps = CompositeScreenProps<
  ScanStackScreenProps<'Scanner'>,
  TabScreenProps<keyof RootTabParamList>
>;

export type ResultScreenProps = CompositeScreenProps<
  ScanStackScreenProps<'Result'>,
  TabScreenProps<keyof RootTabParamList>
>;
