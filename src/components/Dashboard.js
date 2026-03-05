/* eslint-disable */
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { T, s, tooltipStyle } from '../theme';
import { fmtCZK, fmtDate, getRevColor, getRevLabel } from '../helpers';
import { FINANCE_MONTHLY } from '../data/mockData';
import { StatCard, SectionTitle, SubTitle } from './shared';

export default function Dashboard({ properties, oblMatrix }) {
  const allUnits = properties.flatMap(p => p.units);
  const totalUnits = allUnits.length;
  const occupied = allUnits.filter(u => u.status === 'occupied').length;
  const occupancy = ((occupied / totalUnits) * 100).toFixed(1);
  const totalIncome = properties.reduce((a, p) => a + p.monthlyIncome, 0);

  const urgentRevisions = useMemo(() => {
    let count = 0;
    Object.values(oblMatrix).forEach(obj => {
      Object.values(obj).forEach(cell => {
        if (cell.deadline && new Date(cell.deadline) < new Date()) count++;
      });
    });
    return count;
  }, [oblMatrix]);

  const upcomingRevisions = useMemo(() => {
    const items = [];
    Object.entries(oblMatrix).forEach(([obj, types]) => {
      Object.entries(types).forEach(([type, cell]) => {
        if (cell.deadline) {
          const diff = Math.floor((new Date(cell.deadline) - new Date()) / 864e5);
          if (diff <= 90) items.push({ object: obj, type, date: cell.deadline, diff });
        }
      });
    });
    return items.sort((a, b) => a.diff - b.diff).slice(0, 5);
  }, [oblMatrix]);

  const debtors = useMemo(() => {
    const list = [];
    properties.forEach(p => p.units.forEach(u => {
      if (u.balance < 0) list.push({ tenant: u.tenant, property: p.name, unit: u.id, amount: u.balance });
    }));
    return list.sort((a, b) => a.amount - b.amount);
  }, [properties]);

  const expiringContracts = useMemo(() => {
    const list = [];
    const limit = new Date();
    limit.setDate(limit.getDate() + 90);
    properties.forEach(p => p.units.forEach(u => {
      if (u.contractEnd && new Date(u.contractEnd) <= limit) {
        list.push({ tenant: u.tenant, property: p.name, unit: u.id, end: u.contractEnd });
      }
    }));
    return list.sort((a, b) => new Date(a.end) - new Date(b.end));
  }, [properties]);

  const portfolio = properties.reduce((acc, p) => {
    const key = p.city;
    const ex = acc.find(x => x.name === key);
    if (ex) ex.value += p.totalUnits; else acc.push({ name: key, value: p.totalUnits });
    return acc;
  }, []);
  const PIE_COLORS = [T.accent, T.cyan, T.purple, T.orange, T.green];

  return (
    <div className="fade-in">
      <SectionTitle>Dashboard</SectionTitle>
      <div style={s.grid4}>
        <StatCard label="Celkem bytů" value={totalUnits} sub={`${properties.length} nemovitostí`} color={T.accent} />
        <StatCard label="Obsazenost" value={`${occupancy}%`} sub={`${occupied} z ${totalUnits} obsazeno`} color={T.green} />
        <StatCard label="Měsíční příjmy" value={fmtCZK(totalIncome)} sub="Celkem nájemné" color={T.cyan} />
        <StatCard label="Urgentní revize" value={urgentRevisions} sub="Po termínu" color={urgentRevisions > 0 ? T.red : T.green} />
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <SubTitle>Příjmy vs Výdaje</SubTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={FINANCE_MONTHLY} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={{ stroke: T.border }} />
              <YAxis tick={{ fill: T.textDim, fontSize: 11 }} axisLine={{ stroke: T.border }} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCZK(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: T.textDim }} />
              <Bar dataKey="income" name="Příjmy" fill={T.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Výdaje" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.card}>
          <SubTitle>Struktura portfolia</SubTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={portfolio} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {portfolio.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <SubTitle>Dlužníci</SubTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Nájemník</th><th style={s.th}>Nemovitost</th><th style={s.th}>Byt</th><th style={{ ...s.th, textAlign: 'right' }}>Dluh</th>
              </tr></thead>
              <tbody>
                {debtors.map((d, i) => (
                  <tr key={i}>
                    <td style={s.td}>{d.tenant}</td>
                    <td style={{ ...s.td, color: T.textDim }}>{d.property}</td>
                    <td style={s.td}>{d.unit}</td>
                    <td style={{ ...s.td, textAlign: 'right', color: T.red, fontWeight: 600 }}>{fmtCZK(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={s.card}>
          <SubTitle>Končící smlouvy (90 dní)</SubTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Nájemník</th><th style={s.th}>Nemovitost</th><th style={s.th}>Byt</th><th style={s.th}>Konec</th>
              </tr></thead>
              <tbody>
                {expiringContracts.map((c, i) => {
                  const diff = Math.floor((new Date(c.end) - new Date()) / 864e5);
                  const col = diff < 0 ? T.red : diff <= 30 ? T.orange : T.yellow;
                  return (
                    <tr key={i}>
                      <td style={s.td}>{c.tenant}</td>
                      <td style={{ ...s.td, color: T.textDim }}>{c.property}</td>
                      <td style={s.td}>{c.unit}</td>
                      <td style={{ ...s.td, color: col, fontWeight: 600 }}>{fmtDate(c.end)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {upcomingRevisions.length > 0 && (
        <div style={s.card}>
          <SubTitle>Blížící se revize</SubTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Stav</th><th style={s.th}>Objekt</th><th style={s.th}>Typ revize</th><th style={s.th}>Datum</th><th style={s.th}>Zbývá</th>
              </tr></thead>
              <tbody>
                {upcomingRevisions.map((r, i) => {
                  const color = getRevColor(r.date);
                  return (
                    <tr key={i}>
                      <td style={s.td}><div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} /></td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{r.object}</td>
                      <td style={s.td}>{r.type}</td>
                      <td style={s.td}>{fmtDate(r.date)}</td>
                      <td style={{ ...s.td, color, fontWeight: 600 }}>{getRevLabel(r.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
