import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreen, HistoryScreen, SettingsScreen } from './src/screens';
import { ScanStack } from './src/navigation';
import { RootTabParamList } from './src/types/navigation';
import { colors, spacing } from './src/styles/constants';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Main SMARTIES Application Component
 * 
 * This is the root component that includes:
 * - Navigation setup with bottom tabs and nested stack navigation
 * - Safe area handling
 * - Screen routing between Scanner Stack, Profile, History, and Settings
 * 
 * The app uses a tab-based navigation pattern with nested stack navigation
 * for the scanner flow (Scanner → Result).
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="ScanStack"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'ScanStack') {
                iconName = focused ? 'scan' : 'scan-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'History') {
                iconName = focused ? 'time' : 'time-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={24} color={color} />;
            },
            tabBarActiveTintColor: colors.primaryBlue,
            tabBarInactiveTintColor: colors.gray,
            tabBarStyle: {
              backgroundColor: colors.white,
              borderTopWidth: 0,
              borderRadius: 20,
              marginHorizontal: spacing.md,
              marginBottom: spacing.md,
              paddingVertical: spacing.sm,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen 
            name="ScanStack" 
            component={ScanStack}
            options={{
              title: 'Scan',
            }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              title: 'Profile',
              headerShown: true,
              headerStyle: {
                backgroundColor: colors.backgroundBlue,
              },
              headerTintColor: colors.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'My Profile',
            }}
          />
          <Tab.Screen 
            name="History" 
            component={HistoryScreen}
            options={{
              title: 'History',
              headerShown: true,
              headerStyle: {
                backgroundColor: colors.backgroundBlue,
              },
              headerTintColor: colors.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'Scan History',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerShown: true,
              headerStyle: {
                backgroundColor: colors.backgroundBlue,
              },
              headerTintColor: colors.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'App Settings',
            }}
          />
        </Tab.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
