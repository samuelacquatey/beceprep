import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, LogOut, Home } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function AdminSidebar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <aside className="sidebar" style={{ borderRight: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div className="brand">
                <div className="logo" style={{ background: '#4F46E5' }}>AD</div>
                <span style={{ color: '#1e293b' }}>Admin Panel</span>
            </div>

            <nav className="nav-menu">
                <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/questions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <Database size={20} />
                    <span>Question Bank</span>
                </NavLink>

                <div style={{ margin: '1rem 0', borderTop: '1px solid #cbd5e1' }}></div>

                <NavLink to="/" className="nav-item">
                    <Home size={20} />
                    <span>Student View</span>
                </NavLink>
            </nav>

            <div className="user-profile" style={{ background: '#e2e8f0' }}>
                <div className="user-info">
                    <div className="user-name" style={{ color: '#334155' }}>Administrator</div>
                    <div className="user-level" style={{ color: '#64748b' }}>Super User</div>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
}
