// =============================================================
//  OnlineRoom component
//  Loaded by tcg.html via:
//    <script type="text/babel" src="./js/OnlineRoom.js"></script>
//
//  Dependencies (window globals):
//    window._db, window._appId, window._fb()
//    window.Icons, window.PlayerCard, window.CardSearch
//    window.GameToolsModal, window.HistoryModal, window.MatchResultExportModal, window.CardDetailModal
//    window.fbHelpers.{ updateCommanderStat, recordDeathStats, incrementUserStats, formatTime }
// =============================================================

const OnlineRoom = ({ user, onLeave }) => {
    const Icons = window.Icons;
    const { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, deleteField, arrayUnion, runTransaction, serverTimestamp, query } = window._fb();
    const db = window._db;
    const appId = window._appId;
    const { updateCommanderStat, recordDeathStats, incrementUserStats, formatTime } = window.fbHelpers;

    const { useState, useEffect, useRef } = React;

    const [joinedRoom, setJoinedRoom] = useState(null);
    const [error, setError] = useState('');
    const [players, setPlayers] = useState([]);
    const [roomData, setRoomData] = useState(null);
    const [showCopiedToast, setShowCopiedToast] = useState(false);
    const [showCardSearch, setShowCardSearch] = useState(false);
    const [viewingCard, setViewingCard] = useState(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastMsgCountRef = useRef(0);
    const chatEndRef = useRef(null);
    const playersRef = useRef([]);
    const isJoiningRef = useRef(false);
    const lastWinnerRef = useRef(null);
    const [showToolsModal, setShowToolsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [roomLog, setRoomLog] = useState([]);
    const [showMatchResult, setShowMatchResult] = useState(false);
    const [displayTimer, setDisplayTimer] = useState("00:00:00");
    const [rooms, setRooms] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [hostName, setHostName] = useState('');
    const [hostPassword, setHostPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    const TIMEOUT_INACTIVITY = 20 * 60 * 1000;
    const TIMEOUT_DURATION = 12 * 60 * 60 * 1000;

    useEffect(() => { const storedName = localStorage.getItem('mtg_username'); if (storedName) setPlayerName(storedName); }, []);
    const updatePlayerName = (name) => { setPlayerName(name); localStorage.setItem('mtg_username', name); };
    const getMillis = (ts) => { if (!ts) return Date.now(); return ts.toMillis ? ts.toMillis() : Date.now(); };

    // Wake Lock
    useEffect(() => {
        let wakeLock = null;
        const requestWakeLock = async () => {
            try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); } } catch (err) { console.log(`${err.name}, ${err.message}`); }
        };
        async function handleVisibilityChange() { if (wakeLock !== null && document.visibilityState === 'visible') { requestWakeLock(); } }
        if (joinedRoom) { requestWakeLock(); document.addEventListener('visibilitychange', handleVisibilityChange); }
        return () => { if (wakeLock !== null) { wakeLock.release(); wakeLock = null; } document.removeEventListener('visibilitychange', handleVisibilityChange); };
    }, [joinedRoom]);

    // Room List
    useEffect(() => {
        if (joinedRoom) return;
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get('room');
        if (roomParam) setSelectedRoomId(roomParam);

        const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
        const unsub = onSnapshot(roomsRef, (snap) => {
            const r = [];
            const now = Date.now();
            snap.forEach(d => {
                const data = d.data();
                const created = getMillis(data.createdAt);
                const lastActive = getMillis(data.lastActivity);
                if (now - lastActive < TIMEOUT_INACTIVITY && now - created < TIMEOUT_DURATION) {
                    const pCount = Array.isArray(data.players) ? data.players.length : Object.keys(data.players || {}).length;
                    r.push({ id: d.id, ...data, playerCount: pCount });
                }
            });
            setRooms(r);
        });
        return () => unsub();
    }, [joinedRoom]);

    const joinRoomLogic = async (roomName, password = null) => {
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomName);
        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) { throw new Error("Room does not exist."); }
                const data = roomDoc.data();
                if (data.password && data.password !== password) { throw new Error("Incorrect Password"); }
                let currentPlayers = data.players || {};
                let isArray = Array.isArray(currentPlayers);
                const existingPlayer = isArray ? currentPlayers.find(p => p.id === user.uid) : currentPlayers[user.uid];
                if (!existingPlayer) {
                    const newPlayer = { id: user.uid, name: playerName || `Player ${Object.keys(currentPlayers).length + 1}`, life: 40, commander: null, isDead: false, poison: 0, milled: false, commanderDamage: {}, lastHeartbeat: Date.now(), isGuest: user.isAnonymous };
                    if (isArray) {
                        const map = {}; currentPlayers.forEach(p => map[p.id] = p); map[user.uid] = newPlayer;
                        transaction.update(roomRef, { players: map, lastActivity: serverTimestamp() });
                    } else {
                        transaction.update(roomRef, { [`players.${user.uid}`]: newPlayer, lastActivity: serverTimestamp() });
                    }
                }
            });
            isJoiningRef.current = true;
            setJoinedRoom(roomName);
        } catch (e) { setError(e.message); isJoiningRef.current = false; }
    };

    const createRoom = async () => {
        if (!hostName || !playerName) { setError("Room Name and Player Name are required."); return; }
        if (!user) { setError("Authenticating..."); return; }
        try {
            const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', hostName);
            const playerData = { id: user.uid, name: playerName, life: 40, commander: null, partner: null, isDead: false, poison: 0, commanderDamage: {}, milled: false, lastActive: Date.now(), lastHeartbeat: Date.now(), isGuest: user.isAnonymous };
            await setDoc(roomRef, { name: hostName, password: hostPassword, hostId: user.uid, createdAt: serverTimestamp(), lastActivity: serverTimestamp(), players: { [user.uid]: playerData }, log: [], messages: [], timer: { isRunning: false, startTime: null, offset: 0 } });
            if (playerData.commander && hostName !== "Test") updateCommanderStat(playerData.commander);
            isJoiningRef.current = true;
            setJoinedRoom(hostName);
        } catch (err) { setError(err.message); isJoiningRef.current = false; }
    };

    const joinRoom = () => {
        if (!selectedRoomId && !hostName) { setError("Select a room."); return; }
        const rName = selectedRoomId || hostName;
        if (!playerName) { setError("Enter Display Name."); return; }
        joinRoomLogic(rName, joinPassword);
    };

    const copyRoomLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(joinedRoom)}`;
        const el = document.createElement('textarea'); el.value = url; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
        setShowCopiedToast(true); setTimeout(() => setShowCopiedToast(false), 2000);
    };

    const closeRoom = async () => {
        if (!joinedRoom) return;
        await recordDeathStats(playersRef.current);
        try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom)); setJoinedRoom(null); setConfirmClose(false); }
        catch (e) { setError(e.message); }
    };

    const resetGame = async () => {
        if (!joinedRoom) return;
        try {
            const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
            const updates = {};
            playersRef.current.forEach(p => { updates[`players.${p.id}.life`] = 40; updates[`players.${p.id}.poison`] = 0; updates[`players.${p.id}.milled`] = false; updates[`players.${p.id}.commanderDamage`] = {}; updates[`players.${p.id}.isDead`] = false; });
            updates.messages = arrayUnion({ sender: "System", text: "Game has been reset.", timestamp: Date.now() });
            updates.timer = { isRunning: false, offset: 0, startTime: null };
            await updateDoc(roomRef, updates); setConfirmReset(false); lastWinnerRef.current = null;
        } catch (e) { setError(e.message); }
    };

    const sendMessage = async (customText = null, cardData = null) => {
        const textToSend = customText || chatInput.trim(); if (!textToSend) return;
        const msg = { sender: playerName, text: textToSend, timestamp: Date.now(), card: cardData };
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
        await updateDoc(roomRef, { messages: arrayUnion(msg) });
        if (!customText) setChatInput('');
    };

    const addLogEntry = async (entry) => {
        if (!joinedRoom) return;
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
        await updateDoc(roomRef, { log: arrayUnion({ timestamp: Date.now(), message: entry }) });
    };

    const handleLeaveRoom = async () => {
        if (!joinedRoom || !user) return;
        try {
            const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
            const currentList = playersRef.current;
            const remainingPlayers = currentList.filter(p => p.id !== user.uid);
            await updateDoc(roomRef, { [`players.${user.uid}`]: deleteField() });
            if (remainingPlayers.length === 0) { await deleteDoc(roomRef); }
            setJoinedRoom(null); onLeave();
        } catch (e) { console.error("Error leaving room:", e); setJoinedRoom(null); onLeave(); }
    };

    const handleKickPlayer = async (playerIdToKick) => {
        if (!joinedRoom || !isHost) return;
        try {
            const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
            await updateDoc(roomRef, { [`players.${playerIdToKick}`]: deleteField(), messages: arrayUnion({ sender: "System", text: "A player was kicked from the room.", timestamp: Date.now() }) });
        } catch (e) { console.error("Error kicking player:", e); }
    };

    const toggleOnlineTimer = async () => {
        if (!joinedRoom) return;
        const _isHost = window._db && roomData?.hostId === user.uid;
        if (!_isHost) return;
        const { doc: fbDoc, updateDoc: fbUpdateDoc, serverTimestamp: fbServerTimestamp } = window._fb();
        const roomRef = fbDoc(window._db, 'artifacts', window._appId, 'public', 'data', 'rooms', joinedRoom);
        const timer = roomData?.timer || { isRunning: false, offset: 0, startTime: null };
        if (timer.isRunning) {
            const elapsed = Date.now() - (timer.startTime?.toMillis?.() || timer.startTime || Date.now());
            await fbUpdateDoc(roomRef, { 'timer.isRunning': false, 'timer.offset': timer.offset + elapsed, 'timer.startTime': null });
        } else {
            await fbUpdateDoc(roomRef, { 'timer.isRunning': true, 'timer.startTime': fbServerTimestamp() });
        }
    };

    const resetOnlineTimer = async () => {
        if (!joinedRoom) return;
        const _isHost = window._db && roomData?.hostId === user.uid;
        if (!_isHost) return;
        const { doc: fbDoc, updateDoc: fbUpdateDoc } = window._fb();
        const roomRef = fbDoc(window._db, 'artifacts', window._appId, 'public', 'data', 'rooms', joinedRoom);
        await fbUpdateDoc(roomRef, { 'timer.isRunning': false, 'timer.offset': 0, 'timer.startTime': null });
    };

    useEffect(() => {
        if (!roomData?.timer) return;
        const { isRunning, startTime, offset } = roomData.timer;
        const update = () => {
            if (!isRunning) { setDisplayTimer(formatTime(offset)); return; }
            const start = startTime?.toMillis?.() || startTime || Date.now();
            setDisplayTimer(formatTime(Date.now() - start + offset));
        };
        update();
        if (isRunning) { const interval = setInterval(update, 1000); return () => clearInterval(interval); }
    }, [roomData?.timer]);

    const ChatMessage = ({ msg, isMyMsg, onViewCard }) => {
        const [showTooltip, setShowTooltip] = useState(false);
        if (msg.card) {
            const parts = msg.text.split(`[${msg.card.name}]`);
            if (parts.length === 2) return (
                <div className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-[var(--text-faint)] px-1 mb-0.5">{msg.sender}</div>
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words relative overflow-visible ${isMyMsg ? 'bg-[var(--accent)] text-white rounded-br-none shadow-lg shadow-purple-900/10' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-none'}`}>
                        <span>{parts[0]}</span>
                        <span className="font-bold underline decoration-dotted cursor-pointer relative inline-block theme-accent-text hover:opacity-80" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} onClick={(e) => { e.stopPropagation(); setShowTooltip(false); onViewCard(msg.card); }}>
                            {msg.card.name}
                            {showTooltip && (<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl shadow-2xl border-2 border-[var(--border)] z-50 animate-in fade-in zoom-in-95 pointer-events-none bg-[var(--bg-secondary)] overflow-hidden"><img src={msg.card.image} alt={msg.card.name} className="w-full h-auto object-cover" /></div>)}
                        </span>
                        <span>{parts[1]}</span>
                    </div>
                </div>
            );
        }
        return (
            <div className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-[var(--text-faint)] px-1 mb-0.5">{msg.sender}</div>
                <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words ${isMyMsg ? 'bg-[var(--accent)] text-white rounded-br-none shadow-lg shadow-purple-900/10' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-none'}`}>{msg.text}</div>
            </div>
        );
    };

    // Room snapshot listener
    useEffect(() => {
        if (!joinedRoom || !user) return;
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRoomData(data);
                const now = Date.now();
                const created = getMillis(data.createdAt); const lastActive = getMillis(data.lastActivity);
                if (now - lastActive > TIMEOUT_INACTIVITY) { setJoinedRoom(null); setError("Room closed (inactivity)."); return; }
                if (now - created > TIMEOUT_DURATION) { setJoinedRoom(null); setError("Room closed (12h limit)."); return; }
                const msgs = data.messages || [];
                setMessages(msgs);
                if (!showChat && msgs.length > lastMsgCountRef.current) { setUnreadCount(prev => prev + (msgs.length - lastMsgCountRef.current)); }
                lastMsgCountRef.current = msgs.length;
                setRoomLog(data.log || []);
                let currentPlayers = Array.isArray(data.players || {}) ? data.players : Object.values(data.players || {});
                const amIIn = currentPlayers.find(p => p.id === user.uid);
                if (!amIIn) { if (isJoiningRef.current) { return; } setJoinedRoom(null); setError("You have left the room."); }
                else { isJoiningRef.current = false; setPlayers(currentPlayers); playersRef.current = currentPlayers; }
            } else { setError('Room does not exist!'); setJoinedRoom(null); }
        }, (err) => setError(err.message));
        return () => unsubscribe();
    }, [joinedRoom, user, showChat]);

    useEffect(() => { if (showChat && chatEndRef.current) { chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); setUnreadCount(0); } }, [showChat, messages]);

    const updateSelf = async (updates) => {
        if (!joinedRoom) return;
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', joinedRoom);
        const newPlayers = playersRef.current.map(p => p.id === user.uid ? { ...p, ...updates } : p);
        setPlayers(newPlayers); playersRef.current = newPlayers;
        const updatePayload = {};
        Object.entries(updates).forEach(([key, val]) => { updatePayload[`players.${user.uid}.${key}`] = val; });
        updatePayload.lastActivity = serverTimestamp();
        await updateDoc(roomRef, updatePayload);
        if (updates.commander && joinedRoom !== "Test") updateCommanderStat(updates.commander);
        if (updates.partner && joinedRoom !== "Test") updateCommanderStat(updates.partner);
    };

    const isHost = roomData?.hostId === user.uid;
    const activePlayers = players.filter(p => !p.isDead);
    const winnerId = (activePlayers.length === 1 && players.length > 1) ? activePlayers[0].id : null;

    useEffect(() => {
        if (!isHost || !winnerId) return;
        if (winnerId !== lastWinnerRef.current) {
            lastWinnerRef.current = winnerId;
            incrementUserStats(winnerId, { wins: 1, gamesPlayed: 1 });
            players.forEach(p => { if (p.id !== winnerId) { incrementUserStats(p.id, { gamesPlayed: 1 }); } });
            const winnerName = players.find(p => p.id === winnerId)?.name || 'Unknown';
            sendMessage(`🏆 Game Over! ${winnerName} wins! Stats have been recorded.`, null);
            // Record full game history for all players
            window.fbHelpers?.recordGameHistory(players, winnerId, joinedRoom, displayTimer);
        }
    }, [winnerId, isHost, players]);

    // Heartbeat
    useEffect(() => {
        if (!joinedRoom) return;
        const interval = setInterval(() => { updateSelf({ lastHeartbeat: Date.now() }); }, 5000);
        return () => clearInterval(interval);
    }, [joinedRoom]);

    // Lazy-resolve modals at render-time
    const PlayerCard = window.PlayerCard;
    const CardSearch = window.CardSearch;
    const CardDetailModal = window.CardDetailModal;
    const GameToolsModal = window.GameToolsModal;
    const HistoryModal = window.HistoryModal;
    const MatchResultExportModal = window.MatchResultExportModal;

    if (joinedRoom) {
        return (
            <div className="fixed inset-0 flex flex-col bg-[var(--bg-primary)] overflow-hidden z-[60]">
                <div className="flex-none bg-[var(--bg-secondary)] border-b border-[var(--border)] shadow-xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 h-16 border-b border-[var(--border-light)]">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[var(--accent-light)] rounded-lg hidden md:block"><Icons.Wifi className="text-[var(--accent)] w-4 h-4 animate-pulse" /></div>
                            <span className="text-[var(--text-primary)] font-black tracking-tight">{joinedRoom}</span>
                            <span className="text-[var(--text-muted)] text-xs font-bold bg-[var(--bg-card)] px-2 py-0.5 rounded-full">{players.length}P</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-[var(--border-light)]">
                                <Icons.Clock className="w-4 h-4 text-[var(--text-muted)]" />
                                <span className="font-mono text-[var(--text-primary)] font-black tracking-widest text-lg">{displayTimer}</span>
                            </div>
                            {isHost && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <button onClick={toggleOnlineTimer} className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${roomData?.timer?.isRunning ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'theme-accent text-white shadow-lg shadow-purple-900/20 hover:scale-105'}`}>{roomData?.timer?.isRunning ? 'Pause' : 'Start'}</button>
                                    <button onClick={resetOnlineTimer} className="p-2 rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]"><Icons.RotateCcw className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowToolsModal(true)} className="p-2 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl border border-[var(--border)]" title="Dice & Counters"><Icons.Dices className="w-5 h-5 text-[var(--accent)]" /></button>
                            <button onClick={() => setShowHistoryModal(true)} className="p-2 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl border border-[var(--border)]" title="Game Log"><Icons.Clock className="w-5 h-5 text-[var(--accent)]" /></button>
                            <button onClick={() => { setShowChat(!showChat); if (!showChat) setUnreadCount(0); }} className="relative p-2 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl border border-[var(--border)]">
                                <Icons.MessageCircle className="w-5 h-5 text-[var(--accent)]" />
                                {unreadCount > 0 && (<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] animate-bounce" />)}
                            </button>
                            <button onClick={() => setShowCardSearch(true)} className="p-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl shadow-lg shadow-purple-900/20" title="Search Database"><Icons.Search className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] backdrop-blur-sm">
                        <div className="flex gap-2">
                            <button onClick={copyRoomLink} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-3 py-1.5 rounded-lg border border-[var(--accent-ring)] transition-all"><Icons.Share className="w-3 h-3" /> Share</button>
                            {isHost && (<>
                                <button onClick={() => { if (confirmReset) resetGame(); else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); } }} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${confirmReset ? 'bg-orange-600 text-white border-orange-500' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]'}`}><Icons.Refresh className="w-3 h-3" /> {confirmReset ? 'Confirm Reset?' : 'Reset Game'}</button>
                                <button onClick={() => { if (confirmClose) closeRoom(); else { setConfirmClose(true); setTimeout(() => setConfirmClose(false), 3000); } }} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${confirmClose ? 'bg-red-600 text-white border-red-500' : 'bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white border-red-500/30'}`}><Icons.Trash className="w-3 h-3" /> {confirmClose ? 'Confirm Close?' : 'Close Room'}</button>
                            </>)}
                        </div>
                        <div className="flex items-center gap-3">
                            {winnerId && (<button onClick={() => setShowMatchResult(true)} className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 animate-pulse hover:scale-105 transition-transform"><Icons.Share className="w-3 h-3" /> Results</button>)}
                            <button onClick={handleLeaveRoom} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg border border-[var(--border)] transition-all"><Icons.LogOut className="w-3 h-3" /> Leave</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scroll-container p-4 pb-32 flex flex-col">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1920px] mx-auto w-full auto-rows-fr">
                        {[...players].sort((a, b) => a.id.localeCompare(b.id)).map(p => (
                            <div key={p.id} className="h-full">
                                <PlayerCard {...p} isGuest={p.isGuest} players={players} isLocal={false} isWinner={p.id === winnerId} color={p.id === user.uid ? 'theme-bg-card ring-2 theme-ring shadow-2xl shadow-purple-500/10' : 'theme-bg-card shadow-xl'} canKick={isHost && p.id !== user.uid} onKick={() => handleKickPlayer(p.id)} onUpdate={(id, updates) => { if (id === user.uid) updateSelf(updates); }} onDead={(id) => { if (id === user.uid) updateSelf({ isDead: true }); }} onLog={addLogEntry} playerId={p.id} />
                            </div>
                        ))}
                    </div>
                </div>

                {showToolsModal && GameToolsModal && <GameToolsModal players={players} onClose={() => setShowToolsModal(false)} />}
                {showHistoryModal && HistoryModal && <HistoryModal log={roomLog} onClose={() => setShowHistoryModal(false)} />}
                {showMatchResult && MatchResultExportModal && (<MatchResultExportModal players={players} winnerId={winnerId} roomName={joinedRoom} duration={displayTimer} onClose={() => setShowMatchResult(false)} />)}

                {showChat && (
                    <div className="fixed top-20 right-4 w-96 max-w-[calc(100vw-2rem)] h-[70vh] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-right-4">
                        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] rounded-t-2xl"><span className="font-black text-[var(--text-primary)] text-xs uppercase tracking-widest italic">Encrypted Chat</span><button onClick={() => setShowChat(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-full"><Icons.X className="w-4 h-4 text-[var(--text-muted)]" /></button></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && <div className="text-center text-xs text-[var(--text-faint)] py-10 font-medium">No tactical transmissions yet.</div>}
                            {messages.map((m, i) => (<ChatMessage key={i} msg={m} isMyMsg={m.sender === playerName} onViewCard={setViewingCard} />))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-elevated)]/50 rounded-b-2xl flex gap-2">
                            <input className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 placeholder:text-[var(--text-faint)]" placeholder="Type message..." value={chatInput} onChange={e => e.target.value && setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                            <button onClick={sendMessage} className="p-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-900/20 active:scale-95 transition-all"><Icons.Send className="w-5 h-5" /></button>
                        </div>
                    </div>
                )}

                {showCardSearch && CardSearch && <CardSearch onSelect={(card) => { setViewingCard(card); setShowCardSearch(false); sendMessage(`I found [${card.name}]`, card); }} onClose={() => setShowCardSearch(false)} mode="any" />}
                {viewingCard && CardDetailModal && <CardDetailModal card={viewingCard} onClose={() => setViewingCard(null)} />}
                {showCopiedToast && (<div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2.5 rounded-full shadow-2xl z-[100] animate-in slide-in-from-top-4 font-bold text-sm tracking-tight border border-green-400">Tactical Link Copied!</div>)}
            </div>
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-y-auto scroll-container pb-24">
            <button onClick={() => setShowCardSearch(true)} className="absolute top-4 right-4 md:right-8 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] p-2 rounded-full shadow-lg border border-[var(--border)] transition-colors z-20 flex items-center gap-2 px-4 focus:ring-2 focus:ring-[var(--accent)]">
                <Icons.Search className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-bold">Card Database</span>
            </button>

            {showCardSearch && CardSearch && <CardSearch onSelect={(card) => { setViewingCard(card); setShowCardSearch(false); }} onClose={() => setShowCardSearch(false)} mode="any" />}
            {viewingCard && CardDetailModal && <CardDetailModal card={viewingCard} onClose={() => setViewingCard(null)} />}

            <div className="max-w-4xl mx-auto w-full space-y-8 mt-12 md:mt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[var(--accent)]/20 rounded-xl"><Icons.Users className="w-8 h-8 text-[var(--accent)]" /></div>
                        <div><h2 className="text-2xl font-bold text-[var(--text-primary)]">Multiplayer Lobby</h2><p className="text-[var(--text-muted)] text-sm">Join a game or host your own.</p></div>
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-[var(--text-faint)] uppercase mb-1 ml-1">Your Display Name</label>
                        <input type="text" placeholder="Enter Your Name..." className="w-full md:w-64 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] p-3 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none font-bold transition-all" value={playerName} onChange={(e) => updatePlayerName(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2"><Icons.Wifi className="w-5 h-5 text-green-500" /> Active Rooms</h3>
                        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] overflow-hidden min-h-[300px] flex flex-col shadow-inner">
                            {rooms.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-faint)] p-8"><p>No active rooms found.</p><p className="text-sm">Be the first to host one!</p></div>
                            ) : (
                                <div className="divide-y divide-[var(--border)]">
                                    {rooms.map(room => (
                                        <div key={room.id} onClick={() => { setSelectedRoomId(room.id); setHostName(''); }} className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedRoomId === room.id ? 'bg-[var(--accent)]/10 border-l-4 border-[var(--accent)]' : 'hover:bg-[var(--bg-elevated)] border-l-4 border-transparent'}`}>
                                            <div><div className="font-bold text-[var(--text-primary)]">{room.name}</div><div className="text-xs text-[var(--text-faint)]">{room.playerCount || 0} Players</div></div>
                                            <div className="flex items-center gap-3">
                                                {room.password && <Icons.Lock className="w-4 h-4 text-orange-400" />}
                                                {!room.password && <Icons.Unlock className="w-4 h-4 text-green-400/50" />}
                                                <Icons.User className="w-5 h-5 text-[var(--text-faint)]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {selectedRoomId && (
                            <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--accent)]/50 shadow-2xl shadow-[var(--accent-ring)] animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Join "{selectedRoomId}"</h3>
                                <div className="space-y-4">
                                    {rooms.find(r => r.id === selectedRoomId)?.password && (
                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 block">Room Password</label>
                                            <input type="password" placeholder="Required" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-[var(--accent)]" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} />
                                        </div>
                                    )}
                                    <button onClick={joinRoom} disabled={!user || !playerName} className="w-full theme-accent hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20">Join Game</button>
                                </div>
                            </div>
                        )}

                        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] shadow-lg">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Host New Room</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-faint)] uppercase mb-1 block">Room Name</label>
                                    <input type="text" placeholder="e.g. Friday Night Magic" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-[var(--accent)] transition-all font-bold" value={hostName} onChange={(e) => { setHostName(e.target.value); setSelectedRoomId(null); }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-faint)] uppercase mb-1 block">Password (Optional)</label>
                                    <input type="text" placeholder="Leave empty for open room" className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-[var(--accent)] transition-all font-bold" value={hostPassword} onChange={(e) => setHostPassword(e.target.value)} />
                                </div>
                                <button onClick={createRoom} disabled={!user || !hostName || !playerName} className="w-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] font-bold py-3 rounded-xl transition-all border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed shadow-md">Create &amp; Host</button>
                            </div>
                        </div>
                    </div>
                </div>
                {error && <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-xl text-center font-bold animate-pulse">{error}</div>}
            </div>
        </div>
    );
};

window.OnlineRoom = OnlineRoom;
