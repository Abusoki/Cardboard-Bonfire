// =============================================================
//  ProfilePage component
//  Loaded by tcg.html via:
//    <script type="text/babel" src="./js/ProfilePage.js"></script>
//
//  Dependencies (window globals set by main module):
//    window._db, window._appId, window._fb, window._auth
//    window.Icons, window.MTG_IDENTITIES, window.IdentityIcon
//    window.fbHelpers.{ getUserProfile, updateUserProfile, followUser, unfollowUser }
//    window.CardSearch (set after CardSearch defined in main module)
// =============================================================

// --- Helper modal: Followers / Following list with avatars + online presence ---
const SocialListModal = ({ label, uids, Icons, onClose, onVisitProfile }) => {
    const [profiles, setProfiles] = React.useState({});
    React.useEffect(() => {
        if (!uids || uids.length === 0 || !window.fbHelpers) return;
        const { getUserProfile } = window.fbHelpers;
        uids.forEach(uid => {
            getUserProfile(uid).then(data => {
                if (data) setProfiles(prev => ({ ...prev, [uid]: data }));
            }).catch(() => {});
        });
    }, [uids]);

    const isOnline = (p) => {
        if (!p?.lastSeen) return false;
        const ms = p.lastSeen?.toMillis ? p.lastSeen.toMillis() : (p.lastSeen || 0);
        return Date.now() - ms < 5 * 60 * 1000;
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-sm rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Icons.Users className="w-4 h-4 text-[var(--accent)]" /> {label} ({uids.length})
                    </h3>
                    <button onClick={onClose}><Icons.X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" /></button>
                </div>
                <div className="max-h-80 overflow-y-auto scroll-container divide-y divide-[var(--border-light)]">
                    {uids.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-faint)] text-sm">No one here yet.</div>
                    ) : uids.map(uid => {
                        const p = profiles[uid];
                        const loaded = p !== undefined;
                        const online = isOnline(p);
                        const avatar = p?.favoriteCommander?.image;

                        // Shimmer skeleton while profile is loading
                        if (!loaded) return (
                            <div key={uid} className="flex items-center gap-3 p-4 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-[var(--bg-elevated)] rounded-full w-2/3" />
                                    <div className="h-2.5 bg-[var(--bg-elevated)] rounded-full w-1/3" />
                                </div>
                            </div>
                        );

                        return (
                            <button key={uid} onClick={() => onVisitProfile(uid)}
                                className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-elevated)] transition-colors text-left group">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--accent)]/20 flex items-center justify-center border border-[var(--border)]">
                                        {avatar
                                            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                                            : <Icons.User className="w-5 h-5 text-[var(--accent)]" />}
                                    </div>
                                    {online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[var(--bg-secondary)] rounded-full" title="Online" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                                        {p?.displayName || 'Unknown Player'}
                                        {online && <span className="ml-2 text-[10px] text-green-400 font-bold">● Online</span>}
                                    </div>
                                    {p?.stats && (
                                        <div className="text-xs text-[var(--text-faint)]">
                                            {p.stats.wins || 0}W · {p.stats.gamesPlayed || 0} games
                                        </div>
                                    )}
                                </div>
                                <Icons.ChevronRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- User Search component ---
const UserSearch = ({ Icons, onVisitProfile }) => {
    const [query, setQuery] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState(null); // { found: bool, uid, profile }

    const handleSearch = async (e) => {
        e.preventDefault();
        const cleanId = query.trim().toLowerCase();
        if (!cleanId || cleanId.length < 2) return;
        setLoading(true);
        setResult(null);
        try {
            const { doc, getDoc } = window._fb();
            const usernameRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'usernames', cleanId);
            const usernameSnap = await getDoc(usernameRef);
            if (usernameSnap.exists()) {
                const uid = usernameSnap.data().uid;
                const profile = await window.fbHelpers.getUserProfile(uid);
                setResult({ found: true, uid, profile });
            } else {
                setResult({ found: false });
            }
        } catch (e) {
            console.error('User search error:', e);
            setResult({ found: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Icons.Search className="w-5 h-5 text-[var(--accent)]" /> Find Players
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] outline-none text-sm"
                />
                <button type="submit" disabled={loading} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 transition-all">
                    {loading ? '...' : 'Search'}
                </button>
            </form>
            {result && (
                <div className="mt-4">
                    {!result.found ? (
                        <div className="text-sm text-[var(--text-faint)] text-center py-3">No player found with that username.</div>
                    ) : (
                        <button onClick={() => onVisitProfile(result.uid)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors group text-left border border-[var(--border)]">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--accent)]/20 border border-[var(--border)] shrink-0 flex items-center justify-center">
                                {result.profile?.favoriteCommander?.image
                                    ? <img src={result.profile.favoriteCommander.image} alt="" className="w-full h-full object-cover" />
                                    : <Icons.User className="w-6 h-6 text-[var(--accent)]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{result.profile?.displayName || result.uid}</div>
                                <div className="text-xs text-[var(--text-faint)]">{result.profile?.stats?.wins || 0}W · {result.profile?.stats?.gamesPlayed || 0} games</div>
                            </div>
                            <Icons.ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--accent)]" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const ProfilePage = ({ user, viewProfileId = null, onBack = null }) => {

    const [profile, setProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [editing, setEditing] = React.useState(false);
    const [formData, setFormData] = React.useState({ displayName: '', favoriteColor: 'Colorless' });
    const [showCmdrSearch, setShowCmdrSearch] = React.useState(false);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [resolvedUid, setResolvedUid] = React.useState(null);
    const [notFound, setNotFound] = React.useState(false);
    const [showCopied, setShowCopied] = React.useState(false);
    const [showSocialList, setShowSocialList] = React.useState(null); // { label, list: [uid, ...] }

    React.useEffect(() => {
        const resolveAndLoad = async () => {
            setLoading(true);
            setNotFound(false);
            let target = viewProfileId;
            try {
                // Guard: ensure firebase helpers and globals are ready
                if (!window.fbHelpers || !window._db || !window._fb) {
                    console.error("ProfilePage: Firebase not ready yet");
                    return; // stays loading, but in practice this shouldn't happen
                }
                const { getUserProfile } = window.fbHelpers;

                if (!target) {
                    if (user) target = user.uid;
                    else return;
                }

                if (target.length !== 28 && target !== user?.uid) {
                    try {
                        const { doc: fbDoc, getDoc: fbGetDoc } = window._fb();
                        const usernameDoc = await fbGetDoc(fbDoc(window._db, 'artifacts', window._appId, 'public', 'data', 'usernames', target.toLowerCase()));
                        if (usernameDoc.exists()) {
                            target = usernameDoc.data().uid;
                        }
                    } catch (e) { console.error("Username lookup failed", e); }
                }

                setResolvedUid(target);

                const data = await getUserProfile(target);
                if (data) {
                    setProfile(data);
                    if (user && target === user.uid) {
                        setFormData({
                            displayName: data.displayName || '',
                            favoriteColor: data.favoriteColor || 'Colorless'
                        });
                    }
                    if (user && target !== user.uid) {
                        const currentUserDoc = await getUserProfile(user.uid);
                        if (currentUserDoc?.following?.includes(target)) {
                            setIsFollowing(true);
                        }
                    }
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                console.error("ProfilePage load error:", e);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        resolveAndLoad();
    }, [viewProfileId, user]);

    const isOwnProfile = user && resolvedUid === user.uid;
    const targetUid = resolvedUid;

    const handleSave = async () => {
        if (!user || !isOwnProfile) return;
        try {
            const { updateUserProfile } = window.fbHelpers;
            await updateUserProfile(user.uid, formData);
            setProfile({ ...profile, ...formData });
            setEditing(false);
            if (formData.displayName) localStorage.setItem('mtg_username', formData.displayName);
        } catch (e) { console.error("Save failed", e); }
    };

    const handleLogout = async () => {
        try { await window._authFns.signOut(window._auth); } catch (e) { console.error(e); }
    };

    const toggleFollow = async () => {
        if (!user || isOwnProfile) return;
        const { followUser, unfollowUser } = window.fbHelpers;
        try {
            if (isFollowing) {
                await unfollowUser(user.uid, targetUid);
                setIsFollowing(false);
                setProfile(prev => ({ ...prev, followers: (prev.followers || []).filter(id => id !== user.uid) }));
            } else {
                await followUser(user.uid, targetUid);
                setIsFollowing(true);
                setProfile(prev => ({ ...prev, followers: [...(prev.followers || []), user.uid] }));
            }
        } catch (e) { console.error(e); }
    };

    const updateCommander = async (card) => {
        const newProfile = { ...formData, favoriteCommander: card };
        setFormData(newProfile);
        if (!editing) {
            const { updateUserProfile } = window.fbHelpers;
            await updateUserProfile(user.uid, { favoriteCommander: card });
            setProfile(prev => ({ ...prev, favoriteCommander: card }));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Loading Profile...</div>;
    if (notFound) return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Profile not found.</div>;

    // Resolve window globals at render time (after loading completes)
    const Icons = window.Icons;
    const MTG_IDENTITIES = window.MTG_IDENTITIES;
    const IdentityIcon = window.IdentityIcon;
    const CardSearch = window.CardSearch;

    return (
        <div className="absolute inset-0 p-8 overflow-y-auto scroll-container pb-24">
            <div className="max-w-2xl mx-auto space-y-8">
                {onBack && <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 mb-4"><Icons.ChevronLeft className="w-4 h-4" /> Back</button>}
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center shadow-xl">
                            {profile?.favoriteCommander?.image
                                ? <img src={profile.favoriteCommander.image} alt={profile.favoriteCommander.name} className="w-full h-full object-cover" />
                                : <Icons.User className="w-10 h-10 text-[var(--accent)]" />}
                        </div>
                        {/* Green dot: always show on own profile (they're here!), or when other profile is recently active */}
                        {isOwnProfile
                            ? <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-[var(--bg-secondary)] rounded-full" title="You are online" />
                            : ((() => {
                                const ms = profile?.lastSeen?.toMillis ? profile.lastSeen.toMillis() : (profile?.lastSeen || 0);
                                const online = ms && (Date.now() - ms) < 5 * 60 * 1000;
                                return online ? <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-[var(--bg-secondary)] rounded-full" title="Online now" /> : null;
                            })())
                        }
                    </div>
                    {/* Title + actions */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{isOwnProfile ? 'My Profile' : (profile?.displayName || 'Player Profile')}</h1>
                                {profile?.favoriteCommander?.name && (
                                    <p className="text-xs text-[var(--text-faint)] mt-1">Commander: {profile.favoriteCommander.name}</p>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {isOwnProfile ? (
                                    <>
                                        <button onClick={() => { const url = window.location.origin + window.location.pathname + '?profile=' + (profile.displayName || user.uid); navigator.clipboard.writeText(url); setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); }} className="bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 px-4 py-2 rounded-lg font-bold transition-colors border border-purple-900/50 flex items-center gap-2">
                                            <Icons.Share className="w-5 h-5" />
                                            {showCopied ? 'Copied!' : 'Share'}
                                        </button>
                                        <button onClick={() => setEditing(!editing)} className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold transition-colors border border-[var(--border)]">
                                            {editing ? 'Cancel' : 'Edit Profile'}
                                        </button>
                                        <button onClick={handleLogout} className="bg-red-900/30 hover:bg-red-900/50 text-red-200 px-4 py-2 rounded-lg font-bold transition-colors border border-red-900/50">
                                            <Icons.LogOut className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={toggleFollow} className={`px-6 py-2 rounded-lg font-bold transition-all border ${isFollowing ? 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-red-500 hover:text-red-500' : 'bg-[var(--accent)] border-[var(--accent-hover)] text-white hover:bg-[var(--accent-hover)]'}`}>
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Counts — clickable to view lists */}
                <div className="flex gap-6 justify-center md:justify-start">
                    <button onClick={() => setShowSocialList({ label: 'Followers', list: profile?.followers || [] })}
                        className="text-center md:text-left hover:opacity-75 transition-opacity cursor-pointer group">
                        <span className="text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{(profile?.followers || []).length}</span>
                        {' '}<span className="text-xs text-[var(--text-faint)] uppercase font-bold underline-offset-2 group-hover:underline">Followers</span>
                    </button>
                    <button onClick={() => setShowSocialList({ label: 'Following', list: profile?.following || [] })}
                        className="text-center md:text-left hover:opacity-75 transition-opacity cursor-pointer group">
                        <span className="text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{(profile?.following || []).length}</span>
                        {' '}<span className="text-xs text-[var(--text-faint)] uppercase font-bold underline-offset-2 group-hover:underline">Following</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Stats Card */}
                    <div className="md:col-span-3 bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border)] backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Lifetime Stats</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--bg-primary)] p-4 rounded-xl text-center">
                                <div className="text-3xl font-black text-[var(--text-primary)]">{profile?.stats?.gamesPlayed || 0}</div>
                                <div className="text-xs text-[var(--text-faint)] uppercase font-bold">Games Played</div>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-4 rounded-xl text-center">
                                <div className="text-3xl font-black theme-accent-text">{profile?.stats?.wins || 0}</div>
                                <div className="text-xs text-[var(--text-faint)] uppercase font-bold">Wins</div>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-4 rounded-xl text-center">
                                <div className="text-3xl font-black text-green-400">{profile?.stats?.gamesPlayed ? Math.round(((profile.stats.wins || 0) / profile.stats.gamesPlayed) * 100) : 0}%</div>
                                <div className="text-xs text-[var(--text-faint)] uppercase font-bold">Win Rate</div>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-4 rounded-xl text-center flex items-center justify-center flex-col">
                                <IdentityIcon id={profile?.favoriteColor} />
                                <div className="text-xs text-[var(--text-faint)] uppercase font-bold mt-2">{profile?.favoriteColor || 'Colorless'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border)] backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Player Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-faint)] uppercase mb-1">Display Name</label>
                                    {editing ? (
                                        <input type="text" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none" />
                                    ) : (
                                        <div className="text-lg font-bold text-[var(--text-primary)]">{profile?.displayName || user.email || 'Anonymous'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-faint)] uppercase mb-1">Color Identity</label>
                                    {editing ? (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                                            {Object.keys(MTG_IDENTITIES).map(id => (
                                                <button key={id} onClick={() => setFormData({ ...formData, favoriteColor: id })} className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all h-24 justify-center ${formData.favoriteColor === id ? 'bg-[var(--accent)]/20 border-[var(--accent)] scale-105 shadow-lg shadow-[var(--accent-ring)]' : 'border-transparent bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] hover:border-[var(--border)]'}`} title={id}>
                                                    <IdentityIcon id={id} />
                                                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <IdentityIcon id={profile?.favoriteColor} />
                                            <span className="text-[var(--text-primary)] font-bold">{profile?.favoriteColor || 'Colorless'}</span>
                                            {MTG_IDENTITIES[profile?.favoriteColor]?.description && <span className="text-xs text-[var(--text-faint)]">({MTG_IDENTITIES[profile?.favoriteColor]?.description})</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editing && (
                                <button onClick={handleSave} className="mt-6 w-full theme-accent hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all">
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Favorite Commander */}
                    <div className="md:col-span-1">
                        <div className="bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border)] backdrop-blur-sm h-full flex flex-col">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Favorite Commander</h2>
                            {(editing ? formData.favoriteCommander : profile?.favoriteCommander) ? (
                                <div className="relative flex-1 rounded-xl overflow-hidden border border-[var(--border)] group cursor-pointer" onClick={() => editing && setShowCmdrSearch(true)}>
                                    <img src={(editing ? formData.favoriteCommander : profile.favoriteCommander)?.image} className="w-full h-full object-cover" alt="Commander" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                        <div className="font-bold text-white">{(editing ? formData.favoriteCommander : profile.favoriteCommander)?.name}</div>
                                    </div>
                                    {editing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Search className="w-8 h-8 text-white" /></div>}
                                </div>
                            ) : (
                                <button onClick={() => editing && setShowCmdrSearch(true)} className={`flex-1 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-faint)] ${editing ? 'hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer' : ''}`}>
                                    <Icons.Sword className="w-8 h-8" />
                                    <span>No Commander Set</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Games */}
                <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <Icons.Clock className="w-5 h-5 text-[var(--accent)]" /> Recent Games
                    </h2>
                    {(!profile?.recentGames || profile.recentGames.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                                <Icons.Sword className="w-6 h-6 text-[var(--text-faint)] opacity-50" />
                            </div>
                            <div className="text-sm font-bold text-[var(--text-faint)]">No recorded games yet.</div>
                            <div className="text-xs text-[var(--text-faint)] opacity-70">Join an online room to start building your history.</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {profile.recentGames.slice(0, 5).map((g, i) => {
                                const isWinner = g.winnerId === (targetUid || user?.uid);
                                const date = g.playedAt ? new Date(g.playedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '?';
                                return (
                                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${isWinner ? 'border-green-500/30 bg-green-500/5' : 'border-[var(--border-light)] bg-[var(--bg-card)]'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {isWinner ? 'W' : 'L'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-[var(--text-primary)] text-sm truncate">{g.roomName || 'Private Room'}</div>
                                            <div className="text-xs text-[var(--text-faint)]">
                                                {g.players?.map(p => p.name).join(', ')} · {g.duration || '—'}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-xs font-bold ${isWinner ? 'text-green-400' : 'text-[var(--text-faint)]'}`}>{isWinner ? '🏆 Won' : 'Lost'}</div>
                                            <div className="text-[10px] text-[var(--text-faint)]">{date}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Find Players */}
                <UserSearch Icons={Icons} onVisitProfile={(uid) => window.setViewProfile && window.setViewProfile(uid)} />

            </div>
            {showCmdrSearch && CardSearch && <CardSearch
                onSelect={(card) => { updateCommander(card); setShowCmdrSearch(false); }}
                onClose={() => setShowCmdrSearch(false)}
                mode="commander"
                allowPartner={false}
            />}
            {showSocialList && (
                <SocialListModal
                    label={showSocialList.label}
                    uids={showSocialList.list}
                    Icons={Icons}
                    onClose={() => setShowSocialList(null)}
                    onVisitProfile={(uid) => { setShowSocialList(null); window.setViewProfile && window.setViewProfile(uid); }}
                />
            )}
        </div>
    );
};

window.ProfilePage = ProfilePage;
