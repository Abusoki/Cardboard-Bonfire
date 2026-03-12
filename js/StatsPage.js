// =============================================================
//  StatsPage component
//  Loaded by tcg.html via:
//    <script type="text/babel" src="./js/StatsPage.js"></script>
//
//  Dependencies (window globals set by main module):
//    window._db, window._appId, window._fb
//    window.Icons, window.StatsExportModal (set after StatsExportModal defined)
// =============================================================

const StatsPage = ({ user }) => {
    const Icons = window.Icons;

    const { collection, onSnapshot, doc, query, orderBy, limit } = window._fb();
    const db = window._db;
    const appId = window._appId;

    const [stats, setStats] = React.useState({ topCommanders: [], topCommander: null, deathStats: null, leaderboard: [] });
    const [loading, setLoading] = React.useState(true);
    const [showExportModal, setShowExportModal] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;

        const commandersRef = collection(db, 'artifacts', appId, 'public', 'data', 'commander_stats');
        const unsubscribeCommanders = onSnapshot(commandersRef, (snapshot) => {
            const commanders = [];
            snapshot.forEach(doc => commanders.push(doc.data()));
            const sortedCommanders = commanders.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
            setStats(prev => ({
                ...prev,
                topCommanders: sortedCommanders,
                topCommander: sortedCommanders.length > 0 ? sortedCommanders[0] : null
            }));
        });

        const deathStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'global_stats', 'deaths');
        const unsubscribeDeaths = onSnapshot(deathStatsRef, (docSnap) => {
            setStats(prev => ({ ...prev, deathStats: docSnap.data() }));
        });

        const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
        const q = query(usersRef, orderBy('stats.gamesPlayed', 'desc'), limit(3));
        const unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
            const leaders = [];
            snapshot.forEach(doc => leaders.push({ id: doc.id, ...doc.data() }));
            setStats(prev => ({ ...prev, leaderboard: leaders }));
            if (loading) setLoading(false);
        });

        return () => { unsubscribeCommanders(); unsubscribeDeaths(); unsubscribeLeaderboard(); };
    }, [user]);

    if (loading) return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Loading Stats...</div>;

    const StatsExportModal = window.StatsExportModal;

    return (
        <div className="absolute inset-0 p-8 overflow-y-auto scroll-container pb-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Icons.BarChart2 className="w-8 h-8 text-purple-500" /> Global Stats</h1>
                    <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-purple-700/60 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-xl transition-colors border border-purple-500/50 text-sm">
                        <Icons.Share className="w-4 h-4" /> Export Card
                    </button>
                </div>
                {showExportModal && StatsExportModal && <StatsExportModal user={user} stats={stats} onClose={() => setShowExportModal(false)} />}

                {/* Leaderboard */}
                <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"><Icons.Crown className="w-5 h-5 text-yellow-400" /> Most Dedicated Players</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.leaderboard.map((player, i) => (
                            <div key={player.id} className={`p-4 rounded-xl border flex items-center gap-4 relative overflow-hidden ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}>
                                <div className={`text-4xl font-black opacity-20 absolute right-2 top-0 pointer-events-none ${i === 0 ? 'text-yellow-500' : 'text-[var(--text-faint)]'}`}>#{i + 1}</div>
                                <div className="w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                                    {player.favoriteCommander ? <img src={player.favoriteCommander.image} className="w-full h-full rounded-full object-cover" /> : <Icons.User className="w-6 h-6 text-[var(--text-faint)]" />}
                                </div>
                                <div>
                                    <div className="font-bold text-[var(--text-primary)] truncate max-w-[150px]">{player.displayName || 'Anonymous'}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-bold uppercase">{player.stats?.gamesPlayed || 0} Games</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Death Stats */}
                {stats.deathStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex flex-col items-center">
                            <Icons.Skull className="w-6 h-6 text-red-500 mb-2" />
                            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.deathStats.standard || 0}</div>
                            <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider">Combat/Life</div>
                        </div>
                        <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex flex-col items-center">
                            <Icons.Sword className="w-6 h-6 text-orange-500 mb-2" />
                            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.deathStats.commander || 0}</div>
                            <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider">Commander Dmg</div>
                        </div>
                        <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex flex-col items-center">
                            <Icons.Droplet className="w-6 h-6 text-green-500 mb-2" />
                            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.deathStats.poison || 0}</div>
                            <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider">Poison</div>
                        </div>
                        <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex flex-col items-center">
                            <Icons.Book className="w-6 h-6 text-blue-500 mb-2" />
                            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.deathStats.milled || 0}</div>
                            <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider">Milled Out</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] backdrop-blur-sm">
                        <h2 className="text-xl font-semibold theme-accent-text mb-6 flex items-center justify-between">
                            <span>Top 5 Commanders</span>
                            <span className="text-xs font-normal text-[var(--text-faint)] bg-[var(--bg-card)] px-2 py-1 rounded-full">All Time</span>
                        </h2>
                        <div className="space-y-4">
                            {stats.topCommanders.length === 0 ? (
                                <div className="text-[var(--text-faint)] text-center py-10">No stats recorded yet. Play a game!</div>
                            ) : (
                                stats.topCommanders.map((cmd, index) => (
                                    <div key={cmd.name} className="flex items-center gap-4 p-3 bg-[var(--bg-card)]/50 rounded-xl hover:bg-[var(--bg-elevated)] transition-all border border-transparent hover:border-[var(--accent)]/30 group">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-[var(--text-faint)] text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{index + 1}</div>
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-black shrink-0">
                                            <img src={cmd.image} alt={cmd.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[var(--text-primary)] font-medium truncate">{cmd.name}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{cmd.count} plays</div>
                                        </div>
                                        {index === 0 && <Icons.Crown className="w-5 h-5 text-yellow-500" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border-4 border-[var(--border)] min-h-[400px] flex items-center justify-center bg-[var(--bg-secondary)]">
                        {stats.topCommander ? (
                            <>
                                <img src={stats.topCommander.image} alt={stats.topCommander.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent opacity-90"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-8">
                                    <div className="flex items-center gap-2 text-yellow-500 mb-2 font-bold tracking-wider text-sm uppercase">
                                        <Icons.Crown className="w-4 h-4" />
                                        Most Popular Commander
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-tight drop-shadow-lg">{stats.topCommander.name}</h2>
                                    <div className="mt-4 inline-flex items-center gap-2 bg-[var(--accent)]/90 text-white px-4 py-2 rounded-full backdrop-blur-md font-medium shadow-lg">
                                        {stats.topCommander.count} Total Picks
                                    </div>
                                </div>
                                {stats.topCommander.artist && (
                                    <div className="absolute bottom-2 right-2 text-[10px] text-white/40 font-medium text-right leading-tight z-10">
                                        <div>Art by {stats.topCommander.artist}</div>
                                        <div>™ &amp; © Wizards of the Coast</div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-[var(--text-faint)] gap-4">
                                <Icons.Shield className="w-20 h-20 opacity-20" />
                                <p>Play games to reveal the top commander!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.StatsPage = StatsPage;
