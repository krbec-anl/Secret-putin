'use client';
/* eslint-disable */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

// ---------- COLOR PALETTES ----------

const DARK = {
  bg: '#0f1117', sidebar: '#161821', card: '#1a1d2e', cardHover: '#222640',
  border: '#2d3148', accent: '#6366f1', accentHover: '#818cf8',
  text: '#e2e8f0', textDim: '#94a3b8', textMuted: '#64748b',
  green: '#22c55e', red: '#ef4444', orange: '#f97316', yellow: '#eab308',
  blue: '#3b82f6', purple: '#a855f7', cyan: '#06b6d4',
};

const LIGHT = {
  bg: '#F7F8FA', sidebar: '#FFFFFF', card: '#FFFFFF', cardHover: '#F7F7F7',
  border: '#E0E0E0', accent: '#FF385C', accentHover: '#E31C5F',
  text: '#222222', textDim: '#717171', textMuted: '#B0B0B0',
  green: '#008A05', red: '#C13515', orange: '#E07912', yellow: '#9A7400',
  blue: '#0076FC', purple: '#8B5CF6', cyan: '#0891B2',
};

// Status colors (invariant across themes, used by helpers)
export const STATUS_COLORS = {
  green: '#22c55e', red: '#ef4444', orange: '#f97316', yellow: '#eab308',
};

// ---------- CSS GENERATOR ----------

function makeCSS(T, isDark) {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { color-scheme: ${isDark ? 'dark' : 'light'}; }
    body {
      background: ${T.bg}; color: ${T.text};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px; line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      transition: background .3s ease, color .3s ease;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${T.textMuted}; }
    input, select, textarea { font-family: inherit; font-size: inherit; color-scheme: ${isDark ? 'dark' : 'light'}; }
    input::placeholder, textarea::placeholder { color: ${T.textMuted}; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn .3s ease; }
    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  `;
}

// ---------- STYLES GENERATOR ----------

function makeStyles(T, isDark) {
  const shadow = isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)';
  const shadowHover = isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.1)';

  return {
    card: {
      background: T.card, borderRadius: 16,
      border: `1px solid ${T.border}`,
      padding: 24, marginBottom: 16,
      boxShadow: shadow,
    },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 },
    btn: (active) => ({
      padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
      background: active ? T.accent : (isDark ? T.card : '#fff'),
      color: active ? '#fff' : T.text,
      fontSize: 14, fontWeight: 500, transition: 'all .2s',
      boxShadow: active ? 'none' : (isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)'),
      border: active ? 'none' : `1px solid ${T.border}`,
    }),
    input: {
      background: isDark ? T.card : '#fff',
      border: `1px solid ${T.border}`, borderRadius: 10,
      padding: '12px 16px', color: T.text, fontSize: 15,
      width: '100%', outline: 'none', transition: 'border-color .2s',
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: {
      textAlign: 'left', padding: '14px 16px',
      borderBottom: `2px solid ${T.border}`,
      color: T.textDim, fontWeight: 600, fontSize: 13,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    td: { padding: '14px 16px', borderBottom: `1px solid ${T.border}22`, height: 52 },
    badge: (color) => ({
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      background: color + '22', color: color, fontSize: 12, fontWeight: 600,
    }),
    tag: (color) => ({
      display: 'inline-block', padding: '3px 10px', borderRadius: 8,
      background: color + '22', color: color, fontSize: 12, fontWeight: 600,
    }),
    tooltip: {
      backgroundColor: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, color: T.text, fontSize: 13,
      boxShadow: shadowHover,
    },
    shadow, shadowHover,
  };
}

// ---------- THEME CONTEXT ----------

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spravujto-theme');
      if (saved === 'light') setIsDark(false);
    } catch {}
    setMounted(true);
  }, []);

  const value = useMemo(() => {
    const T = isDark ? DARK : LIGHT;
    const s = makeStyles(T, isDark);
    return { T, s, isDark, mounted, toggleTheme: () => setIsDark(d => !d) };
  }, [isDark, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem('spravujto-theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark, mounted]);

  useEffect(() => {
    let style = document.getElementById('app-theme-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'app-theme-css';
      document.head.appendChild(style);
    }
    style.textContent = makeCSS(value.T, value.isDark);
  }, [value.T, value.isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
