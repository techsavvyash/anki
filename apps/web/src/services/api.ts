import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '@anki/constants';
import type {
  User,
  Deck,
  Flashcard,
  Subject,
  Topic,
  CardNote
} from '@anki/types';

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
      (config) => {
        if (!this.userId) {
          this.userId = localStorage.getItem('userId');
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

  private initializeUserId() {
    this.userId = localStorage.getItem('userId');
  }

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  getUserId(): string | null {
    if (!this.userId) {
      this.userId = localStorage.getItem('userId');
    }
    return this.userId;
  }

  clearUserId() {
    this.userId = null;
    localStorage.removeItem('userId');
  }

  // User endpoints
  async createUser(email: string): Promise<User> {
    const response = await this.client.post('/users', { email });
    this.setUserId(response.data.id);
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  // Upload endpoints
  async uploadApkg(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

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
  ): Promise<{ message: string; session_id?: string }> {
    const formData = new FormData();
    formData.append('chunk', chunk);
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
  async getDecks(): Promise<Deck[]> {
    const response = await this.client.get('/decks');
    return response.data;
  }

  async getDeckCards(deckId: string): Promise<Flashcard[]> {
    const response = await this.client.get(`/decks/${deckId}/cards`);
    return response.data;
  }

  async assignDeckToTopic(deckId: string, topicId: string): Promise<{ message: string }> {
    const response = await this.client.put(`/decks/${deckId}/topic`, { topic_id: topicId });
    return response.data;
  }

  // Subject endpoints
  async createSubject(name: string, color: string): Promise<Subject> {
    const response = await this.client.post('/subjects', { name, color });
    return response.data;
  }

  async getSubjects(): Promise<Subject[]> {
    const response = await this.client.get('/subjects');
    return response.data;
  }

  async getSubjectTopics(subjectId: string): Promise<Topic[]> {
    const response = await this.client.get(`/subjects/${subjectId}/topics`);
    return response.data;
  }

  async updateSubject(subjectId: string, name: string, color: string): Promise<Subject> {
    const response = await this.client.put(`/subjects/${subjectId}`, { name, color });
    return response.data;
  }

  async deleteSubject(subjectId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/subjects/${subjectId}`);
    return response.data;
  }

  // Topic endpoints
  async createTopic(name: string, subjectId: string): Promise<Topic> {
    const response = await this.client.post('/topics', { name, subject_id: subjectId });
    return response.data;
  }

  async getTopics(): Promise<Topic[]> {
    const response = await this.client.get('/topics');
    return response.data;
  }

  async updateTopic(topicId: string, name: string): Promise<Topic> {
    const response = await this.client.put(`/topics/${topicId}`, { name });
    return response.data;
  }

  async deleteTopic(topicId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/topics/${topicId}`);
    return response.data;
  }

  // Review endpoints
  async getDueCards(): Promise<Flashcard[]> {
    const response = await this.client.get('/reviews/due');
    return response.data;
  }

  async submitReview(cardId: string, quality: number): Promise<{ message: string }> {
    const userId = this.getUserId();
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
  async getCard(cardId: string): Promise<Flashcard> {
    const response = await this.client.get(`/cards/${cardId}`);
    return response.data;
  }

  async saveCardNote(cardId: string, content: string): Promise<CardNote> {
    const response = await this.client.post(`/cards/${cardId}/note`, { note: content });
    return response.data;
  }

  async getCardNote(cardId: string): Promise<CardNote | null> {
    try {
      const response = await this.client.get(`/cards/${cardId}/note`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteCardNote(cardId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/cards/${cardId}/note`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
