// =============================================================
//  Theme Config + ThemeContext + ThemeProvider
//  Loaded by tcg.html via:
//    <script type="text/babel" src="./js/themes.js"></script>
//
//  To add a new theme:
//    1. Add a [data-theme="your-id"] block in css/themes.css
//    2. Add a matching entry to THEME_CONFIG below
// =============================================================

// Theme metadata used by SettingsPage to render the picker swatches.
// preview: [background, accent, card]  — three colours shown as dots
const THEME_CONFIG = [
    {
        id: 'dark-purple',
        label: 'Dark Purple',
        desc: 'Default — deep space vibes',
        preview: ['#020617', '#9333ea', '#1e293b'],
    },
    {
        id: 'light',
        label: 'Light',
        desc: 'Clean & crisp with purple',
        preview: ['#f8fafc', '#7c3aed', '#e2e8f0'],
    },
    {
        id: 'dark-red',
        label: 'Dark Red',
        desc: 'Crimson battle mode',
        preview: ['#0a0000', '#dc2626', '#1f0d0d'],
    },
    // ---- Add new themes below this line ----
];

// ThemeContext — consumed in any component via React.useContext(window.ThemeContext)
const ThemeContext = React.createContext({ theme: 'dark-purple', setTheme: () => { } });

// ThemeProvider — wraps the whole app in tcg.html
const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = React.useState(() => localStorage.getItem('mtg_theme') || 'dark-purple');
    const setTheme = (t) => {
        setThemeState(t);
        localStorage.setItem('mtg_theme', t);
        document.documentElement.setAttribute('data-theme', t);
    };
    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    return React.createElement(ThemeContext.Provider, { value: { theme, setTheme } }, children);
};

// Expose to main module
window.THEME_CONFIG = THEME_CONFIG;
window.ThemeContext = ThemeContext;
window.ThemeProvider = ThemeProvider;
