
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import { batchTrackQuestionAttempts, trackQuizAttempt, logSystemError } from '../utils/database';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, RotateCcw, Save } from 'lucide-react';
import '../assets/styles/dashboard.css';

export default function ExamRoom() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { currentQuiz, updateAnswer, nextQuestion, prevQuestion, endQuiz } = useQuiz();

    const [loading, setLoading] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

    // Redirect if no quiz active
    useEffect(() => {
        if (!currentQuiz.isActive || !currentQuiz.questions || currentQuiz.questions.length === 0) {
            navigate('/quiz');
        }
    }, [currentQuiz, navigate]);

    if (!currentQuiz.isActive || !currentQuiz.questions || currentQuiz.questions.length === 0) {
        return <div className="spinner"></div>;
    }

    const currentQuestion = currentQuiz.questions[currentQuiz.currentIndex];
    const currentAnswer = currentQuiz.answers[currentQuestion.id];
    const totalQuestions = currentQuiz.questions.length;
    const progressPercentage = Math.round(((currentQuiz.currentIndex + 1) / totalQuestions) * 100);

    const handleOptionSelect = (index) => {
        if (showSummary) return; // Read-only if finished

        updateAnswer(currentQuestion.id, {
            ...currentAnswer,
            choice: index,
            // Default confidence if not set
            confidence: currentAnswer?.confidence || 1.0
        });
    };

    const handleConfidenceSelect = (level) => {
        if (showSummary) return;

        updateAnswer(currentQuestion.id, {
            ...currentAnswer,
            confidence: level
        });
    };

    const calculateResults = () => {
        let correctCount = 0;
        let answeredCount = 0;
        const attemptList = [];

        currentQuiz.questions.forEach(q => {
            const ans = currentQuiz.answers[q.id];
            if (ans && ans.choice !== undefined) {
                answeredCount++;
                const isCorrect = ans.choice === q.a;
                if (isCorrect) correctCount++;

                attemptList.push({
                    questionId: q.id,
                    correct: isCorrect,
                    choice: ans.choice,
                    confidence: ans.confidence || 1.0,
                    subject: q.subject,
                    topic: q.topic,
                    year: q.year,
                    // Time spent could be tracked per question, for now simplistic
                });
            }
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        return {
            score,
            correctCount,
            answeredCount,
            attemptList,
            totalQuestions
        };
    };

    const handleSubmitQuiz = async () => {
        if (!window.confirm("Are you sure you want to submit? You cannot change answers after submitting.")) {
            return;
        }

        setLoading(true);
        try {
            const results = calculateResults();
            const totalTimeSpent = Math.round((Date.now() - currentQuiz.startTime) / 1000); // seconds

            // Save to Firebase
            if (currentUser) {
                // 1. Batch save attempts
                if (results.attemptList.length > 0) {
                    await batchTrackQuestionAttempts(currentUser.uid, results.attemptList);
                }

                // 2. Save session summary
                await trackQuizAttempt({
                    userId: currentUser.uid,
                    mode: currentQuiz.mode,
                    score: results.score,
                    totalQuestions: results.totalQuestions,
                    answeredCount: results.answeredCount,
                    correctCount: results.correctCount,
                    timeSpent: totalTimeSpent,
                    subjects: currentQuiz.subjects,
                    timestamp: new Date() // Firestore timestamp conversion handled in util
                });
            }

            setQuizResult(results);
            setShowSummary(true);

        } catch (error) {
            console.error("Error submitting quiz:", error);
            alert("There was an error saving your results. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleExit = () => {
        if (showSummary || window.confirm("Progress will be lost. Are you sure?")) {
            endQuiz();
            navigate('/dashboard');
        }
    };

    // --- Render Helpers ---

    const getOptionClass = (index) => {
        let className = "quiz-option";

        if (showSummary) {
            if (index === currentQuestion.a) className += " correct";
            else if (currentAnswer?.choice === index && index !== currentQuestion.a) className += " wrong";
        } else {
            if (currentAnswer?.choice === index) className += " selected";
        }

        return className;
    };

    // Summary View
    if (showSummary && quizResult) {
        return (
            <div className="dashboard-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <AwardIcon score={quizResult.score} />
                    <h1 style={{ fontSize: '3rem', color: 'var(--primary)', margin: '20px 0' }}>
                        {quizResult.score}%
                    </h1>
                    <h3>{getMotivationalMessage(quizResult.score)}</h3>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', margin: '30px 0' }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{quizResult.correctCount}/{quizResult.totalQuestions}</div>
                            <div style={{ color: 'var(--muted)' }}>Correct Answers</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{quizResult.answeredCount}</div>
                            <div style={{ color: 'var(--muted)' }}>Attempted</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => { endQuiz(); navigate('/quiz'); }}>
                            Take Another Quiz
                        </button>
                        <button className="btn btn-ghost" onClick={() => { endQuiz(); navigate('/dashboard'); }}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active Quiz View
    return (
        <div className="dashboard-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Quiz Header */}
            <header className="header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={handleExit} className="btn btn-ghost" style={{ padding: '5px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h4 style={{ margin: 0 }}>{currentQuestion.subject}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{currentQuestion.topic} • {currentQuestion.year}</span>
                    </div>
                </div>
                <div>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                        {currentQuiz.currentIndex + 1}
                    </span>
                    <span style={{ color: 'var(--muted)' }}> / {totalQuestions}</span>
                </div>
            </header>

            {/* Progress Bar */}
            <div style={{ height: '4px', background: 'var(--surface-hover)', width: '100%' }}>
                <div style={{ height: '100%', background: 'var(--primary)', width: `${progressPercentage}%`, transition: 'width 0.3s' }}></div>
            </div>

            {/* Main Question Area */}
            <main style={{ flex: 1, padding: '20px', overflowY: 'auto', maxWidth: '800px', width: '100%', margin: '0 auto' }}>

                <div className="question-card">
                    <h3 style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '20px' }}>
                        {currentQuestion.q}
                    </h3>

                    <div className="options-grid">
                        {currentQuestion.options.map((opt, idx) => (
                            <div
                                key={idx}
                                className={getOptionClass(idx)}
                                onClick={() => handleOptionSelect(idx)}
                            >
                                <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Confidence Rating (Only in Practice Mode w/o immediate feedback usually, but good for data) */}
                {!showSummary && (
                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <p style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--muted)' }}>Confidence Level</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            {[
                                { label: 'Guessing', val: 0.2 },
                                { label: 'Unsure', val: 0.6 },
                                { label: 'Confident', val: 1.0 }
                            ].map((lvl) => (
                                <button
                                    key={lvl.label}
                                    className={`chip ${currentAnswer?.confidence === lvl.val ? 'active' : ''}`}
                                    onClick={() => handleConfidenceSelect(lvl.val)}
                                    style={{ fontSize: '12px', padding: '5px 15px' }}
                                >
                                    {lvl.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </main>

            {/* Footer Controls */}
            <footer style={{
                padding: '15px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <button
                    className="btn btn-ghost"
                    onClick={prevQuestion}
                    disabled={currentQuiz.currentIndex === 0}
                    style={{ opacity: currentQuiz.currentIndex === 0 ? 0.5 : 1 }}
                >
                    <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Prev
                </button>

                {currentQuiz.currentIndex === totalQuestions - 1 ? (
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmitQuiz}
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                ) : (
                    <button
                        className="btn btn-ghost"
                        onClick={nextQuestion}
                        style={{ background: 'var(--surface-hover)' }}
                    >
                        Next <ArrowRight size={16} style={{ marginLeft: '5px' }} />
                    </button>
                )}
            </footer>

        </div>
    );
}

function getMotivationalMessage(score) {
    if (score === 100) return "🏆 Perfect Score! You're a genius!";
    if (score >= 80) return "🌟 Amazing Job! You're doing great!";
    if (score >= 60) return "👍 Good Effort! Keep practicing!";
    if (score >= 40) return "📚 Nice Try! Review your mistakes.";
    return "💪 Don't Give Up! Persistence is key.";
}

const AwardIcon = ({ score }) => {
    const color = score >= 80 ? '#10B981' : score >= 60 ? '#06B6D4' : '#F59E0B';
    return (
        <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: `${color}20`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto', fontSize: '40px'
        }}>
            {score >= 80 ? '🏆' : score >= 60 ? '🌟' : '💪'}
        </div>
    );
};
