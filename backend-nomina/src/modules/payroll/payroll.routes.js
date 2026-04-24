const express = require('express');
const router = express.Router();

const {
  createPayroll,
  deletePayrollsByEmployee,
  getPayrollReport,
  downloadPayrollPdf,
  getPayrollNoveltiesPreview
} = require('./payroll.controller');
const { verifyToken, verifyAdminORRRHH } = require('../../middleware/authMiddleware');

router.use(verifyToken);

router.get('/reportes', getPayrollReport);
router.get('/novedades', verifyAdminORRRHH, getPayrollNoveltiesPreview);
router.post('/', verifyAdminORRRHH, createPayroll);
router.delete('/empleado/:id_empleado', verifyAdminORRRHH, deletePayrollsByEmployee);
router.post('/empleado/:id_empleado/eliminar', verifyAdminORRRHH, deletePayrollsByEmployee);
router.get('/:id_nomina/pdf', downloadPayrollPdf);

module.exports = router;
