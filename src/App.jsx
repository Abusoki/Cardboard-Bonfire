// src/App.jsx
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameData } from './hooks/useGameData'; // Fetches troops/inventory
import { useGameLoop } from './hooks/useGameLoop';

// Views
import AuthScreen from './views/AuthScreen';
import Barracks from './views/Barracks';
import Combat from './views/Combat';
import Navbar from './components/Navbar';

export default function App() {
  const { user } = useAuth();
  const { troops, inventory, gold } = useGameData(user); // Custom hook handling onSnapshot
  const [view, setView] = useState('barracks');

  // Activate game logic
  useGameLoop(user, troops);

  if (!user) return <AuthScreen />;

  return (
    <div className="app-container">
      <Header gold={gold} />
      
      <main>
        {view === 'barracks' && <Barracks troops={troops} />}
        {view === 'combat' && <Combat troops={troops} />}
        {/* ... other views ... */}
      </main>

      <Navbar currentView={view} setView={setView} />
    </div>
  );
}
