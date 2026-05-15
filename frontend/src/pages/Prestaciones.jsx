import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import prestacionesService from '../services/prestacionesService'
import '../styles/Nomina.css'

const formatPeso = (value) => {
  const num = Number(value)
  if (isNaN(num)) return '–'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

const Prestaciones = () => {
  const { isAdmin } = useAuth()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acumulando, setAcumulando] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await prestacionesService.getPrestacionesResumen({ anio: selectedYear })
        setEmpleados(Array.isArray(data.empleados) ? data.empleados : [])
      } catch (e) {
        setError('No se pudieron cargar las prestaciones')
        setEmpleados([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear])

  const handleAcumularMasivo = async () => {
    setAcumulando(true)
    try {
      const now = new Date()
      const result = await prestacionesService.acumularPrestacionesMasivo({
        anio: selectedYear,
        mes: now.getMonth() + 1
      })
      alert(result.message || 'Prestaciones acumuladas')
      const data = await prestacionesService.getPrestacionesResumen({ anio: selectedYear })
      setEmpleados(Array.isArray(data.empleados) ? data.empleados : [])
    } catch (e) {
      alert('Error acumulando prestaciones')
    } finally {
      setAcumulando(false)
    }
  }

  const years = []
  for (let y = currentYear - 3; y <= currentYear + 1; y++) years.push(y)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-light)' }}>
      <Navbar />
      <div className="nomina-container">
        <div className="page-header">
          <div>
            <h1>Prestaciones Sociales</h1>
            <p>Consulta y acumulación de prima, cesantías, intereses y vacaciones</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="form-select" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {isAdmin() && (
              <button onClick={handleAcumularMasivo} disabled={acumulando} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>
                {acumulando ? 'Acumulando...' : 'Acumular Mes Actual'}
              </button>
            )}
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--text-light)' }}>Cargando...</p>}

        {!loading && empleados.length === 0 && !error && (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '40px' }}>
            No hay datos de prestaciones para {selectedYear}. Usa "Acumular Mes Actual" para generar.
          </p>
        )}

        {empleados.map((emp) => (
          <div key={emp.id_empleado} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{emp.empleado}</h3>
              <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>Salario: {formatPeso(emp.salario_actual)}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Prima</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#0369a1' }}>{formatPeso(emp.totales.prima)}</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Cesantías</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#15803d' }}>{formatPeso(emp.totales.cesantias)}</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Intereses Cesantías</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#b45309' }}>{formatPeso(emp.totales.intereses)}</div>
              </div>
              <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Vacaciones</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#6d28d9' }}>{formatPeso(emp.totales.vacaciones)}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-light)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Mes</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Salario Base</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Días Acum.</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Prima</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Cesantías</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Intereses</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Vacaciones</th>
                </tr>
              </thead>
              <tbody>
                {emp.meses.map((m) => (
                  <tr key={m.id_prestacion} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px' }}>{String(m.mes).padStart(2, '0')}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPeso(m.salario_base)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{m.dias_acumulados}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPeso(m.prima_servicios)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPeso(m.cesantias)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPeso(m.intereses_cesantias)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPeso(m.vacaciones)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Prestaciones
