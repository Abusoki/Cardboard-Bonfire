// =============================================================
//  Firebase Helper Functions
//  Loaded by tcg.html via:
//    <script type="text/babel" src="./js/firebase-helpers.js"></script>
//
//  All functions reference window._db, window._appId, window._fb()
//  directly — no intermediate closures that could be affected by
//  Babel's eval-based script execution scope.
// =============================================================

const updateCommanderStat = async (commander) => {
    if (!commander || !commander.name) return;
    const { doc, setDoc, increment, serverTimestamp } = window._fb();
    const statRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'commander_stats', commander.name);
    try {
        await setDoc(statRef, {
            name: commander.name,
            image: commander.image,
            fullImage: commander.fullImage,
            artist: commander.artist || 'Unknown',
            count: increment(1),
            lastPlayed: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("Error updating commander stats:", e);
    }
};

const recordDeathStats = async (players) => {
    if (!players || players.length === 0) return;
    const deaths = { poison: 0, commander: 0, milled: 0, standard: 0 };
    players.forEach(p => {
        if (p.isDead) {
            if (p.milled) deaths.milled++;
            else if (p.poison >= 10) deaths.poison++;
            else if (Object.values(p.commanderDamage || {}).some(d => d >= 21)) deaths.commander++;
            else deaths.standard++;
        }
    });
    if (Object.values(deaths).some(v => v > 0)) {
        const { doc, setDoc, increment } = window._fb();
        const statsRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'global_stats', 'deaths');
        try {
            await setDoc(statsRef, {
                poison: increment(deaths.poison),
                commander: increment(deaths.commander),
                milled: increment(deaths.milled),
                standard: increment(deaths.standard)
            }, { merge: true });
        } catch (e) {
            console.error("Error saving death stats:", e);
        }
    }
};

const formatTime = (ms) => {
    if (!ms || isNaN(ms)) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const getUserProfile = async (uid) => {
    const { doc, getDoc } = window._fb();
    const docRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
};

const updateUserProfile = async (uid, data) => {
    const { doc, setDoc, serverTimestamp } = window._fb();
    const docRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', uid);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

const incrementUserStats = async (uid, { wins = 0, gamesPlayed = 0 }) => {
    const { doc, setDoc, increment, serverTimestamp } = window._fb();
    const docRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', uid);
    await setDoc(docRef, {
        stats: { wins: increment(wins), gamesPlayed: increment(gamesPlayed) },
        lastActive: serverTimestamp()
    }, { merge: true });
};

const followUser = async (currentUid, targetUid) => {
    if (!currentUid || !targetUid || currentUid === targetUid) return;
    const { doc, writeBatch, arrayUnion } = window._fb();
    const batch = writeBatch(window._db);
    batch.set(doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', currentUid), { following: arrayUnion(targetUid) }, { merge: true });
    batch.set(doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', targetUid), { followers: arrayUnion(currentUid) }, { merge: true });
    await batch.commit();
};

const unfollowUser = async (currentUid, targetUid) => {
    if (!currentUid || !targetUid) return;
    const { doc, writeBatch, arrayRemove } = window._fb();
    const batch = writeBatch(window._db);
    batch.update(doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', currentUid), { following: arrayRemove(targetUid) });
    batch.update(doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', targetUid), { followers: arrayRemove(currentUid) });
    await batch.commit();
};

window.fbHelpers = {
    updateCommanderStat,
    recordDeathStats,
    formatTime,
    getUserProfile,
    updateUserProfile,
    incrementUserStats,
    followUser,
    unfollowUser,
};
