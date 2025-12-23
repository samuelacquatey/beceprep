
import React, { useState, useMemo } from 'react';
import { ENHANCED_QUESTIONS } from '../data/questionBank';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DevQuestions() {
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    // Get unique subjects
    const subjects = useMemo(() => {
        const subs = new Set(ENHANCED_QUESTIONS.map(q => q.subject));
        return ['ALL', ...Array.from(subs)];
    }, []);

    // Filter questions
    const filteredQuestions = useMemo(() => {
        return ENHANCED_QUESTIONS.filter(q => {
            const matchesSearch = q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.id.toString().includes(searchTerm);
            const matchesSubject = subjectFilter === 'ALL' || q.subject === subjectFilter;
            return matchesSearch && matchesSubject;
        });
    }, [searchTerm, subjectFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const currentQuestions = filteredQuestions.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    return (
        <div style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Question Bank Explorer</h1>
                <p>Total Questions: {filteredQuestions.length} / {ENHANCED_QUESTIONS.length}</p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input
                        type="text"
                        placeholder="Search by text or ID..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        style={{
                            width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem',
                            borderRadius: '8px', border: '1px solid #ddd'
                        }}
                    />
                </div>

                <div style={{ position: 'relative', minWidth: '200px' }}>
                    <Filter size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <select
                        value={subjectFilter}
                        onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                        style={{
                            width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem',
                            borderRadius: '8px', border: '1px solid #ddd', appearance: 'none'
                        }}
                    >
                        {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto', background: 'white', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>ID</th>
                            <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Subject</th>
                            <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Question</th>
                            <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Answer</th>
                            <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Year</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentQuestions.map(q => (
                            <tr key={q.id} style={{ borderBottom: '1px solid #eee', fontSize: '0.95rem' }}>
                                <td style={{ padding: '1rem', color: '#666' }}>{q.id}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem',
                                        background: '#EEF2FF', color: '#4F46E5', fontWeight: '500'
                                    }}>
                                        {q.subject}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '400px' }}>{q.q}</td>
                                <td style={{ padding: '1rem' }}>
                                    {['A', 'B', 'C', 'D'][q.a]}
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                                        {q.options && q.options[q.a]}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#666' }}>{q.year}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                >
                    <ChevronLeft size={24} />
                </button>
                <span>
                    Page {page} of {totalPages || 1}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

        </div>
    );
}
