import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScanScreen, ProfileScreen, HistoryScreen, SettingsScreen } from './src/screens';

const Tab = createBottomTabNavigator();

/**
 * Main SMARTIES Application Component
 * 
 * This is the root component that includes:
 * - Navigation setup with bottom tabs
 * - Safe area handling
 * - Screen routing between Scanner, Profile, History, and Settings
 * 
 * The app uses a tab-based navigation pattern with the scanner as the primary screen.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Scanner"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Scanner') {
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

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1168bd',
            tabBarInactiveTintColor: '#666',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#e0e0e0',
              borderTopWidth: 1,
            },
            headerStyle: {
              backgroundColor: '#1168bd',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen 
            name="Scanner" 
            component={ScanScreen}
            options={{
              title: 'Scan',
              headerTitle: 'SMARTIES Scanner',
            }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              title: 'Profile',
              headerTitle: 'My Profile',
            }}
          />
          <Tab.Screen 
            name="History" 
            component={HistoryScreen}
            options={{
              title: 'History',
              headerTitle: 'Scan History',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerTitle: 'App Settings',
            }}
          />
        </Tab.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// No custom styles needed - using React Navigation's built-in styling
