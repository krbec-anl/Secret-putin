/* eslint-disable */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../theme';
import ICONS from '../icons';
import { fmtDate, getRevColor, getRevLabel } from '../helpers';
import { OBL_OBJECTS } from '../data/mockData';
import { SectionTitle } from './shared';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Neuvedeno' },
  { value: '1×měsíc', label: '1×měsíc' },
  { value: '1×rok', label: '1×rok' },
  { value: '1×2roky', label: '1×2roky' },
  { value: '1×3roky', label: '1×3roky' },
  { value: '1×4roky', label: '1×4roky' },
  { value: '1×5let', label: '1×5let' },
];

export default function ObligationsPage({ matrix, onUpdateCell, onOpenPropertyProfile, revisionTypes, onAddRevType, onDeleteRevType }) {
  const { T, s, isDark } = useTheme();
  const [view, setView] = useState('matrix');
  const [detail, setDetail] = useState(null);

  // Panel edit state
  const [panelDeadline, setPanelDeadline] = useState('');
  const [panelCompany, setPanelCompany] = useState('');
  const [panelDocs, setPanelDocs] = useState([]);
  const [panelNotApplicable, setPanelNotApplicable] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef(null);

  // Add/delete column modals
  const [showAddCol, setShowAddCol] = useState(false);
  const [addColForm, setAddColForm] = useState({ name: '', frequency: '', supplier: '' });
  const [confirmDeleteCol, setConfirmDeleteCol] = useState(null);

  const getCell = useCallback((obj, rt) => {
    return matrix[obj]?.[rt] || { deadline: null, docs: [], company: '', notApplicable: false };
  }, [matrix]);

  const openDetail = (obj, rt) => {
    const cell = getCell(obj, rt);
    setDetail({ object: obj, revType: rt });
    setPanelDeadline(cell.deadline || '');
    setPanelCompany(cell.company || '');
    setPanelDocs([...cell.docs]);
    setPanelNotApplicable(!!cell.notApplicable);
    setShowUpload(false);
    setShowHistory(false);
    setUploadName('');
  };

  const closeDetail = () => {
    setDetail(null);
    setUploadName('');
    setShowUpload(false);
    setShowHistory(false);
  };

  const handleSave = () => {
    if (!detail) return;
    onUpdateCell(detail.object, detail.revType, {
      deadline: panelNotApplicable ? null : (panelDeadline || null),
      docs: panelNotApplicable ? [] : panelDocs,
      company: panelCompany,
      notApplicable: panelNotApplicable,
    });
    closeDetail();
  };

  const handleUploadDoc = () => {
    if (!detail || !uploadName.trim()) return;
    const newDoc = { id: 'rd' + Date.now(), name: uploadName, date: new Date().toISOString().split('T')[0], size: '— KB' };
    setPanelDocs([newDoc, ...panelDocs]);
    setUploadName('');
    setShowUpload(false);
  };

  const handleDeleteDoc = (docId) => {
    setPanelDocs(panelDocs.filter(d => d.id !== docId));
  };

  const handleAddCol = () => {
    if (!addColForm.name.trim()) return;
    if (revisionTypes.some(rt => rt.name === addColForm.name.trim())) return;
    onAddRevType({ name: addColForm.name.trim(), frequency: addColForm.frequency, supplier: addColForm.supplier.trim() });
    setAddColForm({ name: '', frequency: '', supplier: '' });
    setShowAddCol(false);
  };

  const handleDeleteCol = (name) => {
    onDeleteRevType(name);
    setConfirmDeleteCol(null);
  };

  // Build flat list for list/timeline views
  const allItems = useMemo(() => {
    const items = [];
    OBL_OBJECTS.forEach(obj => {
      revisionTypes.forEach(rt => {
        const cell = matrix[obj]?.[rt.name];
        if (cell?.deadline && !cell?.notApplicable) {
          items.push({ object: obj, type: rt.name, supplier: rt.supplier, period: rt.frequency, date: cell.deadline, docs: cell.docs, company: cell.company });
        }
      });
    });
    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [matrix, revisionTypes]);

  const timeline = useMemo(() => {
    const groups = {};
    allItems.forEach(it => {
      const m = it.date.substring(0, 7);
      if (!groups[m]) groups[m] = [];
      groups[m].push(it);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allItems]);

  // ---- MODAL HELPER ----
  const Modal = ({ children, onClose, width = 500 }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...s.card, maxWidth: width, width: '100%', border: `1px solid ${T.accent}44`, padding: 28, marginBottom: 0 }}>
        {children}
      </div>
    </div>
  );

  const FieldLabel = ({ children }) => (
    <label style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>{children}</label>
  );

  // ---- SLIDING PANEL ----
  const currentDoc = panelDocs[0] || null;
  const historyDocs = panelDocs.slice(1);
  const detailRt = detail ? revisionTypes.find(r => r.name === detail.revType) : null;
  const lastRevisionDate = currentDoc?.date || null;

  const SlidingPanel = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      pointerEvents: detail ? 'auto' : 'none',
    }}>
      <div
        onClick={closeDetail}
        style={{
          position: 'absolute', inset: 0,
          background: detail ? 'rgba(0,0,0,0.5)' : 'transparent',
          backdropFilter: detail ? 'blur(4px)' : 'none',
          transition: 'all .3s ease',
        }}
      />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 500, maxWidth: '100vw',
        background: T.sidebar,
        borderLeft: `1px solid ${T.border}`,
        transform: detail ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: detail ? '-8px 0 32px rgba(0,0,0,0.4)' : 'none',
      }}>
        {detail && (
          <>
            {/* Header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${T.border}`,
              background: panelNotApplicable ? T.textMuted + '08' : (panelDeadline ? getRevColor(panelDeadline) + '08' : 'transparent'),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{detail.object}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, color: T.accent, fontWeight: 600 }}>{detail.revType}</span>
                    {detailRt?.frequency && <span style={s.tag(T.textMuted)}>{detailRt.frequency}</span>}
                  </div>
                </div>
                <button onClick={closeDetail} style={{
                  background: T.card, border: `1px solid ${T.border}`, color: T.textDim,
                  fontSize: 16, cursor: 'pointer', padding: '6px 10px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{'\u2715'}</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

              {/* N/A toggle */}
              <div style={{
                marginBottom: 20, padding: 14, borderRadius: 10,
                background: panelNotApplicable ? T.orange + '11' : T.bg,
                border: `1px solid ${panelNotApplicable ? T.orange + '33' : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: panelNotApplicable ? T.orange : T.text }}>Nevztahuje se na tuto nemovitost</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Pokud je zapnuto, buňka bude zobrazena jako N/A</div>
                </div>
                <button
                  onClick={() => setPanelNotApplicable(!panelNotApplicable)}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: panelNotApplicable ? T.orange : T.border,
                    position: 'relative', transition: 'background .2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, transition: 'left .2s',
                    left: panelNotApplicable ? 25 : 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {panelNotApplicable ? (
                <div style={{ textAlign: 'center', padding: 40, color: T.textMuted }}>
                  <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>N/A</div>
                  <div style={{ fontSize: 13 }}>Tato revize se nevztahuje na objekt {detail.object}</div>
                </div>
              ) : (
                <>
                  {/* Last revision date */}
                  <div style={{ marginBottom: 20 }}>
                    <FieldLabel>Datum poslední revize</FieldLabel>
                    <div style={{
                      ...s.input, background: T.card, cursor: 'default',
                      color: lastRevisionDate ? T.text : T.textMuted,
                    }}>
                      {lastRevisionDate ? fmtDate(lastRevisionDate) : 'Žádný dokument — datum neznámé'}
                    </div>
                  </div>

                  {/* Next revision date */}
                  <div style={{ marginBottom: 20 }}>
                    <FieldLabel>Datum příští revize</FieldLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="date"
                        value={panelDeadline}
                        onChange={e => setPanelDeadline(e.target.value)}
                        style={{ ...s.input, width: 'auto', minWidth: 180, colorScheme: isDark ? 'dark' : 'light' }}
                      />
                      {panelDeadline && (
                        <span style={{ ...s.tag(getRevColor(panelDeadline)), fontSize: 12, padding: '4px 10px' }}>
                          {getRevLabel(panelDeadline)}
                        </span>
                      )}
                      {panelDeadline && (
                        <button onClick={() => setPanelDeadline('')} style={{
                          background: 'none', border: 'none', color: T.red, cursor: 'pointer',
                          fontSize: 12, display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px',
                        }}>
                          {ICONS.trash}
                        </button>
                      )}
                    </div>
                    {!panelDeadline && (
                      <div style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic', marginTop: 6 }}>Nenastaveno</div>
                    )}
                  </div>

                  {/* Company */}
                  <div style={{ marginBottom: 24 }}>
                    <FieldLabel>Firma</FieldLabel>
                    <input
                      value={panelCompany}
                      onChange={e => setPanelCompany(e.target.value)}
                      placeholder="např. Enetep, p.Šavel..."
                      style={s.input}
                    />
                  </div>

                  <div style={{ height: 1, background: T.border, marginBottom: 20 }} />

                  {/* Current document */}
                  <div style={{ marginBottom: 16 }}>
                    <FieldLabel>Dokument</FieldLabel>
                    {currentDoc ? (
                      <div style={{
                        background: T.accent + '0d', border: `1px solid ${T.accent}22`, borderRadius: 10, padding: 14,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <span style={{ color: T.accent, display: 'flex', flexShrink: 0 }}>{ICONS.doc}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentDoc.name}</div>
                              <div style={{ fontSize: 12, color: T.textMuted }}>{fmtDate(currentDoc.date)} · {currentDoc.size}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button style={{
                              background: T.accent + '22', color: T.accent, border: 'none',
                              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex',
                            }} title="Zobrazit">{ICONS.eye}</button>
                            <button style={{
                              background: T.green + '22', color: T.green, border: 'none',
                              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex',
                            }} title="Stáhnout">{ICONS.download}</button>
                            <button onClick={() => handleDeleteDoc(currentDoc.id)} style={{
                              background: T.red + '22', color: T.red, border: 'none',
                              borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex',
                            }} title="Smazat">{ICONS.trash}</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: T.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>
                        Žádný dokument
                      </div>
                    )}
                  </div>

                  {/* Upload new doc */}
                  {!showUpload ? (
                    <button onClick={() => setShowUpload(true)} style={{
                      ...s.btn(false), display: 'flex', alignItems: 'center', gap: 6,
                      border: `1px dashed ${T.accent}44`, color: T.accent, width: '100%', justifyContent: 'center',
                      padding: '10px 16px', marginBottom: 16,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.accent + '11'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {ICONS.upload} {currentDoc ? 'Nahrát nový (stávající → historie)' : 'Nahrát dokument'}
                    </button>
                  ) : (
                    <div style={{
                      background: T.bg, borderRadius: 10, padding: 14, marginBottom: 16,
                      border: `1px solid ${T.accent}33`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Nahrát nový dokument</div>
                      {currentDoc && (
                        <div style={{
                          fontSize: 12, color: T.orange, marginBottom: 8, padding: '6px 8px',
                          background: T.orange + '11', borderRadius: 6,
                        }}>
                          Stávající „{currentDoc.name}" se přesune do historie.
                        </div>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <input
                          value={uploadName}
                          onChange={e => setUploadName(e.target.value)}
                          placeholder={`např. Revize ${detail.revType} ${new Date().getFullYear()}.pdf`}
                          style={s.input}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => fileRef.current?.click()} style={{
                          ...s.btn(false), display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
                          border: `1px dashed ${T.border}`,
                        }}>
                          {ICONS.folder} Soubor
                        </button>
                        <input ref={fileRef} type="file" style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && !uploadName) setUploadName(file.name);
                          }}
                        />
                        <div style={{ flex: 1 }} />
                        <button onClick={() => { setShowUpload(false); setUploadName(''); }} style={{ ...s.btn(false), fontSize: 13 }}>Zrušit</button>
                        <button onClick={handleUploadDoc} style={{
                          ...s.btn(true), fontSize: 13, opacity: uploadName.trim() ? 1 : 0.5,
                        }}>Nahrát</button>
                      </div>
                    </div>
                  )}

                  {/* History */}
                  {historyDocs.length > 0 && (
                    <div>
                      <button onClick={() => setShowHistory(!showHistory)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                        fontSize: 13, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.5px',
                        marginBottom: showHistory ? 10 : 0,
                      }}>
                        <span style={{ transition: 'transform .2s', transform: showHistory ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block' }}>&#9654;</span>
                        Historie ({historyDocs.length})
                      </button>
                      {showHistory && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {historyDocs.map(doc => (
                            <div key={doc.id} style={{
                              background: T.bg, borderRadius: 8, padding: '8px 12px',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                              border: `1px solid ${T.border}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                <span style={{ color: T.textMuted, display: 'flex', flexShrink: 0 }}>{ICONS.doc}</span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                                  <div style={{ fontSize: 11, color: T.textMuted }}>{fmtDate(doc.date)} · {doc.size}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                <button style={{
                                  background: T.accent + '22', color: T.accent, border: 'none',
                                  borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'flex',
                                }} title="Zobrazit">{ICONS.eye}</button>
                                <button style={{
                                  background: T.green + '22', color: T.green, border: 'none',
                                  borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'flex',
                                }} title="Stáhnout">{ICONS.download}</button>
                                <button onClick={() => handleDeleteDoc(doc.id)} style={{
                                  background: T.red + '15', color: T.red, border: 'none',
                                  borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'flex',
                                }} title="Smazat">{ICONS.trash}</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: `1px solid ${T.border}`,
              display: 'flex', gap: 10, justifyContent: 'flex-end',
            }}>
              <button onClick={closeDetail} style={{ ...s.btn(false), padding: '10px 20px' }}>Zavřít</button>
              <button onClick={handleSave} style={{ ...s.btn(true), padding: '10px 24px' }}>Uložit</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {SlidingPanel}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <SectionTitle>Povinnosti a revize</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['matrix', 'Matice'], ['list', 'Seznam'], ['timeline', 'Časová osa']].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} style={s.btn(view === k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* ===== MATRIX VIEW ===== */}
      {view === 'matrix' && (
        <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
          {/* Add column button */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddCol(true)} style={{ ...s.btn(true), display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
              {ICONS.plus} Přidat typ revize
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...s.table, minWidth: Math.max(1400, 190 + revisionTypes.length * 130), fontSize: 13, borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, position: 'sticky', left: 0, background: T.card, zIndex: 2, minWidth: 190, fontSize: 13 }}>Objekt</th>
                  {revisionTypes.map((rt) => (
                    <th key={rt.id} style={{
                      ...s.th, textAlign: 'center', minWidth: 130, padding: '14px 10px',
                      verticalAlign: 'bottom', position: 'relative',
                    }}>
                      <button
                        onClick={() => setConfirmDeleteCol(rt.name)}
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#FF385C', fontSize: 18, fontWeight: 700,
                          lineHeight: 1, padding: '2px 5px', borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#c1112e'; e.currentTarget.style.transform = 'scale(1.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#FF385C'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title={`Smazat sloupec ${rt.name}`}
                      >
                        &times;
                      </button>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{rt.name}</div>
                      {rt.frequency && <div style={{ fontWeight: 500, fontSize: 12, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{rt.frequency}</div>}
                      {rt.supplier && <div style={{ fontWeight: 500, fontSize: 12, color: T.cyan, marginTop: 2 }}>{rt.supplier}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OBL_OBJECTS.map((obj, oi) => (
                  <tr key={oi}>
                    <td style={{ ...s.td, fontWeight: 600, position: 'sticky', left: 0, background: T.card, zIndex: 1, whiteSpace: 'nowrap', fontSize: 13 }}>
                      <span
                        onClick={(e) => { e.stopPropagation(); if (onOpenPropertyProfile) onOpenPropertyProfile(obj); }}
                        style={{ cursor: 'pointer', transition: 'color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = T.accent}
                        onMouseLeave={e => e.currentTarget.style.color = T.text}
                      >{obj}</span>
                    </td>
                    {revisionTypes.map((rt) => {
                      const cell = getCell(obj, rt.name);
                      const isNA = cell.notApplicable;
                      const d = cell.deadline;
                      const color = getRevColor(d);
                      const hasDoc = cell.docs.length > 0;
                      return (
                        <td key={rt.id} style={{ ...s.td, textAlign: 'center', padding: '4px 3px', verticalAlign: 'top', height: 'auto' }}>
                          <div
                            onClick={() => openDetail(obj, rt.name)}
                            style={{
                              borderRadius: 10, padding: '10px 8px', lineHeight: '1.3', cursor: 'pointer',
                              transition: 'all .15s', minHeight: 70,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                              ...(isNA ? {
                                background: T.textMuted + '0a',
                                border: `1px solid ${T.textMuted}15`,
                              } : d ? {
                                background: color + '12',
                                border: `1px solid ${color}20`,
                              } : {
                                background: 'transparent',
                                border: `1px dashed ${T.textMuted}22`,
                              }),
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                              if (!isNA) e.currentTarget.style.borderColor = d ? color + '55' : T.accent + '55';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)';
                              if (!isNA) e.currentTarget.style.borderColor = d ? color + '20' : T.textMuted + '22';
                            }}
                          >
                            {isNA ? (
                              <span style={{ color: T.textMuted, fontSize: 13, fontWeight: 600, textDecoration: 'line-through', opacity: 0.5 }}>N/A</span>
                            ) : d ? (
                              <>
                                <div style={{ color, fontSize: 13, fontWeight: 700 }}>{fmtDate(d)}</div>
                                <div style={{ fontSize: 11, color, opacity: 0.8, marginTop: 2 }}>{getRevLabel(d)}</div>
                                {hasDoc && (
                                  <div style={{
                                    position: 'absolute', top: 3, right: 4,
                                    color: T.accent, display: 'flex', opacity: 0.7,
                                  }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span style={{ color: T.textMuted, fontSize: 18, opacity: 0.4 }}>+</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[[T.red, 'Po termínu'], [T.orange, 'Do 30 dní'], [T.yellow, 'Do 90 dní'], [T.green, 'OK']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.textDim }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} /> {l}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.textDim }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Má dokument
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.textDim }}>
                <span style={{ color: T.textMuted, fontSize: 13, fontWeight: 600, textDecoration: 'line-through', opacity: 0.5 }}>N/A</span> Nevztahuje se
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.textDim }}>
                <span style={{ color: T.textMuted, fontSize: 16 }}>+</span> Klikni pro nastavení
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {view === 'list' && (
        <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Stav</th><th style={s.th}>Objekt</th><th style={s.th}>Typ revize</th>
                <th style={s.th}>Dodavatel</th><th style={s.th}>Perioda</th><th style={s.th}>Termín</th><th style={s.th}>Zbývá</th><th style={s.th}>Dokument</th>
              </tr></thead>
              <tbody>
                {allItems.map((it, i) => {
                  const color = getRevColor(it.date);
                  const hasDoc = it.docs.length > 0;
                  return (
                    <tr key={i} style={{ cursor: 'pointer' }}
                      onClick={() => openDetail(it.object, it.type)}
                      onMouseEnter={e => e.currentTarget.style.background = T.card}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={s.td}><div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} /></td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{it.object}</td>
                      <td style={s.td}>{it.type}</td>
                      <td style={{ ...s.td, color: T.cyan }}>{it.company || it.supplier || '—'}</td>
                      <td style={{ ...s.td, color: T.textDim }}>{it.period || '—'}</td>
                      <td style={s.td}>{fmtDate(it.date)}</td>
                      <td style={{ ...s.td, color, fontWeight: 600 }}>{getRevLabel(it.date)}</td>
                      <td style={s.td}>
                        {hasDoc ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.accent, fontSize: 13, fontWeight: 500 }}>
                            {ICONS.doc} {it.docs[0].name.length > 25 ? it.docs[0].name.slice(0, 23) + '…' : it.docs[0].name}
                            {it.docs.length > 1 && <span style={s.tag(T.textMuted)}>+{it.docs.length - 1}</span>}
                          </span>
                        ) : (
                          <span style={{ color: T.textMuted, fontSize: 13 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TIMELINE VIEW ===== */}
      {view === 'timeline' && (
        <div>
          {timeline.map(([month, items]) => {
            const [y, m] = month.split('-');
            const monthNames = ['', 'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
            const label = `${monthNames[parseInt(m)]} ${y}`;
            const isPast = new Date(y, parseInt(m) - 1, 28) < new Date();
            return (
              <div key={month} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: isPast ? T.red : T.accent, flexShrink: 0 }} />
                  <div style={{ height: 1, flex: 1, background: T.border }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: isPast ? T.red : T.text, whiteSpace: 'nowrap' }}>{label}</div>
                </div>
                <div style={{ marginLeft: 7, borderLeft: `2px solid ${T.border}`, paddingLeft: 24 }}>
                  {items.map((it, i) => {
                    const hasDoc = it.docs.length > 0;
                    return (
                      <div key={i}
                        onClick={() => openDetail(it.object, it.type)}
                        style={{ ...s.card, padding: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{it.object}</div>
                          <div style={{ color: T.textDim, fontSize: 13 }}>
                            {it.type} {it.company || it.supplier ? `(${it.company || it.supplier})` : ''}
                            {hasDoc && <span style={{ color: T.accent, marginLeft: 8 }}>{ICONS.doc} {it.docs.length} dok.</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: T.textDim }}>{fmtDate(it.date)}</span>
                          <span style={s.tag(getRevColor(it.date))}>{getRevLabel(it.date)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add column modal */}
      {showAddCol && (
        <Modal onClose={() => setShowAddCol(false)}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: T.text }}>Nový typ revize</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <FieldLabel>Název *</FieldLabel>
              <input value={addColForm.name} onChange={e => setAddColForm({ ...addColForm, name: e.target.value })} placeholder="např. EPS" style={s.input} autoFocus />
            </div>
            <div>
              <FieldLabel>Frekvence</FieldLabel>
              <select value={addColForm.frequency} onChange={e => setAddColForm({ ...addColForm, frequency: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                {FREQUENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                <option value="custom">Vlastní...</option>
              </select>
              {addColForm.frequency === 'custom' && (
                <input
                  value=""
                  onChange={e => setAddColForm({ ...addColForm, frequency: e.target.value })}
                  placeholder="např. 1×6let"
                  style={{ ...s.input, marginTop: 8 }}
                />
              )}
            </div>
            <div>
              <FieldLabel>Firma</FieldLabel>
              <input value={addColForm.supplier} onChange={e => setAddColForm({ ...addColForm, supplier: e.target.value })} placeholder="např. Enetep" style={s.input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddCol(false)} style={{ ...s.btn(false), padding: '10px 20px' }}>Zrušit</button>
            <button onClick={handleAddCol} style={{ ...s.btn(true), padding: '10px 20px', opacity: addColForm.name.trim() ? 1 : 0.5 }}>Přidat</button>
          </div>
        </Modal>
      )}

      {/* Confirm delete column */}
      {confirmDeleteCol && (
        <Modal onClose={() => setConfirmDeleteCol(null)} width={400}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: T.red }}>Smazat sloupec „{confirmDeleteCol}"?</h3>
          <p style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>Tato akce smaže sloupec ze všech nemovitostí včetně všech dat a dokumentů. Tato akce je nevratná.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDeleteCol(null)} style={{ ...s.btn(false), padding: '10px 20px' }}>Zrušit</button>
            <button onClick={() => handleDeleteCol(confirmDeleteCol)} style={{ ...s.btn(true), padding: '10px 20px', background: T.red }}>Smazat</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
