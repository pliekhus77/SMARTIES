import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AllClearResultScreen } from './src/screens/AllClearResultScreen';
import { MildWarningResultScreen } from './src/screens/MildWarningResultScreen';
import { SevereAllergyResultScreen } from './src/screens/SevereAllergyResultScreen';

type RootStackParamList = {
  Home: undefined;
  ScanScreen: undefined;
  History: undefined;
  Profile: undefined;
  Settings: undefined;
  AllClearResultScreen: { product: any; analysisResult: any };
  MildWarningResultScreen: { product: any; analysisResult: any };
  SevereAllergyResultScreen: { product: any; analysisResult: any };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
          />
          <Stack.Screen 
            name="ScanScreen" 
            component={ScanScreen}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
          />
          <Stack.Screen 
            name="AllClearResultScreen" 
            component={AllClearResultScreen}
          />
          <Stack.Screen 
            name="MildWarningResultScreen" 
            component={MildWarningResultScreen}
          />
          <Stack.Screen 
            name="SevereAllergyResultScreen" 
            component={SevereAllergyResultScreen}
          />
        </Stack.Navigator>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
