import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@anki/constants';

class ApiClient {
  private client: AxiosInstance;
  private userId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    // Add request interceptor to include user ID
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.userId) {
          this.userId = await AsyncStorage.getItem('userId');
        }
        if (this.userId) {
          config.headers['X-User-ID'] = this.userId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.initializeUserId();
  }

  private async initializeUserId() {
    this.userId = await AsyncStorage.getItem('userId');
  }

  async setUserId(userId: string) {
    this.userId = userId;
    await AsyncStorage.setItem('userId', userId);
  }

  async getUserId(): Promise<string | null> {
    if (!this.userId) {
      this.userId = await AsyncStorage.getItem('userId');
    }
    return this.userId;
  }

  // User endpoints
  async createUser(email: string) {
    const response = await this.client.post('/users', { email });
    await this.setUserId(response.data.id);
    return response.data;
  }

  async getUser(userId: string) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  // Upload endpoints
  async uploadApkg(fileUri: string, fileName: string, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'application/zip',
      name: fileName,
    } as any);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async uploadChunk(
    chunk: Blob,
    sessionId: string,
    chunkIndex: number,
    totalChunks: number,
    fileName: string,
    onProgress?: (progress: number) => void
  ) {
    const formData = new FormData();
    formData.append('chunk', chunk as any);
    formData.append('session_id', sessionId);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('file_name', fileName);

    const response = await this.client.post('/upload/chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Deck endpoints
  async getDecks() {
    const response = await this.client.get('/decks');
    return response.data;
  }

  async getDeckCards(deckId: string) {
    const response = await this.client.get(`/decks/${deckId}/cards`);
    return response.data;
  }

  // Review endpoints
  async getDueCards() {
    const response = await this.client.get('/reviews/due');
    return response.data;
  }

  async submitReview(cardId: string, quality: number) {
    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await this.client.post('/reviews', {
      user_id: userId,
      card_id: cardId,
      quality,
    });
    return response.data;
  }

  // Card endpoints
  async getCard(cardId: string) {
    const response = await this.client.get(`/cards/${cardId}`);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
