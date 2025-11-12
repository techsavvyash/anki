import { Platform } from 'react-native';
import { createResponsiveStyles, commonStyles } from '../styles';

// Mock responsive module
jest.mock('../responsive', () => ({
  IS_TABLET: false,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  responsiveFontSize: (size: number) => size,
}));

describe('styles utilities', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    (Platform as any).isPad = false;
  });

  describe('createResponsiveStyles', () => {
    it('should create phone styles when not on tablet', () => {
      const phoneStyles = {
        container: {
          padding: 10,
          backgroundColor: 'white',
        },
        text: {
          fontSize: 14,
        },
      };

      const result = createResponsiveStyles(phoneStyles);

      expect(result).toBeDefined();
      expect(result.container).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should merge tablet styles when on tablet', () => {
      // Mock IS_TABLET to be true
      jest.resetModules();
      jest.mock('../responsive', () => ({
        IS_TABLET: true,
        spacing: {
          xs: 6,
          sm: 12,
          md: 20,
          lg: 32,
          xl: 48,
          xxl: 64,
        },
        responsiveFontSize: (size: number) => Math.round(size * 1.2),
      }));

      const phoneStyles = {
        container: {
          padding: 10,
          backgroundColor: 'white',
        },
        text: {
          fontSize: 14,
          color: 'black',
        },
      };

      const tabletStyles = {
        container: {
          padding: 20,
        },
        text: {
          fontSize: 18,
        },
      };

      const result = createResponsiveStyles(phoneStyles, tabletStyles);

      expect(result).toBeDefined();
    });

    it('should handle styles without tablet overrides', () => {
      const phoneStyles = {
        container: {
          padding: 10,
        },
      };

      const result = createResponsiveStyles(phoneStyles);

      expect(result).toBeDefined();
      expect(result.container).toBeDefined();
    });
  });

  describe('commonStyles', () => {
    it('should have centerContainer style', () => {
      expect(commonStyles.centerContainer).toBeDefined();
      expect(commonStyles.centerContainer.flex).toBe(1);
      expect(commonStyles.centerContainer.justifyContent).toBe('center');
      expect(commonStyles.centerContainer.alignItems).toBe('center');
    });

    it('should have container style', () => {
      expect(commonStyles.container).toBeDefined();
      expect(commonStyles.container.flex).toBe(1);
      expect(commonStyles.container.backgroundColor).toBe('#f5f5f5');
    });

    it('should have contentContainer style with correct padding', () => {
      expect(commonStyles.contentContainer).toBeDefined();
      expect(commonStyles.contentContainer.padding).toBe(16); // spacing.md
    });

    it('should have card style', () => {
      expect(commonStyles.card).toBeDefined();
      expect(commonStyles.card.backgroundColor).toBe('#fff');
      expect(commonStyles.card.borderRadius).toBeDefined();
      expect(commonStyles.card.shadowColor).toBe('#000');
    });

    it('should have typography styles', () => {
      expect(commonStyles.title).toBeDefined();
      expect(commonStyles.title.fontWeight).toBe('bold');
      expect(commonStyles.title.color).toBe('#333');

      expect(commonStyles.subtitle).toBeDefined();
      expect(commonStyles.subtitle.color).toBe('#666');

      expect(commonStyles.body).toBeDefined();
      expect(commonStyles.body.color).toBe('#333');
    });

    it('should have button styles', () => {
      expect(commonStyles.primaryButton).toBeDefined();
      expect(commonStyles.primaryButton.backgroundColor).toBe('#007AFF');
      expect(commonStyles.primaryButton.alignItems).toBe('center');
      expect(commonStyles.primaryButton.justifyContent).toBe('center');

      expect(commonStyles.buttonText).toBeDefined();
      expect(commonStyles.buttonText.fontWeight).toBe('600');
      expect(commonStyles.buttonText.color).toBe('#fff');
    });

    it('should have layout helper styles', () => {
      expect(commonStyles.row).toBeDefined();
      expect(commonStyles.row.flexDirection).toBe('row');
      expect(commonStyles.row.alignItems).toBe('center');

      expect(commonStyles.spaceBetween).toBeDefined();
      expect(commonStyles.spaceBetween.justifyContent).toBe('space-between');

      expect(commonStyles.centered).toBeDefined();
      expect(commonStyles.centered.alignItems).toBe('center');
      expect(commonStyles.centered.justifyContent).toBe('center');
    });
  });
});
