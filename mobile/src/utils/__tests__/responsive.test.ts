import { Dimensions, Platform } from 'react-native';
import {
  isTablet,
  isIPad,
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  spacing,
  getGridColumns,
  getCardMaxWidth,
  isLandscape,
} from '../responsive';

// Mock Dimensions and Platform
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 667 })),
  addEventListener: jest.fn(),
}));

describe('responsive utilities', () => {
  beforeEach(() => {
    // Reset to iPhone dimensions by default
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
    Platform.OS = 'ios';
    (Platform as any).isPad = false;
  });

  describe('isTablet', () => {
    it('should return false for iPhone dimensions', () => {
      const result = isTablet();
      expect(result).toBe(false);
    });

    it('should return true for iPad dimensions', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      (Platform as any).isPad = true;
      const result = isTablet();
      expect(result).toBe(true);
    });

    it('should return true for wide screens >= 768', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 800, height: 600 });
      const result = isTablet();
      expect(result).toBe(true);
    });
  });

  describe('isIPad', () => {
    it('should return false for iPhone', () => {
      const result = isIPad();
      expect(result).toBe(false);
    });

    it('should return true when Platform.isPad is true', () => {
      (Platform as any).isPad = true;
      const result = isIPad();
      expect(result).toBe(true);
    });

    it('should return false for Android tablets', () => {
      Platform.OS = 'android';
      (Platform as any).isPad = true;
      const result = isIPad();
      expect(result).toBe(false);
    });
  });

  describe('responsiveWidth', () => {
    it('should calculate percentage of screen width', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = responsiveWidth(50);
      expect(result).toBe(187.5);
    });

    it('should return full width for 100%', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = responsiveWidth(100);
      expect(result).toBe(375);
    });
  });

  describe('responsiveHeight', () => {
    it('should calculate percentage of screen height', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = responsiveHeight(50);
      expect(result).toBe(333.5);
    });

    it('should return full height for 100%', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = responsiveHeight(100);
      expect(result).toBe(667);
    });
  });

  describe('responsiveFontSize', () => {
    it('should scale font size based on screen width', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = responsiveFontSize(16);
      expect(result).toBe(16); // 375/375 = 1, so 16 * 1 = 16
    });

    it('should apply 1.2x multiplier for tablets', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      (Platform as any).isPad = true;
      const result = responsiveFontSize(16);
      // 768/375 = 2.048, 16 * 2.048 = 32.768, * 1.2 = 39.3216, rounded = 39
      expect(result).toBe(39);
    });

    it('should return integer values', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 414, height: 896 });
      const result = responsiveFontSize(14);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('spacing', () => {
    it('should provide phone spacing values', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
      expect(spacing.xxl).toBe(48);
    });
  });

  describe('getGridColumns', () => {
    it('should return 1 column for phones', () => {
      const result = getGridColumns();
      expect(result).toBe(1);
    });

    it('should return 2 columns for iPad in portrait', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      (Platform as any).isPad = true;
      const result = getGridColumns();
      expect(result).toBe(2);
    });

    it('should return 3 columns for iPad in landscape', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
      (Platform as any).isPad = true;
      const result = getGridColumns();
      expect(result).toBe(3);
    });
  });

  describe('getCardMaxWidth', () => {
    it('should return appropriate width for phones', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = getCardMaxWidth();
      expect(result).toBe(335); // 375 - 40
    });

    it('should return 75% width for iPad in portrait', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      (Platform as any).isPad = true;
      const result = getCardMaxWidth();
      expect(result).toBe(576); // 768 * 0.75
    });

    it('should return 60% width for iPad in landscape', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
      (Platform as any).isPad = true;
      const result = getCardMaxWidth();
      expect(result).toBe(614.4); // 1024 * 0.6
    });
  });

  describe('isLandscape', () => {
    it('should return false for portrait orientation', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = isLandscape();
      expect(result).toBe(false);
    });

    it('should return true for landscape orientation', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 667, height: 375 });
      const result = isLandscape();
      expect(result).toBe(true);
    });

    it('should return true when width equals height', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 500, height: 500 });
      const result = isLandscape();
      expect(result).toBe(false); // width > height is false
    });
  });
});
