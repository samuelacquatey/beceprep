import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, Users, LogOut, Hammer } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function Sidebar() {
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
        <aside className="sidebar">
            <div className="brand">
                <div className="logo">BE</div>
                <span>BECE Prep</span>
            </div>

            <nav className="nav-menu">
                <NavLink to="/dashboard" className={({ isActive }) => `nav - item ${isActive ? 'active' : ''} `}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/quiz" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <PenTool size={20} />
                    <span>Quiz Hub</span>
                </NavLink>
                <NavLink to="/flashcards" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <BookOpen size={20} />
                    <span>Flashcards</span>
                </NavLink>

                <div style={{ margin: '1rem 0', borderTop: '1px solid #eee' }}></div>

                <NavLink to="/dev" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `} style={{ color: '#4F46E5' }}>
                    <Hammer size={20} />
                    <span>Dev Tools</span>
                </NavLink>
                <NavLink to="/social" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <Users size={20} />
                    <span>Social Hub</span>
                </NavLink>
            </nav>

            <div className="user-profile">
                <div className="user-info">
                    {/* User info can be fetched from context if needed */}
                    <div className="user-name">Student</div>
                    <div className="user-level">JHS 3</div>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
}
