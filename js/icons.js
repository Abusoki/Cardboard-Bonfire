// =============================================================
//  Icons + MTG Color Identities
//  Loaded by tcg.html via:
//    <script type="text/babel" src="./js/icons.js"></script>
//
//  To add a new icon: add an entry to the Icons object below.
//  To add a colour identity: add an entry to MTG_IDENTITIES below.
// =============================================================

// Base SVG wrapper — all icons use this
const Icon = ({ path, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        {path}
    </svg>
);

// Icon library — add new icons here
const Icons = {
    Search: (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>} />,
    Shield: (p) => <Icon {...p} path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />} />,
    Skull: (p) => <Icon {...p} path={<><path d="m12.5 17-.5-1-.5 1h1z" /><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="12" r="1" /></>} />,
    Menu: (p) => <Icon {...p} path={<><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></>} />,
    X: (p) => <Icon {...p} path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />,
    Users: (p) => <Icon {...p} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
    User: (p) => <Icon {...p} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
    Wifi: (p) => <Icon {...p} path={<><path d="M12 20h.01" /><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.859a10 10 0 0 1 14 0" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /></>} />,
    RotateCcw: (p) => <Icon {...p} path={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>} />,
    Crown: (p) => <Icon {...p} path={<path d="m2 4 3 12h14l3-12-6 7-4-3-4 3-6-7z" />} />,
    ExternalLink: (p) => <Icon {...p} path={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></>} />,
    BarChart2: (p) => <Icon {...p} path={<><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></>} />,
    FileText: (p) => <Icon {...p} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>} />,
    Mail: (p) => <Icon {...p} path={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>} />,
    Sliders: (p) => <Icon {...p} path={<><line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="1" x2="7" y1="14" y2="14" /><line x1="9" x2="15" y1="8" y2="8" /><line x1="17" x2="23" y1="16" y2="16" /></>} />,
    Sword: (p) => <Icon {...p} path={<><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" x2="19" y1="19" y2="13" /><line x1="16" x2="20" y1="16" y2="20" /><line x1="19" x2="21" y1="21" y2="19" /></>} />,
    Droplet: (p) => <Icon {...p} path={<path d="M12 22a7 7 0 0 0 7-7c0-2-2-3-2-3L12 2 7 12s-2 1-2 3a7 7 0 0 0 7 7z" />} />,
    RotateCw: (p) => <Icon {...p} path={<><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></>} />,
    Lock: (p) => <Icon {...p} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />,
    Unlock: (p) => <Icon {...p} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>} />,
    Share: (p) => <Icon {...p} path={<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></>} />,
    Copy: (p) => <Icon {...p} path={<><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>} />,
    Trash: (p) => <Icon {...p} path={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />,
    MessageCircle: (p) => <Icon {...p} path={<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></>} />,
    Send: (p) => <Icon {...p} path={<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>} />,
    Dices: (p) => <Icon {...p} path={<><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 8h.01" /><path d="M8 8h.01" /><path d="M8 16h.01" /><path d="M16 16h.01" /><path d="M12 12h.01" /></>} />,
    Clock: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
    Wrench: (p) => <Icon {...p} path={<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>} />,
    Refresh: (p) => <Icon {...p} path={<><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>} />,
    Book: (p) => <Icon {...p} path={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>} />,
    ChevronLeft: (p) => <Icon {...p} path={<polyline points="15 18 9 12 15 6" />} />,
    ChevronRight: (p) => <Icon {...p} path={<polyline points="9 18 15 12 9 6" />} />,
    LogOut: (p) => <Icon {...p} path={<g><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></g>} />,
    AlertTriangle: (p) => <Icon {...p} path={<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>} />,
    Undo: (p) => <Icon {...p} path={<><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></>} />,
    Redo: (p) => <Icon {...p} path={<><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></>} />,
};

// --- MTG Color Identities ---
// Add new colour identities here (used by IdentityIcon and ProfilePage)
const MTG_IDENTITIES = {
    // Mono
    'White': { colors: ['#F0F2C0'], symbol: 'prod/w' },
    'Blue': { colors: ['#B3CEEA'], symbol: 'prod/u' },
    'Black': { colors: ['#A69F9D'], symbol: 'prod/b' },
    'Red': { colors: ['#EBA082'], symbol: 'prod/r' },
    'Green': { colors: ['#C4D3CA'], symbol: 'prod/g' },
    'Colorless': { colors: ['#CBCBCB'], symbol: 'prod/c' },
    // Guilds (2 Color)
    'Azorius': { colors: ['#F0F2C0', '#B3CEEA'], description: 'White/Blue' },
    'Dimir': { colors: ['#B3CEEA', '#A69F9D'], description: 'Blue/Black' },
    'Rakdos': { colors: ['#A69F9D', '#EBA082'], description: 'Black/Red' },
    'Gruul': { colors: ['#EBA082', '#C4D3CA'], description: 'Red/Green' },
    'Selesnya': { colors: ['#F0F2C0', '#C4D3CA'], description: 'White/Green' },
    'Orzhov': { colors: ['#F0F2C0', '#A69F9D'], description: 'White/Black' },
    'Izzet': { colors: ['#B3CEEA', '#EBA082'], description: 'Blue/Red' },
    'Golgari': { colors: ['#A69F9D', '#C4D3CA'], description: 'Black/Green' },
    'Boros': { colors: ['#F0F2C0', '#EBA082'], description: 'White/Red' },
    'Simic': { colors: ['#B3CEEA', '#C4D3CA'], description: 'Blue/Green' },
    // Shards (3 Color)
    'Bant': { colors: ['#F0F2C0', '#B3CEEA', '#C4D3CA'], description: 'WUG' },
    'Esper': { colors: ['#F0F2C0', '#B3CEEA', '#A69F9D'], description: 'WUB' },
    'Grixis': { colors: ['#B3CEEA', '#A69F9D', '#EBA082'], description: 'UBR' },
    'Jund': { colors: ['#A69F9D', '#EBA082', '#C4D3CA'], description: 'BRG' },
    'Naya': { colors: ['#F0F2C0', '#EBA082', '#C4D3CA'], description: 'WRG' },
    // Wedges (3 Color)
    'Abzan': { colors: ['#F0F2C0', '#A69F9D', '#C4D3CA'], description: 'WBG' },
    'Jeskai': { colors: ['#F0F2C0', '#B3CEEA', '#EBA082'], description: 'WUR' },
    'Sultai': { colors: ['#A69F9D', '#C4D3CA', '#B3CEEA'], description: 'BGU' },
    'Mardu': { colors: ['#F0F2C0', '#A69F9D', '#EBA082'], description: 'WBR' },
    'Temur': { colors: ['#C4D3CA', '#B3CEEA', '#EBA082'], description: 'GUR' },
    // 5 Color
    'WUBRG': { colors: ['#F0F2C0', '#B3CEEA', '#A69F9D', '#EBA082', '#C4D3CA'], description: 'All Colors' },
};

const IdentityIcon = ({ id, size = "w-6 h-6" }) => {
    const data = MTG_IDENTITIES[id] || MTG_IDENTITIES['Colorless'];
    const gradient = data.colors.length > 1
        ? `linear-gradient(135deg, ${data.colors.join(', ')})`
        : data.colors[0];
    return (
        <div
            className={`${size} rounded-full shadow-inner border border-[var(--border)]`}
            style={{ background: gradient }}
            title={id}
        />
    );
};

// Expose to window for main module and other external scripts
window.Icon = Icon;
window.Icons = Icons;
window.MTG_IDENTITIES = MTG_IDENTITIES;
window.IdentityIcon = IdentityIcon;
