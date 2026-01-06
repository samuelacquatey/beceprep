
import React, { useState, useEffect } from 'react';
import {
    BarChart, Users, BookOpen, Activity,
    Database, RefreshCw
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { useQuestions } from '../hooks/useQuestions';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function DevDashboard() {
    const { questions } = useQuestions();
    const [stats, setStats] = useState({
        totalQuestions: 0,
        subjectBreakdown: {},
        activeUsers: 0,
        dailyActive: []
    });

    useEffect(() => {
        if (!questions.length) return;

        // 1. Calculate Question Stats
        const total = questions.length;
        const subjects = questions.reduce((acc, q) => {
            const sub = q.subject || 'UNKNOWN';
            acc[sub] = (acc[sub] || 0) + 1;
            return acc;
        }, {});

        // 2. Mock Active User Stats (Simulating real data)
        // In a real app, this would come from an analytics endpoint
        const mockDaily = Array.from({ length: 7 }, (_, i) => ({
            day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
            users: Math.floor(Math.random() * 50) + 10
        }));

        setStats({
            totalQuestions: total,
            subjectBreakdown: subjects,
            activeUsers: 42, // Mock current active
            dailyActive: mockDaily
        });
    }, [questions]);

    const chartData = {
        labels: stats.dailyActive.map(d => d.day),
        datasets: [
            {
                label: 'Active Users',
                data: stats.dailyActive.map(d => d.users),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Daily Active Users (Last 7 Days)'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '2rem' }}>
            <div className="header-section" style={{ marginBottom: '2rem' }}>
                <h1>Developer Dashboard</h1>
                <p className="welcome-text">System metrics and content overview</p>
            </div>

            {/* Metrics Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: '#666' }}>Total Questions</span>
                        <Database size={24} color="#4F46E5" />
                    </div>
                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {stats.totalQuestions.toLocaleString()}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        <Link to="/admin/questions" style={{ color: '#4F46E5', fontSize: '0.9rem', textDecoration: 'none' }}>
                            View Question Bank &rarr;
                        </Link>
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: '#666' }}>Active Users</span>
                        <Activity size={24} color="#10B981" />
                    </div>
                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {stats.activeUsers}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#10B981' }}>
                        +12% from last week
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: '#666' }}>System Status</span>
                        <RefreshCw size={24} color="#F59E0B" />
                    </div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981' }}>
                        Healthy
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Version 1.0.0 (React Migration)
                    </div>
                </div>

            </div>

            {/* Charts & Details Section */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Active Users Chart */}
                <div className="chart-container" style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Line data={chartData} options={chartOptions} />
                </div>

                {/* Subject Breakdown */}
                <div className="subject-list" style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3>Questions by Subject</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {Object.entries(stats.subjectBreakdown).map(([subject, count]) => (
                            <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                                <span style={{ fontWeight: '500' }}>{subject}</span>
                                <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
