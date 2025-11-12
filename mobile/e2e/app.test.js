describe('Anki App E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Home Screen', () => {
    it('should show home screen on launch', async () => {
      await expect(element(by.text('Anki Flashcards'))).toBeVisible();
    });

    it('should show cards due today section', async () => {
      await expect(element(by.text('Cards Due Today'))).toBeVisible();
    });

    it('should navigate to decks screen', async () => {
      await element(by.text('Browse All Decks')).tap();
      await expect(element(by.text('My Decks'))).toBeVisible();
    });

    it('should navigate to upload screen', async () => {
      await element(by.text('Import Deck')).tap();
      await expect(element(by.text('Import Anki Deck'))).toBeVisible();
    });
  });

  describe('Decks Screen', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('Browse All Decks')).tap();
    });

    it('should display decks list', async () => {
      await expect(element(by.text('My Decks'))).toBeVisible();
    });

    it('should show empty state when no decks', async () => {
      // This test assumes a fresh database
      await expect(element(by.text('No decks yet'))).toBeVisible();
    });

    it('should navigate back to home', async () => {
      await element(by.text('← Back')).tap();
      await expect(element(by.text('Anki Flashcards'))).toBeVisible();
    });
  });

  describe('Upload Screen', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('Import Deck')).tap();
    });

    it('should show upload interface', async () => {
      await expect(element(by.text('Import Anki Deck'))).toBeVisible();
      await expect(element(by.text('Select .apkg File'))).toBeVisible();
    });

    it('should show supported file types', async () => {
      await expect(element(by.text('Supported: .apkg files'))).toBeVisible();
    });

    it('should navigate back to home', async () => {
      await element(by.text('← Back')).tap();
      await expect(element(by.text('Anki Flashcards'))).toBeVisible();
    });
  });

  describe('Subjects Screen', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      // Navigate to subjects (might be in a menu or nav)
      // This assumes there's a way to get to subjects from home
    });

    it('should show subjects list when available', async () => {
      // Test subject organization
      await expect(element(by.id('subjects-screen'))).toBeVisible();
    });
  });
});
