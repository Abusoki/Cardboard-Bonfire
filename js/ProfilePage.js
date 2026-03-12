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

const ProfilePage = ({ user, viewProfileId = null, onBack = null }) => {
    const Icons = window.Icons;
    const MTG_IDENTITIES = window.MTG_IDENTITIES;
    const IdentityIcon = window.IdentityIcon;
    const { getUserProfile, updateUserProfile, followUser, unfollowUser } = window.fbHelpers;

    const [profile, setProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [editing, setEditing] = React.useState(false);
    const [formData, setFormData] = React.useState({ displayName: '', favoriteColor: 'Colorless' });
    const [showCmdrSearch, setShowCmdrSearch] = React.useState(false);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [resolvedUid, setResolvedUid] = React.useState(null);
    const [notFound, setNotFound] = React.useState(false);
    const [showCopied, setShowCopied] = React.useState(false);

    React.useEffect(() => {
        const resolveAndLoad = async () => {
            setLoading(true);
            setNotFound(false);
            let target = viewProfileId;

            if (!target) {
                if (user) target = user.uid;
                else { setLoading(false); return; }
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
            setLoading(false);
        };
        resolveAndLoad();
    }, [viewProfileId, user]);

    const isOwnProfile = user && resolvedUid === user.uid;
    const targetUid = resolvedUid;

    const handleSave = async () => {
        if (!user || !isOwnProfile) return;
        try {
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
            await updateUserProfile(user.uid, { favoriteCommander: card });
            setProfile(prev => ({ ...prev, favoriteCommander: card }));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Loading Profile...</div>;
    if (notFound) return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Profile not found.</div>;

    const CardSearch = window.CardSearch;

    return (
        <div className="absolute inset-0 p-8 overflow-y-auto scroll-container pb-24">
            <div className="max-w-2xl mx-auto space-y-8">
                {onBack && <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 mb-4"><Icons.ChevronLeft className="w-4 h-4" /> Back</button>}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Icons.User className="w-8 h-8 text-purple-500" />
                        {isOwnProfile ? 'My Profile' : (profile?.displayName || 'Player Profile')}
                    </h1>
                    <div className="flex gap-2">
                        {isOwnProfile ? (
                            <>
                                <button onClick={() => {
                                    const url = window.location.origin + window.location.pathname + '?profile=' + (profile.displayName || user.uid);
                                    navigator.clipboard.writeText(url);
                                    setShowCopied(true);
                                    setTimeout(() => setShowCopied(false), 2000);
                                }} className="bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 px-4 py-2 rounded-lg font-bold transition-colors border border-purple-900/50 flex items-center gap-2">
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

                {/* Social Counts */}
                <div className="flex gap-6 justify-center md:justify-start">
                    <div className="text-center md:text-left"><span className="text-2xl font-black text-[var(--text-primary)]">{profile?.followers?.length || 0}</span> <span className="text-xs text-[var(--text-faint)] uppercase font-bold">Followers</span></div>
                    <div className="text-center md:text-left"><span className="text-2xl font-black text-[var(--text-primary)]">{profile?.following?.length || 0}</span> <span className="text-xs text-[var(--text-faint)] uppercase font-bold">Following</span></div>
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
            </div>
            {showCmdrSearch && CardSearch && <CardSearch
                onSelect={(card) => { updateCommander(card); setShowCmdrSearch(false); }}
                onClose={() => setShowCmdrSearch(false)}
                mode="commander"
                allowPartner={false}
            />}
        </div>
    );
};

window.ProfilePage = ProfilePage;
