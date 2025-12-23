
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, Users, Hammer } from 'lucide-react';

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={24} />
                <span className="nav-label">Home</span>
            </NavLink>

            <NavLink to="/quiz" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <PenTool size={24} />
                <span className="nav-label">Quiz</span>
            </NavLink>

            <NavLink to="/dev" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div style={{ position: 'relative' }}>
                    <Hammer size={24} />
                    {/* <span style={{position:'absolute', top:-5, right:-5, width:8, height:8, background:'red', borderRadius:'50%'}}></span> */}
                </div>
                <span className="nav-label">Dev</span>
            </NavLink>

            <NavLink to="/flashcards" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BookOpen size={24} />
                <span className="nav-label">Cards</span>
            </NavLink>

            <NavLink to="/social" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={24} />
                <span className="nav-label">Social</span>
            </NavLink>
        </nav>
    );
}
