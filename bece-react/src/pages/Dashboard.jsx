
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    Filler
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
import { Mic, BarChart2, Clock, Search, BookOpen, User, CheckCircle, ClipboardList } from 'lucide-react';
import '../assets/styles/dashboard.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Dashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const {
        loading,
        loadData,
        calculateOverallProgress,
        generateRecommendations,
        data
    } = useAnalytics(currentUser?.uid);

    const [searchQuery, setSearchQuery] = useState('');
    const [progress, setProgress] = useState({
        totalQuestions: 0,
        accuracy: 0,
        averageTimePerQuestion: 0,
        consistencyScore: 0,
        totalStudyTime: 0,
        readinessScore: 0
    });
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        if (currentUser?.uid) {
            loadData(30).then(() => {
                // Data loaded, handled by hook state
            });
        }
    }, [currentUser, loadData]);

    useEffect(() => {
        if (!loading && data.insights.length >= 0) {
            setProgress(calculateOverallProgress());
            setRecommendations(generateRecommendations());
        }
    }, [loading, data, calculateOverallProgress, generateRecommendations]);

    // Chart Logic
    const performanceChartData = {
        labels: data.insights.slice(-7).map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [{
            label: 'Accuracy',
            data: data.insights.slice(-7).map(d => d.totalQuestions > 0 ? (d.correctAnswers / d.totalQuestions) * 100 : 0),
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 6,
            pointBackgroundColor: '#7C3AED',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
        }]
    };

    const performanceChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1E293B',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#7C3AED',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#E5E7EB', drawBorder: false },
                ticks: { color: '#64748B', callback: value => value + '%' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748B' }
            }
        }
    };

    const subjectChartData = () => {
        const subjects = {};
        Object.values(data.topicPerformance).forEach(t => {
            if (!subjects[t.subject]) subjects[t.subject] = { total: 0, correct: 0 };
            subjects[t.subject].total += t.total;
            subjects[t.subject].correct += t.correct;
        });

        const labels = Object.keys(subjects);
        const chartData = labels.map(s => (subjects[s].correct / subjects[s].total) * 100);

        return {
            labels: labels.length ? labels : ['Math', 'Science', 'English', 'Social', 'RME'],
            datasets: [{
                label: 'Mastery',
                data: chartData.length ? chartData : [0, 0, 0, 0, 0],
                borderColor: '#06B6D4',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#06B6D4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        };
    };

    const subjectChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#E5E7EB' },
                angleLines: { color: '#E5E7EB' },
                pointLabels: { color: '#1E293B', font: { size: 12, weight: '600' } },
                ticks: { display: false }
            }
        },
        plugins: { legend: { display: false } }
    };

    const getReadinessColor = (score) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#06B6D4';
        return '#F59E0B';
    };

    const getReadinessMessage = (score) => {
        if (score >= 80) return "🎉 Excellent! You're well prepared!";
        if (score >= 60) return "👍 Good progress! Keep practicing.";
        return "💪 Keep going! More practice needed.";
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // No Data State
    if (!loading && data.insights.length === 0) {
        return (
            <div className="dashboard-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="no-data-state">
                    <div className="no-data-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                    <h2>No Data Yet</h2>
                    <p>Start taking quizzes to see your analytics dashboard</p>
                    <button className="btn btn-primary" onClick={() => navigate('/quiz')}>Take Your First Quiz</button>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Header */}
            <header className="header">
                <div className="header-title-section">
                    <h1>Dashboard</h1>
                    <p className="welcome-text">Welcome back, {currentUser?.displayName || 'Student'}!</p>
                </div>

                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/quiz')}>📝 Take Quiz</button>
                </div>
            </header>

            {/* Metrics Grid */}
            <section className="metrics-grid">
                {/* Study Time */}
                <div className="metric-card green">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="card-icon"><Mic size={20} /></div>
                        <div className="card-title">Study Time</div>
                    </div>
                    <div>
                        <div className="card-value">{(progress.totalStudyTime / 60).toFixed(1)} hrs</div>
                        <div className="card-trend trend-up">↗ +2.5 hrs</div>
                    </div>
                </div>

                {/* Readiness */}
                <div className="metric-card orange">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="card-icon"><BarChart2 size={20} /></div>
                        <div className="card-title">Course Progress</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div>
                            <div className="card-value">{progress.accuracy}%</div>
                            <div className="card-trend trend-up">{progress.accuracy > 70 ? '↗ +5%' : '→ Stable'}</div>
                        </div>
                        {/* Simple Readiness Circle using SVG */}
                        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="30" cy="30" r="26" stroke="rgba(0,0,0,0.1)" strokeWidth="4" fill="transparent" />
                                <circle
                                    cx="30" cy="30" r="26"
                                    stroke={getReadinessColor(progress.readinessScore)}
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 26}
                                    strokeDashoffset={2 * Math.PI * 26 - ((progress.readinessScore / 100) * 2 * Math.PI * 26)}
                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 'bold' }}>
                                {progress.readinessScore}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="metric-card yellow">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="card-icon"><Clock size={20} /></div>
                        <div className="card-title">Total Quizzes</div>
                    </div>
                    <div>
                        <div className="card-value">{progress.totalQuestions}</div>
                        <div className="card-trend">Questions Answered</div>
                    </div>
                </div>
            </section>

            {/* Middle Grid */}
            <section className="middle-grid">
                {/* Performance Chart */}
                <div className="content-card">
                    <div className="section-title">
                        <span>Activity Hours</span>
                        <button className="btn btn-ghost" style={{ fontSize: '12px' }}>Weekly ▼</button>
                    </div>
                    <div className="chart-wrapper">
                        <Line data={performanceChartData} options={performanceChartOptions} />
                    </div>
                </div>

                {/* Weak Areas */}
                <div className="content-card">
                    <div className="section-title">
                        <span>Assignments</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recommendations.length === 0 ? (
                            <div className="no-data">🎉 Great job! No weak areas detected.</div>
                        ) : (
                            recommendations.filter(r => r.priority === 'high' || r.priority === 'medium').slice(0, 5).map((area, idx) => (
                                <div key={idx} className={`weak-area-item ${area.priority}`}>
                                    <div className="weak-area-header">
                                        <span className={`priority-badge ${area.priority}`}>{area.priority.toUpperCase()}</span>
                                        <h4>{area.title}</h4>
                                    </div>
                                    <p>{area.message}</p>
                                    <div className="action-tip">💡 {area.action}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Bottom Grid / Right Panel Integration (Responsive) */}
            <section className="content-grid-responsive">
                {/* Timeline */}
                <div className="content-card full-width">
                    <div className="section-title">
                        <span>Time Schedule</span>
                        <button className="btn btn-ghost" style={{ fontSize: '12px' }}>See All</button>
                    </div>
                    <div className="timeline-container">
                        {data.insights.length === 0 ? (
                            <div className="no-data">No recent activity</div>
                        ) : (
                            data.insights.slice(-5).reverse().map((insight, idx) => {
                                const total = insight.totalQuestions || 0;
                                const correct = insight.correctAnswers !== undefined ? insight.correctAnswers : (insight.correctCount || 0);
                                const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
                                const icon = accuracy >= 70 ? '✅' : accuracy >= 50 ? '⚠️' : '❌';

                                return (
                                    <div key={idx} className="timeline-item">
                                        <div className="timeline-icon">{icon}</div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <h4>Quiz Session</h4>
                                                <span className="timeline-date">{new Date(insight.date).toLocaleDateString()}</span>
                                            </div>
                                            <p>{correct}/{total} correct ({accuracy}%)</p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Calendar / Subject Chart Widget */}
                <div className="right-panel-widget">
                    <div className="profile-header">
                        <div className="avatar-large">👨‍🎓</div>
                        <h3>{currentUser?.displayName || 'Student'}</h3>
                        <div className="profile-stats-row">
                            <div className="mini-stat"><Clock size={16} /><b>{(progress.totalStudyTime / 60).toFixed(0)}h</b></div>
                            <div className="mini-stat"><ClipboardList size={16} /><b>{data.insights.length}</b></div>
                            <div className="mini-stat"><CheckCircle size={16} /><b>{progress.readinessScore}</b></div>
                        </div>
                    </div>

                    <div className="section-title">Topic Mastery</div>
                    <div className="calendar-widget">
                        <div style={{ width: '100%', height: '200px' }}>
                            <Radar data={subjectChartData()} options={subjectChartOptions} />
                        </div>
                    </div>

                    <div className="notice-board">
                        <div className="section-title">Notice Board</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ background: '#000', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>i</div>
                                <div>
                                    <b>Exam Schedule Release</b>
                                    <p>Check the new BECE timetable.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
