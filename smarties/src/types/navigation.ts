/**
 * Navigation type definitions for SMARTIES app
 * 
 * This file defines the navigation structure and parameter types
 * for type-safe navigation throughout the application.
 */

export type RootTabParamList = {
  Scanner: undefined;
  Profile: undefined;
  History: undefined;
  Settings: undefined;
};

export type TabScreenProps<T extends keyof RootTabParamList> = {
  route: { name: T; params: RootTabParamList[T] };
  navigation: any; // Will be properly typed when we add more complex navigation
};