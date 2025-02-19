import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Connect from './components/SearchComponent/RealDebrid/Connect';
import Search from './components/SearchComponent/Search';
import Player from './components/PlayerComponent/Player';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Connect />} />
        <Route path="/home" element={<Search />} />
        <Route path="/player" element={<Player />} />
      </Routes>
    </Router>

  );
};

export default App;


// client/src/App.tsx
