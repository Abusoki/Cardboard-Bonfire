// src/views/Barracks.jsx
import React from 'react';
import { Heart, Sword } from 'lucide-react';
import { getEffectiveStats } from '../utils/mechanics';
import CharacterCard from '../components/CharacterCard'; // Reusable component

export default function Barracks({ troops, onRecruitClick }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
         <h2>Roster</h2>
         <button onClick={onRecruitClick}>Recruit</button>
      </div>
      <div className="grid gap-3">
        {troops.map(t => (
           <CharacterCard key={t.uid} unit={t} /> 
        ))}
      </div>
    </div>
  );
}
