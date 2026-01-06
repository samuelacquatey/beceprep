import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
    return (
        <div className="dashboard-container">
            <AdminSidebar />
            <main className="main-content" style={{ background: '#f1f5f9' }}>
                <Outlet />
            </main>
        </div>
    );
}
