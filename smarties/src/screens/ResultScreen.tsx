import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { ScanStackParamList } from '../types/navigation';
import { colors, spacing, textStyles, buttonStyles, cardStyles } from '../styles/constants';

type Props = StackScreenProps<ScanStackParamList, 'Result'>;

export function ResultScreen({ route, navigation }: Props) {
  const { scanResult } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return colors.safeGreen;
      case 'warning': return colors.cautionYellow;
      case 'danger': return colors.alertRed;
      default: return colors.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'danger': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.productName}>{scanResult.productName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(scanResult.status) }]}>
          <Ionicons name={getStatusIcon(scanResult.status)} size={20} color={colors.white} />
          <Text style={styles.statusText}>{scanResult.status.toUpperCase()}</Text>
        </View>
      </View>

      {scanResult.violations && scanResult.violations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Dietary Violations</Text>
          {scanResult.violations.map((violation, index) => (
            <Text key={index} style={styles.violation}>{violation}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Product Details</Text>
        <Text style={styles.detail}>UPC: {scanResult.upc}</Text>
        <Text style={styles.detail}>Scanned: {new Date(scanResult.timestamp).toLocaleString()}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Scan Another Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  productName: {
    ...textStyles.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statusBadge: {
    ...cardStyles.alert,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    margin: 0,
  },
  statusText: {
    ...textStyles.buttonPrimary,
    marginLeft: spacing.xs,
  },
  section: {
    ...cardStyles.product,
    marginHorizontal: spacing.md,
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing.sm,
  },
  violation: {
    ...textStyles.body,
    color: colors.alertRed,
    marginBottom: spacing.xs,
  },
  detail: {
    ...textStyles.caption,
    marginBottom: spacing.xs,
  },
  button: {
    ...buttonStyles.secondary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    ...textStyles.buttonPrimary,
  },
});
