import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import { ProfileScreen, HistoryScreen, SettingsScreen } from './src/screens';
import { ScanScreen } from './src/screens';

// Types
type RootStackParamList = {
  Home: undefined;
  Scan: undefined;
  Profile: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Simple loading component
const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <View style={loadingStyles.container}>
    <ActivityIndicator size="large" color="#1168bd" />
    <Text style={loadingStyles.message}>{message}</Text>
  </View>
);

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

// Simple offline banner component
const OfflineBanner: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <View style={bannerStyles.container}>
      <Text style={bannerStyles.text}>Offline Mode - Limited functionality</Text>
    </View>
  );
};

const bannerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ff9500',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={loadingStyles.container}>
          <Text style={{ fontSize: 18, color: '#d32f2f', marginBottom: 16 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Main SMARTIES Application Component
 * Full-featured app with navigation and error handling
 */
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing SMARTIES...');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoadingMessage('Loading application...');
      
      // Simulate initialization without complex dependencies
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingMessage('Ready!');
      
      // Small delay to show "Ready!" message
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);

    } catch (error) {
      console.error('App initialization error:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      setLoadingMessage('Initialization failed');
    }
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return <LoadingScreen message={loadingMessage} />;
  }

  // Show error screen if initialization failed
  if (initializationError) {
    return <LoadingScreen message={`Error: ${initializationError}`} />;
  }

  // Main app navigation
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <OfflineBanner isVisible={isOfflineMode} />
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
              name="Scan" 
              component={ScanScreen}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1168bd',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerTitle: 'My Profile',
              }}
            />
            <Stack.Screen 
              name="History" 
              component={HistoryScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1168bd',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerTitle: 'Scan History',
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1168bd',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerTitle: 'App Settings',
              }}
            />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
