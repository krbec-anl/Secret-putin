'use client';
/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider, useTheme } from './theme';
import ICONS from './icons';
import {
  INITIAL_PROPERTIES, INITIAL_MATRIX, INITIAL_DOCUMENTS,
  NAV_SECTIONS, NAV_FLAT, REV_TYPES as INITIAL_REV_TYPES, OBL_OBJECTS,
} from './data/mockData';
const APP_VERSION = '0.5.1';

import Dashboard from './components/Dashboard';
import PropertiesPage from './components/PropertiesPage';
import TenantsPage from './components/TenantsPage';
import FinancePage from './components/FinancePage';
import ObligationsPage from './components/ObligationsPage';
import MaintenancePage from './components/MaintenancePage';
import CommunicationPage from './components/CommunicationPage';
import OwnerPortalPage from './components/OwnerPortalPage';
import PropertyProfilePage from './components/PropertyProfilePage';
import PropertyProfile from './components/PropertyProfile';

// Sun / Moon icons for theme toggle
const SunIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ============================================================
//  INNER APP (needs theme context)
// ============================================================

function AppInner() {
  const { T, s, isDark, mounted, toggleTheme } = useTheme();

  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profilePropertyId, setProfilePropertyId] = useState(null);
  const [panelPropertyId, setPanelPropertyId] = useState(null);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [oblMatrix, setOblMatrix] = useState(INITIAL_MATRIX);
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [revisionTypes, setRevisionTypes] = useState(() =>
    INITIAL_REV_TYPES.map((rt, i) => ({ id: i + 1, name: rt.name, frequency: rt.period, supplier: rt.supplier }))
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddDoc = useCallback((doc) => {
    setDocuments(prev => [doc, ...prev]);
  }, []);

  const handleDeleteDoc = useCallback((docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  }, []);

  const handleUpdateCell = useCallback((obj, rt, newCell) => {
    setOblMatrix(prev => ({
      ...prev,
      [obj]: { ...prev[obj], [rt]: newCell },
    }));
  }, []);

  const handleAddRevType = useCallback((newType) => {
    setRevisionTypes(prev => [...prev, { ...newType, id: Date.now() }]);
    setOblMatrix(prev => {
      const next = { ...prev };
      OBL_OBJECTS.forEach(obj => {
        next[obj] = { ...next[obj], [newType.name]: { deadline: null, docs: [], company: newType.supplier || '' } };
      });
      return next;
    });
  }, []);

  const handleDeleteRevType = useCallback((typeName) => {
    setRevisionTypes(prev => prev.filter(rt => rt.name !== typeName));
    setOblMatrix(prev => {
      const next = {};
      Object.entries(prev).forEach(([obj, cells]) => {
        const { [typeName]: _, ...rest } = cells;
        next[obj] = rest;
      });
      return next;
    });
  }, []);

  const openPropertyProfile = useCallback((propertyId) => {
    setProfilePropertyId(propertyId);
    setPage('propertyProfile');
  }, []);

  const openPropertyProfileByName = useCallback((name) => {
    const match = properties.find(p => name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) && p.name.toLowerCase().split(' ')[0].length > 2);
    if (match) {
      setProfilePropertyId(match.id);
      setPage('propertyProfile');
    }
  }, [properties]);

  const panelProperty = useMemo(() => {
    if (panelPropertyId === null) return null;
    if (typeof panelPropertyId === 'number') {
      return properties.find(x => x.id === panelPropertyId) || null;
    }
    return { id: panelPropertyId, name: panelPropertyId, address: '', city: '', units: [], obligations: [], ownership: 'own', owner: null, totalUnits: 0, monthlyIncome: 0 };
  }, [panelPropertyId, properties]);

  const handleAddProperty = useCallback((newProp) => {
    setProperties(prev => [...prev, newProp]);
  }, []);

  const handleUpdateProperty = useCallback((updatedProp) => {
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
  }, []);

  const handleDeleteProperty = useCallback((propId) => {
    setProperties(prev => prev.filter(p => p.id !== propId));
    setDocuments(prev => prev.filter(d => d.propertyId !== propId));
    setPage('propertyList');
    setProfilePropertyId(null);
  }, []);

  const oblAlertCount = useMemo(() => {
    let count = 0;
    Object.values(oblMatrix).forEach(obj => {
      Object.values(obj).forEach(cell => {
        if (cell.deadline) {
          const diff = Math.floor((new Date(cell.deadline) - new Date()) / 864e5);
          if (diff <= 30) count++;
        }
      });
    });
    return count;
  }, [oblMatrix]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard properties={properties} oblMatrix={oblMatrix} />;
      case 'properties': return <PropertiesPage properties={properties} onOpenProfile={openPropertyProfile} onAddProperty={handleAddProperty} />;
      case 'propertyList': return <PropertiesPage properties={properties} onOpenProfile={openPropertyProfile} onAddProperty={handleAddProperty} />;
      case 'tenants': return <TenantsPage properties={properties} />;
      case 'finance': return <FinancePage properties={properties} />;
      case 'obligations': return <ObligationsPage matrix={oblMatrix} onUpdateCell={handleUpdateCell} onOpenPropertyProfile={openPropertyProfileByName} revisionTypes={revisionTypes} onAddRevType={handleAddRevType} onDeleteRevType={handleDeleteRevType} />;
      case 'maintenance': return <MaintenancePage />;
      case 'communication': return <CommunicationPage />;
      case 'owners': return <OwnerPortalPage properties={properties} />;
      case 'propertyProfile': return (
        <PropertyProfilePage
          propertyId={profilePropertyId}
          properties={properties}
          onBack={() => setPage('propertyList')}
          documents={documents}
          onAddDoc={handleAddDoc}
          onDeleteDoc={handleDeleteDoc}
          onUpdateProperty={handleUpdateProperty}
          onDeleteProperty={handleDeleteProperty}
        />
      );
      default: return <Dashboard properties={properties} />;
    }
  };

  const sidebarWidth = 280;
  const showSidebar = !isMobile || sidebarOpen;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside style={{
        width: sidebarWidth, background: T.sidebar,
        borderRight: `1px solid ${T.border}`, padding: '24px 0',
        display: 'flex', flexDirection: 'column', position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, height: '100vh', zIndex: 50, overflowY: 'auto',
        transform: showSidebar ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
        transition: 'transform .3s ease',
        boxShadow: isDark ? 'none' : '2px 0 12px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{ padding: '8px 24px 24px', borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>S</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>Spravuj.to</div>
              <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.5px', fontWeight: 500 }}>SPRÁVA NEMOVITOSTÍ</div>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '8px 14px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: 12 }}>
              <div style={{
                padding: '14px 16px 8px',
                fontSize: 11, fontWeight: 700, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '1.2px',
              }}>
                {section.title}
              </div>
              {section.items.map(item => {
                const active = page === item.id || (page === 'propertyProfile' && item.id === 'propertyList');
                return (
                  <button key={item.id}
                    onClick={() => {
                      setPage(item.id);
                      if (item.id !== 'properties') setProfilePropertyId(null);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                      padding: '0 16px', height: 48, borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      background: active ? T.accent + '15' : 'transparent',
                      color: active ? T.accent : T.textDim,
                      fontSize: 15, fontWeight: active ? 600 : 400,
                      textAlign: 'left', transition: 'all .15s',
                      marginBottom: 2,
                      borderLeft: active ? `3px solid ${T.accent}` : '3px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = isDark ? T.card : T.cardHover;
                        e.currentTarget.style.color = T.text;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = T.textDim;
                      }
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', width: 24, justifyContent: 'center', opacity: active ? 1 : 0.6 }}>
                      {ICONS[item.icon]}
                    </span>
                    {item.label}
                    {item.id === 'obligations' && oblAlertCount > 0 ? (
                      <span style={{
                        marginLeft: 'auto', background: T.red, color: '#fff',
                        fontSize: 10, fontWeight: 700, borderRadius: 10,
                        padding: '2px 7px', minWidth: 20, textAlign: 'center', lineHeight: '1.4',
                      }}>
                        {oblAlertCount}
                      </span>
                    ) : active ? (
                      <div style={{
                        marginLeft: 'auto', width: 7, height: 7,
                        borderRadius: '50%', background: T.accent,
                      }} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${T.border}`,
          fontSize: 12, color: T.textMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 500 }}>v{APP_VERSION}</span>
          <span>2026</span>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: isDark ? T.bg + 'ee' : T.sidebar + 'f0',
          backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}`,
          padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'none', border: 'none', color: T.text, fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>
                {sidebarOpen ? '\u2715' : '\u2630'}
              </button>
            )}
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {page === 'propertyProfile'
                ? `Seznam nemovitostí / ${properties.find(p => p.id === profilePropertyId)?.name || ''}`
                : (NAV_FLAT.find(n => n.id === page)?.label || 'Dashboard')
              }
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>v{APP_VERSION}</span>
            <span style={{ fontSize: 13, color: T.textDim }}>
              {mounted ? new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '\u00A0'}
            </span>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
              style={{
                background: isDark ? T.card : '#fff',
                border: `1px solid ${T.border}`,
                borderRadius: 10, cursor: 'pointer',
                padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDark ? T.yellow : T.orange,
                transition: 'all .2s',
                boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
            >
              {isDark ? SunIcon : MoonIcon}
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: isMobile ? 16 : 28, maxWidth: 1440 }}>
          {renderPage()}
        </div>
      </main>

      {/* Property Profile Sliding Panel */}
      {panelProperty && (
        <PropertyProfile
          key={panelPropertyId}
          property={panelProperty}
          isOpen={!!panelProperty}
          onClose={() => setPanelPropertyId(null)}
          onUpdateProperty={handleUpdateProperty}
        />
      )}
    </div>
  );
}

// ============================================================
//  ROOT PAGE (wraps with ThemeProvider)
// ============================================================

export default function Home() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
