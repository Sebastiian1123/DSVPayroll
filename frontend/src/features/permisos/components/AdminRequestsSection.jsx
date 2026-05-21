import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { showSuccess, showError } from '../../../utils/alerts';
import { formatDate, getStatusClass, getSupportFileUrl } from '../utils/requestHelpers';
import { REQUEST_TYPE_OPTIONS } from '../utils/requestTypeOptions';

const JORNADA_LUNES_VIERNES = 'LUNES_VIERNES';
const JORNADA_LUNES_SABADO = 'LUNES_SABADO';

const JornadaToggle = () => {
  const [jornada, setJornada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/liquidacion/config/jornada-laboral');
        setJornada(res.data.data.jornada_laboral || JORNADA_LUNES_VIERNES);
      } catch {
        setJornada(JORNADA_LUNES_VIERNES);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleToggle = async (value) => {
    if (value === jornada || saving) return;
    setSaving(true);
    try {
      await api.put('/liquidacion/config/jornada-laboral', { jornada_laboral: value });
      setJornada(value);
      showSuccess('Configuracion actualizada', value === JORNADA_LUNES_SABADO
        ? 'La empresa ahora trabaja de lunes a sabado'
        : 'La empresa ahora trabaja de lunes a viernes');
    } catch (error) {
      showError('Error', error.response?.data?.message || 'No se pudo actualizar la configuracion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="permisos-jornada-loader">Cargando configuracion...</div>;
  }

  return (
    <div className="permisos-jornada-selector">
      <span className="permisos-jornada-label">Jornada laboral de la empresa:</span>
      <div className="permisos-jornada-options">
        <button
          type="button"
          className={`permisos-jornada-btn ${jornada === JORNADA_LUNES_VIERNES ? 'is-active' : ''}`}
          onClick={() => handleToggle(JORNADA_LUNES_VIERNES)}
          disabled={saving}
        >
          Lunes a Viernes
        </button>
        <button
          type="button"
          className={`permisos-jornada-btn ${jornada === JORNADA_LUNES_SABADO ? 'is-active' : ''}`}
          onClick={() => handleToggle(JORNADA_LUNES_SABADO)}
          disabled={saving}
        >
          Lunes a Sábado
        </button>
      </div>
    </div>
  );
};

const AdminRequestsSection = ({
  adminFilters,
  adminRequestsError,
  loadingAdminRequests,
  adminRequests,
  processingRequestId,
  onFilterChange,
  onAction,
  onDelete
}) => (
  <section className="permisos-admin-panel">
    <div className="permisos-panel-header">
      <h2>Bandeja administrativa</h2>
      <p>Gestiona solicitudes de vacaciones, permisos, incapacidades y licencias de todo el personal.</p>
    </div>

    <div className="permisos-admin-filters">
      <div className="permisos-form-group">
        <label htmlFor="admin-tipo">Tipo</label>
        <select id="admin-tipo" name="tipo" value={adminFilters.tipo} onChange={onFilterChange}>
          <option value={REQUEST_TYPE_OPTIONS.VACACIONES.key}>Vacaciones</option>
          <option value={REQUEST_TYPE_OPTIONS.PERMISO.key}>Permisos</option>
          <option value={REQUEST_TYPE_OPTIONS.INCAPACIDAD.key}>Incapacidades</option>
          <option value={REQUEST_TYPE_OPTIONS.LICENCIA.key}>Licencias</option>
        </select>
      </div>

      <div className="permisos-form-group">
        <label htmlFor="admin-estado">Estado</label>
        <select id="admin-estado" name="estado" value={adminFilters.estado} onChange={onFilterChange}>
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADA">Aprobada</option>
          <option value="RECHAZADA">Rechazada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      <div className="permisos-form-group">
        <label htmlFor="admin-id-empleado">Empleado</label>
        <input
          id="admin-id-empleado"
          type="text"
          name="id_empleado"
          value={adminFilters.id_empleado}
          onChange={onFilterChange}
          placeholder="Filtrar por id_empleado"
        />
      </div>
    </div>

    <JornadaToggle />

    {adminRequestsError && <div className="permisos-alert permisos-alert--error">{adminRequestsError}</div>}

    {loadingAdminRequests ? (
      <div className="permisos-empty-state">Cargando bandeja administrativa...</div>
    ) : adminRequests.length === 0 ? (
      <div className="permisos-empty-state">No hay solicitudes para los filtros seleccionados.</div>
    ) : (
      <div className="permisos-admin-table-wrapper">
        <table className="permisos-admin-table">
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Empleado</th>
              <th>Rango</th>
              <th>Dias</th>
              <th>Estado</th>
              <th>Comentario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {adminRequests.map((request) => (
              <tr key={request.id_solicitud}>
                <td>#{request.id_solicitud}</td>
                <td>
                  <strong>{request.empleado}</strong>
                  <span className="permisos-admin-subtext">ID {request.id_empleado}</span>
                </td>
                <td>{formatDate(request.fecha_inicio)} al {formatDate(request.fecha_fin)}</td>
                <td>
                  {request.tipo === 'VACACIONES' && (Number(request.dias_disfrutar) > 0 || Number(request.dias_dinero) > 0) ? (
                    <>
                      {Number(request.dias_solicitados || 0).toFixed(1)}
                      <span className="permisos-admin-subtext">
                        ({Number(request.dias_disfrutar || 0).toFixed(1)} D / {Number(request.dias_dinero || 0).toFixed(1)} $)
                      </span>
                    </>
                  ) : (
                    Number(request.dias_solicitados || 0).toFixed(1)
                  )}
                </td>
                <td>
                  <span className={`permisos-status permisos-status--${getStatusClass(request.estado)}`}>
                    {request.estado}
                  </span>
                </td>
                <td>{request.comentario_empleado || 'Sin comentario'}</td>
                <td>
                  <div className="permisos-admin-actions">
                    {request.estado === 'PENDIENTE' && (
                      <>
                        <button
                          type="button"
                          className="permisos-admin-btn permisos-admin-btn--approve"
                          onClick={() => onAction(request, 'aprobar')}
                          disabled={processingRequestId === request.id_solicitud}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="permisos-admin-btn permisos-admin-btn--reject"
                          onClick={() => onAction(request, 'rechazar')}
                          disabled={processingRequestId === request.id_solicitud}
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {(request.estado === 'PENDIENTE' || request.estado === 'APROBADA') && (
                      <button
                        type="button"
                        className="permisos-admin-btn permisos-admin-btn--cancel"
                        onClick={() => onAction(request, 'cancelar')}
                        disabled={processingRequestId === request.id_solicitud}
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="button"
                      className="permisos-admin-btn permisos-admin-btn--reject"
                      style={{ backgroundColor: '#dc2626' }}
                      onClick={() => onDelete(request)}
                      disabled={processingRequestId === request.id_solicitud}
                    >
                      Eliminar
                    </button>

                    {request.documento_soporte && (
                      <a
                        className="permisos-admin-btn permisos-admin-btn--link"
                        href={getSupportFileUrl(request.documento_soporte)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Soporte
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export default AdminRequestsSection;
