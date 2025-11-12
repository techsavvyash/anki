export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  topic_id?: string;
  name: string;
  description: string;
  original_id: number;
  card_count: number;
  created_at: string;
}

export interface CardNote {
  id: string;
  user_id: string;
  card_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  note_id: number;
  front: string;
  back: string;
  original_id: number;
  created_at: string;
}

export interface CardSchedule {
  id: string;
  user_id: string;
  card_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string;
  state: 'new' | 'learning' | 'review' | 'relearning';
  updated_at: string;
}

export interface ReviewLog {
  id: string;
  user_id: string;
  card_id: string;
  quality: number;
  reviewed_at: string;
}

export type RootStackParamList = {
  Home: undefined;
  Decks: undefined;
  DeckDetail: { deckId: string; deckName: string };
  Review: { deckId?: string };
  Upload: undefined;
  Settings: undefined;
  Subjects: undefined;
  SubjectDetail: { subjectId: string; subjectName: string };
  TopicDetail: { topicId: string; topicName: string };
};
