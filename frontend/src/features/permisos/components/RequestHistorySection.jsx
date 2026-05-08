import { formatDate, getStatusClass, getSupportFileUrl } from '../utils/requestHelpers';

const RequestHistorySection = ({
  selectedOption,
  loadingRequests,
  requests,
  onDelete,
  processingRequestId
}) => (
  <section className="permisos-panel">
    <div className="permisos-panel-header">
      <h2>Historial</h2>
      <p>Consulta el estado de tus solicitudes de {selectedOption.label.toLowerCase()}.</p>
    </div>

    {loadingRequests ? (
      <div className="permisos-empty-state">Cargando solicitudes...</div>
    ) : requests.length === 0 ? (
      <div className="permisos-empty-state">Aun no tienes solicitudes registradas.</div>
    ) : (
      <div className="permisos-request-list">
        {requests.map((request) => (
          <article className="permisos-request-card" key={request.id_solicitud}>
            <div className="permisos-request-top">
              <div>
                <h3>Solicitud #{request.id_solicitud}</h3>
                <p>{formatDate(request.fecha_inicio)} al {formatDate(request.fecha_fin)}</p>
              </div>
              <div className="permisos-request-actions-inline">
                <span className={`permisos-status permisos-status--${getStatusClass(request.estado)}`}>
                  {request.estado}
                </span>
                {request.estado === 'PENDIENTE' && (
                  <button
                    type="button"
                    className="permisos-delete-icon-btn"
                    title="Eliminar solicitud"
                    onClick={() => onDelete(request)}
                    disabled={processingRequestId === request.id_solicitud}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="permisos-request-meta">
              <span>
                {Number(request.dias_solicitados || 0).toFixed(1)} dias
                {selectedOption.key === 'VACACIONES' && (Number(request.dias_disfrutar) > 0 || Number(request.dias_dinero) > 0) && (
                  ` (${Number(request.dias_disfrutar || 0).toFixed(1)} Descanso / ${Number(request.dias_dinero || 0).toFixed(1)} Pago)`
                )}
              </span>
              <span>Creada: {formatDate(request.fecha_solicitud)}</span>
            </div>

            {request.comentario_empleado && <p className="permisos-request-comment">{request.comentario_empleado}</p>}

            {request.comentario_aprobador && (
              <div className="permisos-review-box">
                <strong>Respuesta</strong>
                <p>{request.comentario_aprobador}</p>
              </div>
            )}

            {request.documento_soporte && (
              <a
                className="permisos-support-link"
                href={getSupportFileUrl(request.documento_soporte)}
                target="_blank"
                rel="noreferrer"
              >
                Ver soporte
              </a>
            )}
          </article>
        ))}
      </div>
    )}
  </section>
);

export default RequestHistorySection;


