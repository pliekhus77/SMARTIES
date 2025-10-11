# SMARTIES React Native Style Guide

## Brand Identity

### Logo & Shield
- **Primary Logo**: Shield with barcode lines and green checkmark
- **Color Variants**: Multi-colored border (red/yellow/green/blue) for app icon
- **Usage**: Center-aligned on screens, consistent sizing across platforms

### Tagline
**"Scan. Know. Stay Safe."**

## Color System

### Primary Colors
```javascript
const colors = {
  // Alert System (Core Safety Colors)
  safeGreen: '#2ECC40',      // Safe/compliant products
  alertRed: '#FF4136',       // Violations/severe allergies
  cautionYellow: '#FFDC00',  // Warnings/mild concerns
  
  // UI Colors
  primaryBlue: '#0074D9',    // Primary actions, navigation
  backgroundBlue: '#1E88E5', // Screen backgrounds, gradients
  
  // Neutral Colors
  white: '#FFFFFF',          // Text, cards, backgrounds
  black: '#111111',          // Primary text
  gray: '#DDDDDD',          // Secondary elements
  lightGray: '#F5F5F5',     // Card backgrounds
}
```

### Gradient Backgrounds
```javascript
const gradients = {
  primary: ['#1E88E5', '#42A5F5'],        // Main screens
  severe: ['#FF4136', '#FF6B6B'],         // Severe allergy alerts
  warning: ['#FFDC00', '#FFE082'],        // Warning states
  safe: ['#2ECC40', '#66BB6A'],           // Safe/clear states
}
```

## Typography

### Font Stack
```javascript
const fonts = {
  primary: 'System', // iOS: SF Pro, Android: Roboto
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

### Text Styles
```javascript
const textStyles = {
  // Headers
  h1: { fontSize: 32, fontWeight: '700', color: colors.black },
  h2: { fontSize: 24, fontWeight: '600', color: colors.black },
  h3: { fontSize: 20, fontWeight: '600', color: colors.black },
  
  // Body Text
  body: { fontSize: 16, fontWeight: '400', color: colors.black },
  bodyMedium: { fontSize: 16, fontWeight: '500', color: colors.black },
  caption: { fontSize: 14, fontWeight: '400', color: colors.gray },
  
  // Button Text
  buttonPrimary: { fontSize: 18, fontWeight: '600', color: colors.white },
  buttonSecondary: { fontSize: 16, fontWeight: '500', color: colors.primaryBlue },
}
```

## Component Styles

### Buttons
```javascript
const buttonStyles = {
  // Primary Action (Scan Barcode)
  primary: {
    backgroundColor: colors.safeGreen,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  
  // Secondary Actions
  secondary: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  
  // Warning/Report Actions
  warning: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    paddingVertical: 14,
    paddingHorizontal: 20,
  }
}
```

### Cards
```javascript
const cardStyles = {
  // Product Cards
  product: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Alert Cards
  alert: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Restriction Cards (Profile Screen)
  restriction: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    backdropFilter: 'blur(10px)',
  }
}
```

### Alert System Styling

#### Severe Alert (Red)
```javascript
const severeAlert = {
  container: {
    ...cardStyles.alert,
    background: 'linear-gradient(135deg, #FF4136, #DC2626)',
  },
  icon: {
    backgroundColor: colors.cautionYellow,
    borderRadius: 50,
    padding: 12,
    shadowColor: colors.alertRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  text: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  }
}
```

#### Warning Alert (Yellow)
```javascript
const warningAlert = {
  container: {
    ...cardStyles.alert,
    background: 'linear-gradient(135deg, #FFDC00, #FFC107)',
  },
  icon: {
    backgroundColor: colors.cautionYellow,
    borderRadius: 50,
    padding: 12,
  },
  text: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
  }
}
```

#### Safe Alert (Green)
```javascript
const safeAlert = {
  container: {
    ...cardStyles.alert,
    background: 'linear-gradient(135deg, #2ECC40, #4CAF50)',
  },
  icon: {
    backgroundColor: colors.white,
    borderRadius: 50,
    padding: 12,
  },
  text: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  }
}
```

## Layout & Spacing

### Spacing Scale
```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

### Screen Layout
```javascript
const layout = {
  screenPadding: spacing.md,
  sectionSpacing: spacing.lg,
  cardSpacing: spacing.sm,
  buttonSpacing: spacing.md,
}
```

## Navigation

### Tab Bar
```javascript
const tabBarStyle = {
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
}

const tabBarIcon = {
  size: 24,
  activeColor: colors.primaryBlue,
  inactiveColor: colors.gray,
}
```

## Icons & Imagery

### Icon System
- **Barcode**: Primary scan icon (outlined style)
- **Shield**: Safety/protection indicator
- **Checkmark**: Safe/approved status
- **Warning Triangle**: Alert/caution states
- **Product Icons**: Food category representations

### Product Images
- **Size**: 48x48px for list items, 80x80px for cards
- **Style**: Rounded corners (8px), subtle shadow
- **Fallback**: Generic product icon with category color

## Accessibility

### Color Contrast
- **Text on White**: Minimum 4.5:1 ratio
- **Alert Colors**: High contrast with white text
- **Interactive Elements**: Minimum 44pt touch targets

### Typography Accessibility
- **Dynamic Type**: Support iOS/Android system font scaling
- **Minimum Size**: 14px for body text, 16px for buttons
- **Line Height**: 1.4x font size for readability

## Animation & Transitions

### Micro-interactions
```javascript
const animations = {
  // Button Press
  buttonPress: {
    scale: 0.95,
    duration: 100,
  },
  
  // Alert Appearance
  alertSlide: {
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: 300,
    easing: 'easeOutCubic',
  },
  
  // Screen Transitions
  screenTransition: {
    duration: 250,
    easing: 'easeInOutQuart',
  }
}
```

## Platform-Specific Considerations

### iOS Specific
- **Status Bar**: Light content on colored backgrounds
- **Navigation**: Large title style for main screens
- **Haptics**: Use for alert feedback and button presses

### Android Specific
- **Material Design**: Elevation and shadow consistency
- **Navigation**: Standard action bar with back button
- **Ripple Effects**: Touch feedback on interactive elements

## Usage Guidelines

### Do's
- Use color-coded alerts consistently across all screens
- Maintain high contrast for accessibility
- Keep scan button prominent and easily accessible
- Use consistent spacing and typography scales

### Don'ts
- Don't use red/yellow colors for non-alert purposes
- Don't compromise touch target sizes (<44pt)
- Don't use more than 3 alert levels simultaneously
- Don't override system accessibility settings

## Implementation Example

```javascript
// Example StyleSheet for React Native
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: layout.screenPadding,
  },
  
  scanButton: {
    ...buttonStyles.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  productCard: {
    ...cardStyles.product,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  alertContainer: {
    ...cardStyles.alert,
    alignItems: 'center',
  }
});
```
