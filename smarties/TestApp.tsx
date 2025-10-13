import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const TestApp = () => {
  const handlePress = () => {
    Alert.alert('Success!', 'React Native is working perfectly!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 SMARTIES</Text>
      <Text style={styles.subtitle}>React Native Test App</Text>
      <Text style={styles.info}>Metro bundler connected ✅</Text>
      <Text style={styles.info}>Android emulator ready ✅</Text>
      
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Test Touch</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TestApp;