import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
export const isTablet = () => {
  const aspectRatio = height / width;
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    (width >= 768 || (aspectRatio < 1.6 && width >= 600))
  ) || Platform.isPad;
};

export const isIPad = () => {
  return Platform.OS === 'ios' && Platform.isPad;
};

// Screen dimensions
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const IS_TABLET = isTablet();
export const IS_IPAD = isIPad();

// Responsive values
export const responsiveWidth = (percentage: number) => {
  return (width * percentage) / 100;
};

export const responsiveHeight = (percentage: number) => {
  return (height * percentage) / 100;
};

export const responsiveFontSize = (size: number) => {
  const scale = width / 375; // Base on iPhone design
  const newSize = size * scale;
  return IS_TABLET ? Math.round(newSize * 1.2) : Math.round(newSize);
};

// Spacing helpers
export const spacing = {
  xs: IS_TABLET ? 6 : 4,
  sm: IS_TABLET ? 12 : 8,
  md: IS_TABLET ? 20 : 16,
  lg: IS_TABLET ? 32 : 24,
  xl: IS_TABLET ? 48 : 32,
  xxl: IS_TABLET ? 64 : 48,
};

// Grid columns
export const getGridColumns = () => {
  if (IS_TABLET) {
    return width > height ? 3 : 2; // 3 columns in landscape, 2 in portrait
  }
  return 1;
};

// Card dimensions
export const getCardMaxWidth = () => {
  if (IS_TABLET) {
    return width > height ? width * 0.6 : width * 0.75;
  }
  return width - 40;
};

// Layout helpers
export const isLandscape = () => width > height;

// Orientation listener
export const addOrientationListener = (callback: () => void) => {
  const subscription = Dimensions.addEventListener('change', callback);
  return subscription;
};
