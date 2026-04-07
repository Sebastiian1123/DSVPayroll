const { pool } = require('../config/database');
const puppeteer = require('puppeteer');

const VALID_PAYMENT_TYPES = new Set(['MENSUAL', 'QUINCENAL']);
const VALID_OVERTIME_TYPES = new Set([
  'EXTRA_DIURNA',
  'EXTRA_NOCTURNA',
  'EXTRA_DIURNA_DOMINICAL_FESTIVO',
  'EXTRA_NOCTURNA_DOMINICAL_FESTIVO'
]);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
};

const createPayroll = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      id_empleado,
      fecha_inicio,
      fecha_corte,
      tipo_pago,
      total_devengado,
      total_deducciones,
      detalles = [],
      horas_extras = []
    } = req.body;

    if (!id_empleado || !fecha_inicio || !fecha_corte) {
      return res.status(400).json({
        success: false,
        message: 'id_empleado, fecha_inicio y fecha_corte son obligatorios'
      });
    }

    const paymentType = VALID_PAYMENT_TYPES.has(tipo_pago) ? tipo_pago : 'MENSUAL';
    const devengado = Number(total_devengado) || 0;
    const deducciones = Number(total_deducciones) || 0;

    if (devengado < 0 || deducciones < 0) {
      return res.status(400).json({
        success: false,
        message: 'Los valores de nomina no pueden ser negativos'
      });
    }

    const overtimeRows = Array.isArray(horas_extras)
      ? horas_extras
        .filter((item) => item && VALID_OVERTIME_TYPES.has(item.tipo_hora))
        .map((item) => ({
          tipo_hora: item.tipo_hora,
          porcentaje_recargo: Number(item.porcentaje_recargo) || 0,
          horas: Number(item.horas) || 0,
          valor_hora_base: Number(item.valor_hora_base) || 0,
          valor_hora_extra: Number(item.valor_hora_extra) || 0,
          valor_total: Number(item.valor_total) || 0
        }))
        .filter((item) => item.horas > 0 && item.valor_total >= 0)
      : [];

    await connection.beginTransaction();

    const [payrollResult] = await connection.query(
      `INSERT INTO nomina (id_empleado, fecha_inicio, fecha_corte, tipo_pago, total_devengado, total_deducciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_empleado, fecha_inicio, fecha_corte, paymentType, devengado, deducciones]
    );

    const idNomina = payrollResult.insertId;

    if (Array.isArray(detalles) && detalles.length > 0) {
      const detailRows = detalles
        .filter((item) => item && item.concepto && Number(item.valor) >= 0)
        .map((item) => [idNomina, String(item.concepto).slice(0, 100), Number(item.valor)]);

      if (detailRows.length > 0) {
        await connection.query(
          `INSERT INTO detalle_nomina (id_nomina, concepto, valor) VALUES ?`,
          [detailRows]
        );
      }
    }

    if (overtimeRows.length > 0) {
      const overtimeInsertRows = overtimeRows.map((row) => [
        idNomina,
        row.tipo_hora,
        row.porcentaje_recargo,
        row.horas,
        row.valor_hora_base,
        row.valor_hora_extra,
        row.valor_total
      ]);

      await connection.query(
        `INSERT INTO horas_extra_nomina
          (id_nomina, tipo_hora, porcentaje_recargo, horas, valor_hora_base, valor_hora_extra, valor_total)
         VALUES ?`,
        [overtimeInsertRows]
      );
    }

    const corteDate = new Date(fecha_corte);
    const anio = corteDate.getUTCFullYear();
    const mes = corteDate.getUTCMonth() + 1;
    const totalHorasExtra = overtimeRows.reduce((acc, row) => acc + row.horas, 0);
    const valorHorasExtra = overtimeRows.reduce((acc, row) => acc + row.valor_total, 0);

    await connection.query(
      `INSERT INTO reporte_nomina_mensual
        (anio, mes, total_nominas, total_devengado, total_deducciones, total_pagado, total_horas_extra, valor_horas_extra)
       VALUES (?, ?, 1, ?, ?, (? - ?), ?, ?)
       ON DUPLICATE KEY UPDATE
         total_nominas = total_nominas + 1,
         total_devengado = total_devengado + VALUES(total_devengado),
         total_deducciones = total_deducciones + VALUES(total_deducciones),
         total_pagado = total_pagado + VALUES(total_pagado),
         total_horas_extra = total_horas_extra + VALUES(total_horas_extra),
         valor_horas_extra = valor_horas_extra + VALUES(valor_horas_extra)`,
      [anio, mes, devengado, deducciones, devengado, deducciones, totalHorasExtra, valorHorasExtra]
    );

    await connection.commit();

    const [savedPayrollRows] = await connection.query(
      `SELECT id_nomina, id_empleado, fecha_inicio, fecha_corte, tipo_pago, total_devengado, total_deducciones, total_pagar
       FROM nomina
       WHERE id_nomina = ?`,
      [idNomina]
    );

    return res.status(201).json({
      success: true,
      message: 'Nomina guardada exitosamente',
      data: savedPayrollRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando nomina:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error guardando la nomina'
    });
  } finally {
    connection.release();
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const now = new Date();
    const requestedYear = Number(req.query.anio) || now.getUTCFullYear();
    const requestedEmployeeId = Number(req.query.id_empleado) || null;

    const hasMonthFilter = req.query.mes !== undefined && req.query.mes !== null && req.query.mes !== '';
    const requestedMonth = hasMonthFilter ? Number(req.query.mes) : null;

    if (hasMonthFilter && (requestedMonth < 1 || requestedMonth > 12)) {
      return res.status(400).json({
        success: false,
        message: 'El parametro mes debe estar entre 1 y 12'
      });
    }

    const queryParams = [requestedYear];
    let monthFilterSql = '';
    let employeeFilterSql = '';

    if (hasMonthFilter) {
      monthFilterSql = ' AND MONTH(n.fecha_corte) = ? ';
      queryParams.push(requestedMonth);
    }

    if (requestedEmployeeId) {
      employeeFilterSql = ' AND n.id_empleado = ? ';
      queryParams.push(requestedEmployeeId);
    }

    const [rows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        e.nombres,
        e.apellidos,
        CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
        e.sueldo AS salario_base,
        c.nombre_cargo,
        d.nombre_departamento,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar,
        COALESCE((
          SELECT SUM(hen.horas)
          FROM horas_extra_nomina hen
          WHERE hen.id_nomina = n.id_nomina
            AND hen.tipo_hora = 'EXTRA_DIURNA'
        ), 0) AS horas_extra_diurna,
        COALESCE((
          SELECT SUM(hen.horas)
          FROM horas_extra_nomina hen
          WHERE hen.id_nomina = n.id_nomina
            AND hen.tipo_hora = 'EXTRA_DIURNA_DOMINICAL_FESTIVO'
        ), 0) AS horas_extra_diurna_festiva,
        COALESCE((
          SELECT SUM(hen.horas)
          FROM horas_extra_nomina hen
          WHERE hen.id_nomina = n.id_nomina
            AND hen.tipo_hora = 'EXTRA_NOCTURNA'
        ), 0) AS horas_extra_nocturna,
        COALESCE((
          SELECT SUM(hen.horas)
          FROM horas_extra_nomina hen
          WHERE hen.id_nomina = n.id_nomina
            AND hen.tipo_hora = 'EXTRA_NOCTURNA_DOMINICAL_FESTIVO'
        ), 0) AS horas_extra_nocturna_festiva
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      LEFT JOIN cargos c ON c.id_cargo = e.id_cargo
      LEFT JOIN departamentos d ON d.id_departamento = e.id_departamento
      WHERE YEAR(n.fecha_corte) = ?
        ${monthFilterSql}
        ${employeeFilterSql}
      ORDER BY n.fecha_corte DESC, n.id_nomina DESC`,
      queryParams
    );

    const resumen = rows.reduce((acc, row) => ({
      totalNominas: acc.totalNominas + 1,
      totalDevengado: acc.totalDevengado + (Number(row.total_devengado) || 0),
      totalDeducciones: acc.totalDeducciones + (Number(row.total_deducciones) || 0),
      totalPagado: acc.totalPagado + (Number(row.total_pagar) || 0)
    }), {
      totalNominas: 0,
      totalDevengado: 0,
      totalDeducciones: 0,
      totalPagado: 0
    });

    return res.json({
      success: true,
      data: {
        filtros: {
          anio: requestedYear,
          mes: hasMonthFilter ? requestedMonth : null,
          id_empleado: requestedEmployeeId
        },
        resumen,
        nominas: rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo el reporte de nomina'
    });
  }
};

const downloadPayrollPdf = async (req, res) => {
  let browser;

  try {
    const { id_nomina } = req.params;

    if (!id_nomina) {
      return res.status(400).json({
        success: false,
        message: 'El id de la nomina es obligatorio'
      });
    }

    const [payrollRows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar,
        e.nombres,
        e.apellidos,
        e.tipo_identificacion,
        e.numero_identificacion,
        e.sueldo,
        c.nombre_cargo,
        d.nombre_departamento
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      INNER JOIN cargos c ON c.id_cargo = e.id_cargo
      INNER JOIN departamentos d ON d.id_departamento = e.id_departamento
      WHERE n.id_nomina = ?`,
      [id_nomina]
    );

    if (payrollRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nomina no encontrada'
      });
    }

    const payroll = payrollRows[0];

    const [detailRows] = await pool.query(
      `SELECT concepto, valor
      FROM detalle_nomina
      WHERE id_nomina = ?`,
      [id_nomina]
    );

    const [overtimeRows] = await pool.query(
      `SELECT
      tipo_hora,
      porcentaje_recargo,
      horas,
      valor_hora_base,
      valor_hora_extra,
      valor_total
      FROM horas_extra_nomina
      WHERE id_nomina = ?`,
      [id_nomina]
    );

    const detailsHtml = detailRows.length > 0
      ? detailRows.map((item) => `
      <tr>
        <td>${item.concepto}</td>
        <td style="text-align: right;">${formatCurrency(item.valor)}</td>
      </tr>
    `).join('')
      : `
      <tr>
        <td colspan="2" style="text-align: center; color: #64748b;">
          No hay detalles registrados
        </td>
      </tr>
    `;

    const overtimeHtml = overtimeRows.length > 0
      ? overtimeRows.map((item) => `
      <tr>
        <td>${item.tipo_hora}</td>
        <td style="text-align: center;">${item.horas}</td>
        <td style="text-align: right;">${formatCurrency(item.valor_total)}</td>
      </tr>
    `).join('')
      : `
      <tr>
        <td colspan="3" style="text-align: center; color: #64748b;">
          No hay horas extra registradas
        </td>
      </tr>
    `;

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Comprobante de Nomina</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 32px;
          color: #1e293b;
          background: #ffffff;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .title {
          font-size: 28px;
          font-weight: bold;
          margin: 0;
          color: #0f172a;
        }

        .subtitle {
          margin-top: 6px;
          color: #64748b;
          font-size: 14px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section h2 {
          font-size: 16px;
          margin-bottom: 12px;
          color: #0f172a;
          border-left: 4px solid #2563eb;
          padding-left: 10px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 24px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }

        .info-item strong {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .info-item span {
          font-size: 14px;
          color: #0f172a;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th {
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 13px;
          text-align: left;
          padding: 10px;
          border: 1px solid #dbeafe;
        }

        td {
          padding: 10px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
        }

        .summary {
          margin-top: 24px;
          margin-left: auto;
          width: 320px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-row.total {
          background: #eff6ff;
          font-weight: bold;
          color: #1d4ed8;
        }

        .footer-note {
          margin-top: 30px;
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Comprobante de Nomina</h1>
          <p class="subtitle">Documento generado por el sistema de nomina</p>
        </div>
        <div>
          <strong>ID Nomina:</strong> ${payroll.id_nomina}
        </div>
      </div>

      <div class="section">
        <h2>Datos del Empleado</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Empleado</strong>
            <span>${payroll.nombres} ${payroll.apellidos}</span>
          </div>
          <div class="info-item">
            <strong>Identificacion</strong>
            <span>${payroll.tipo_identificacion} - ${payroll.numero_identificacion}</span>
          </div>
          <div class="info-item">
            <strong>Cargo</strong>
            <span>${payroll.nombre_cargo}</span>
          </div>
          <div class="info-item">
            <strong>Departamento</strong>
            <span>${payroll.nombre_departamento}</span>
          </div>
          <div class="info-item">
            <strong>Fecha inicio</strong>
            <span>${String(payroll.fecha_inicio).split('T')[0]}</span>
          </div>
          <div class="info-item">
            <strong>Fecha corte</strong>
            <span>${String(payroll.fecha_corte).split('T')[0]}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Detalle de Nomina</h2>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${detailsHtml}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Horas Extra</h2>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th style="text-align: center;">Horas</th>
              <th style="text-align: right;">Valor total</th>
            </tr>
          </thead>
          <tbody>
            ${overtimeHtml}
          </tbody>
        </table>
      </div>

      <div class="summary">
        <div class="summary-row">
          <span>Total devengado</span>
          <span>${formatCurrency(payroll.total_devengado)}</span>
        </div>
        <div class="summary-row">
          <span>Total deducciones</span>
          <span>${formatCurrency(payroll.total_deducciones)}</span>
        </div>
        <div class="summary-row total">
          <span>Neto a pagar</span>
          <span>${formatCurrency(payroll.total_pagar)}</span>
        </div>
      </div>

      <div class="footer-note">
        Este comprobante fue generado automaticamente por el sistema.
      </div>
    </body>
    </html>
`;

    browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=nomina-${payroll.id_nomina}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error generando el PDF de nomina'
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  createPayroll,
  getPayrollReport,
  downloadPayrollPdf
};
