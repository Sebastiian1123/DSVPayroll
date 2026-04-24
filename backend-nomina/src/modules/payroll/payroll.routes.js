const express = require('express');
const router = express.Router();

const {
  createPayroll,
  deletePayrollsByEmployee,
  getPayrollReport,
  downloadPayrollPdf,
  getPayrollNoveltiesPreview,
  getPayrollById
} = require('./payroll.controller');
const { verifyToken, verifyAdminORRRHH } = require('../../middleware/authMiddleware');

router.use(verifyToken);

router.get('/parametros', getPayrollParameters);
router.put('/parametros', verifyAdminORRRHH, updatePayrollParameters);
router.get('/reportes', getPayrollReport);
router.get('/novedades', verifyAdminORRRHH, getPayrollNoveltiesPreview);
router.post('/', verifyAdminORRRHH, createPayroll);
router.delete('/empleado/:id_empleado', verifyAdminORRRHH, deletePayrollsByEmployee);
router.get('/:id_nomina/pdf', downloadPayrollPdf);

module.exports = router;
