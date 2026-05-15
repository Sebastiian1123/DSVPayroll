import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import liquidacionService from '../services/liquidacionService'
import api from '../services/api'
import '../styles/Nomina.css'

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

  useEffect(() => {
    fetchLiquidaciones()
    if (isAdmin()) {
      api.get('/employees').then(r => setEmployees(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {})
    }
  }, [])

  const fetchLiquidaciones = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await liquidacionService.getLiquidaciones()
      setLiquidaciones(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('No se pudieron cargar las liquidaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleCalcular = async () => {
    if (!formData.id_empleado || !formData.fecha_retiro) return alert('Selecciona empleado y fecha de retiro')
    setCalculando(true)
    try {
      const result = await liquidacionService.calcularLiquidacion(formData)
      if (result.success) {
        setCalculo(result.data)
      } else {
        alert(result.message || 'Error calculando')
      }
    } catch (e) {
      alert('Error al calcular liquidación')
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
        alert('Liquidación guardada exitosamente. Empleado desactivado.')
        setCalculo(null)
        setFormData({ id_empleado: '', fecha_retiro: '', motivo_retiro: '' })
        fetchLiquidaciones()
      } else {
        alert(result.message || 'Error guardando')
      }
    } catch (e) {
      alert('Error al guardar liquidación')
    }
  }

  const handlePagar = async (id) => {
    try {
      await liquidacionService.marcarPagada(id)
      fetchLiquidaciones()
    } catch (e) {
      alert('Error al marcar como pagada')
    }
  }

  const handleAnular = async (id) => {
    if (!window.confirm('¿Anular esta liquidación? El empleado será reactivado.')) return
    try {
      await liquidacionService.anularLiquidacion(id)
      fetchLiquidaciones()
    } catch (e) {
      alert('Error al anular liquidación')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-light)' }}>
      <Navbar />
      <div className="nomina-container">
        <div className="page-header">
          <h1>Liquidación de Contrato</h1>
          <p>Cálculo y gestión de liquidaciones por retiro de empleados</p>
        </div>

        {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

        {isAdmin() && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '16px' }}>Calcular Liquidación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Empleado</label>
                <select value={formData.id_empleado} onChange={(e) => setFormData({ ...formData, id_empleado: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <option value="">Seleccionar...</option>
                  {employees.filter(e => e.activo !== 0).map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombres} {emp.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Fecha de Retiro</label>
                <input type="date" value={formData.fecha_retiro} onChange={(e) => setFormData({ ...formData, fecha_retiro: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Motivo</label>
                <input type="text" value={formData.motivo_retiro} onChange={(e) => setFormData({ ...formData, motivo_retiro: e.target.value })} placeholder="Renuncia voluntaria..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
              <button onClick={handleCalcular} disabled={calculando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', height: '38px' }}>
                {calculando ? 'Calculando...' : 'Calcular'}
              </button>
            </div>

            {calculo && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ marginBottom: '8px' }}>{calculo.empleado}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>
                  Ingreso: {calculo.fecha_ingreso?.split('T')[0]} — Retiro: {calculo.fecha_retiro?.split('T')[0]} — Días año: {calculo.dias_trabajados_anio}
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Concepto</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculo.detalle.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px' }}>{d.concepto}</td>
                        <td style={{ textAlign: 'right', padding: '8px', color: d.tipo === 'DEDUCCION' ? '#dc2626' : '#16a34a' }}>
                          {d.tipo === 'DEDUCCION' ? '- ' : ''}{formatPeso(d.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, fontSize: '15px' }}>
                      <td style={{ padding: '8px' }}>Total Liquidación</td>
                      <td style={{ textAlign: 'right', padding: '8px', color: '#2563eb' }}>{formatPeso(calculo.total_liquidacion)}</td>
                    </tr>
                  </tfoot>
                </table>
                <button onClick={handleGuardar} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Guardar Liquidación y Desactivar Empleado
                </button>
              </div>
            )}
          </div>
        )}

        <h3 style={{ marginBottom: '16px' }}>Historial de Liquidaciones</h3>
        {loading && <p>Cargando...</p>}
        {!loading && liquidaciones.length === 0 && <p style={{ color: 'var(--text-light)' }}>No hay liquidaciones registradas</p>}

        {liquidaciones.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Empleado</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Documento</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Retiro</th>
                  <th style={{ textAlign: 'right', padding: '12px' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((liq) => (
                  <tr key={liq.id_liquidacion} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setSelectedLiq(selectedLiq?.id_liquidacion === liq.id_liquidacion ? null : liq)}>
                    <td style={{ padding: '12px' }}>{liq.empleado}</td>
                    <td style={{ padding: '12px', color: 'var(--text-light)' }}>{liq.numero_identificacion}</td>
                    <td style={{ padding: '12px' }}>{liq.fecha_retiro?.split('T')[0]}</td>
                    <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600 }}>{formatPeso(liq.total_liquidacion)}</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: liq.estado === 'PAGADA' ? '#dcfce7' : liq.estado === 'ANULADA' ? '#fef2f2' : '#fef3c7',
                        color: liq.estado === 'PAGADA' ? '#15803d' : liq.estado === 'ANULADA' ? '#dc2626' : '#b45309'
                      }}>{estados[liq.estado] || liq.estado}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      {liq.estado === 'PENDIENTE' && isAdmin() && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); handlePagar(liq.id_liquidacion) }} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', marginRight: '6px', fontSize: '12px' }}>Pagar</button>
                          <button onClick={(e) => { e.stopPropagation(); handleAnular(liq.id_liquidacion) }} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Anular</button>
                        </>
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
