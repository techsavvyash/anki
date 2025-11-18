/**
 * Re-export shared types from @anki/types package
 */
export type {
  User,
  Subject,
  Topic,
  Deck,
  CardNote,
  Flashcard,
  CardSchedule,
  ReviewLog,
  CardState,
} from '@anki/types';

/**
 * Mobile app specific types
 */
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
