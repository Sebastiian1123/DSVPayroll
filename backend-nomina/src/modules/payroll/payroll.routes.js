const express = require('express');
const router = express.Router();

const {
  createPayroll,
  getPayrollReport,
  downloadPayrollPdf,
  getPayrollNoveltiesPreview,
  deletePayrollByEmployeeMonth
} = require('./payroll.controller');
const { verifyToken, verifyAdminORRRHH } = require('../../middleware/authMiddleware');

router.use(verifyToken);

router.get('/reportes', getPayrollReport);
router.get('/novedades', verifyAdminORRRHH, getPayrollNoveltiesPreview);
router.post('/', verifyAdminORRRHH, createPayroll);
router.delete('/empleado/:id_empleado', verifyAdminORRRHH, deletePayrollByEmployeeMonth);
router.delete('/empleados/:id_empleado', verifyAdminORRRHH, deletePayrollByEmployeeMonth);
router.delete('/:id_empleado/periodo', verifyAdminORRRHH, deletePayrollByEmployeeMonth);
router.get('/:id_nomina/pdf', downloadPayrollPdf);

module.exports = router;
