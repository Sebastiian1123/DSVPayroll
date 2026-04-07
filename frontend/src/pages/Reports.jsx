import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Reports.css';

import AdminReportsDashboard from '../components/reports/AdminReportsDashboard';
import AdminDetailPayroll from '../components/reports/AdminDetailPayroll';
import EmployeeReportsList from '../components/reports/EmployeeReportsList';
import EmployeeReportDetail from '../components/reports/EmployeeReportDetail';

export const Reports = () => {
    const { isAdmin } = useAuth();
    const isAdminUser = isAdmin();
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedAdminPeriod, setSelectedAdminPeriod] = useState(null);
    const currentYear = new Date().getFullYear();
    const [selectedAdminYear, setSelectedAdminYear] = useState(currentYear);
    const [adminReportRows, setAdminReportRows] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState('');

    useEffect(() => {
        const fetchAdminReportsByYear = async () => {
            if (!isAdminUser) return;

            try {
                setAdminLoading(true);
                setAdminError('');

                const response = await api.get('/nomina/reportes', {
                    params: { anio: selectedAdminYear }
                });

                setAdminReportRows(response.data?.data?.nominas || []);
            } catch (fetchError) {
                console.error('Error cargando reportes de administrador:', fetchError);
                setAdminReportRows([]);
                setAdminError('No fue posible cargar los reportes de nómina. Intenta nuevamente.');
            } finally {
                setAdminLoading(false);
            }
        };

        fetchAdminReportsByYear();
    }, [isAdminUser, selectedAdminYear]);

    const adminAvailableYears = useMemo(() => {
        const yearsFromRows = adminReportRows
            .map((row) => new Date(row.fecha_corte).getUTCFullYear())
            .filter((year) => Number.isFinite(year));

        const fallbackYears = [currentYear, currentYear - 1, currentYear - 2];

        return Array.from(new Set([...yearsFromRows, ...fallbackYears]))
            .sort((a, b) => b - a);
    }, [adminReportRows, currentYear]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-light)' }}>
            <Navbar />

            <div className="reports-container">
                {isAdminUser ? (
                    selectedAdminPeriod ? (
                        <AdminDetailPayroll
                            period={selectedAdminPeriod}
                            reportRows={adminReportRows}
                            loading={adminLoading}
                            error={adminError}
                            onBack={() => setSelectedAdminPeriod(null)}
                        />
                    ) : (
                        <AdminReportsDashboard
                            selectedYear={selectedAdminYear}
                            years={adminAvailableYears}
                            loading={adminLoading}
                            error={adminError}
                            reportRows={adminReportRows}
                            onSelectYear={(year) => setSelectedAdminYear(year)}
                            onSelectPeriod={(period) => setSelectedAdminPeriod(period)}
                        />
                    )
                ) : (
                    selectedReport ? (
                        <EmployeeReportDetail
                            report={selectedReport}
                            onBack={() => setSelectedReport(null)}
                        />
                    ) : (
                        <EmployeeReportsList
                            onSelectReport={(report) => setSelectedReport(report)}
                        />
                    )
                )}
            </div>
        </div>
    );
};
