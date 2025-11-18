import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import DecksScreen from './screens/DecksScreen';
import DeckDetailScreen from './screens/DeckDetailScreen';
import ReviewScreen from './screens/ReviewScreen';
import UploadScreen from './screens/UploadScreen';
import OrganizeScreen from './screens/OrganizeScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/decks" element={<DecksScreen />} />
        <Route path="/decks/:deckId" element={<DeckDetailScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/upload" element={<UploadScreen />} />
        <Route path="/organize" element={<OrganizeScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
