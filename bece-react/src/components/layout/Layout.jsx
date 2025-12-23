import React from 'react';
import Sidebar from '../ui/Sidebar';
import BottomNav from '../ui/BottomNav';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
