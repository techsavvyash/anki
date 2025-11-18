import { create } from 'zustand';
import type { Subject, Topic } from '@anki/types';
import apiClient from '../services/api';

interface OrganizationState {
  subjects: Subject[];
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
  fetchSubjects: () => Promise<void>;
  fetchTopics: () => Promise<void>;
  createSubject: (name: string, color: string) => Promise<Subject>;
  createTopic: (name: string, subjectId: string) => Promise<Topic>;
  updateSubject: (subjectId: string, name: string, color: string) => Promise<void>;
  updateTopic: (topicId: string, name: string) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  subjects: [],
  topics: [],
  isLoading: false,
  error: null,

  fetchSubjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const subjects = await apiClient.getSubjects();
      set({ subjects });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subjects';
      set({ error: errorMessage });
      console.error('Failed to fetch subjects:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTopics: async () => {
    set({ isLoading: true, error: null });
    try {
      const topics = await apiClient.getTopics();
      set({ topics });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch topics';
      set({ error: errorMessage });
      console.error('Failed to fetch topics:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createSubject: async (name: string, color: string) => {
    set({ isLoading: true, error: null });
    try {
      const subject = await apiClient.createSubject(name, color);
      set((state) => ({ subjects: [...state.subjects, subject] }));
      return subject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subject';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createTopic: async (name: string, subjectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const topic = await apiClient.createTopic(name, subjectId);
      set((state) => ({ topics: [...state.topics, topic] }));
      return topic;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create topic';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSubject: async (subjectId: string, name: string, color: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSubject = await apiClient.updateSubject(subjectId, name, color);
      set((state) => ({
        subjects: state.subjects.map((s) => (s.id === subjectId ? updatedSubject : s)),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subject';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTopic: async (topicId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTopic = await apiClient.updateTopic(topicId, name);
      set((state) => ({
        topics: state.topics.map((t) => (t.id === topicId ? updatedTopic : t)),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update topic';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSubject: async (subjectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteSubject(subjectId);
      set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== subjectId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete subject';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTopic: async (topicId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteTopic(topicId);
      set((state) => ({
        topics: state.topics.filter((t) => t.id !== topicId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete topic';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
