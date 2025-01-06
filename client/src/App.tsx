import './App.css';
import Search from './components/SearchComponent/Search';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />

      </Routes>
    </Router>

  );
};

export default App;


// client/src/App.tsx
