// =============================================================
//  UI Modals + CardSearch + SettingsPage
//  No Firebase dependencies — pure UI components.
//  Depends on: window.Icons, window.ThemeContext, window.THEME_CONFIG
// =============================================================

// helper for canvas roundRect (Safari compat) — also used by export-modals.js
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}
window.roundRect = roundRect;

const LifeHistoryModal = ({ name, history, startLife = 40, onClose }) => {
    const Icons = window.Icons;
    if (!history || history.length === 0) return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border)] text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="text-[var(--text-muted)] mb-4">No life history yet.</div>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Close</button>
            </div>
        </div>
    );

    const W = 320, H = 180, PAD = 32;
    const allLife = [startLife, ...history.map(h => h.life)];
    const minL = Math.min(...allLife) - 5;
    const maxL = Math.max(...allLife) + 5;
    const toX = (i) => PAD + (i / (allLife.length - 1 || 1)) * (W - PAD * 2);
    const toY = (l) => PAD + ((maxL - l) / (maxL - minL || 1)) * (H - PAD * 2);
    const points = allLife.map((l, i) => `${toX(i)},${toY(l)}`).join(' ');
    const areaPoints = `${toX(0)},${H - PAD} ${points} ${toX(allLife.length - 1)},${H - PAD}`;
    const lastLife = allLife[allLife.length - 1];
    const colorClass = lastLife <= 0 ? '#ef4444' : lastLife <= 10 ? '#f59e0b' : '#a855f7';

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-sm rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Icons.BarChart2 className="w-4 h-4 text-[var(--accent)]" /> {name} — Life History
                    </h3>
                    <button onClick={onClose}><Icons.X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" /></button>
                </div>
                <div className="p-4">
                    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
                        {[0, 1, 2, 3].map(i => {
                            const y = PAD + i * (H - PAD * 2) / 3;
                            const val = Math.round(maxL - i * (maxL - minL) / 3);
                            return <g key={i}>
                                <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeDasharray="4,4" strokeWidth="1" />
                                <text x={PAD - 4} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">{val}</text>
                            </g>;
                        })}
                        {minL < 0 && maxL > 0 && <line x1={PAD} x2={W - PAD} y1={toY(0)} y2={toY(0)} stroke="#ef4444" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4,2" />}
                        <polygon points={areaPoints} fill={colorClass} fillOpacity="0.08" />
                        <polyline points={points} fill="none" stroke={colorClass} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                        {allLife.map((l, i) => (
                            <circle key={i} cx={toX(i)} cy={toY(l)} r="3.5" fill={colorClass} stroke="var(--bg-secondary)" strokeWidth="2" className="life-graph-dot">
                                <title>{i === 0 ? `Start: ${l}` : `Move ${i}: ${l}`}</title>
                            </circle>
                        ))}
                    </svg>
                    <div className="flex justify-between text-xs text-[var(--text-faint)] mt-1 px-1">
                        <span>Start ({startLife})</span>
                        <span>Now ({lastLife})</span>
                    </div>
                    {history.length > 0 && (
                        <div className="mt-3 space-y-1 max-h-28 overflow-y-auto scroll-container">
                            {[...history].reverse().slice(0, 10).map((h, i) => (
                                <div key={i} className="flex justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-light)] pb-1">
                                    <span>{h.change > 0 ? `+${h.change}` : h.change}</span>
                                    <span className="font-bold text-[var(--text-primary)]">{h.life}</span>
                                    <span className="text-[var(--text-faint)]">{new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border)] flex justify-center">
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

const HistoryModal = ({ log = [], onClose }) => {
    const Icons = window.Icons;
    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-end md:items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-md h-[60vh] rounded-t-2xl md:rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)]">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><Icons.Clock className="w-4 h-4 text-[var(--accent)]" /> Game Log</h3>
                    <button onClick={onClose}><Icons.X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-container">
                    {log.length === 0 ? (
                        <div className="text-center text-[var(--text-faint)] mt-10">No history yet.</div>
                    ) : (
                        [...log].reverse().map((entry, i) => (
                            <div key={i} className="text-sm border-l-2 border-[var(--accent)] pl-3 py-1 bg-[var(--bg-card)]/30 rounded-r-lg">
                                <span className="text-xs text-[var(--text-faint)] block">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-[var(--text-primary)]">{entry.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CardDetailModal = ({ card, onClose }) => {
    const Icons = window.Icons;
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="relative max-w-lg w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <img src={card.fullImage || card.image} alt={card.name} className="w-full max-h-[70vh] object-contain rounded-xl shadow-2xl mb-6 border border-[var(--border)]" />
                <div className="text-center text-[var(--text-primary)] bg-[var(--bg-secondary)]/80 p-4 rounded-xl backdrop-blur-md border border-[var(--border)] w-full">
                    <h2 className="text-2xl font-bold theme-accent-text mb-1">{card.name}</h2>
                    {card.artist && (<div className="text-sm text-[var(--text-muted)] font-medium flex items-center justify-center gap-2"><span>Art by {card.artist}</span></div>)}
                    <div className="text-xs text-[var(--text-faint)] mt-2 tracking-widest uppercase">™ &amp; © Wizards of the Coast</div>
                </div>
                <button onClick={onClose} className="absolute -top-12 right-0 md:-right-12 p-2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all">
                    <Icons.X className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

const GameToolsModal = ({ players, onClose }) => {
    const Icons = window.Icons;
    const { useState } = React;
    const [activeTab, setActiveTab] = React.useState('first');
    const [result, setResult] = React.useState(null);
    const [animating, setAnimating] = React.useState(false);

    const spinForFirst = () => {
        setAnimating(true); setResult(null);
        let count = 0; const max = 20;
        const interval = setInterval(() => {
            setResult(players[count % players.length].name); count++;
            if (count > max) { clearInterval(interval); setResult(players[Math.floor(Math.random() * players.length)].name); setAnimating(false); }
        }, 100);
    };
    const rollDice = (sides) => { setAnimating(true); setResult(null); setTimeout(() => { setResult(Math.floor(Math.random() * sides) + 1); setAnimating(false); }, 600); };
    const flipCoin = () => { setAnimating(true); setResult(null); setTimeout(() => { setResult(Math.random() > 0.5 ? "Heads" : "Tails"); setAnimating(false); }, 600); };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-sm rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex border-b border-[var(--border)]">
                    {['first', 'dice', 'coin'].map(tab => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setResult(null); }} className={`flex-1 p-3 text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'bg-[var(--accent)] text-white shadow-inner shadow-black/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'}`}>
                            {tab === 'first' ? 'Who First?' : tab}
                        </button>
                    ))}
                </div>
                <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
                    {activeTab === 'first' && (<>
                        <div className={`text-3xl font-bold mb-6 text-center break-words w-full ${animating ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{result || "?"}</div>
                        <button onClick={spinForFirst} disabled={animating} className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] px-6 py-2 rounded-full font-bold border border-[var(--border)] transition-all">Spin Randomizer</button>
                    </>)}
                    {activeTab === 'dice' && (<>
                        <div className={`text-6xl font-black mb-8 ${animating ? 'animate-bounce text-[var(--text-muted)]' : 'theme-accent-text'}`}>{result || <Icons.Dices className="w-16 h-16 opacity-20" />}</div>
                        <div className="flex gap-4">
                            <button onClick={() => rollDice(6)} disabled={animating} className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold border border-[var(--border)] transition-all">Roll D6</button>
                            <button onClick={() => rollDice(20)} disabled={animating} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-900/10 transition-all">Roll D20</button>
                        </div>
                    </>)}
                    {activeTab === 'coin' && (<>
                        <div className={`text-4xl font-bold mb-8 ${animating ? 'animate-spin-slow text-[var(--text-faint)]' : 'text-yellow-400'}`}>{result || "Flip Me"}</div>
                        <button onClick={flipCoin} disabled={animating} className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-200 border border-yellow-600/50 px-6 py-2 rounded-full font-bold">Flip Coin</button>
                    </>)}
                </div>
                <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border)] flex justify-center">
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors">Close Tools</button>
                </div>
            </div>
        </div>
    );
};

const CardSearch = ({ onSelect, onClose, mode = 'commander', allowPartner = true }) => {
    const Icons = window.Icons;
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [asPartner, setAsPartner] = React.useState(false);
    const debounceRef = React.useRef(null);

    const searchScryfall = async (q) => {
        if (!q || q.length < 3) { setResults([]); return; }
        setLoading(true);
        try {
            let searchParams = `q=${encodeURIComponent(q + ' (game:paper)')}`;
            if (mode === 'commander') searchParams = `q=${encodeURIComponent(q + ' (is:commander) (game:paper)')}`;
            const response = await fetch(`https://api.scryfall.com/cards/search?${searchParams}`);
            const data = await response.json();
            setResults(data.data ? data.data.slice(0, 20) : []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleInput = (e) => {
        const val = e.target.value; setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchScryfall(val), 500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[var(--bg-secondary)] w-full max-w-lg rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-[var(--border)] flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Icons.Search className="text-[var(--text-muted)] w-5 h-5" />
                        <input type="text" placeholder={mode === 'commander' ? "Search Commander..." : "Search Scryfall For Any Card.."} className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full placeholder:text-[var(--text-faint)]" value={query} onChange={handleInput} autoFocus />
                        <button onClick={onClose}><Icons.X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" /></button>
                    </div>
                    {mode === 'commander' && allowPartner && (
                        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer self-start ml-8">
                            <input type="checkbox" checked={asPartner} onChange={e => setAsPartner(e.target.checked)} className="rounded border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                            <span>Add as Partner</span>
                        </label>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading && <div className="text-center text-[var(--text-muted)] py-8">Searching Scryfall...</div>}
                    {!loading && results.length === 0 && query.length > 2 && <div className="text-center text-[var(--text-muted)] py-8">No cards found.</div>}
                    {results.map((card) => (
                        <div key={card.id} onClick={() => onSelect({ name: card.name, image: card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop || '', fullImage: card.image_uris?.large || card.card_faces?.[0]?.image_uris?.large || '', artist: card.artist || card.card_faces?.[0]?.artist || 'Unknown' }, asPartner)} className="flex items-center gap-4 p-2 hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer transition-colors group">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-primary)] shrink-0 border border-[var(--border)] group-hover:border-[var(--accent)]">
                                {(card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop) ? (
                                    <img src={card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop} alt={card.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-faint)]">?</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate">{card.name}</div>
                                <div className="text-xs text-[var(--text-muted)] truncate">{card.type_line}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SettingsPage = () => {
    const Icons = window.Icons;
    const { theme, setTheme } = React.useContext(window.ThemeContext);
    const themes = window.THEME_CONFIG;
    return (
        <div className="absolute inset-0 p-8 overflow-y-auto scroll-container pb-24" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                    <Icons.Sliders className="w-8 h-8" style={{ color: 'var(--accent)' }} /> Settings
                </h1>
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
                    <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Theme</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Changes take effect immediately and are saved for next time.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {themes.map(t => (
                            <button key={t.id} onClick={() => setTheme(t.id)} className={`theme-swatch p-4 rounded-xl border-2 text-left transition-all ${theme === t.id ? 'selected' : ''}`} style={{ background: t.preview[0], borderColor: theme === t.id ? t.preview[1] : t.preview[2] }}>
                                <div className="flex gap-2 mb-3">
                                    <div className="w-5 h-5 rounded-full" style={{ background: t.preview[0], border: `2px solid ${t.preview[2]}` }} />
                                    <div className="w-5 h-5 rounded-full" style={{ background: t.preview[1] }} />
                                    <div className="w-5 h-5 rounded-full" style={{ background: t.preview[2] }} />
                                </div>
                                <div className="font-bold text-sm" style={{ color: t.id === 'light' ? '#0f172a' : '#f1f5f9' }}>{t.label}</div>
                                <div className="text-xs mt-0.5" style={{ color: t.id === 'light' ? '#64748b' : '#94a3b8' }}>{t.desc}</div>
                                {theme === t.id && (<div className="mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: t.preview[1], color: '#fff' }}>Active</div>)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Preferences</h2>
                    <div className="space-y-3 opacity-50 pointer-events-none select-none">
                        {['Starting Life Total (40)', 'Auto-detect Winner', 'Sound Effects', 'Haptic Feedback'].map(pref => (
                            <div key={pref} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{pref}</span>
                                <div className="w-10 h-5 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                            </div>
                        ))}
                        <p className="text-xs text-center pt-2" style={{ color: 'var(--text-faint)' }}>Coming soon</p>
                    </div>
                </div>
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>About</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>MTG Commander Companion — v2.28.0</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Not affiliated with Wizards of the Coast.</p>
                </div>
            </div>
        </div>
    );
};

window.LifeHistoryModal = LifeHistoryModal;
window.HistoryModal = HistoryModal;
window.CardDetailModal = CardDetailModal;
window.GameToolsModal = GameToolsModal;
window.CardSearch = CardSearch;
window.SettingsPage = SettingsPage;

// =============================================================
//  Export Modals — canvas-based shareable image generators
// =============================================================

const MatchResultExportModal = ({ players, winnerId, roomName, duration, onClose }) => {
    const Icons = window.Icons;
    const canvasRef = React.useRef(null);
    const [generating, setGenerating] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState('');

    const winner = players.find(p => p.id === winnerId);

    React.useEffect(() => {
        const generate = async () => {
            setGenerating(true);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Background Gradient
            const grad = ctx.createLinearGradient(0, 0, 800, 600);
            grad.addColorStop(0, '#1e1b4b');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 800, 600);

            // Decorative elements
            ctx.strokeStyle = 'rgba(147, 51, 234, 0.15)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 800, Math.random() * 600, Math.random() * 80, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Header
            ctx.fillStyle = '#9333ea';
            ctx.font = '900 32px Inter, sans-serif';
            ctx.fillText('MATCH SUMMARY', 50, 60);

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(roomName.toUpperCase(), 50, 85);

            // Winner Badge
            if (winner) {
                ctx.fillStyle = 'rgba(147, 51, 234, 0.2)';
                if (ctx.roundRect) ctx.roundRect(50, 110, 700, 140, 20);
                else ctx.fillRect(50, 110, 700, 140);
                ctx.fill();

                ctx.fillStyle = '#fbbf24';
                ctx.font = '900 20px Inter, sans-serif';
                ctx.fillText('🏆 WINNER', 80, 150);

                ctx.fillStyle = '#ffffff';
                ctx.font = '900 48px Inter, sans-serif';
                ctx.fillText(winner.name, 80, 205);

                if (winner.commander?.name) {
                    ctx.fillStyle = '#d8b4fe';
                    ctx.font = 'bold 20px Inter, sans-serif';
                    ctx.fillText(winner.commander.name, 80, 230);
                }
            }

            // Players Section
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 24px Inter, sans-serif';
            ctx.fillText('Final Standings', 50, 300);

            players.slice(0, 5).forEach((p, i) => {
                const y = 350 + (i * 50);
                ctx.fillStyle = p.isDead ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)';
                if (ctx.roundRect) ctx.roundRect(50, y - 35, 700, 40, 10);
                else ctx.fillRect(50, y - 35, 700, 40);
                ctx.fill();

                ctx.fillStyle = p.isDead ? '#475569' : '#f1f5f9';
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.fillText(p.name, 70, y - 8);

                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(p.isDead ? 'ELIMINATED' : `${p.life} HP`, 730, y - 8);
                ctx.textAlign = 'left';
            });

            // Footer
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 540, 800, 60);

            ctx.fillStyle = '#a78bfa';
            ctx.font = '900 14px Inter, sans-serif';
            ctx.fillText('CARDBOARD BONFIRE • MTG COMPANION', 50, 575);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText(`Duration: ${duration} • ${new Date().toLocaleDateString()}`, 750, 575);
            ctx.textAlign = 'left';

            setPreviewUrl(canvas.toDataURL('image/png'));
            setGenerating(false);
        };
        generate();
    }, [players, winnerId, roomName, duration]);

    const share = async () => {
        const blob = await (await fetch(previewUrl)).blob();
        const file = new File([blob], 'match-result.png', { type: 'image/png' });
        if (navigator.share) {
            try {
                await navigator.share({ files: [file], title: 'MTG Match Result', text: `Epic game in ${roomName}!` });
            } catch (e) {
                const link = document.createElement('a'); link.download = `match-${roomName}.png`; link.href = previewUrl; link.click();
            }
        } else {
            const link = document.createElement('a'); link.download = `match-${roomName}.png`; link.href = previewUrl; link.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Share Results</h2>
                        <p className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wider">Generate match summary card</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-[var(--bg-elevated)] rounded-2xl transition-all border border-transparent hover:border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Icons.X className="w-6 h-6" /></button>
                </div>

                <div className="p-10 flex flex-col items-center">
                    <canvas ref={canvasRef} width="800" height="600" className="hidden" />
                    {generating ? (
                        <div className="w-full aspect-[4/3] bg-[var(--bg-primary)] rounded-3xl flex items-center justify-center border border-[var(--border)] shadow-inner">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                <div className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">Forging Result Card...</div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group perspective-1000">
                            <img src={previewUrl} className="w-full h-auto rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-[var(--border)] transition-transform duration-500 group-hover:scale-[1.02]" alt="Result Preview" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl backdrop-blur-[2px]">
                                <div className="bg-white/10 p-5 rounded-full text-white backdrop-blur-md border border-white/20 scale-90 group-hover:scale-100 transition-transform duration-500">
                                    <Icons.Share className="w-10 h-10" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 w-full mt-10">
                        <button onClick={onClose} className="py-5 rounded-3xl font-black uppercase tracking-widest text-xs bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]">Close</button>
                        <button onClick={share} className="py-5 rounded-3xl font-black uppercase tracking-widest text-xs bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-[0_10px_30px_-10px_rgba(147,51,234,0.5)] flex items-center justify-center gap-3">
                            <Icons.Share className="w-5 h-5" /> {navigator.share ? 'Share Card' : 'Download Image'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsExportModal = ({ user, stats, onClose }) => {
    const Icons = window.Icons;
    const canvasRef = React.useRef(null);
    const [generating, setGenerating] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState('');

    React.useEffect(() => {
        const generate = async () => {
            setGenerating(true);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // BG
            const grad = ctx.createLinearGradient(0, 0, 800, 600);
            grad.addColorStop(0, '#2e1065');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 800, 600);

            // Header
            ctx.fillStyle = '#a78bfa';
            ctx.font = '900 40px Inter, sans-serif';
            ctx.fillText((user?.displayName || 'PLAYER').toUpperCase(), 50, 80);
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText('CARDBOARD BONFIRE PRO-STATS', 50, 110);

            // Stats Grid
            const s = stats.deathStats || {};
            const total = (s.standard || 0) + (s.commander || 0) + (s.poison || 0) + (s.milled || 0);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            if (ctx.roundRect) ctx.roundRect(50, 150, 700, 120, 20); else ctx.fillRect(50, 150, 700, 120);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 32px Inter, sans-serif';
            ctx.fillText(total.toLocaleString(), 80, 210);
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText('GLOBAL DEATHS RECORDED', 80, 235);

            // Top Commander
            if (stats.topCommander) {
                ctx.fillStyle = 'rgba(147, 51, 234, 0.2)';
                if (ctx.roundRect) ctx.roundRect(50, 290, 700, 230, 20); else ctx.fillRect(50, 290, 700, 230);
                ctx.fill();

                ctx.fillStyle = '#fbbf24';
                ctx.font = '900 14px Inter, sans-serif';
                ctx.fillText('SIGNATURE COMMANDER', 80, 330);

                ctx.fillStyle = '#ffffff';
                ctx.font = '900 48px Inter, sans-serif';
                ctx.fillText(stats.topCommander.name, 80, 390);

                ctx.fillStyle = '#d8b4fe';
                ctx.font = 'bold 20px Inter, sans-serif';
                ctx.fillText(`${stats.topCommander.count} Total Picks Across Games`, 80, 420);
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 540, 800, 60);
            ctx.fillStyle = '#a78bfa';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText('CARDBOARD BONFIRE • MTG COMPANION', 50, 575);

            setPreviewUrl(canvas.toDataURL('image/png'));
            setGenerating(false);
        };
        generate();
    }, [user, stats]);

    const share = async () => {
        const blob = await (await fetch(previewUrl)).blob();
        const file = new File([blob], 'stats-card.png', { type: 'image/png' });
        if (navigator.share) {
            try { await navigator.share({ files: [file], title: 'My MTG Stats', text: 'Check out my MTG Companion stats!' }); }
            catch (e) { const link = document.createElement('a'); link.download = 'my-stats.png'; link.href = previewUrl; link.click(); }
        } else {
            const link = document.createElement('a'); link.download = 'my-stats.png'; link.href = previewUrl; link.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] w-full max-w-2xl overflow-hidden">
                <div className="p-8 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] italic">PRO-STATS CARD</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card)] rounded-full text-[var(--text-muted)]"><Icons.X className="w-6 h-6" /></button>
                </div>
                <div className="p-10 flex flex-col items-center">
                    <canvas ref={canvasRef} width="800" height="600" className="hidden" />
                    <img src={previewUrl} className="w-full h-auto rounded-3xl shadow-2xl border border-[var(--border)]" alt="Stats Card" />
                    <div className="grid grid-cols-2 gap-4 w-full mt-10">
                        <button onClick={onClose} className="py-4 rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Close</button>
                        <button onClick={share} className="py-4 rounded-2xl bg-[var(--accent)] text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                            <Icons.Share className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.MatchResultExportModal = MatchResultExportModal;
window.StatsExportModal = StatsExportModal;
