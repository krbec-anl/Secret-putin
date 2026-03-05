/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { T, CSS } from './theme';
import ICONS from './icons';
import {
  INITIAL_PROPERTIES, INITIAL_MATRIX, INITIAL_DOCUMENTS,
  NAV_SECTIONS, NAV_FLAT,
} from './data/mockData';

import Dashboard from './components/Dashboard';
import PropertiesPage from './components/PropertiesPage';
import TenantsPage from './components/TenantsPage';
import FinancePage from './components/FinancePage';
import ObligationsPage from './components/ObligationsPage';
import MaintenancePage from './components/MaintenancePage';
import CommunicationPage from './components/CommunicationPage';
import OwnerPortalPage from './components/OwnerPortalPage';
import PropertyProfilePage from './components/PropertyProfilePage';

// ============================================================
//  MAIN APP
// ============================================================

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [profilePropertyId, setProfilePropertyId] = useState(null);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [oblMatrix, setOblMatrix] = useState(INITIAL_MATRIX);
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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

  const openPropertyProfile = useCallback((propertyId) => {
    setProfilePropertyId(propertyId);
    setPage('propertyProfile');
  }, []);

  const handleAddProperty = useCallback((newProp) => {
    setProperties(prev => [...prev, newProp]);
  }, []);

  const handleUpdateProperty = useCallback((updatedProp) => {
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
  }, []);

  const handleDeleteProperty = useCallback((propId) => {
    setProperties(prev => prev.filter(p => p.id !== propId));
    setDocuments(prev => prev.filter(d => d.propertyId !== propId));
    setPage('properties');
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
      case 'tenants': return <TenantsPage properties={properties} />;
      case 'finance': return <FinancePage properties={properties} />;
      case 'obligations': return <ObligationsPage matrix={oblMatrix} onUpdateCell={handleUpdateCell} />;
      case 'maintenance': return <MaintenancePage />;
      case 'communication': return <CommunicationPage />;
      case 'owners': return <OwnerPortalPage properties={properties} />;
      case 'propertyProfile': return (
        <PropertyProfilePage
          propertyId={profilePropertyId}
          properties={properties}
          onBack={() => setPage('properties')}
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

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth, background: T.sidebar,
        borderRight: `1px solid ${T.border}`, padding: '20px 0',
        display: 'flex', flexDirection: 'column', position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, height: '100vh', zIndex: 50, overflowY: 'auto',
        transform: showSidebar ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
        transition: 'transform .3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '8px 22px 22px', borderBottom: `1px solid ${T.border}`, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#fff',
            }}>S</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>Spravuj.to</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 0, letterSpacing: '0.3px' }}>SPRÁVA NEMOVITOSTÍ</div>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '6px 12px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: 8 }}>
              <div style={{
                padding: '12px 16px 6px',
                fontSize: 11, fontWeight: 700, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '1.2px',
              }}>
                {section.title}
              </div>
              {section.items.map(item => {
                const active = page === item.id || (page === 'propertyProfile' && item.id === 'properties');
                return (
                  <button key={item.id}
                    onClick={() => {
                      setPage(item.id);
                      if (item.id !== 'properties') setProfilePropertyId(null);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '11px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: active ? T.accent + '18' : 'transparent',
                      color: active ? T.accent : T.textDim,
                      fontSize: 14, fontWeight: active ? 600 : 400,
                      textAlign: 'left', transition: 'all .15s', marginBottom: 2,
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = T.card;
                        e.currentTarget.style.color = T.text;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = T.textDim;
                      }
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', width: 22, justifyContent: 'center', opacity: active ? 1 : 0.7 }}>
                      {ICONS[item.icon]}
                    </span>
                    {item.label}
                    {item.id === 'obligations' && oblAlertCount > 0 ? (
                      <span style={{
                        marginLeft: 'auto', background: T.red, color: '#fff',
                        fontSize: 10, fontWeight: 700, borderRadius: 10,
                        padding: '2px 6px', minWidth: 18, textAlign: 'center', lineHeight: '1.4',
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
          padding: '12px 20px', borderTop: `1px solid ${T.border}`,
          fontSize: 11, color: T.textMuted, display: 'flex', justifyContent: 'space-between',
        }}>
          <span>v1.0</span>
          <span>2026</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30, background: T.bg + 'ee',
          backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'none', border: 'none', color: T.text, fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>
                {sidebarOpen ? '\u2715' : '\u2630'}
              </button>
            )}
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {page === 'propertyProfile'
                ? `Nemovitosti / ${properties.find(p => p.id === profilePropertyId)?.name || ''}`
                : (NAV_FLAT.find(n => n.id === page)?.label || 'Dashboard')
              }
            </span>
          </div>
          <div style={{ fontSize: 12, color: T.textDim }}>
            {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
