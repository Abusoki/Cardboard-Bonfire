// =============================================================
//  AuthPage + UsernameSetup
//  Depends on: window.Icons, window._auth, window._authFns,
//              window._fb(), window._db, window._appId
// =============================================================

const AuthPage = () => {
    const Icons = window.Icons;
    const [isLogin, setIsLogin] = React.useState(true);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    const handleAuth = async (e) => {
        e.preventDefault(); setError(null); setLoading(true);
        try {
            const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = window._authFns;
            if (isLogin) {
                await signInWithEmailAndPassword(window._auth, email, password);
            } else {
                await createUserWithEmailAndPassword(window._auth, email, password);
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally { setLoading(false); }
    };

    const handleGuest = async () => {
        setLoading(true);
        try {
            await window._authFns.signInAnonymously(window._auth);
        } catch (err) { setError(err.message); setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
            <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border)] shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[var(--accent)] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                        <Icons.Shield className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h1>
                    <p className="text-[var(--text-muted)]">Sign in to sync your stats and profile</p>
                </div>
                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm font-bold text-center">{error}</div>}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-faint)] uppercase mb-1">Email</label>
                        <input type="email" required className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-[var(--text-faint)]" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-faint)] uppercase mb-1">Password</label>
                        <input type="password" required className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button disabled={loading} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-900/10">
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
                <div className="mt-6 text-center space-y-4">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors">
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[var(--bg-secondary)] px-2 text-[var(--text-faint)]">Or continue as</span></div>
                    </div>
                    <button onClick={handleGuest} className="w-full bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold py-3 rounded-xl transition-all border border-[var(--border)]">Guest</button>
                </div>
            </div>
        </div>
    );
};

const UsernameSetup = ({ user, onComplete }) => {
    const Icons = window.Icons;
    const [username, setUsername] = React.useState('');
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(null); setLoading(true);
        const cleanName = username.trim();
        const cleanId = cleanName.toLowerCase();
        if (cleanName.length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }
        try {
            const { doc, runTransaction, serverTimestamp } = window._fb();
            await runTransaction(window._db, async (transaction) => {
                const usernameRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'usernames', cleanId);
                const userRef = doc(window._db, 'artifacts', window._appId, 'public', 'data', 'users', user.uid);
                const usernameDoc = await transaction.get(usernameRef);
                if (usernameDoc.exists()) throw "Username is already taken.";
                transaction.set(usernameRef, { uid: user.uid });
                transaction.set(userRef, { displayName: cleanName, updatedAt: serverTimestamp() }, { merge: true });
            });
            if (window._auth.currentUser) {
                await window._authFns.updateProfile(window._auth.currentUser, { displayName: cleanName });
            }
            onComplete(cleanName);
        } catch (e) {
            console.error(e);
            setError(typeof e === 'string' ? e : "Error setting username. Try again.");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border)] shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[var(--accent)] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                        <Icons.User className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Choose a Username</h1>
                    <p className="text-[var(--text-muted)]">This will be your unique identity in all games.</p>
                </div>
                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm font-bold text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-faint)] uppercase mb-1">Username</label>
                        <input type="text" required className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-[var(--text-faint)]" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. JaceBeleren" />
                    </div>
                    <button disabled={loading} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-900/10">
                        {loading ? 'Saving...' : 'Set Username'}
                    </button>
                </form>
            </div>
        </div>
    );
};

window.AuthPage = AuthPage;
window.UsernameSetup = UsernameSetup;
