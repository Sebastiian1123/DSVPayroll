import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import liquidacionService from '../services/liquidacionService'
import api from '../services/api'
import '../styles/Nomina.css'
import '../styles/Liquidacion.css'
import {showSuccess, showError, showConfirmDelete} from '../utils/alerts.js'

const formatPeso = (value) => {
  const num = Number(value)
  if (isNaN(num)) return '–'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

const estados = { PENDIENTE: 'Pendiente', PAGADA: 'Pagada', ANULADA: 'Anulada' }

const Liquidacion = () => {
  const { user, isAdmin } = useAuth()
  const [liquidaciones, setLiquidaciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLiq, setSelectedLiq] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [calculo, setCalculo] = useState(null)
  const [formData, setFormData] = useState({ id_empleado: '', fecha_retiro: '', motivo_retiro: '' })
  const [employees, setEmployees] = useState([])
  const [rehireConfig, setRehireConfig] = useState({ meses: 0, dias: 0 })
  const [updatingConfig, setUpdatingConfig] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    fetchLiquidaciones()
    if (isAdmin()) {
      api.get('/employees').then(r => setEmployees(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {})
      fetchRehireConfig()
    }

    const closeMenu = () => setActiveMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const fetchRehireConfig = async () => {
    try {
      const data = await liquidacionService.getRecontratacionConfig()
      setRehireConfig(data)
    } catch (e) {
      console.error('Error fetching rehire config:', e)
    }
  }

  const handleUpdateRehireConfig = async () => {
    try {
      setUpdatingConfig(true)
      await liquidacionService.updateRecontratacionConfig(rehireConfig.meses, rehireConfig.dias)
      showSuccess('Configuración de recontratación actualizada')
    } catch (e) {
      showError('Error al actualizar la configuración', e)
    } finally {
      setUpdatingConfig(false)
    }
  }

  const fetchLiquidaciones = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await liquidacionService.getLiquidaciones()
      setLiquidaciones(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('No se pudieron cargar las liquidaciones', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCalcular = async () => {
    if (!formData.id_empleado || !formData.fecha_retiro) return showError('Selecciona empleado y fecha de retiro')
    setCalculando(true)
    try {
      const result = await liquidacionService.calcularLiquidacion(formData)
      if (result.success) {
        setCalculo(result.data)
      } else {
        showError(result.message || 'Error calculando')
      }
    } catch (e) {
      showError('Error al calcular liquidación', e)
    } finally {
      setCalculando(false)
    }
  }

  const handleGuardar = async () => {
    if (!calculo) return
    try {
      const result = await liquidacionService.guardarLiquidacion({
        id_empleado: calculo.id_empleado,
        fecha_retiro: calculo.fecha_retiro,
        motivo_retiro: calculo.motivo_retiro,
        detalle: calculo.detalle
      })
      if (result.success) {
        showSuccess('Liquidación guardada exitosamente. Empleado desactivado.')
        setCalculo(null)
        setFormData({ id_empleado: '', fecha_retiro: '', motivo_retiro: '' })
        fetchLiquidaciones()
      } else {
        showError(result.message || 'Error guardando')
      }
    } catch (e) {
      showError('Error al guardar liquidación', e)
    }
  }

  const handlePagar = async (id) => {
    try {
      await liquidacionService.marcarPagada(id)
      fetchLiquidaciones()
    } catch (e) {
      showError('Error al marcar como pagada', e)
    }
  }

  const handleAnular = async (id) => {
    if (!window.confirm('¿Anular esta liquidación? El empleado será reactivado.')) return
    try {
      await liquidacionService.anularLiquidacion(id)
      fetchLiquidaciones()
    } catch (e) {
      showError('Error al anular liquidación', e)
    }
  }

  const handleRevertirPago = async (id) => {
    const reactivar = window.confirm('¿Desea reactivar al empleado al revertir el pago?')
    try {
      const result = await liquidacionService.revertirPago(id, reactivar)
      if (result.success) {
        showSuccess(result.message)
        fetchLiquidaciones()
      } else {
        showError(result.message || 'Error al revertir pago')
      }
    } catch (e) {
      showError('Error al revertir pago', e)
    }
  }

  const handleRevertirAnulacion = async (id) => {
    if (!showConfirmDelete('¿Desea revertir la anulación? La liquidación volverá a estar PENDIENTE y el empleado será desactivado nuevamente.')) return
    try {
      const result = await liquidacionService.revertirAnulacion(id)
      if (result.success) {
        showSuccess(result.message)
        fetchLiquidaciones()
      } else {
        showError(result.message || 'Error al revertir anulación')
      }
    } catch (e) {
      showError('Error al revertir anulación', e)
    }
  }

  const handleDelete = async (id) => {
    if (!showConfirmDelete('¿Eliminar definitivamente esta liquidación? El empleado será reactivado si no estaba anulada.')) return
    try {
      await liquidacionService.deleteLiquidacion(id)
      fetchLiquidaciones()
    } catch (e) {
      showError('Error al eliminar liquidación', e)
    }
  }

  return (
    <div className="liquidacion-page">
      <Navbar />
      <div className="nomina-container">
        <div className="liquidacion-header">
          <h1>Liquidación de Contrato</h1>
          <p>Cálculo y gestión de liquidaciones por retiro de empleados</p>
        </div>

        {error && <p className="liquidacion-error">{error}</p>}

        {isAdmin() && (
          <div className="liquidacion-section">
            <h3 className="liquidacion-section-title">Calcular Liquidación</h3>
            <div className="liquidacion-form-grid">
              <div className="liquidacion-form-group">
                <label>Empleado</label>
                <select value={formData.id_empleado} onChange={(e) => setFormData({ ...formData, id_empleado: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {employees.filter(e => e.activo !== 0).map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombres} {emp.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div className="liquidacion-form-group">
                <label>Fecha de Retiro</label>
                <input type="date" value={formData.fecha_retiro} onChange={(e) => setFormData({ ...formData, fecha_retiro: e.target.value })} />
              </div>
              <div className="liquidacion-form-group">
                <label>Motivo</label>
                <input type="text" value={formData.motivo_retiro} onChange={(e) => setFormData({ ...formData, motivo_retiro: e.target.value })} placeholder="Renuncia voluntaria..." />
              </div>
              <button onClick={handleCalcular} disabled={calculando} className="liquidacion-btn liquidacion-btn--primary">
                {calculando ? 'Calculando...' : 'Calcular'}
              </button>
            </div>

            {calculo && (
              <div className="liquidacion-preview">
                <h4 className="liquidacion-preview-title">{calculo.empleado}</h4>
                <p className="liquidacion-preview-meta">
                  Ingreso: {calculo.fecha_ingreso?.split('T')[0]} — Retiro: {calculo.fecha_retiro?.split('T')[0]} — Días año: {calculo.dias_trabajados_anio}
                </p>
                <table className="liquidacion-preview-table">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th className="liquidacion-cell-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculo.detalle.map((d, i) => (
                      <tr key={i}>
                        <td>{d.concepto}</td>
                        <td className={`liquidacion-cell-right ${d.tipo === 'DEDUCCION' ? 'liquidacion-value-deduccion' : 'liquidacion-value-devengado'}`}>
                          {d.tipo === 'DEDUCCION' ? '- ' : ''}{formatPeso(d.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="liquidacion-total-row">
                      <td>Total Liquidación</td>
                      <td className="liquidacion-total-value">{formatPeso(calculo.total_liquidacion)}</td>
                    </tr>
                  </tfoot>
                </table>
                <button onClick={handleGuardar} className="liquidacion-btn liquidacion-btn--success mt-2">
                  Guardar Liquidación y Desactivar Empleado
                </button>
              </div>
            )}
          </div>
        )}

        {isAdmin() && (
          <div className="liquidacion-section">
            <h3 className="liquidacion-section-title mb-1">Restricción de Recontratación</h3>
            <p className="liquidacion-section-desc">
              Define el tiempo mínimo de espera después del retiro para poder reactivar a un empleado.
            </p>
            <div className="liquidacion-rehire-grid">
              <div className="liquidacion-rehire-group">
                <label>Meses de espera</label>
                <input 
                  type="number" 
                  min="0"
                  value={rehireConfig.meses} 
                  onChange={(e) => setRehireConfig({ ...rehireConfig, meses: e.target.value })} 
                />
              </div>
              <div className="liquidacion-rehire-group">
                <label>Días de espera</label>
                <input 
                  type="number" 
                  min="0"
                  value={rehireConfig.dias} 
                  onChange={(e) => setRehireConfig({ ...rehireConfig, dias: e.target.value })} 
                />
              </div>
              <button 
                onClick={handleUpdateRehireConfig} 
                disabled={updatingConfig} 
                className="liquidacion-btn liquidacion-btn--secondary"
              >
                {updatingConfig ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}

        <h3 className="liquidacion-history-title">Historial de Liquidaciones</h3>
        {loading && <p>Cargando...</p>}
        {!loading && liquidaciones.length === 0 && <p className="liquidacion-empty">No hay liquidaciones registradas</p>}

        {liquidaciones.length > 0 && (
          <div className="liquidacion-table-wrapper">
            <table className="liquidacion-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Documento</th>
                  <th>Retiro</th>
                  <th className="liquidacion-cell-right">Total</th>
                  <th className="liquidacion-cell-center">Estado</th>
                  <th className="liquidacion-actions-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((liq) => (
                  <tr key={liq.id_liquidacion} onClick={() => setSelectedLiq(selectedLiq?.id_liquidacion === liq.id_liquidacion ? null : liq)}>
                    <td>{liq.empleado}</td>
                    <td className="liquidacion-doc-cell">{liq.numero_identificacion}</td>
                    <td>{liq.fecha_retiro?.split('T')[0]}</td>
                    <td className="liquidacion-total-cell">{formatPeso(liq.total_liquidacion)}</td>
                    <td className="liquidacion-cell-center">
                      <span className={`liquidacion-status-badge liquidacion-status-badge--${liq.estado.toLowerCase()}`}>
                        {estados[liq.estado] || liq.estado}
                      </span>
                    </td>
                    <td className="liquidacion-actions-cell" style={{ zIndex: activeMenu === liq.id_liquidacion ? 101 : 1 }}>
                      {isAdmin() && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveMenu(activeMenu === liq.id_liquidacion ? null : liq.id_liquidacion);
                            }} 
                            className="liquidacion-menu-btn"
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                          
                          {activeMenu === liq.id_liquidacion && (
                            <div className="liquidacion-dropdown-menu">
                              {liq.estado === 'PENDIENTE' && (
                                <>
                                  <button onClick={() => handlePagar(liq.id_liquidacion)} className="liquidacion-dropdown-item">
                                    <i className="fa-solid fa-check" style={{ color: '#16a34a' }}></i> Pagar
                                  </button>
                                  <button onClick={() => handleAnular(liq.id_liquidacion)} className="liquidacion-dropdown-item">
                                    <i className="fa-solid fa-ban" style={{ color: '#dc2626' }}></i> Anular
                                  </button>
                                </>
                              )}
                              
                              {liq.estado === 'PAGADA' && (
                                <button onClick={() => handleRevertirPago(liq.id_liquidacion)} className="liquidacion-dropdown-item">
                                  <i className="fa-solid fa-rotate-left" style={{ color: '#6366f1' }}></i> Revertir Pago
                                </button>
                              )}
                              
                              {liq.estado === 'ANULADA' && (
                                <button onClick={() => handleRevertirAnulacion(liq.id_liquidacion)} className="liquidacion-dropdown-item">
                                  <i className="fa-solid fa-rotate-left" style={{ color: '#6366f1' }}></i> Revertir Anulación
                                </button>
                              )}
                              
                              <button onClick={() => handleDelete(liq.id_liquidacion)} className="liquidacion-dropdown-item liquidacion-dropdown-item--danger">
                                <i className="fa-solid fa-trash"></i> Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Liquidacion
