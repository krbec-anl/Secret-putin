export default function GameLog({ log }) {
  if (!log || log.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="section-title">Herní log</div>
      <div className="card log-container">
        {[...log].reverse().map((entry, i) => (
          <div key={i} className="log-entry">
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
