import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { IS_TABLET, spacing, responsiveFontSize } from './responsive';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

// Create responsive styles that automatically adjust for iPad
export const createResponsiveStyles = <T extends NamedStyles<T>>(
  phoneStyles: T,
  tabletStyles?: Partial<T>
): T => {
  if (IS_TABLET && tabletStyles) {
    const merged = {} as T;
    for (const key in phoneStyles) {
      merged[key] = {
        ...phoneStyles[key],
        ...(tabletStyles[key] || {}),
      } as T[typeof key];
    }
    return StyleSheet.create(merged);
  }
  return StyleSheet.create(phoneStyles);
};

// Common responsive styles
export const commonStyles = StyleSheet.create({
  // Containers
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: spacing.md,
  },
  contentContainerTablet: {
    padding: spacing.lg,
    maxWidth: IS_TABLET ? 1200 : undefined,
    alignSelf: 'center',
    width: '100%',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: IS_TABLET ? 16 : 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: IS_TABLET ? 8 : 4,
    elevation: IS_TABLET ? 5 : 3,
  },

  // Typography
  title: {
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: responsiveFontSize(16),
    color: '#666',
  },
  body: {
    fontSize: responsiveFontSize(15),
    color: '#333',
    lineHeight: responsiveFontSize(24),
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: spacing.md,
    borderRadius: IS_TABLET ? 16 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#fff',
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
