import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiClient } from '../client';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('ApiClient', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((onFulfilled) => {
            // Store the interceptor for testing
            mockAxiosInstance._requestInterceptor = onFulfilled;
            return 0;
          }),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    // Mock AsyncStorage default behavior
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should set up request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('user management', () => {
    it('should set and get user ID', async () => {
      const userId = 'user-123';
      await apiClient.setUserId(userId);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userId', userId);

      const retrievedId = await apiClient.getUserId();
      expect(retrievedId).toBe(userId);
    });

    it('should get user ID from storage if not cached', async () => {
      const userId = 'user-456';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(userId);

      const retrievedId = await apiClient.getUserId();
      expect(retrievedId).toBe(userId);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userId');
    });

    it('should create user', async () => {
      const mockUser = { id: 'user-789', email: 'test@example.com' };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockUser });

      const result = await apiClient.createUser('test@example.com');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', {
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userId', mockUser.id);
    });

    it('should get user by ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      const result = await apiClient.getUser('user-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/user-123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('upload functionality', () => {
    it('should upload apkg file', async () => {
      const mockResponse = { deck_id: 'deck-123' };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiClient.uploadApkg(
        'file://path/to/deck.apkg',
        'deck.apkg'
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should upload file with progress callback', async () => {
      const mockResponse = { deck_id: 'deck-123' };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const onProgress = jest.fn();

      await apiClient.uploadApkg('file://path/to/deck.apkg', 'deck.apkg', onProgress);

      // Get the config passed to post
      const config = mockAxiosInstance.post.mock.calls[0][2];

      // Simulate progress event
      config.onUploadProgress({ loaded: 50, total: 100 });

      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('should upload chunk', async () => {
      const mockResponse = { success: true };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const chunk = new Blob(['chunk data']);
      const result = await apiClient.uploadChunk(
        chunk,
        'session-123',
        0,
        10,
        'deck.apkg'
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/upload/chunk',
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deck functionality', () => {
    it('should get all decks', async () => {
      const mockDecks = [
        { id: 'deck-1', name: 'Deck 1' },
        { id: 'deck-2', name: 'Deck 2' },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockDecks });

      const result = await apiClient.getDecks();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/decks');
      expect(result).toEqual(mockDecks);
    });

    it('should get deck cards', async () => {
      const mockCards = [
        { id: 'card-1', front: 'Front 1', back: 'Back 1' },
        { id: 'card-2', front: 'Front 2', back: 'Back 2' },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCards });

      const result = await apiClient.getDeckCards('deck-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/decks/deck-123/cards');
      expect(result).toEqual(mockCards);
    });
  });

  describe('review functionality', () => {
    it('should get due cards', async () => {
      const mockCards = [
        { id: 'card-1', front: 'Front 1' },
        { id: 'card-2', front: 'Front 2' },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCards });

      const result = await apiClient.getDueCards();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reviews/due');
      expect(result).toEqual(mockCards);
    });

    it('should submit review', async () => {
      const userId = 'user-123';
      await apiClient.setUserId(userId);

      const mockResponse = { success: true };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiClient.submitReview('card-123', 3);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/reviews', {
        user_id: userId,
        card_id: 'card-123',
        quality: 3,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when submitting review without user ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await expect(apiClient.submitReview('card-123', 3)).rejects.toThrow(
        'User ID not found'
      );
    });
  });

  describe('card functionality', () => {
    it('should get card by ID', async () => {
      const mockCard = { id: 'card-123', front: 'Front', back: 'Back' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCard });

      const result = await apiClient.getCard('card-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/cards/card-123');
      expect(result).toEqual(mockCard);
    });
  });

  describe('health check', () => {
    it('should perform health check', async () => {
      const mockResponse = { status: 'ok' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiClient.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('request interceptor', () => {
    it('should add user ID header to requests', async () => {
      const userId = 'user-123';
      await apiClient.setUserId(userId);

      const config = { headers: {} };
      const interceptor = mockAxiosInstance._requestInterceptor;

      if (interceptor) {
        const modifiedConfig = await interceptor(config);
        expect(modifiedConfig.headers['X-User-ID']).toBe(userId);
      }
    });

    it('should not add header if no user ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const config = { headers: {} };
      const interceptor = mockAxiosInstance._requestInterceptor;

      if (interceptor) {
        const modifiedConfig = await interceptor(config);
        expect(modifiedConfig.headers['X-User-ID']).toBeUndefined();
      }
    });
  });
});
