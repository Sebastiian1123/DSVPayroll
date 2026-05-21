const RequestSummaryCards = ({ loadingBalance, balance }) => (
  <div className="permisos-summary-grid">
    <div className="permisos-summary-card">
      <span className="permisos-summary-label">Dias habiles ganados</span>
      <strong>{loadingBalance ? '...' : Number(balance?.dias_ganados || 0).toFixed(2)}</strong>
    </div>
    <div className="permisos-summary-card">
      <span className="permisos-summary-label">Dias habiles disfrutados</span>
      <strong>{loadingBalance ? '...' : Number(balance?.dias_disfrutados || 0).toFixed(2)}</strong>
    </div>
    <div className="permisos-summary-card permisos-summary-card--highlight">
      <span className="permisos-summary-label">Dias habiles pendientes</span>
      <strong>{loadingBalance ? '...' : Number(balance?.dias_pendientes || 0).toFixed(2)}</strong>
    </div>
  </div>
);

export default RequestSummaryCards;


