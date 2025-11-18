import { create } from 'zustand';
import type { Flashcard } from '@anki/types';
import apiClient from '../services/api';

interface ReviewState {
  dueCards: Flashcard[];
  currentCard: Flashcard | null;
  currentCardIndex: number;
  isLoading: boolean;
  error: string | null;
  showAnswer: boolean;
  fetchDueCards: () => Promise<void>;
  submitReview: (quality: number) => Promise<void>;
  toggleAnswer: () => void;
  resetReview: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  dueCards: [],
  currentCard: null,
  currentCardIndex: 0,
  isLoading: false,
  error: null,
  showAnswer: false,

  fetchDueCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const dueCards = await apiClient.getDueCards();
      set({
        dueCards,
        currentCard: dueCards.length > 0 ? dueCards[0] : null,
        currentCardIndex: 0,
        showAnswer: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch due cards';
      set({ error: errorMessage });
      console.error('Failed to fetch due cards:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  submitReview: async (quality: number) => {
    const { currentCard, currentCardIndex, dueCards } = get();
    if (!currentCard) return;

    set({ isLoading: true, error: null });
    try {
      await apiClient.submitReview(currentCard.id, quality);

      // Move to next card
      const nextIndex = currentCardIndex + 1;
      const nextCard = nextIndex < dueCards.length ? dueCards[nextIndex] : null;

      set({
        currentCardIndex: nextIndex,
        currentCard: nextCard,
        showAnswer: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      set({ error: errorMessage });
      console.error('Failed to submit review:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleAnswer: () => {
    set((state) => ({ showAnswer: !state.showAnswer }));
  },

  resetReview: () => {
    set({
      dueCards: [],
      currentCard: null,
      currentCardIndex: 0,
      showAnswer: false,
      error: null,
    });
  },
}));
