import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Affirmations from './pages/Affirmations';

function App() {
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/affirmations" className="nav-link">Daily Affirmations</Link>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/affirmations" element={<Affirmations />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
