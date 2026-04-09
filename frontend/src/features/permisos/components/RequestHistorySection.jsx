import { formatDate, getStatusClass, getSupportFileUrl } from '../utils/requestHelpers';

const RequestHistorySection = ({ selectedOption, loadingRequests, requests }) => (
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
              <span className={`permisos-status permisos-status--${getStatusClass(request.estado)}`}>
                {request.estado}
              </span>
            </div>

            <div className="permisos-request-meta">
              <span>{Number(request.dias_solicitados || 0).toFixed(2)} dias</span>
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


