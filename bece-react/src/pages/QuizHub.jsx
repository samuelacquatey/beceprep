import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useQuestions } from '../hooks/useQuestions';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import '../assets/styles/dashboard.css';

const SUBJECTS = [
    { id: 'math', name: 'Mathematics', icon: '📐', color: '#3B82F6' },
    { id: 'sci', name: 'Integrated Science', icon: '🧪', color: '#10B981' },
    { id: 'eng', name: 'English Language', icon: '📝', color: '#F59E0B' },
    { id: 'soc', name: 'Social Studies', icon: '🌍', color: '#8B5CF6' },
    { id: 'rme', name: 'RME', icon: '🙏', color: '#EC4899' },
    { id: 'ict', name: 'ICT', icon: '💻', color: '#6366F1' },
    { id: 'french', name: 'French', icon: '🇫🇷', color: '#EF4444' },
    { id: 'home_econs', name: 'Home Economics', icon: '🏠', color: '#F97316' },
    { id: 'bdt', name: 'BDT', icon: '🔨', color: '#64748B' }
];

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019];

export default function QuizHub() {
    const navigate = useNavigate();
    const { startQuiz } = useQuiz();
    const { questions: allQuestions, refresh, loading: isFetching } = useQuestions();
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
            let filteredQuestions = [...allQuestions];

            if (year !== 'all') {
                filteredQuestions = filteredQuestions.filter(q => q.year === Number(year));
            }

            if (subjectsArray.length > 0) {
                filteredQuestions = filteredQuestions.filter(q => subjectsArray.includes(q.subject));
            }

            if (filteredQuestions.length === 0) {
                if (window.confirm('No questions found for the selected criteria. Would you like to refresh the question bank from the server?')) {
                    await refresh();
                    // Optional: Try filtering again immediately? Or just let them click Start again.
                    // Letting them click start again is safer to ensure state settles.
                    alert('Question bank refreshed! Please try starting the quiz again.');
                }
                setLoading(false);
                return;
            }

            startQuiz({
                mode,
                subjects: subjectsArray,
                year,
                questions: shuffleArray(filteredQuestions)
            });

            navigate('/qna');
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to start quiz. Please try again.');
            setLoading(false);
        }
    };

    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 200;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                {/* Filters Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Filter</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>

                        {/* Year Dropdown */}
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                background: '#f9fafb',
                                minWidth: '150px',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All years</option>
                            {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {/* Mode Dropdown */}
                        <select
                            value={mode === 'endless' ? 'practice' : mode}
                            onChange={(e) => setMode(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                background: '#f9fafb',
                                minWidth: '150px',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="practice">Practice Mode</option>
                            <option value="exam">Exam Mode</option>
                        </select>
                    </div>
                </div>

                {/* Subjects Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Subjects</h3>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                        {/* Wrapped Container */}
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.8rem',
                                padding: '0.5rem',
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            {SUBJECTS.map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() => toggleSubject(sub.name)}
                                    style={{
                                        flex: '0 0 auto',
                                        minWidth: 'fit-content',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '50px',
                                        border: selectedSubjects.has(sub.name) ? '2px solid #3B82F6' : '1px solid #e5e7eb',
                                        background: selectedSubjects.has(sub.name) ? '#EFF6FF' : 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ fontSize: '1.2rem' }}>{sub.icon}</div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: selectedSubjects.has(sub.name) ? '#1D4ED8' : '#374151',
                                        textTransform: 'uppercase'
                                    }}>
                                        {sub.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Controls</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={handleStartQuiz}
                            disabled={loading}
                            style={{
                                background: '#2563EB',
                                color: 'white',
                                padding: '0.8rem 2rem',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#1D4ED8')}
                            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#2563EB')}
                        >
                            {loading ? 'Loading...' : 'Start Quiz'}
                        </button>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={mode === 'endless'}
                                onChange={(e) => setMode(e.target.checked ? 'endless' : 'practice')}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Endless Mode</span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sub-components for cleaner code
const ModeCard = ({ title, description, icon, active, onClick, color }) => (
    <div
        onClick={onClick}
        style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            cursor: 'pointer',
            border: active ? `2px solid ${color}` : '2px solid transparent',
            boxShadow: active ? `0 10px 20px -5px ${color}33` : '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{
            position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem',
            background: color, borderRadius: '0 0 0 16px', opacity: active ? 0.1 : 0
        }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{
                padding: '0.8rem',
                borderRadius: '12px',
                background: active ? color : '#f3f4f6',
                color: active ? 'white' : '#6b7280',
                transition: 'all 0.2s'
            }}>
                {icon}
            </div>
            {active && <CheckCircle size={24} color={color} />}
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>{description}</p>
    </div>
);

const FilterChip = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '50px',
            border: active ? '1px solid #4F46E5' : '1px solid #e5e7eb',
            background: active ? '#EEF2FF' : 'white',
            color: active ? '#4F46E5' : '#4b5563',
            fontSize: '0.95rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
        }}
    >
        {label}
    </button>
);

const SubjectCard = ({ subject, selected, onClick }) => (
    <div
        onClick={onClick}
        style={{
            padding: '1.2rem',
            borderRadius: '16px',
            border: selected ? `2px solid ${subject.color}` : '2px solid transparent',
            background: selected ? `${subject.color}11` : '#f9fafb',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            transition: 'all 0.2s ease',
            textAlign: 'center'
        }}
    >
        <span style={{ fontSize: '2rem' }}>{subject.icon}</span>
        <span style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: selected ? subject.color : '#374151'
        }}>
            {subject.name}
        </span>
    </div>
);
