import { create } from 'zustand';
import type { Deck, Flashcard } from '@anki/types';
import apiClient from '../services/api';

interface DecksState {
  decks: Deck[];
  currentDeck: Deck | null;
  currentDeckCards: Flashcard[];
  isLoading: boolean;
  error: string | null;
  fetchDecks: () => Promise<void>;
  fetchDeckCards: (deckId: string) => Promise<void>;
  assignDeckToTopic: (deckId: string, topicId: string) => Promise<void>;
}

export const useDecksStore = create<DecksState>((set) => ({
  decks: [],
  currentDeck: null,
  currentDeckCards: [],
  isLoading: false,
  error: null,

  fetchDecks: async () => {
    set({ isLoading: true, error: null });
    try {
      const decks = await apiClient.getDecks();
      set({ decks });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch decks';
      set({ error: errorMessage });
      console.error('Failed to fetch decks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDeckCards: async (deckId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cards = await apiClient.getDeckCards(deckId);
      const deck = await apiClient.getDecks().then(decks => decks.find(d => d.id === deckId) || null);
      set({ currentDeckCards: cards, currentDeck: deck });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deck cards';
      set({ error: errorMessage });
      console.error('Failed to fetch deck cards:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  assignDeckToTopic: async (deckId: string, topicId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.assignDeckToTopic(deckId, topicId);
      // Refresh decks to get updated data
      const decks = await apiClient.getDecks();
      set({ decks });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign deck to topic';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
