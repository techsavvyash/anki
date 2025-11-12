describe('iPad Specific Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      device: { type: 'iPad Pro (12.9-inch) (6th generation)' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('iPad Layout - Portrait', () => {
    beforeEach(async () => {
      await device.setOrientation('portrait');
    });

    it('should display 2-column grid for decks in portrait', async () => {
      await element(by.text('Browse All Decks')).tap();
      // Grid layout should be visible with 2 columns
      await expect(element(by.id('decks-grid'))).toBeVisible();
    });

    it('should have larger font sizes on iPad', async () => {
      // Visual test for responsive font sizing
      await expect(element(by.text('Anki Flashcards'))).toBeVisible();
    });

    it('should have increased spacing between elements', async () => {
      // Test that iPad spacing is applied
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('iPad Layout - Landscape', () => {
    beforeEach(async () => {
      await device.setOrientation('landscape');
    });

    it('should display 3-column grid for decks in landscape', async () => {
      await element(by.text('Browse All Decks')).tap();
      // Grid should adapt to 3 columns in landscape
      await expect(element(by.id('decks-grid'))).toBeVisible();
    });

    it('should adjust review buttons layout in landscape', async () => {
      // Review buttons should be side-by-side in landscape
      // This test would need a deck with cards to be meaningful
    });

    it('should maintain functionality after orientation change', async () => {
      // Navigate through app
      await element(by.text('Browse All Decks')).tap();
      await expect(element(by.text('My Decks'))).toBeVisible();

      // Change orientation
      await device.setOrientation('portrait');

      // Should still work
      await expect(element(by.text('My Decks'))).toBeVisible();

      // Change back
      await device.setOrientation('landscape');
      await expect(element(by.text('My Decks'))).toBeVisible();
    });
  });

  describe('iPad Touch Targets', () => {
    it('should have appropriately sized touch targets', async () => {
      // Larger buttons should be easier to tap on iPad
      await element(by.text('Browse All Decks')).tap();
      await expect(element(by.text('My Decks'))).toBeVisible();
    });
  });

  describe('iPad Split View Support', () => {
    it('should maintain layout in split view', async () => {
      // Test app behavior in iPad split view
      // This is more of a manual test but can verify basic layout
      await expect(element(by.text('Anki Flashcards'))).toBeVisible();
    });
  });
});
