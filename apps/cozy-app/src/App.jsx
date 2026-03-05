import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Cozy App</h1>
      <p>Welcome to Cozy App.</p>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
    </div>
  );
}

export default App;
