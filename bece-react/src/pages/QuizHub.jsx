
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { fetchQuestions } from '../utils/database';
import { BookOpen, Clock, Zap, Award, Layers } from 'lucide-react';
import '../assets/styles/dashboard.css'; // Reusing dashboard styles for consistency

const SUBJECTS = [
    { id: 'math', name: 'Mathematics', icon: '📐' },
    { id: 'sci', name: 'Integrated Science', icon: '🧪' },
    { id: 'eng', name: 'English Language', icon: '📝' },
    { id: 'soc', name: 'Social Studies', icon: '🌍' },
    { id: 'rme', name: 'RME', icon: '🙏' },
    { id: 'ict', name: 'ICT', icon: '💻' },
    { id: 'french', name: 'French', icon: '🇫🇷' },
    { id: 'home_econs', name: 'Home Economics', icon: '🏠' },
    { id: 'bdt', name: 'BDT', icon: '🔨' }
];

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019];

export default function QuizHub() {
    const navigate = useNavigate();
    const { startQuiz } = useQuiz();
    const [loading, setLoading] = useState(false);

    const [selectedSubjects, setSelectedSubjects] = useState(new Set());
    const [year, setYear] = useState('all');
    const [mode, setMode] = useState('practice');

    const toggleSubject = (name) => {
        const newSelected = new Set(selectedSubjects);
        if (newSelected.has(name)) {
            newSelected.delete(name);
        } else {
            newSelected.add(name);
        }
        setSelectedSubjects(newSelected);
    };

    const handleStartQuiz = async () => {
        if (selectedSubjects.size === 0) {
            alert('Please select at least one subject');
            return;
        }

        setLoading(true);
        try {
            const subjectsArray = Array.from(selectedSubjects);
            const questions = await fetchQuestions({
                subjects: subjectsArray,
                year: year
            });

            if (questions.length === 0) {
                alert('No questions found for the selected criteria. Try adjusting your filters.');
                setLoading(false);
                return;
            }

            // Initialize Quiz Context
            startQuiz({
                mode,
                subjects: subjectsArray,
                year,
                questions: shuffleArray(questions)
            });

            navigate('/qna');
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to start quiz. Please try again.');
            setLoading(false);
        }
    };

    // Fisher-Yates shuffle
    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    return (
        <div className="dashboard-container" style={{ padding: '20px' }}>

            <header className="header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <h1>Quiz Hub</h1>
                <p className="subtitle">Configure your practice session</p>
            </header>

            <div className="metrics-grid">
                {/* Practice Mode Card */}
                <div
                    className={`metric-card ${mode === 'practice' ? 'green' : ''}`}
                    onClick={() => setMode('practice')}
                    style={{ cursor: 'pointer', border: mode === 'practice' ? '2px solid var(--accent)' : 'none' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div className="card-icon"><BookOpen size={20} /></div>
                        {mode === 'practice' && <CheckCircle size={20} color="var(--accent)" />}
                    </div>
                    <h3>Practice Mode</h3>
                    <p style={{ fontSize: '12px', opacity: 0.8 }}>Learn as you go with instant feedback and explanations.</p>
                </div>

                {/* Exam Mode Card */}
                <div
                    className={`metric-card ${mode === 'exam' ? 'orange' : ''}`}
                    onClick={() => setMode('exam')}
                    style={{ cursor: 'pointer', border: mode === 'exam' ? '2px solid #F59E0B' : 'none' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div className="card-icon"><Clock size={20} /></div>
                        {mode === 'exam' && <CheckCircle size={20} color="#F59E0B" />}
                    </div>
                    <h3>Exam Mode</h3>
                    <p style={{ fontSize: '12px', opacity: 0.8 }}>Simulate real exam conditions. Timed, no immediate feedback.</p>
                </div>

                {/* Endless Mode Card */}
                <div
                    className={`metric-card ${mode === 'endless' ? 'yellow' : ''}`}
                    onClick={() => setMode('endless')}
                    style={{ cursor: 'pointer', border: mode === 'endless' ? '2px solid #10B981' : 'none' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div className="card-icon"><Zap size={20} /></div>
                        {mode === 'endless' && <CheckCircle size={20} color="#10B981" />}
                    </div>
                    <h3>Endless Mode</h3>
                    <p style={{ fontSize: '12px', opacity: 0.8 }}>Keep answering questions until you stop. Great for quick revision.</p>
                </div>
            </div>

            <div className="content-card" style={{ marginTop: '20px' }}>
                <div className="section-title">
                    <span>Target Settings</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Year</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className={`chip ${year === 'all' ? 'active' : ''}`}
                            onClick={() => setYear('all')}
                        >
                            All Years
                        </button>
                        {YEARS.map(y => (
                            <button
                                key={y}
                                className={`chip ${year === y ? 'active' : ''}`}
                                onClick={() => setYear(y)}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Subjects</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                        {SUBJECTS.map(sub => (
                            <div
                                key={sub.id}
                                className={`subject-card ${selectedSubjects.has(sub.name) ? 'active' : ''}`}
                                onClick={() => toggleSubject(sub.name)}
                                style={{
                                    padding: '15px',
                                    borderRadius: '12px',
                                    background: selectedSubjects.has(sub.name) ? 'var(--accent)' : 'var(--glass)',
                                    color: selectedSubjects.has(sub.name) ? '#fff' : 'inherit',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{sub.icon}</span>
                                <span style={{ fontWeight: '500' }}>{sub.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '15px 40px', fontSize: '18px', width: '100%', maxWidth: '400px' }}
                        onClick={handleStartQuiz}
                        disabled={loading}
                    >
                        {loading ? 'Loading Questions...' : 'Start Session 🚀'}
                    </button>
                </div>

            </div>
        </div>
    );
}

// Icon for active state dummy ref
const CheckCircle = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
