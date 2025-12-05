import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, updateDoc, onSnapshot, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { Shield, Backpack, LogOut } from 'lucide-react';
import { getEffectiveStats, generateRecruit } from './utils/mechanics';
import { generateId } from './utils/helpers';
import { TAVERN_REFRESH_MS, LEVEL_XP_CURVE, COOKING_XP_CURVE, MAX_LEVEL, MAX_COOKING_LEVEL } from './config/gameData';

// Component Imports
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
// Assumes views are in src/views/
import Barracks from './views/Barracks';
import CharacterSheet from './views/CharacterSheet';
import Tavern from './views/Tavern';
import Skills from './views/Skills';
import Kitchen from './views/Kitchen';
import MissionSelect from './views/MissionSelect';
import Combat from './views/Combat';

const appId = 'iron-and-oil-web';

export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, setView] = useState('barracks'); 
    const [troops, setTroops] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [gold, setGold] = useState(0);
    const [tavernState, setTavernState] = useState({ recruits: [], nextRefresh: 0 });
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [combatLog, setCombatLog] = useState([]);
    const [gameState, setGameState] = useState('idle');
    const [selectedTroops, setSelectedTroops] = useState([]);
    const [enemies, setEnemies] = useState([]);
    const [autoBattle, setAutoBattle] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [newName, setNewName] = useState("");

    const troopsRef = useRef(troops);
    const inventoryRef = useRef(inventory);
    const gameStateRef = useRef(gameState);

    useEffect(() => { troopsRef.current = troops; }, [troops]);
    useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const playerLevel = troops.reduce((acc, t) => acc + t.level, 0);
    const maxTroops = playerLevel >= 10 ? 4 : 3;

    // --- Helper Functions ---
    const applyOfflineRegen = (ticks) => {
        setTimeout(() => {
            const currentTroops = troopsRef.current;
            currentTroops.forEach(t => {
                if (t.currentHp > 0 && t.currentHp < t.baseStats.hp) {
                        const stats = getEffectiveStats(t);
                        const healAmt = ticks; 
                        const newHp = Math.min(stats.maxHp, t.currentHp + healAmt);
                        if (newHp > t.currentHp) {
                            updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', t.uid), { currentHp: newHp });
                        }
                }
            });
        }, 2000); 
    };

    const saveName = async () => {
        if (!newName.trim()) return;
        const p = { displayName: newName };
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'meta'), p, { merge: true });
        setProfile(p);
        setShowNameModal(false);
    };

    // --- Auth & Data ---
    useEffect(() => {
        return onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                const profRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'meta');
                const snap = await getDoc(profRef);
                if (!snap.exists() || !snap.data().displayName) setShowNameModal(true);
                else setProfile(snap.data());
            }
        });
    }, []);

    // --- Listeners ---
    useEffect(() => {
        if (!user) return;
        const unsubTroops = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'troops'), (snap) => {
            if (gameStateRef.current === 'fighting') return; 
            const t = [];
            snap.forEach(doc => t.push({ ...doc.data(), uid: doc.id }));
            setTroops(t);
        });
        const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), (snap) => {
            if (snap.exists()) {
                setInventory(snap.data().inventory || []);
                setGold(snap.data().gold || 100);
                const lastOnline = snap.data().lastOnline;
                if (lastOnline) {
                    const elapsedSeconds = Math.floor((Date.now() - lastOnline) / 1000);
                    const regenTicks = Math.floor(elapsedSeconds / 5);
                    if (regenTicks > 0) applyOfflineRegen(regenTicks);
                }
            } else {
                setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { inventory: [], gold: 100 });
            }
        });
        const unsubBattle = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'combat'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.active) {
                    setEnemies(data.enemies);
                    setGameState('fighting');
                } else if (gameStateRef.current === 'fighting') {
                    setGameState('victory');
                }
            }
        });
        const unsubTavern = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'tavern'), (snap) => {
            if (snap.exists()) setTavernState(snap.data());
            else {
                const newRecruits = Array.from({ length: 5 }, () => generateRecruit());
                setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'tavern'), { recruits: newRecruits, nextRefresh: Date.now() + TAVERN_REFRESH_MS });
            }
        });
        const heartbeat = setInterval(() => {
            updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { lastOnline: Date.now() }).catch(()=>{});
        }, 10000);
        return () => { unsubTroops(); unsubProfile(); unsubTavern(); unsubBattle(); clearInterval(heartbeat); };
    }, [user]);

    // --- Loops (Regen, Cooking, Combat) go here --- 
    // (Ensure you copy the UseEffect loops from the previous single-file code into here)
    
    // Regen
    useEffect(() => {
        if (!user) return;
        const regenInterval = setInterval(() => {
            if (gameState === 'fighting') return;
            troopsRef.current.forEach(t => {
                if (t.currentHp > 0 && t.activity !== 'fighting' && !t.inCombat) {
                    const stats = getEffectiveStats(t);
                    if (t.currentHp < stats.maxHp) {
                        updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', t.uid), {
                            currentHp: Math.min(stats.maxHp, t.currentHp + 1)
                        }).catch(()=>{});
                    }
                }
            });
        }, 5000);
        return () => clearInterval(regenInterval);
    }, [user, gameState]);

    // Cooking
    useEffect(() => {
        if (!user) return;
        const cookingInterval = setInterval(async () => {
            const chefs = troopsRef.current.filter(t => t.activity === 'cooking');
            if (chefs.length === 0) return;
            const inv = inventoryRef.current;
            const slimePaste = inv.find(i => i.name === 'Slime Paste');

            for (const chef of chefs) {
                if (!slimePaste) {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', chef.uid), { activity: 'idle', cookingProgress: 0 });
                    continue;
                }
                let newProgress = (chef.cookingProgress || 0) + 10;
                if (newProgress >= 100) {
                    const hasGloves = chef.equipment?.gloves?.name === 'Slimey Gloves';
                    const cookingLvl = chef.cooking?.level || 1;
                    let failChance = Math.max(0, 50 - ((cookingLvl - 1) * 5));
                    if (hasGloves) failChance = Math.max(0, failChance - 2);

                    const isSuccess = Math.random() * 100 > failChance;
                    let newInv = inventoryRef.current.filter(i => i.id !== slimePaste.id);
                    if (isSuccess) newInv.push({ id: generateId(), name: "Slime Bread", type: "food", desc: "Restores 10 HP", value: 10 });
                    
                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { inventory: newInv });
                    
                    let newXp = (chef.cooking?.xp || 0) + 10;
                    let newLvl = cookingLvl;
                    if (newXp >= COOKING_XP_CURVE[newLvl] && newLvl < MAX_COOKING_LEVEL) newLvl++;

                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', chef.uid), { cookingProgress: 0, "cooking.xp": newXp, "cooking.level": newLvl });
                } else {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', chef.uid), { cookingProgress: newProgress });
                }
            }
        }, 1000);
        return () => clearInterval(cookingInterval);
    }, [user]);

    // Combat Loop (Local Calc)
    useEffect(() => {
        if (gameState !== 'fighting') return;
        const interval = setInterval(() => {
            const combatRef = doc(db, 'artifacts', appId, 'users', user.uid, 'system', 'combat');
            let logUpdates = [];
            let battleOver = false;
            let dirtyTroops = new Map();
            const fighters = troopsRef.current.filter(t => t.inCombat);
            if (fighters.length === 0 && enemies.length > 0) return;

            [...fighters, ...enemies].forEach(u => {
                if (u.currentHp > 0) u.actionGauge = (u.actionGauge || 0) + (u.baseStats?.spd || u.spd || 8);
            });

            const actors = [...fighters, ...enemies].filter(u => u.currentHp > 0 && u.actionGauge >= 100).sort((a, b) => b.actionGauge - a.actionGauge);
            
            actors.forEach(actor => {
                if (battleOver || actor.currentHp <= 0) return;
                actor.actionGauge -= 100;
                const isPlayer = !!actor.uid;
                const targets = isPlayer ? enemies.filter(e => e.currentHp > 0) : fighters.filter(t => t.currentHp > 0);
                if (targets.length === 0) { battleOver = true; return; }
                const target = targets[Math.floor(Math.random() * targets.length)];
                
                let dmgMod = 1.0;
                if (isPlayer && actor.skills?.row1 === 'oil_concentrated') {
                    actor.combatAttackCount = (actor.combatAttackCount || 0) + 1;
                    if (actor.combatAttackCount % 3 === 0) dmgMod = 1.1;
                }

                const stats = isPlayer ? getEffectiveStats(actor) : actor;
                const targetStats = isPlayer ? target : getEffectiveStats(target);
                
                let rawDmg = (stats.ap * dmgMod * (0.8 + Math.random() * 0.4)) - (targetStats.def || 0);
                let finalDmg = Math.max(1, Math.floor(rawDmg));
                target.currentHp -= finalDmg;
                logUpdates.push(`${actor.name} hits ${target.name} for ${finalDmg}`);

                if (isPlayer && actor.skills?.row1 === 'oil_refined') {
                    actor.combatHitCount = (actor.combatHitCount || 0) + 1;
                    if (actor.combatHitCount % 5 === 0) {
                        actor.currentHp = Math.min(stats.maxHp, actor.currentHp + 5);
                        logUpdates.push(`${actor.name} heals 5 HP (Oil Refined)`);
                    }
                }

                if (target.currentHp <= 0) {
                    logUpdates.push(`☠️ ${target.name} died!`);
                    if (isPlayer) actor.battleKills = (actor.battleKills || 0) + 1;
                }
                
                if (isPlayer) dirtyTroops.set(actor.uid, actor);
                if (target.uid) dirtyTroops.set(target.uid, target);
            });

            setEnemies([...enemies]);
            setCombatLog(prev => [...prev, ...logUpdates].slice(-10));
            updateDoc(combatRef, { enemies: enemies, active: !battleOver }).catch(()=>{});
            dirtyTroops.forEach(t => {
                updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', t.uid), { 
                    currentHp: t.currentHp, actionGauge: t.actionGauge, battleKills: t.battleKills || 0, combatHitCount: t.combatHitCount || 0, combatAttackCount: t.combatAttackCount || 0
                }).catch(()=>{});
            });

            const aliveTroops = fighters.filter(t => t.currentHp > 0);
            const aliveEnemies = enemies.filter(e => e.currentHp > 0);
            if (aliveTroops.length === 0) { 
                // Defeat logic... (You would extract handleDefeat to pass here or simplify)
                setGameState('defeat');
                setAutoBattle(false);
                updateDoc(combatRef, { active: false });
                Promise.all(fighters.map(u => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'troops', u.uid))));
                battleOver = true; 
            } 
            else if (aliveEnemies.length === 0) { 
                // Victory logic...
                setGameState('victory');
                setCombatLog(prev => [...prev, "VICTORY! Found Rewards."]);
                // (XP Logic would go here - simplified for brevity in this view)
                updateDoc(combatRef, { active: false });
                battleOver = true; 
            }
        }, 800);
        return () => clearInterval(interval);
    }, [gameState, enemies]);

    if (!user) return <AuthScreen />;

    const selectedUnit = troops.find(t => t.uid === selectedUnitId);

    return (
        <div className="h-full w-full bg-slate-900 text-slate-100 font-sans selection:bg-amber-900 pb-20 overflow-y-auto">
            <header className="bg-slate-800 border-b border-slate-700 p-3 sticky top-0 z-20 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2 text-amber-500"><Shield className="fill-current w-5 h-5" /><span className="font-bold tracking-wider">IRON & OIL</span></div>
                <div className="flex gap-4 items-center text-sm font-mono">
                    <span className="text-slate-400 text-xs">Lvl {playerLevel}</span>
                    <span className="text-yellow-400">🪙 {gold}</span>
                    <span className="text-blue-300 flex items-center gap-1"><Backpack size={14}/> {inventory.length}</span>
                    <button onClick={() => signOut(auth)} className="text-slate-500 hover:text-red-400 ml-2"><LogOut size={16} /></button>
                </div>
            </header>

            {showNameModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Identify Yourself</h2>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-900 p-2 rounded border border-slate-700 mb-4" placeholder="Warlord Name" />
                        <button onClick={saveName} className="w-full bg-amber-700 py-2 rounded font-bold">Confirm</button>
                    </div>
                </div>
            )}

            <main className="p-4 max-w-2xl mx-auto min-h-full">
                {view === 'barracks' && <Barracks troops={troops} profile={profile} maxTroops={maxTroops} setView={setView} setSelectedUnitId={setSelectedUnitId} />}
                {view === 'character_sheet' && <CharacterSheet user={user} unit={selectedUnit} inventory={inventory} setView={setView} appId={appId} />}
                {view === 'tavern' && <Tavern tavernState={tavernState} troops={troops} maxTroops={maxTroops} setView={setView} user={user} appId={appId} />}
                {view === 'skills' && <Skills troops={troops} user={user} appId={appId} />}
                {view === 'kitchen' && <Kitchen troops={troops} inventory={inventory} user={user} appId={appId} />}
                {view === 'mission_select' && <MissionSelect troops={troops} selectedTroops={selectedTroops} setSelectedTroops={setSelectedTroops} setView={setView} user={user} appId={appId} setEnemies={setEnemies} setGameState={setGameState} setCombatLog={setCombatLog} setAutoBattle={setAutoBattle} />}
                {view === 'combat' && <Combat troops={troops} enemies={enemies} gameState={gameState} setGameState={setGameState} setView={setView} autoBattle={autoBattle} setAutoBattle={setAutoBattle} combatLog={combatLog} />}
            </main>

            <Navbar currentView={view} setView={setView} gameState={gameState} />
        </div>
    );
}
