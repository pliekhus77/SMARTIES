import React from 'react';
import { View, AccessibilityInfo, Alert } from 'react-native';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  announceChanges?: boolean;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  announceChanges = true,
}) => {
  const announceToScreenReader = (message: string) => {
    if (announceChanges) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
};
