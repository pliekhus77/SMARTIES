// SMARTIES Style Constants - Based on design/style-guide.md

export const colors = {
  // Alert System (Core Safety Colors)
  safeGreen: '#2ECC40',
  alertRed: '#FF4136',
  cautionYellow: '#FFDC00',
  
  // UI Colors
  primaryBlue: '#0074D9',
  backgroundBlue: '#1E88E5',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#111111',
  gray: '#DDDDDD',
  lightGray: '#F5F5F5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const textStyles = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.black },
  h2: { fontSize: 24, fontWeight: '600' as const, color: colors.black },
  h3: { fontSize: 20, fontWeight: '600' as const, color: colors.black },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.black },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, color: colors.black },
  caption: { fontSize: 14, fontWeight: '400' as const, color: colors.gray },
  buttonPrimary: { fontSize: 18, fontWeight: '600' as const, color: colors.white },
  buttonSecondary: { fontSize: 16, fontWeight: '500' as const, color: colors.primaryBlue },
};

export const buttonStyles = {
  primary: {
    backgroundColor: colors.safeGreen,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  secondary: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
};

export const cardStyles = {
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
};
