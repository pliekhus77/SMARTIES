import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ScanScreen, ResultScreen } from '../screens';
import { ScanStackParamList } from '../types/navigation';
import { colors } from '../styles/constants';

const Stack = createStackNavigator<ScanStackParamList>();

export function ScanStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundBlue,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Scanner" 
        component={ScanScreen}
        options={{
          title: 'SMARTIES Scanner',
        }}
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen}
        options={{
          title: 'Scan Result',
        }}
      />
    </Stack.Navigator>
  );
}
