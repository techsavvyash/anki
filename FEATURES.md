# Custom Notes and Hierarchical Organization - Implementation Guide

This document describes the new features added to the Anki flashcard app: **Custom Notes for Cards** and **Hierarchical Organization (Subject → Topic → Deck)**.

## ✅ Backend Implementation (COMPLETE)

The backend is fully implemented with database schema, storage layer, and REST API endpoints.

### Database Schema

#### Subjects Table
```sql
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#007AFF',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Topics Table
```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Card Notes Table
```sql
CREATE TABLE card_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, card_id)
);
```

#### Updated Decks Table
```sql
ALTER TABLE decks ADD COLUMN topic_id TEXT REFERENCES topics(id);
```

## 📡 API Endpoints

### Subject Endpoints

**Create Subject**
```http
POST /subjects
Headers: X-User-ID: {user_id}
Body: {
  "name": "Languages",
  "description": "Language learning materials",
  "color": "#FF6B6B"
}
Response: 201 Created
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Languages",
  "description": "Language learning materials",
  "color": "#FF6B6B",
  "created_at": "2025-11-12T..."
}
```

**Get All Subjects**
```http
GET /subjects
Headers: X-User-ID: {user_id}
Response: 200 OK
[
  {
    "id": "uuid",
    "name": "Languages",
    "color": "#FF6B6B",
    ...
  },
  ...
]
```

**Update Subject**
```http
PUT /subjects/{id}
Body: {
  "name": "Updated Name",
  "description": "Updated description",
  "color": "#00D9FF"
}
```

**Delete Subject**
```http
DELETE /subjects/{id}
Response: 200 OK
```

### Topic Endpoints

**Create Topic**
```http
POST /topics
Headers: X-User-ID: {user_id}
Body: {
  "subject_id": "uuid",
  "name": "Spanish Vocabulary",
  "description": "Common words and phrases"
}
```

**Get All Topics for User**
```http
GET /topics
Headers: X-User-ID: {user_id}
```

**Get Topics for Subject**
```http
GET /subjects/{subject_id}/topics
```

**Update Topic**
```http
PUT /topics/{id}
Body: {
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Delete Topic**
```http
DELETE /topics/{id}
```

### Deck-Topic Association

**Assign Deck to Topic**
```http
PUT /decks/{deck_id}/topic
Body: {
  "topic_id": "uuid"  // or "" to remove assignment
}
```

### Card Note Endpoints

**Save/Update Note**
```http
POST /cards/{card_id}/note
Headers: X-User-ID: {user_id}
Body: {
  "note": "This is my personal note about this card"
}
Response: 200 OK
{
  "id": "uuid",
  "user_id": "uuid",
  "card_id": "uuid",
  "note": "This is my personal note about this card",
  "created_at": "...",
  "updated_at": "..."
}
```

**Get Note**
```http
GET /cards/{card_id}/note
Headers: X-User-ID: {user_id}
Response: 200 OK
{
  "note": "This is my personal note about this card",
  ...
}
// Or if no note exists:
{
  "note": ""
}
```

**Delete Note**
```http
DELETE /cards/{card_id}/note
Headers: X-User-ID: {user_id}
```

## 🎯 Use Cases

### 1. Hierarchical Organization

**Example Structure:**
```
📚 Languages (Subject - Color: #FF6B6B)
   ├── 📖 Spanish (Topic)
   │   ├── 📇 Spanish Vocabulary Deck
   │   └── 📇 Spanish Grammar Deck
   └── 📖 French (Topic)
       └── 📇 French Basics Deck

🏥 Medicine (Subject - Color: #4ECDC4)
   ├── 📖 Anatomy (Topic)
   │   └── 📇 Human Anatomy Deck
   └── 📖 Pharmacology (Topic)
       └── 📇 Drug Names Deck
```

### 2. Custom Notes

**During Review:**
```
Card Front: "Hola"
Card Back: "Hello"

User Note: "Remember: 'Hola' is informal. Use 'Buenos días' in formal settings."
```

## 🎨 Frontend Implementation Guide

### Types (Already Added)

```typescript
// mobile/src/types/index.ts
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

export interface CardNote {
  id: string;
  user_id: string;
  card_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}
```

### API Client Methods (To Add)

Add these methods to `mobile/src/api/client.ts`:

```typescript
// Subjects
async createSubject(name: string, description: string, color: string) {
  const response = await this.client.post('/subjects', {
    name,
    description,
    color
  });
  return response.data;
}

async getSubjects() {
  const response = await this.client.get('/subjects');
  return response.data;
}

async updateSubject(id: string, name: string, description: string, color: string) {
  const response = await this.client.put(`/subjects/${id}`, {
    name,
    description,
    color
  });
  return response.data;
}

async deleteSubject(id: string) {
  await this.client.delete(`/subjects/${id}`);
}

// Topics
async createTopic(subjectId: string, name: string, description: string) {
  const response = await this.client.post('/topics', {
    subject_id: subjectId,
    name,
    description
  });
  return response.data;
}

async getTopics() {
  const response = await this.client.get('/topics');
  return response.data;
}

async getSubjectTopics(subjectId: string) {
  const response = await this.client.get(`/subjects/${subjectId}/topics`);
  return response.data;
}

async updateTopic(id: string, name: string, description: string) {
  const response = await this.client.put(`/topics/${id}`, {
    name,
    description
  });
  return response.data;
}

async deleteTopic(id: string) {
  await this.client.delete(`/topics/${id}`);
}

async updateDeckTopic(deckId: string, topicId: string) {
  await this.client.put(`/decks/${deckId}/topic`, {
    topic_id: topicId
  });
}

// Card Notes
async saveCardNote(cardId: string, note: string) {
  const response = await this.client.post(`/cards/${cardId}/note`, {
    note
  });
  return response.data;
}

async getCardNote(cardId: string) {
  const response = await this.client.get(`/cards/${cardId}/note`);
  return response.data;
}

async deleteCardNote(cardId: string) {
  await this.client.delete(`/cards/${cardId}/note`);
}
```

### UI Screens to Create

#### 1. SubjectsScreen.tsx
- List all subjects with color indicators
- Create new subject button
- Edit/delete subject options
- Tap subject to view topics

#### 2. SubjectDetailScreen.tsx
- Show topics within a subject
- Create new topic button
- Edit/delete topic options
- Show decks within each topic

#### 3. Card Notes in ReviewScreen
Add to `ReviewScreen.tsx`:

```typescript
const [cardNote, setCardNote] = useState('');
const [showNoteInput, setShowNoteInput] = useState(false);

// Load note when card changes
useEffect(() => {
  loadCardNote();
}, [currentCard]);

const loadCardNote = async () => {
  if (!currentCard) return;
  try {
    const note = await apiClient.getCardNote(currentCard.id);
    setCardNote(note.note || '');
  } catch (error) {
    console.error('Failed to load note:', error);
  }
};

const saveNote = async () => {
  if (!currentCard) return;
  try {
    await apiClient.saveCardNote(currentCard.id, cardNote);
    setShowNoteInput(false);
  } catch (error) {
    console.error('Failed to save note:', error);
    Alert.alert('Error', 'Failed to save note');
  }
};

// UI Elements
<TouchableOpacity onPress={() => setShowNoteInput(!showNoteInput)}>
  <Text>📝 {cardNote ? 'Edit Note' : 'Add Note'}</Text>
</TouchableOpacity>

{showNoteInput && (
  <TextInput
    value={cardNote}
    onChangeText={setCardNote}
    multiline
    placeholder="Add your personal note..."
    style={styles.noteInput}
  />
  <Button title="Save Note" onPress={saveNote} />
)}

{cardNote && !showNoteInput && (
  <View style={styles.noteDisplay}>
    <Text style={styles.noteLabel}>Your Note:</Text>
    <Text style={styles.noteText}>{cardNote}</Text>
  </View>
)}
```

#### 4. Enhanced DecksScreen
Update to show organization:

```typescript
// Group decks by subject/topic
const organizedDecks = useMemo(() => {
  const organized = {};

  subjects.forEach(subject => {
    organized[subject.id] = {
      subject,
      topics: {}
    };

    topics
      .filter(t => t.subject_id === subject.id)
      .forEach(topic => {
        organized[subject.id].topics[topic.id] = {
          topic,
          decks: decks.filter(d => d.topic_id === topic.id)
        };
      });
  });

  return organized;
}, [subjects, topics, decks]);

// Render with collapsible sections
```

### Navigation Updates

Update `App.tsx` to include new screens:

```typescript
<Stack.Screen
  name="Subjects"
  component={SubjectsScreen}
  options={{ title: 'Organize by Subject' }}
/>
<Stack.Screen
  name="SubjectDetail"
  component={SubjectDetailScreen}
/>
<Stack.Screen
  name="TopicDetail"
  component={TopicDetailScreen}
/>
```

## 🎨 UI Design Suggestions

### Subject Cards
```
┌─────────────────────────────────┐
│ ● Languages             📚       │
│   5 topics • 12 decks            │
│   Language learning materials    │
└─────────────────────────────────┘
  (Color bar on left)
```

### Topic List
```
Languages
  ├─ Spanish (3 decks)
  ├─ French (2 decks)
  └─ German (1 deck)
```

### Card Note Display
```
┌─────────────────────────────────┐
│ Q: What is "Hola"?              │
│ A: Hello                         │
├─────────────────────────────────┤
│ 📝 Your Note:                    │
│ Remember: informal greeting!     │
│ Use "Buenos días" formally      │
└─────────────────────────────────┘
```

## 🚀 Implementation Priority

1. **High Priority** (Core features):
   - Add card notes to ReviewScreen
   - Update API client with new methods

2. **Medium Priority** (Organization):
   - Create SubjectsScreen
   - Create Subject/Topic management dialogs
   - Update DecksScreen to show hierarchy

3. **Nice to Have** (Polish):
   - Drag-and-drop deck assignment
   - Bulk deck organization
   - Subject color picker
   - Search and filter by subject/topic

## 📝 Testing

1. **Create a subject**: POST to `/subjects` with name and color
2. **Create topics**: POST to `/topics` for each subject
3. **Assign decks**: PUT to `/decks/{id}/topic`
4. **Add notes during review**: POST to `/cards/{id}/note`
5. **Verify hierarchy**: GET `/subjects`, `/topics`, `/decks`

## 🎯 Next Steps

The backend is complete and ready to use! To finish the implementation:

1. Add API client methods to `mobile/src/api/client.ts`
2. Create SubjectsScreen and SubjectDetailScreen
3. Add note input to ReviewScreen
4. Update DecksScreen to show subject/topic hierarchy
5. Add navigation links from HomeScreen to Subjects

All the backend infrastructure is in place and tested!
