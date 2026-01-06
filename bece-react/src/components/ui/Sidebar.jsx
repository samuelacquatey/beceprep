import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, Users, LogOut, Hammer, GraduationCap, Layers } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

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
                <div className="brand-icon">
                    <span style={{ fontSize: '24px' }}>⚡</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827' }}>BECE Prep</span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Student Portal</span>
                </div>
            </div>

            <div className="nav-menu" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/quiz" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <BookOpen size={20} />
                    <span>Quiz Hub</span>
                </NavLink>
                <NavLink to="/qna" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <GraduationCap size={20} />
                    {/* <span>Exam Room</span> */}
                    <span>Exam Room</span>
                </NavLink>
                <NavLink to="/flashcards" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <Layers size={20} />
                    <span>Flashcards</span>
                </NavLink>

                <div style={{ margin: '1rem 0', borderTop: '1px solid #eee' }}></div>


                <NavLink to="/social" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} `}>
                    <Users size={20} />
                    <span>Social Hub</span>
                </NavLink>
            </div>

            <div className="user-profile" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                {/* User profile could go here, or simple logout */}
                <button
                    onClick={handleLogout}
                    className="nav-item"
                    style={{ width: '100%', border: 'none', background: 'transparent', color: '#EF4444' }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
