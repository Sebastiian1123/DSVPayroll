import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import './Reports.css';

import AdminReportsDashboard from './components/AdminReportsDashboard';
import AdminDetailPayroll from './components/AdminDetailPayroll';
import EmployeeReportsList from './components/EmployeeReportsList';
import EmployeeReportDetail from './components/EmployeeReportDetail';

export const ReportsPage = () => {
    const { isAdmin } = useAuth();
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedAdminPeriod, setSelectedAdminPeriod] = useState(null);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-light)' }}>
            <Navbar />

            <div className="reports-container">
                {isAdmin() ? (
                    selectedAdminPeriod ? (
                        <AdminDetailPayroll
                            period={selectedAdminPeriod}
                            onBack={() => setSelectedAdminPeriod(null)}
                        />
                    ) : (
                        <AdminReportsDashboard
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

export default ReportsPage;
