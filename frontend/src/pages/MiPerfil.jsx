import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showSuccess, showError } from '../utils/alerts';
import '../styles/MiPerfil.css';

const TIPO_ID_OPTIONS = ['CC', 'TI', 'CE', 'PASAPORTE'];

const MiPerfil = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!user?.id_empleado) return;
    api.get(`/employees/${user.id_empleado}`)
      .then((res) => {
        const data = res.data.data;
        setEmployee(data);
        setFormData({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          tipo_identificacion: data.tipo_identificacion || 'CC',
          numero_identificacion: data.numero_identificacion || '',
          fecha_nacimiento: data.fecha_nacimiento?.split('T')[0] || '',
        });
      })
      .catch(() => showError('Error al cargar tu perfil'))
      .finally(() => setLoading(false));
  }, [user?.id_empleado]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      return showError('Nombres y apellidos son obligatorios');
    }
    setSaving(true);
    try {
      const res = await api.put(`/employees/${user.id_empleado}/profile`, formData);
      if (res.data.success) {
        setEmployee(res.data.data);
        setEditing(false);
        showSuccess('Perfil actualizado exitosamente');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombres: employee.nombres || '',
      apellidos: employee.apellidos || '',
      tipo_identificacion: employee.tipo_identificacion || 'CC',
      numero_identificacion: employee.numero_identificacion || '',
      fecha_nacimiento: employee.fecha_nacimiento?.split('T')[0] || '',
    });
    setEditing(false);
  };

  if (!user?.id_empleado) {
    return (
      <>
        <Navbar />
        <div className="nomina-container">
          <p style={{ textAlign: 'center', marginTop: 40, color: '#6b7280' }}>
            Tu usuario no tiene un empleado asociado.
          </p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="nomina-container">
          <p style={{ textAlign: 'center', marginTop: 40 }}>Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="perfil-wrapper">
        <div className="perfil-header">
          <div>
            <h1>Mi Perfil</h1>
            <p>{employee?.nombre_cargo} &mdash; {employee?.nombre_departamento}</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="perfil-btn perfil-btn--primary">
              <i className="fa-solid fa-pen"></i> Editar
            </button>
          ) : (
            <div className="perfil-actions">
              <button onClick={handleCancel} className="perfil-btn perfil-btn--secondary">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="perfil-btn perfil-btn--success">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        <div className="perfil-card">
          <div className="perfil-grid">

            <div className="perfil-row">
              <div className="perfil-field">
                <label className="perfil-label">Nombres</label>
                <input name="nombres" value={formData.nombres} onChange={handleChange} readOnly={!editing} className={`perfil-input${editing ? ' perfil-input--editable' : ''}`} />
              </div>
              <div className="perfil-field">
                <label className="perfil-label">Apellidos</label>
                <input name="apellidos" value={formData.apellidos} onChange={handleChange} readOnly={!editing} className={`perfil-input${editing ? ' perfil-input--editable' : ''}`} />
              </div>
            </div>

            <div className="perfil-row--narrow">
              <div className="perfil-field">
                <label className="perfil-label">Tipo ID</label>
                {editing ? (
                  <select name="tipo_identificacion" value={formData.tipo_identificacion} onChange={handleChange} className="perfil-input perfil-input--editable">
                    {TIPO_ID_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input name="tipo_identificacion" value={formData.tipo_identificacion} readOnly className="perfil-input" />
                )}
              </div>
              <div className="perfil-field">
                <label className="perfil-label">Número ID</label>
                <input name="numero_identificacion" value={formData.numero_identificacion} onChange={handleChange} readOnly={!editing} className={`perfil-input${editing ? ' perfil-input--editable' : ''}`} />
              </div>
            </div>

            <div className="perfil-field">
              <label className="perfil-label">Fecha de nacimiento</label>
              <input name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} readOnly={!editing} className={`perfil-input${editing ? ' perfil-input--editable' : ''}`} />
            </div>

            <div className="perfil-section">
              <h3 className="perfil-section-title">Informacion del cargo</h3>
              <div className="perfil-info-row">
                <div>
                  <span className="perfil-info-label">Cargo</span>
                  <p className="perfil-info-value">{employee?.nombre_cargo || '---'}</p>
                </div>
                <div>
                  <span className="perfil-info-label">Departamento</span>
                  <p className="perfil-info-value">{employee?.nombre_departamento || '---'}</p>
                </div>
              </div>
              <div className="perfil-info-row">
                <div>
                  <span className="perfil-info-label">Fecha ingreso</span>
                  <p className="perfil-info-value">{employee?.fecha_ingreso?.split('T')[0] || '---'}</p>
                </div>
                <div>
                  <span className="perfil-info-label">Sueldo</span>
                  <p className="perfil-info-value">
                    {employee?.sueldo != null
                      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(employee.sueldo)
                      : '---'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default MiPerfil;
