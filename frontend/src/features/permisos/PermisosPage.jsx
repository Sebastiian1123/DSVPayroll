import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Permisos.css';
import { showError, showSuccess } from '../../utils/alerts';
import RequestTypeSwitch from './components/RequestTypeSwitch';
import RequestSummaryCards from './components/RequestSummaryCards';
import RequestFormSection from './components/RequestFormSection';
import RequestHistorySection from './components/RequestHistorySection';
import AdminRequestsSection from './components/AdminRequestsSection';
import {
  REQUEST_TYPE_OPTIONS,
  getCurrentYear,
  getInitialForm,
  getDefaultPayrollValuesByType
} from './utils/requestTypeOptions';
import { toBase64 } from './utils/requestHelpers';

const PermisosPage = () => {
  const { user, isAdminOrRRHH } = useAuth();

  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingAdminRequests, setLoadingAdminRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [balanceError, setBalanceError] = useState('');
  const [requestsError, setRequestsError] = useState('');
  const [adminRequestsError, setAdminRequestsError] = useState('');
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedRequestType, setSelectedRequestType] = useState(REQUEST_TYPE_OPTIONS.VACACIONES.key);
  const [formData, setFormData] = useState(getInitialForm(REQUEST_TYPE_OPTIONS.VACACIONES.key));
  const [adminFilters, setAdminFilters] = useState({
    tipo: REQUEST_TYPE_OPTIONS.VACACIONES.key,
    estado: 'PENDIENTE',
    id_empleado: ''
  });
  const [supportFile, setSupportFile] = useState(null);

  const selectedOption = REQUEST_TYPE_OPTIONS[selectedRequestType];

  // Carga el saldo solo para vacaciones, porque es el unico tipo con acumulado visible.
  const fetchBalance = async () => {
    if (!user?.id_empleado) {
      setBalance(null);
      setBalanceError('Tu usuario no tiene un empleado asociado para consultar saldo de vacaciones.');
      setLoadingBalance(false);
      return;
    }

    try {
      setLoadingBalance(true);
      setBalanceError('');

      const response = await api.get(`/solicitudes/vacaciones/saldo/${user.id_empleado}`, {
        params: { periodo_anio: selectedYear }
      });

      setBalance(response.data.data || null);
    } catch (error) {
      setBalance(null);
      setBalanceError(error.response?.data?.message || 'No fue posible cargar el saldo de vacaciones.');
    } finally {
      setLoadingBalance(false);
    }
  };

  // Carga el historial del tipo seleccionado para el empleado autenticado.
  const fetchRequests = async () => {
    if (!user?.id_empleado) {
      setRequests([]);
      setRequestsError('Tu usuario no tiene un empleado asociado para consultar solicitudes.');
      setLoadingRequests(false);
      return;
    }

    try {
      setLoadingRequests(true);
      setRequestsError('');

      const response = await api.get('/solicitudes/mis-solicitudes', {
        params: { tipo: selectedRequestType }
      });

      setRequests(response.data.data || []);
    } catch (error) {
      setRequests([]);
      setRequestsError(error.response?.data?.message || 'No fue posible cargar tus solicitudes.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Carga la bandeja administrativa usando filtros del modulo.
  const fetchAdminRequests = async () => {
    if (!isAdminOrRRHH()) {
      setAdminRequests([]);
      setAdminRequestsError('');
      return;
    }

    try {
      setLoadingAdminRequests(true);
      setAdminRequestsError('');

      const params = { tipo: adminFilters.tipo };

      if (adminFilters.estado) {
        params.estado = adminFilters.estado;
      }

      if (adminFilters.id_empleado.trim()) {
        params.id_empleado = adminFilters.id_empleado.trim();
      }

      const response = await api.get('/solicitudes', { params });
      setAdminRequests(response.data.data || []);
    } catch (error) {
      setAdminRequests([]);
      setAdminRequestsError(error.response?.data?.message || 'No fue posible cargar la bandeja administrativa.');
    } finally {
      setLoadingAdminRequests(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [selectedYear, user?.id_empleado]);

  useEffect(() => {
    fetchRequests();
  }, [user?.id_empleado, selectedRequestType]);

  useEffect(() => {
    fetchAdminRequests();
  }, [user?.rol, adminFilters.tipo, adminFilters.estado, adminFilters.id_empleado]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const nextState = {
        ...prev,
        [name]: value
      };

      // Mantiene sincronizados los campos que luego usara nomina.
      if (selectedRequestType === REQUEST_TYPE_OPTIONS.INCAPACIDAD.key && name === 'origen_novedad') {
        return {
          ...nextState,
          ...getDefaultPayrollValuesByType(selectedRequestType, {
            origen_novedad: value
          })
        };
      }

      if (
        (selectedRequestType === REQUEST_TYPE_OPTIONS.PERMISO.key ||
          selectedRequestType === REQUEST_TYPE_OPTIONS.LICENCIA.key) &&
        name === 'es_remunerado'
      ) {
        return {
          ...nextState,
          ...getDefaultPayrollValuesByType(selectedRequestType, {
            es_remunerado: value
          })
        };
      }

      return nextState;
    });
  };

  const handleAdminFilterChange = (event) => {
    const { name, value } = event.target;
    setAdminFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestTypeChange = (type) => {
    setSelectedRequestType(type);
    setFormData(getInitialForm(type));
    setSupportFile(null);
  };

  const handleSupportFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSupportFile(file);
  };

  // Crea la solicitud del tipo activo y luego refresca historial y saldo.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      showError('Datos incompletos', 'Debes seleccionar la fecha de inicio y la fecha final.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = { ...formData };

      if (supportFile) {
        payload.support_file = {
          name: supportFile.name,
          type: supportFile.type,
          content: await toBase64(supportFile)
        };
      }

      await api.post(`/solicitudes/${selectedOption.endpoint}`, payload);

      showSuccess(
        'Solicitud enviada',
        `La solicitud de ${selectedOption.label.toLowerCase()} fue creada correctamente.`
      );

      setFormData(getInitialForm(selectedRequestType));
      setSupportFile(null);
      await Promise.all([fetchBalance(), fetchRequests()]);
    } catch (error) {
      showError('No se pudo crear la solicitud', error.response?.data?.message || 'Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mapea el tipo de solicitud hacia su endpoint para accionar la bandeja administrativa.
  const getRequestEndpoint = (requestType) => {
    if (requestType === REQUEST_TYPE_OPTIONS.PERMISO.key) return REQUEST_TYPE_OPTIONS.PERMISO.endpoint;
    if (requestType === REQUEST_TYPE_OPTIONS.INCAPACIDAD.key) return REQUEST_TYPE_OPTIONS.INCAPACIDAD.endpoint;
    if (requestType === REQUEST_TYPE_OPTIONS.LICENCIA.key) return REQUEST_TYPE_OPTIONS.LICENCIA.endpoint;
    return REQUEST_TYPE_OPTIONS.VACACIONES.endpoint;
  };

  const handleAdminAction = async (request, action) => {
    const actionLabels = {
      aprobar: {
        title: 'Aprobar solicitud',
        button: 'Aprobar',
        endpoint: 'aprobar'
      },
      rechazar: {
        title: 'Rechazar solicitud',
        button: 'Rechazar',
        endpoint: 'rechazar'
      },
      cancelar: {
        title: 'Cancelar solicitud',
        button: 'Cancelar solicitud',
        endpoint: 'cancelar'
      }
    };

    const currentAction = actionLabels[action];

    const result = await Swal.fire({
      title: currentAction.title,
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe una observacion para esta gestion',
      inputAttributes: {
        maxlength: '250'
      },
      showCancelButton: true,
      confirmButtonText: currentAction.button,
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#111827',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessingRequestId(request.id_solicitud);

      const payload = action === 'cancelar'
        ? { comentario_cancelacion: result.value || '' }
        : { comentario_aprobador: result.value || '' };

      const requestEndpoint = getRequestEndpoint(request.tipo);

      await api.patch(`/solicitudes/${requestEndpoint}/${request.id_solicitud}/${currentAction.endpoint}`, payload);

      showSuccess(
        'Gestion realizada',
        `La solicitud fue ${action === 'aprobar' ? 'aprobada' : action === 'rechazar' ? 'rechazada' : 'cancelada'} correctamente.`
      );

      await Promise.all([fetchAdminRequests(), fetchRequests(), fetchBalance()]);
    } catch (error) {
      showError('No se pudo gestionar la solicitud', error.response?.data?.message || 'Intenta nuevamente.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="permisos-container">
        <div className="permisos-header">
          <div>
            <h1>Permisos</h1>
            <p>Consulta vacaciones, registra permisos, incapacidades y licencias y revisa el estado de cada gestion.</p>
          </div>

          <div className="permisos-year-switch">
            <label htmlFor="permisos-year">Periodo</label>
            <select
              id="permisos-year"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              <option value={getCurrentYear()}>{getCurrentYear()}</option>
              <option value={getCurrentYear() - 1}>{getCurrentYear() - 1}</option>
              <option value={getCurrentYear() + 1}>{getCurrentYear() + 1}</option>
            </select>
          </div>
        </div>

        <RequestTypeSwitch
          options={REQUEST_TYPE_OPTIONS}
          selectedType={selectedRequestType}
          onChange={handleRequestTypeChange}
        />

        {selectedRequestType === REQUEST_TYPE_OPTIONS.VACACIONES.key && (
          <>
            <RequestSummaryCards loadingBalance={loadingBalance} balance={balance} />
            {balanceError && <div className="permisos-alert permisos-alert--error">{balanceError}</div>}
          </>
        )}

        {requestsError && <div className="permisos-alert permisos-alert--error">{requestsError}</div>}

        <div className="permisos-layout">
          <RequestFormSection
            selectedOption={selectedOption}
            formData={formData}
            supportFile={supportFile}
            submitting={submitting}
            hasEmployee={!!user?.id_empleado}
            canManagePayrollFields={isAdminOrRRHH()}
            onSubmit={handleSubmit}
            onChange={handleChange}
            onSupportFileChange={handleSupportFileChange}
          />

          <RequestHistorySection
            selectedOption={selectedOption}
            loadingRequests={loadingRequests}
            requests={requests}
          />
        </div>

        {isAdminOrRRHH() && (
          <AdminRequestsSection
            adminFilters={adminFilters}
            adminRequestsError={adminRequestsError}
            loadingAdminRequests={loadingAdminRequests}
            adminRequests={adminRequests}
            processingRequestId={processingRequestId}
            onFilterChange={handleAdminFilterChange}
            onAction={handleAdminAction}
          />
        )}
      </div>
    </>
  );
};

export default PermisosPage;


