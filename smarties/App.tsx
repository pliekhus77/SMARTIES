import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import ScannerTest from './ScannerTest';

export default function App() {
  return (
    <View style={styles.container}>
      <ScannerTest />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
