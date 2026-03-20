import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/Reports.css';

// Importar los nuevos subcomponentes
import AdminReportsDashboard from '../components/reports/AdminReportsDashboard';
import EmployeeReportsList from '../components/reports/EmployeeReportsList';
import EmployeeReportDetail from '../components/reports/EmployeeReportDetail';

export const Reports = () => {
    const { user, isAdmin } = useAuth();
    
    // Estado para manejar la navegación interna del empleado (Lista vs Detalle)
    const [selectedReport, setSelectedReport] = useState(null);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-light)'}}>
            <Navbar />
            
            <div className="reports-container">
                {/* 
                  * LÓGICA DE RENDERIZADO POR ROL 
                  * Admin y RRHH ven el Dashboard General
                  * Empleado ve su lista de recibos
                  */}
                {isAdmin() ? (
                    <AdminReportsDashboard />
                ) : (
                    // Lógica para Empleado: Mostrar Detalle o Lista
                    selectedReport ? (
                        <EmployeeReportDetail 
                            report={selectedReport} 
                            reportId={selectedReport?.dbId}
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
