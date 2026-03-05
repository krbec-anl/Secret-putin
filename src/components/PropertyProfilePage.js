/* eslint-disable */
import React, { useState, useRef } from 'react';
import { useTheme } from '../theme';
import ICONS from '../icons';
import { fmtCZK, fmtDate } from '../helpers';
import { MAINTENANCE } from '../data/mockData';
import { StatCard } from './shared';

const OBL_CATEGORIES = {
  all: 'Vše',
  revize: 'Revize',
  pojistka: 'Pojištění',
  smlouva: 'Smlouvy',
  hygiena: 'Bezpečnost',
  povoleni: 'Povolení',
  jine: 'Jiné',
};

const OBL_CAT_COLORS = {
  revize: '#3b82f6',
  pojistka: '#22c55e',
  smlouva: '#a855f7',
  hygiena: '#f97316',
  povoleni: '#06b6d4',
  jine: '#64748b',
};

function getOblStatus(expiryDate) {
  if (!expiryDate) return { label: 'Neurčeno', color: '#64748b' };
  const diff = Math.floor((new Date(expiryDate) - new Date()) / 864e5);
  if (diff < 0) return { label: `${Math.abs(diff)}d po termínu`, color: '#ef4444' };
  if (diff <= 30) return { label: `Zbývá ${diff}d`, color: '#f97316' };
  if (diff <= 90) return { label: `Zbývá ${diff}d`, color: '#eab308' };
  return { label: `Zbývá ${diff}d`, color: '#22c55e' };
}

export default function PropertyProfilePage({ propertyId, properties, onBack, documents, onAddDoc, onDeleteDoc, onUpdateProperty, onDeleteProperty }) {
  const { T, s, isDark } = useTheme();
  const p = properties.find(x => x.id === propertyId);
  const [tab, setTab] = useState('overview');

  // Edit property
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', city: '', ownership: 'own', owner: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Units CRUD
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addUnitForm, setAddUnitForm] = useState({ id: '', type: '', area: '', rent: '' });
  const [editUnit, setEditUnit] = useState(null);
  const [editUnitForm, setEditUnitForm] = useState({});
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [tenantForm, setTenantForm] = useState({ tenant: '', deposit: '', contractEnd: '' });
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(false);

  // Obligations CRUD
  const [oblFilter, setOblFilter] = useState('all');
  const [showAddObl, setShowAddObl] = useState(false);
  const [addOblForm, setAddOblForm] = useState({ name: '', category: 'revize', expiryDate: '', documentName: '' });
  const [editObl, setEditObl] = useState(null);
  const [editOblForm, setEditOblForm] = useState({});
  const [confirmDeleteObl, setConfirmDeleteObl] = useState(false);

  // Maintenance CRUD
  const [showAddMaint, setShowAddMaint] = useState(false);
  const [addMaintForm, setAddMaintForm] = useState({ unit: '', title: '', priority: 'medium', desc: '' });

  if (!p) return <div style={{ color: T.textDim, padding: 40 }}>Nemovitost nenalezena.</div>;

  const occ = p.units.filter(u => u.status === 'occupied').length;
  const income = p.units.filter(u => u.status === 'occupied').reduce((a, u) => a + u.rent, 0);
  const debtors = p.units.filter(u => u.balance < 0);
  const totalDebt = debtors.reduce((a, u) => a + u.balance, 0);
  const propMaint = MAINTENANCE.filter(m => m.property.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) && p.name.toLowerCase().split(' ')[0].length > 2);

  const tabs = [
    { id: 'overview', label: 'Přehled' },
    { id: 'units', label: 'Jednotky' },
    { id: 'obligations', label: 'Povinnosti & Dokumenty' },
    { id: 'maintenance', label: 'Údržba' },
  ];

  // ---- HANDLERS ----

  const startEdit = () => {
    setEditForm({ name: p.name, address: p.address, city: p.city, ownership: p.ownership, owner: p.owner || '' });
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.address.trim()) return;
    onUpdateProperty({ ...p, ...editForm, owner: editForm.ownership === 'foreign' ? editForm.owner.trim() : null });
    setShowEdit(false);
  };

  const handleAddUnit = () => {
    if (!addUnitForm.id.trim() || !addUnitForm.type.trim()) return;
    const newUnit = {
      id: addUnitForm.id.trim(), type: addUnitForm.type.trim(),
      area: Number(addUnitForm.area) || 0, rent: Number(addUnitForm.rent) || 0,
      tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0,
    };
    onUpdateProperty({ ...p, units: [...p.units, newUnit], totalUnits: p.totalUnits + 1 });
    setAddUnitForm({ id: '', type: '', area: '', rent: '' });
    setShowAddUnit(false);
  };

  const startEditUnit = (u) => {
    setEditUnit(u.id);
    setEditUnitForm({ type: u.type, area: u.area, rent: u.rent });
  };

  const saveEditUnit = (uid) => {
    const units = p.units.map(u => u.id === uid ? { ...u, type: editUnitForm.type, area: Number(editUnitForm.area), rent: Number(editUnitForm.rent) } : u);
    const mi = units.filter(u => u.status === 'occupied').reduce((a, u) => a + u.rent, 0);
    onUpdateProperty({ ...p, units, monthlyIncome: mi });
    setEditUnit(null);
  };

  const deleteUnit = (uid) => {
    const units = p.units.filter(u => u.id !== uid);
    onUpdateProperty({ ...p, units, totalUnits: units.length, monthlyIncome: units.filter(u => u.status === 'occupied').reduce((a, u) => a + u.rent, 0) });
    setConfirmDeleteUnit(false);
  };

  const assignTenant = (uid) => {
    setShowTenantForm(uid);
    setTenantForm({ tenant: '', deposit: '', contractEnd: '' });
  };

  const saveTenant = (uid) => {
    if (!tenantForm.tenant.trim()) return;
    const units = p.units.map(u => u.id === uid ? {
      ...u, tenant: tenantForm.tenant.trim(), status: 'occupied',
      deposit: Number(tenantForm.deposit) || 0, contractEnd: tenantForm.contractEnd || null,
    } : u);
    const mi = units.filter(u => u.status === 'occupied').reduce((a, u) => a + u.rent, 0);
    onUpdateProperty({ ...p, units, monthlyIncome: mi });
    setShowTenantForm(false);
  };

  const removeTenant = (uid) => {
    const units = p.units.map(u => u.id === uid ? { ...u, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 } : u);
    const mi = units.filter(u => u.status === 'occupied').reduce((a, u) => a + u.rent, 0);
    onUpdateProperty({ ...p, units, monthlyIncome: mi });
  };

  const handleAddObl = () => {
    if (!addOblForm.name.trim()) return;
    const newObl = {
      id: Date.now(), name: addOblForm.name.trim(), category: addOblForm.category,
      expiryDate: addOblForm.expiryDate || null, documentName: addOblForm.documentName.trim() || null,
    };
    onUpdateProperty({ ...p, obligations: [...(p.obligations || []), newObl] });
    setAddOblForm({ name: '', category: 'revize', expiryDate: '', documentName: '' });
    setShowAddObl(false);
  };

  const startEditObl = (obl) => {
    setEditObl(obl.id);
    setEditOblForm({ name: obl.name, category: obl.category, expiryDate: obl.expiryDate || '', documentName: obl.documentName || '' });
  };

  const saveEditObl = (oblId) => {
    const obligations = (p.obligations || []).map(o => o.id === oblId ? {
      ...o, name: editOblForm.name, category: editOblForm.category,
      expiryDate: editOblForm.expiryDate || null, documentName: editOblForm.documentName.trim() || null,
    } : o);
    onUpdateProperty({ ...p, obligations });
    setEditObl(null);
  };

  const deleteObl = (oblId) => {
    onUpdateProperty({ ...p, obligations: (p.obligations || []).filter(o => o.id !== oblId) });
    setConfirmDeleteObl(false);
  };

  const handleAddMaint = () => {
    if (!addMaintForm.title.trim()) return;
    // Maintenance is stored globally, we just show it here. For now, add to property name match.
    setAddMaintForm({ unit: '', title: '', priority: 'medium', desc: '' });
    setShowAddMaint(false);
  };

  // ---- MODAL HELPER ----
  const Modal = ({ children, onClose, width = 500 }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...s.card, maxWidth: width, width: '100%', border: `1px solid ${T.accent}44`, padding: 28, marginBottom: 0 }}>
        {children}
      </div>
    </div>
  );

  const FieldLabel = ({ children }) => (
    <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 4 }}>{children}</label>
  );

  // ---- STAT BLOCK ----
  const statBlock = (label, value, color) => (
    <div style={{ background: isDark ? T.bg : T.border + '33', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    </div>
  );

  // ======== TAB: OVERVIEW ========
  const renderOverview = () => (
    <div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statBlock('Bytů celkem', p.totalUnits)}
        {statBlock('Obsazeno', `${occ}/${p.totalUnits}`, T.green)}
        {statBlock('Obsazenost', p.totalUnits ? `${((occ / p.totalUnits) * 100).toFixed(0)}%` : '—', T.green)}
        {statBlock('Příjem/měs', fmtCZK(income), T.cyan)}
        {statBlock('Dluh celkem', totalDebt < 0 ? fmtCZK(totalDebt) : '0 Kč', totalDebt < 0 ? T.red : T.green)}
        {statBlock('Vlastnictví', p.ownership === 'own' ? 'Vlastní' : 'Cizí', p.ownership === 'own' ? T.green : T.purple)}
      </div>

      {p.ownership === 'foreign' && (
        <div style={{ ...s.card, background: T.purple + '11', border: `1px solid ${T.purple}33` }}>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Vlastník</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.purple }}>{p.owner}</div>
        </div>
      )}

      {/* Debtors */}
      {debtors.length > 0 && (
        <div style={{ ...s.card, background: T.red + '08', border: `1px solid ${T.red}22` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.red, marginBottom: 12 }}>Dlužníci ({debtors.length})</div>
          {debtors.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${T.border}22` }}>
              <span style={{ color: T.textDim }}>Byt {u.id} — {u.tenant}</span>
              <span style={{ color: T.red, fontWeight: 600 }}>{fmtCZK(u.balance)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick summary: upcoming obligations */}
      {(p.obligations || []).length > 0 && (
        <div style={{ ...s.card }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Nejbližší povinnosti</div>
          {[...(p.obligations || [])].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)).slice(0, 5).map(obl => {
            const st = getOblStatus(obl.expiryDate);
            return (
              <div key={obl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}22` }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{obl.name}</span>
                  <span style={{ ...s.badge(OBL_CAT_COLORS[obl.category] || '#64748b'), marginLeft: 8, fontSize: 10, padding: '2px 8px' }}>
                    {OBL_CATEGORIES[obl.category] || obl.category}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: T.textDim }}>{fmtDate(obl.expiryDate)}</span>
                  <span style={{ ...s.badge(st.color), fontSize: 10, padding: '2px 8px' }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ======== TAB: UNITS ========
  const renderUnits = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: T.textDim }}>{p.units.length} jednotek celkem</div>
        <button onClick={() => setShowAddUnit(true)} style={{ ...s.btn(true), display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
          {ICONS.plus} Přidat jednotku
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead><tr>
            <th style={s.th}>Byt</th><th style={s.th}>Typ</th><th style={s.th}>m²</th>
            <th style={s.th}>Nájemné</th><th style={s.th}>Nájemník</th>
            <th style={s.th}>Smlouva do</th><th style={s.th}>Kauce</th>
            <th style={s.th}>Saldo</th><th style={s.th}>Stav</th><th style={s.th}>Akce</th>
          </tr></thead>
          <tbody>
            {p.units.map(u => (
              <tr key={u.id}>
                <td style={{ ...s.td, fontWeight: 600 }}>{u.id}</td>
                {editUnit === u.id ? (
                  <>
                    <td style={s.td}><input value={editUnitForm.type} onChange={e => setEditUnitForm({ ...editUnitForm, type: e.target.value })} style={{ ...s.input, padding: '6px 10px', fontSize: 13 }} /></td>
                    <td style={s.td}><input value={editUnitForm.area} onChange={e => setEditUnitForm({ ...editUnitForm, area: e.target.value })} style={{ ...s.input, padding: '6px 10px', fontSize: 13, width: 60 }} /></td>
                    <td style={s.td}><input value={editUnitForm.rent} onChange={e => setEditUnitForm({ ...editUnitForm, rent: e.target.value })} style={{ ...s.input, padding: '6px 10px', fontSize: 13, width: 80 }} /></td>
                  </>
                ) : (
                  <>
                    <td style={s.td}>{u.type}</td>
                    <td style={s.td}>{u.area}</td>
                    <td style={s.td}>{fmtCZK(u.rent)}</td>
                  </>
                )}
                <td style={s.td}>{u.tenant || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>—</span>}</td>
                <td style={s.td}>{fmtDate(u.contractEnd)}</td>
                <td style={s.td}>{u.deposit ? fmtCZK(u.deposit) : '—'}</td>
                <td style={{ ...s.td, color: u.balance < 0 ? T.red : T.green, fontWeight: u.balance < 0 ? 600 : 400 }}>
                  {u.balance !== 0 ? fmtCZK(u.balance) : '0 Kč'}
                </td>
                <td style={s.td}>
                  <span style={s.badge(u.status === 'occupied' ? T.green : T.red)}>
                    {u.status === 'occupied' ? 'Obsazeno' : 'Volný'}
                  </span>
                </td>
                <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                  {editUnit === u.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => saveEditUnit(u.id)} style={{ ...s.btn(true), padding: '4px 10px', fontSize: 11 }}>Uložit</button>
                      <button onClick={() => setEditUnit(null)} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 11 }}>Zrušit</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => startEditUnit(u)} style={{ ...s.btn(false), padding: '4px 8px', fontSize: 11 }} title="Upravit">{ICONS.edit}</button>
                      {u.status === 'vacant' ? (
                        <button onClick={() => assignTenant(u.id)} style={{ ...s.btn(false), padding: '4px 8px', fontSize: 11, color: T.green }} title="Přiřadit nájemníka">{ICONS.people}</button>
                      ) : (
                        <button onClick={() => removeTenant(u.id)} style={{ ...s.btn(false), padding: '4px 8px', fontSize: 11, color: T.red }} title="Ukončit nájem">{ICONS.people}</button>
                      )}
                      <button onClick={() => setConfirmDeleteUnit(u.id)} style={{ ...s.btn(false), padding: '4px 8px', fontSize: 11, color: T.red }} title="Smazat">{ICONS.trash}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add unit modal */}
      {showAddUnit && (
        <Modal onClose={() => setShowAddUnit(false)}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Nová jednotka</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><FieldLabel>Označení bytu *</FieldLabel><input value={addUnitForm.id} onChange={e => setAddUnitForm({ ...addUnitForm, id: e.target.value })} placeholder="např. 4A" style={s.input} /></div>
            <div><FieldLabel>Typ *</FieldLabel><input value={addUnitForm.type} onChange={e => setAddUnitForm({ ...addUnitForm, type: e.target.value })} placeholder="např. 2+1" style={s.input} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><FieldLabel>Plocha m²</FieldLabel><input type="number" value={addUnitForm.area} onChange={e => setAddUnitForm({ ...addUnitForm, area: e.target.value })} style={s.input} /></div>
              <div><FieldLabel>Nájemné Kč</FieldLabel><input type="number" value={addUnitForm.rent} onChange={e => setAddUnitForm({ ...addUnitForm, rent: e.target.value })} style={s.input} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddUnit(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
            <button onClick={handleAddUnit} style={{ ...s.btn(true), padding: '8px 16px', opacity: addUnitForm.id.trim() && addUnitForm.type.trim() ? 1 : 0.5 }}>Přidat</button>
          </div>
        </Modal>
      )}

      {/* Assign tenant modal */}
      {showTenantForm && (
        <Modal onClose={() => setShowTenantForm(false)}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Přiřadit nájemníka — Byt {showTenantForm}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><FieldLabel>Jméno nájemníka *</FieldLabel><input value={tenantForm.tenant} onChange={e => setTenantForm({ ...tenantForm, tenant: e.target.value })} placeholder="např. Jan Novák" style={s.input} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><FieldLabel>Kauce Kč</FieldLabel><input type="number" value={tenantForm.deposit} onChange={e => setTenantForm({ ...tenantForm, deposit: e.target.value })} style={s.input} /></div>
              <div><FieldLabel>Smlouva do</FieldLabel><input type="date" value={tenantForm.contractEnd} onChange={e => setTenantForm({ ...tenantForm, contractEnd: e.target.value })} style={s.input} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowTenantForm(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
            <button onClick={() => saveTenant(showTenantForm)} style={{ ...s.btn(true), padding: '8px 16px', opacity: tenantForm.tenant.trim() ? 1 : 0.5 }}>Uložit</button>
          </div>
        </Modal>
      )}

      {/* Confirm delete unit */}
      {confirmDeleteUnit && (
        <Modal onClose={() => setConfirmDeleteUnit(false)} width={380}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: T.red }}>Smazat byt {confirmDeleteUnit}?</h3>
          <p style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>Tato akce je nevratná.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDeleteUnit(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
            <button onClick={() => deleteUnit(confirmDeleteUnit)} style={{ ...s.btn(true), padding: '8px 16px', background: T.red }}>Smazat</button>
          </div>
        </Modal>
      )}
    </div>
  );

  // ======== TAB: OBLIGATIONS & DOCUMENTS ========
  const renderObligations = () => {
    const obligations = p.obligations || [];
    const filtered = oblFilter === 'all' ? obligations : obligations.filter(o => o.category === oblFilter);
    const sorted = [...filtered].sort((a, b) => new Date(a.expiryDate || '2099-01-01') - new Date(b.expiryDate || '2099-01-01'));

    return (
      <div>
        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(OBL_CATEGORIES).map(([key, label]) => (
              <button key={key} onClick={() => setOblFilter(key)} style={{
                ...s.btn(oblFilter === key), padding: '6px 14px', fontSize: 12,
              }}>{label} {key !== 'all' ? `(${obligations.filter(o => o.category === key).length})` : `(${obligations.length})`}</button>
            ))}
          </div>
          <button onClick={() => setShowAddObl(true)} style={{ ...s.btn(true), display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
            {ICONS.plus} Přidat povinnost
          </button>
        </div>

        {/* Obligations list */}
        {sorted.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: 40, color: T.textMuted }}>Žádné povinnosti v této kategorii</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(obl => {
              const st = getOblStatus(obl.expiryDate);
              const isEditing = editObl === obl.id;
              const catColor = OBL_CAT_COLORS[obl.category] || '#64748b';

              if (isEditing) {
                return (
                  <div key={obl.id} style={{ ...s.card, marginBottom: 0, border: `1px solid ${T.accent}44` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><FieldLabel>Název *</FieldLabel><input value={editOblForm.name} onChange={e => setEditOblForm({ ...editOblForm, name: e.target.value })} style={s.input} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <FieldLabel>Kategorie</FieldLabel>
                          <select value={editOblForm.category} onChange={e => setEditOblForm({ ...editOblForm, category: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                            {Object.entries(OBL_CATEGORIES).filter(([k]) => k !== 'all').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div><FieldLabel>Platnost do</FieldLabel><input type="date" value={editOblForm.expiryDate} onChange={e => setEditOblForm({ ...editOblForm, expiryDate: e.target.value })} style={s.input} /></div>
                      </div>
                      <div><FieldLabel>Dokument</FieldLabel><input value={editOblForm.documentName} onChange={e => setEditOblForm({ ...editOblForm, documentName: e.target.value })} placeholder="Název dokumentu" style={s.input} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditObl(null)} style={{ ...s.btn(false), padding: '8px 16px', fontSize: 13 }}>Zrušit</button>
                      <button onClick={() => saveEditObl(obl.id)} style={{ ...s.btn(true), padding: '8px 16px', fontSize: 13 }}>Uložit</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={obl.id} style={{ ...s.card, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: catColor, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{obl.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ ...s.badge(catColor), fontSize: 10, padding: '2px 8px' }}>{OBL_CATEGORIES[obl.category] || obl.category}</span>
                        {obl.documentName && <span style={{ fontSize: 11, color: T.textDim }}>{obl.documentName}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: T.textDim }}>{fmtDate(obl.expiryDate)}</div>
                      <span style={{ ...s.badge(st.color), fontSize: 10, padding: '2px 8px' }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => startEditObl(obl)} style={{ ...s.btn(false), padding: '4px 8px', fontSize: 11 }} title="Upravit">{ICONS.edit}</button>
                      <button onClick={() => setConfirmDeleteObl(obl.id)} style={{ ...s.btn(false), padding: '4px 8px', fontSize: 11, color: T.red }} title="Smazat">{ICONS.trash}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add obligation modal */}
        {showAddObl && (
          <Modal onClose={() => setShowAddObl(false)}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Nová povinnost</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><FieldLabel>Název *</FieldLabel><input value={addOblForm.name} onChange={e => setAddOblForm({ ...addOblForm, name: e.target.value })} placeholder="např. Revize komínu" style={s.input} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel>Kategorie *</FieldLabel>
                  <select value={addOblForm.category} onChange={e => setAddOblForm({ ...addOblForm, category: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                    {Object.entries(OBL_CATEGORIES).filter(([k]) => k !== 'all').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><FieldLabel>Platnost do</FieldLabel><input type="date" value={addOblForm.expiryDate} onChange={e => setAddOblForm({ ...addOblForm, expiryDate: e.target.value })} style={s.input} /></div>
              </div>
              <div><FieldLabel>Název dokumentu</FieldLabel><input value={addOblForm.documentName} onChange={e => setAddOblForm({ ...addOblForm, documentName: e.target.value })} placeholder="např. Revize komín 2025.pdf" style={s.input} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddObl(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
              <button onClick={handleAddObl} style={{ ...s.btn(true), padding: '8px 16px', opacity: addOblForm.name.trim() ? 1 : 0.5 }}>Přidat</button>
            </div>
          </Modal>
        )}

        {/* Confirm delete obligation */}
        {confirmDeleteObl && (
          <Modal onClose={() => setConfirmDeleteObl(false)} width={380}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: T.red }}>Smazat povinnost?</h3>
            <p style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>Tato akce je nevratná.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteObl(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
              <button onClick={() => deleteObl(confirmDeleteObl)} style={{ ...s.btn(true), padding: '8px 16px', background: T.red }}>Smazat</button>
            </div>
          </Modal>
        )}
      </div>
    );
  };

  // ======== TAB: MAINTENANCE ========
  const renderMaintenance = () => {
    const priorityColors = { high: T.red, medium: T.orange, low: T.green };
    const priorityLabels = { high: 'Vysoká', medium: 'Střední', low: 'Nízká' };
    const statusLabels = { new: 'Nový', in_progress: 'Řeší se', resolved: 'Vyřešeno' };
    const statusColors = { new: T.blue, in_progress: T.orange, resolved: T.green };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: T.textDim }}>{propMaint.length} tiketů</div>
          <button onClick={() => setShowAddMaint(true)} style={{ ...s.btn(true), display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
            {ICONS.plus} Nový tiket
          </button>
        </div>

        {propMaint.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: 40, color: T.textMuted }}>Žádné tikety údržby pro tuto nemovitost</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {propMaint.map(m => (
              <div key={m.id} style={{ ...s.card, marginBottom: 0, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Byt {m.unit} — {fmtDate(m.created)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={s.badge(priorityColors[m.priority])}>{priorityLabels[m.priority]}</span>
                    <span style={s.badge(statusColors[m.status])}>{statusLabels[m.status]}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.textDim }}>{m.desc}</div>
                {m.assignee && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Přiřazeno: {m.assignee}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Add maintenance modal */}
        {showAddMaint && (
          <Modal onClose={() => setShowAddMaint(false)}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Nový tiket údržby</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><FieldLabel>Titulek *</FieldLabel><input value={addMaintForm.title} onChange={e => setAddMaintForm({ ...addMaintForm, title: e.target.value })} placeholder="např. Prasklá trubka" style={s.input} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><FieldLabel>Byt</FieldLabel><input value={addMaintForm.unit} onChange={e => setAddMaintForm({ ...addMaintForm, unit: e.target.value })} placeholder="např. 2A" style={s.input} /></div>
                <div>
                  <FieldLabel>Priorita</FieldLabel>
                  <select value={addMaintForm.priority} onChange={e => setAddMaintForm({ ...addMaintForm, priority: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                    <option value="low">Nízká</option>
                    <option value="medium">Střední</option>
                    <option value="high">Vysoká</option>
                  </select>
                </div>
              </div>
              <div><FieldLabel>Popis</FieldLabel><textarea value={addMaintForm.desc} onChange={e => setAddMaintForm({ ...addMaintForm, desc: e.target.value })} rows={3} placeholder="Popis závady..." style={{ ...s.input, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddMaint(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
              <button onClick={handleAddMaint} style={{ ...s.btn(true), padding: '8px 16px', opacity: addMaintForm.title.trim() ? 1 : 0.5 }}>Vytvořit</button>
            </div>
          </Modal>
        )}
      </div>
    );
  };

  // ======== MAIN RENDER ========
  return (
    <div className="fade-in">
      {/* Back button + header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          color: T.accent, fontSize: 14, fontWeight: 500, padding: 0, marginBottom: 16,
        }}>
          {ICONS.arrowLeft} Zpět na seznam
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>{p.name}</h1>
            <div style={{ color: T.textDim, fontSize: 14, marginTop: 2 }}>{p.address}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={s.badge(p.ownership === 'own' ? T.green : T.purple)}>
              {p.ownership === 'own' ? 'Vlastní' : 'Cizí'}
            </span>
            <button onClick={startEdit} style={{ ...s.btn(false), padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              {ICONS.edit} Upravit
            </button>
            <button onClick={() => setConfirmDelete(true)} style={{ ...s.btn(false), padding: '6px 14px', fontSize: 13, color: T.red }}>
              {ICONS.trash} Smazat
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? T.accent : T.textDim,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
            marginBottom: -2, transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && renderOverview()}
      {tab === 'units' && renderUnits()}
      {tab === 'obligations' && renderObligations()}
      {tab === 'maintenance' && renderMaintenance()}

      {/* Edit property modal */}
      {showEdit && (
        <Modal onClose={() => setShowEdit(false)}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Upravit nemovitost</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><FieldLabel>Název *</FieldLabel><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={s.input} /></div>
            <div><FieldLabel>Adresa *</FieldLabel><input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={s.input} /></div>
            <div><FieldLabel>Město</FieldLabel><input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} style={s.input} /></div>
            <div>
              <FieldLabel>Vlastnictví</FieldLabel>
              <select value={editForm.ownership} onChange={e => setEditForm({ ...editForm, ownership: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="own">Vlastní</option>
                <option value="foreign">Cizí</option>
              </select>
            </div>
            {editForm.ownership === 'foreign' && (
              <div><FieldLabel>Vlastník</FieldLabel><input value={editForm.owner} onChange={e => setEditForm({ ...editForm, owner: e.target.value })} style={s.input} /></div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowEdit(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
            <button onClick={saveEdit} style={{ ...s.btn(true), padding: '8px 16px' }}>Uložit</button>
          </div>
        </Modal>
      )}

      {/* Confirm delete property */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(false)} width={400}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: T.red }}>Smazat nemovitost {p.name}?</h3>
          <p style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>Budou smazány i všechny jednotky, dokumenty a povinnosti. Tato akce je nevratná.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDelete(false)} style={{ ...s.btn(false), padding: '8px 16px' }}>Zrušit</button>
            <button onClick={() => onDeleteProperty(p.id)} style={{ ...s.btn(true), padding: '8px 16px', background: T.red }}>Smazat</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
