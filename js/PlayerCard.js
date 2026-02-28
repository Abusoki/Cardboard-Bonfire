// =============================================================
//  PlayerCard — loaded by tcg.html via:
//    <script type="text/babel" src="./js/PlayerCard.js"></script>
//
//  Dependencies (resolved from window at render-time):
//    window.Icons, window.CardSearch, window.LifeHistoryModal
//  React hooks come from the global React UMD build.
// =============================================================

const { useState, useRef } = React;

// 6. Player Card
const PlayerCard = ({ id, name, life, commander, partner, color, poison = 0, commanderDamage = {}, milled = false, mulligans = 0, lifeHistory = [], onUpdate, onDead, isDead, isLocal, isWinner, players = [], onLog, canKick, onKick, playerId, startLife = 40, ...props }) => {
    // Resolve cross-file dependencies at render-time (set on window by tcg.html main module)
    const Icons = window.Icons;
    const CardSearch = window.CardSearch;
    const LifeHistoryModal = window.LifeHistoryModal;

    const [showCmdrSearch, setShowCmdrSearch] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [confirmKick, setConfirmKick] = useState(false);
    const [showKick, setShowKick] = useState(false);
    const [showLifeGraph, setShowLifeGraph] = useState(false);

    const pushToLog = (msg) => { if (onLog) onLog(msg); };
    const lifeChangeRef = useRef(0);
    const lifeTimeoutRef = useRef(null);

    const adjustLife = (amount) => {
        const newLife = life + amount;
        const deadByPoison = poison >= 10;
        const deadByCmdr = Object.values(commanderDamage || {}).some(d => d >= 21);
        const deadByLife = newLife <= 0;
        const newHistory = [...(lifeHistory || []), { life: newLife, change: amount, ts: Date.now() }].slice(-30);
        onUpdate(id, { life: newLife, isDead: deadByPoison || deadByCmdr || deadByLife || milled, lifeHistory: newHistory });
        lifeChangeRef.current += amount;
        if (lifeTimeoutRef.current) clearTimeout(lifeTimeoutRef.current);
        lifeTimeoutRef.current = setTimeout(() => {
            if (lifeChangeRef.current !== 0) {
                const val = lifeChangeRef.current;
                pushToLog(`${name}: Life ${val > 0 ? '+' : ''}${val} (${newLife})`);
                lifeChangeRef.current = 0;
            }
        }, 1000);
    };

    const adjustPoison = (amount) => {
        const newPoison = Math.max(0, (poison || 0) + amount);
        const deadByPoison = newPoison >= 10;
        const deadByCmdr = Object.values(commanderDamage || {}).some(dmg => dmg >= 21);
        const deadByLife = life <= 0;
        onUpdate(id, { poison: newPoison, isDead: deadByPoison || deadByCmdr || deadByLife || milled });
        pushToLog(`${name}: Poison ${amount > 0 ? '+' : ''}${amount} (${newPoison})`);
    };

    const toggleMilled = () => {
        const isNowMilled = !milled;
        const deadByPoison = poison >= 10;
        const deadByCmdr = Object.values(commanderDamage || {}).some(dmg => dmg >= 21);
        const deadByLife = life <= 0;
        onUpdate(id, { milled: isNowMilled, isDead: deadByPoison || deadByCmdr || deadByLife || isNowMilled });
        pushToLog(`${name}: ${isNowMilled ? 'Milled Out' : 'Recovered from Mill'}`);
    };

    const adjustMulligans = (amt) => {
        const newCount = Math.max(0, (mulligans || 0) + amt);
        onUpdate(id, { mulligans: newCount });
        if (amt > 0) pushToLog(`${name}: Took mulligan #${newCount}`);
    };

    // key can be just opponentId (main) or opponentId-partner
    const adjustCmdrDamage = (key, amount, sourceName) => {
        const current = commanderDamage[key] || 0;
        const newDmg = Math.max(0, current + amount);
        const newMap = { ...(commanderDamage || {}), [key]: newDmg };
        const deadByPoison = poison >= 10;
        const deadByCmdr = Object.values(newMap).some(dmg => dmg >= 21);
        const deadByLife = life <= 0;
        onUpdate(id, { commanderDamage: newMap, isDead: deadByPoison || deadByCmdr || deadByLife || milled });
        pushToLog(`${name}: Cmdr Dmg from ${sourceName} ${amount > 0 ? '+' : ''}${amount} (${newDmg})`);
    };

    const toggleRotation = () => { setRotation(prev => (prev + 90) % 360); };
    const rotateClass = `rotate-${rotation}`;
    const isSideways = rotation === 90 || rotation === 270;
    const cardClasses = isWinner
        ? `relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 bg-[var(--bg-secondary)] border-2 border-[var(--accent)] winner-glow min-h-[250px]`
        : `relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 ${isDead ? 'opacity-50 grayscale' : ''} ${color} min-h-[250px]`;

    return (
        <div className={cardClasses}>
            {commander?.image && (<div className="absolute inset-0 z-0"><img src={commander.image} alt="bg" className="w-full h-full object-cover opacity-30 mix-blend-overlay" /><div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" /></div>)}
            {isLocal && !showTools && !showCmdrSearch && (<div className="absolute top-4 right-4 z-50"><button onClick={toggleRotation} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/90 transition-colors shadow-lg border border-white/10"><Icons.RotateCcw className="w-4 h-4" /></button></div>)}
            <div className={`relative z-10 flex flex-col h-full p-4 transition-transform duration-300 ${rotateClass} ${isSideways ? 'scale-90 justify-center gap-2' : ''}`}>
                <div className={`flex justify-between items-start ${isSideways ? 'w-full' : ''}`}>
                    <div className="flex flex-col items-start gap-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                            <span onClick={() => { if (window.setViewProfile) window.setViewProfile(name); }} className={`font-bold text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-md cursor-pointer hover:bg-black/60 hover:text-purple-300 transition-colors ${!props.isGuest && !isLocal ? 'text-green-400' : 'text-white'}`}>{name}</span>
                            {canKick && showKick && (
                                <button onClick={() => onKick(id)} className="text-red-500/50 hover:text-red-500 transition-colors p-1"><Icons.LogOut className="w-3 h-3" /></button>
                            )}
                        </div>
                        <button onClick={() => setShowCmdrSearch(true)} className="flex items-center gap-2 bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors text-white group max-w-full">
                            <div className="flex flex-col items-start truncate">
                                {commander?.name ? (<span className="font-semibold text-sm truncate w-full">{commander.name}</span>) : (<span className="flex items-center gap-1 text-xs uppercase tracking-wide font-bold opacity-80"><Icons.Search className="w-3 h-3" /> Commander</span>)}
                                {partner?.name && <span className="text-[10px] text-purple-300 truncate w-full">+ {partner.name}</span>}
                            </div>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">{isLocal && <div className="w-8 h-8"></div>}{milled && <Icons.Book className="text-blue-400 w-5 h-5 drop-shadow-md" />}{isDead && <Icons.Skull className="text-red-500 w-6 h-6 animate-pulse" />}{isWinner && <Icons.Crown className="text-yellow-400 w-6 h-6 animate-bounce" />}</div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="flex items-center gap-6">
                        <button onClick={() => adjustLife(-1)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm active:scale-95 transition-all"><span className="text-3xl font-light mb-1">-</span></button>
                        <div className="flex flex-col items-center">
                            <div className="text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl relative">{life}{isWinner && <Icons.Crown className="w-8 h-8 text-yellow-400 absolute -top-8 -right-4 rotate-12 drop-shadow-lg" />}</div>
                            <div className="flex gap-2">{(poison > 0) && (<div className="flex items-center gap-1 text-green-400 font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full text-xs"><Icons.Droplet className="w-3 h-3" /> {poison}/10</div>)}{milled && (<div className="flex items-center gap-1 text-blue-400 font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full text-xs border border-blue-500/50"><Icons.Book className="w-3 h-3" /> Milled</div>)}{mulligans > 0 && (<div className="flex items-center gap-1 text-yellow-300 font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full text-xs border border-yellow-500/30">🃏 {mulligans}×</div>)}</div>

                            <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-[120px] relative">
                                {Object.entries(commanderDamage || {}).map(([key, dmg]) => {
                                    if (dmg <= 0) return null;
                                    // Key is either opponentId (main) or opponentId-partner
                                    const isPartnerDmg = key.includes('-partner');
                                    const sourceId = isPartnerDmg ? key.replace('-partner', '') : key;
                                    const sourcePlayer = players.find(p => p.id == sourceId);

                                    let tooltipText = `${sourcePlayer?.name || 'Unknown'}`;
                                    if (isPartnerDmg && sourcePlayer?.partner) tooltipText = `${sourcePlayer.partner.name} (${sourcePlayer.name})`;
                                    else if (!isPartnerDmg && sourcePlayer?.commander) tooltipText = `${sourcePlayer.commander.name} (${sourcePlayer.name})`;

                                    return (
                                        <div
                                            key={key}
                                            className="relative"
                                            onMouseEnter={() => setActiveTooltip(key)}
                                            onMouseLeave={() => setActiveTooltip(null)}
                                            onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === key ? null : key); }}
                                        >
                                            <div className={`flex items-center gap-1 font-bold bg-black/50 px-2 py-0.5 rounded-full text-xs cursor-pointer border
                                                ${dmg >= 21
                                                    ? 'text-red-400 border-red-500/60 cmd-lethal'
                                                    : dmg >= 16
                                                        ? 'text-amber-400 border-amber-400/60 cmd-warning'
                                                        : isPartnerDmg ? 'text-orange-400 border-orange-500/20' : 'text-red-400 border-red-500/20'
                                                }`}>
                                                {dmg >= 16 ? <Icons.AlertTriangle className="w-3 h-3" /> : <Icons.Sword className="w-3 h-3" />} {dmg}/21
                                            </div>
                                            {/* Custom Tooltip Popover */}
                                            {activeTooltip === key && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black text-white text-xs p-2 rounded-lg shadow-xl border border-red-500/50 z-50 text-center pointer-events-none animate-in fade-in zoom-in-95">
                                                    <div className="font-bold text-red-300 mb-1">{isPartnerDmg ? 'Partner Damage' : 'Commander Damage'}</div>
                                                    <div>{tooltipText}</div>
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-b border-r border-red-500/50 transform rotate-45"></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={() => adjustLife(1)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm active:scale-95 transition-all"><span className="text-3xl font-light mb-1">+</span></button>
                    </div>
                </div>
                <div className="flex flex-col items-center space-y-3 relative">
                    <div className="flex justify-center gap-3">{[-10, -5, 5, 10].map(amt => (<button key={amt} onClick={() => adjustLife(amt)} className="px-3 py-1 bg-black/20 hover:bg-black/40 rounded-lg text-white/80 text-xs font-bold backdrop-blur-sm">{amt > 0 ? '+' : ''}{amt}</button>))}</div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowTools(true)} className="flex items-center gap-1 text-xs bg-[var(--bg-elevated)]/80 hover:bg-[var(--bg-card)]/80 text-[var(--text-primary)] font-bold px-3 py-2 rounded-xl backdrop-blur-md transition-colors shadow-md border border-[var(--border)]"><Icons.Sliders className="w-4 h-4 text-[var(--accent)]" /> Counters</button>
                        {(lifeHistory && lifeHistory.length > 0) && (
                            <button onClick={() => setShowLifeGraph(true)} className="text-xs bg-purple-700/60 hover:bg-purple-600/80 text-white font-bold px-2 py-2 rounded-xl backdrop-blur-md transition-colors shadow-md" title="Life History"><Icons.BarChart2 className="w-4 h-4" /></button>
                        )}
                    </div>
                </div>
                {commander?.artist && (<div className="absolute bottom-1 right-2 text-[10px] text-white/40 font-medium pointer-events-none text-right leading-tight"><div>Art by {commander.artist}</div><div>™ &amp; © Wizards of the Coast</div></div>)}
            </div>
            {showCmdrSearch && <CardSearch
                onSelect={(c, asPartner) => {
                    if (asPartner) onUpdate(id, { partner: c });
                    else onUpdate(id, { commander: c });
                    if (onLog) onLog(`${name} chose ${asPartner ? 'Partner ' + c.name : c.name}`);
                    setShowCmdrSearch(false);
                }}
                onClose={() => setShowCmdrSearch(false)}
                mode="commander"
            />}
            {showLifeGraph && <LifeHistoryModal name={name} history={lifeHistory || []} startLife={startLife} onClose={() => setShowLifeGraph(false)} />}
            {showTools && (
                <div className={`absolute inset-0 bg-[var(--bg-secondary)]/95 z-20 flex flex-col p-4 transition-transform duration-300 ${rotateClass} backdrop-blur-md`}>
                    <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-2"><h3 className="text-[var(--text-primary)] font-bold flex items-center gap-2"><Icons.Sliders className="w-4 h-4 text-[var(--accent)]" /> Damage & Counters</h3><button onClick={() => setShowTools(false)}><Icons.X className="w-5 h-5 text-[var(--text-faint)] hover:text-[var(--text-primary)]" /></button></div>
                    <div className="flex-1 overflow-y-auto space-y-4">
                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)]"><div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold text-green-400 flex items-center gap-2"><Icons.Droplet className="w-4 h-4" /> Poison (Infect)</span><span className="text-xs text-[var(--text-faint)]">Die at 10</span></div><div className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-lg p-2"><button onClick={() => adjustPoison(-1)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:opacity-80 transition-opacity">-</button><span className="font-mono text-xl text-[var(--text-primary)] font-bold">{poison || 0}</span><button onClick={() => adjustPoison(1)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:opacity-80 transition-opacity">+</button></div></div>

                        {/* Mulligan Tracker */}
                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-yellow-900/40">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-yellow-300 flex items-center gap-2">🃏 Mulligans</span>
                                <span className="text-xs text-[var(--text-faint)]">Tracking only</span>
                            </div>
                            <div className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-lg p-2">
                                <button onClick={() => adjustMulligans(-1)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:opacity-80 transition-opacity">-</button>
                                <span className="font-mono text-xl text-[var(--text-primary)] font-bold">{mulligans || 0}</span>
                                <button onClick={() => adjustMulligans(1)} className="w-8 h-8 flex items-center justify-center bg-yellow-700/80 rounded text-white hover:bg-yellow-600">+</button>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-blue-400 flex items-center gap-2"><Icons.Book className="w-4 h-4" /> Library Status</span>
                                <span className="text-xs text-[var(--text-faint)]">Die if Milled</span>
                            </div>
                            <button onClick={toggleMilled} className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${milled ? 'bg-red-600 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] border border-[var(--border)]'}`}>
                                {milled ? '📚 Milled Out (Dead)' : 'Mark as Milled Out'}
                            </button>
                        </div>

                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)]"><div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold text-red-400 flex items-center gap-2"><Icons.Sword className="w-4 h-4" /> Commander Damage</span><span className="text-xs text-[var(--text-faint)]">Die at 21 per Cmdr</span></div><div className="space-y-2">
                            {[...players].filter(p => p.id !== id).sort((a, b) => String(a.id).localeCompare(String(b.id))).map(opponent => {
                                const dmgMain = commanderDamage[opponent.id] || 0;
                                const dmgPartner = commanderDamage[`${opponent.id}-partner`] || 0;

                                return (
                                    <div key={opponent.id} className="flex flex-col gap-2 bg-[var(--bg-elevated)] rounded-lg p-2">
                                        {/* Main Commander */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                <div className={`w-2 h-8 rounded-full ${opponent.id === id ? 'bg-[var(--accent)]' : 'bg-[var(--text-faint)] opacity-30'}`}></div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-bold text-white truncate">{opponent.commander?.name || opponent.name}</span>
                                                    <span className="text-[10px] text-[var(--text-faint)] uppercase">From {opponent.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <button onClick={() => adjustCmdrDamage(opponent.id, -1, opponent.commander?.name || opponent.name)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">-</button>
                                                <span className={`font-mono text-lg font-bold w-6 text-center ${dmgMain >= 21 ? 'text-red-500' : 'text-white'}`}>{dmgMain}</span>
                                                <button onClick={() => adjustCmdrDamage(opponent.id, 1, opponent.commander?.name || opponent.name)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">+</button>
                                            </div>
                                        </div>

                                        {/* Partner Commander (if exists) */}
                                        {opponent.partner && (
                                            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                    <div className="w-2 h-8 rounded-full bg-orange-500/50"></div>
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-xs font-bold text-orange-200 truncate">{opponent.partner.name}</span>
                                                        <span className="text-[10px] text-[var(--text-faint)] uppercase">Partner</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <button onClick={() => adjustCmdrDamage(`${opponent.id}-partner`, -1, opponent.partner.name)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">-</button>
                                                    <span className={`font-mono text-lg font-bold w-6 text-center ${dmgPartner >= 21 ? 'text-red-500' : 'text-white'}`}>{dmgPartner}</span>
                                                    <button onClick={() => adjustCmdrDamage(`${opponent.id}-partner`, 1, opponent.partner.name)} className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div></div>

                        {/* KICK PLAYER BUTTON FOR HOST */}
                        {canKick && (
                            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <button
                                    onClick={() => { if (confirmKick) onKick(id); else setConfirmKick(true); }}
                                    className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${confirmKick ? 'bg-red-600 text-white animate-pulse' : 'bg-red-900/50 border border-red-700 text-red-200 hover:bg-red-800'}`}
                                    onMouseLeave={() => setConfirmKick(false)}
                                >
                                    <Icons.LogOut className="w-4 h-4" />
                                    {confirmKick ? "Confirm Kick?" : "Kick Player"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Export to window so the main tcg.html module can reference it
window.PlayerCard = PlayerCard;
