
import React, { useState } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { BookOpen, Layers, PlusCircle, RotateCcw } from 'lucide-react';
import '../assets/styles/dashboard.css';

export default function Flashcards() {
    const { cards, loading, createCard, rateCard, getStats } = useFlashcards();

    const [currentDeck, setCurrentDeck] = useState(null); // Filter by subject
    const [sessionCards, setSessionCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCard, setNewCard] = useState({ subject: 'Mathematics', topic: '', question: '', answer: '', hint: '', explanation: '' });

    // Stats
    const stats = getStats();

    // Initialize session (filter cards)
    const startSession = (subject = null) => {
        // Logic: prioritise due cards
        const now = new Date();
        let pool = cards;

        if (subject) {
            pool = pool.filter(c => c.subject === subject);
        }

        // Sort: Due cards first
        pool.sort((a, b) => {
            const dueA = a.dueDate ? new Date(a.dueDate) : new Date(0);
            const dueB = b.dueDate ? new Date(b.dueDate) : new Date(0);
            return dueA - dueB;
        });

        setSessionCards(pool);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowHint(false);
        setCurrentDeck(subject || 'All');
    };

    const handleRate = async (difficulty) => {
        if (sessionCards.length === 0) return;
        const card = sessionCards[currentIndex];

        await rateCard(card.id, difficulty);

        // Move to next
        if (currentIndex < sessionCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setShowHint(false);
        } else {
            // End of session
            alert("Session complete! Great job.");
            startSession(currentDeck === 'All' ? null : currentDeck);
        }
    };

    const currentCard = sessionCards[currentIndex];

    const handleCreateCard = async () => {
        if (!newCard.question || !newCard.answer) {
            alert("Question and Answer are required.");
            return;
        }
        await createCard(newCard);
        setShowCreateModal(false);
        setNewCard({ subject: 'Mathematics', topic: '', question: '', answer: '', hint: '', explanation: '' });
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="dashboard-container">
            <header className="header">
                <div>
                    <h1>Smart Flashcards</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Master topics with spaced repetition</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Card</button>
            </header>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>

                {/* Main Flashcard Area */}
                <div className="content-card">
                    <h3 style={{ marginBottom: '15px' }}>
                        {currentDeck ? `Study Session: ${currentDeck}` : 'Start Studying'}
                    </h3>

                    {!currentDeck ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Select a deck to start studying, or just review all due cards.</p>
                            <button className="btn btn-primary" onClick={() => startSession(null)}>Review All Due Cards</button>
                        </div>
                    ) : sessionCards.length === 0 ? (
                        <div className="no-data">
                            <p>🎉 No cards due for review in this deck!</p>
                            <button className="btn btn-ghost" onClick={() => setCurrentDeck(null)}>Back to Decks</button>
                        </div>
                    ) : (
                        // Flashcard Interface
                        <div className="flashcard-study-area">
                            <div
                                className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}
                                onClick={() => setIsFlipped(!isFlipped)}
                                style={{
                                    height: '300px', cursor: 'pointer', perspective: '1000px', position: 'relative',
                                    transformStyle: 'preserve-3d', transition: 'transform 0.6s'
                                }}
                            >
                                {/* Front */}
                                <div className="flashcard-side front" style={{
                                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px',
                                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' // Fix: Only rotate if flipped logic
                                }}>
                                    <div className="chip" style={{ marginBottom: '20px' }}>{currentCard.subject}</div>
                                    <h2 style={{ textAlign: 'center' }}>{currentCard.question}</h2>
                                    {!isFlipped && currentCard.hint && (
                                        <div style={{ marginTop: '20px' }}>
                                            {showHint ? <span style={{ color: 'var(--accent)' }}>💡 {currentCard.hint}</span> : <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setShowHint(true); }}>Show Hint</button>}
                                        </div>
                                    )}
                                    <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>Click to flip</div>
                                </div>

                                {/* Back */}
                                <div className="flashcard-side back" style={{
                                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                                    background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '16px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px',
                                    transform: 'rotateY(180deg)'
                                }}>
                                    <h2 style={{ color: 'var(--accent)', textAlign: 'center' }}>{currentCard.answer}</h2>
                                    {currentCard.explanation && <p style={{ marginTop: '15px', color: 'var(--text-muted)', textAlign: 'center' }}>{currentCard.explanation}</p>}
                                </div>
                            </div>

                            {/* Controls */}
                            {isFlipped && (
                                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                    <button className="btn" style={{ background: '#EF4444', color: 'white' }} onClick={() => handleRate('again')}>Again</button>
                                    <button className="btn" style={{ background: '#F59E0B', color: 'white' }} onClick={() => handleRate('hard')}>Hard</button>
                                    <button className="btn" style={{ background: '#10B981', color: 'white' }} onClick={() => handleRate('good')}>Good</button>
                                    <button className="btn" style={{ background: '#3B82F6', color: 'white' }} onClick={() => handleRate('easy')}>Easy</button>
                                </div>
                            )}
                            <div style={{ textAlign: 'center', marginTop: '15px', color: 'var(--text-muted)' }}>
                                Card {currentIndex + 1} of {sessionCards.length}
                            </div>
                            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '10px' }} onClick={() => setCurrentDeck(null)}>End Session</button>
                        </div>
                    )}
                </div>

                {/* Sidebar: Stats & Decks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Stats */}
                    <div className="content-card">
                        <div className="section-title">Study Progress</div>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                            <div style={{ background: 'var(--glass)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#EF4444' }}>{stats.dueToday}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due</div>
                            </div>
                            <div style={{ background: 'var(--glass)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>{stats.mastered}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mastered</div>
                            </div>
                            <div style={{ background: 'var(--glass)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.totalCards}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total</div>
                            </div>
                            <div style={{ background: 'var(--glass)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F59E0B' }}>{stats.streak}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Streak</div>
                            </div>
                        </div>
                    </div>

                    {/* Decks Logic - Group by subject */}
                    <div className="content-card" style={{ flex: 1 }}>
                        <div className="section-title">Your Decks</div>
                        {['Mathematics', 'English', 'Integrated Science', 'Social Studies'].map(sub => {
                            const count = cards.filter(c => c.subject === sub).length;
                            return (
                                <div key={sub}
                                    onClick={() => count > 0 && startSession(sub)}
                                    style={{
                                        padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '8px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        cursor: count > 0 ? 'pointer' : 'default', opacity: count > 0 ? 1 : 0.6
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{sub}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{count} cards</div>
                                    </div>
                                    {count > 0 && <RotateCcw size={16} color="var(--primary)" />}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Create New Flashcard</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <div>
                                <label>Subject</label>
                                <select className="input-field" value={newCard.subject} onChange={e => setNewCard({ ...newCard, subject: e.target.value })}>
                                    <option>Mathematics</option><option>English</option><option>Integrated Science</option><option>Social Studies</option>
                                </select>
                            </div>
                            <div>
                                <label>Question / Front</label>
                                <textarea className="input-field" rows="2" value={newCard.question} onChange={e => setNewCard({ ...newCard, question: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label>Answer / Back</label>
                                <textarea className="input-field" rows="2" value={newCard.answer} onChange={e => setNewCard({ ...newCard, answer: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label>Hint (Optional)</label>
                                <input type="text" className="input-field" value={newCard.hint} onChange={e => setNewCard({ ...newCard, hint: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateCard}>Save Card</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
