
import React, { createContext, useContext, useState, useEffect } from 'react';

const QuizContext = createContext();

export function useQuiz() {
    return useContext(QuizContext);
}

export function QuizProvider({ children }) {
    const [currentQuiz, setCurrentQuiz] = useState({
        mode: 'practice', // practice, exam, endless
        subjects: [],
        year: 'all',
        questions: [],
        currentIndex: 0,
        answers: {}, // {questionId: {choice: index, correct: bool, time: ms}}
        score: 0,
        isActive: false,
        startTime: null
    });

    // Load from sessionStorage on init if exists (persistence)
    useEffect(() => {
        const saved = sessionStorage.getItem('currentQuiz');
        if (saved) {
            setCurrentQuiz(JSON.parse(saved));
        }
    }, []);

    // Save to sessionStorage on change
    useEffect(() => {
        sessionStorage.setItem('currentQuiz', JSON.stringify(currentQuiz));
    }, [currentQuiz]);

    const startQuiz = (config) => {
        const newQuizState = {
            ...currentQuiz,
            ...config,
            currentIndex: 0,
            answers: {},
            score: 0,
            isActive: true,
            startTime: Date.now()
        };
        setCurrentQuiz(newQuizState);
    };

    const endQuiz = () => {
        setCurrentQuiz(prev => ({ ...prev, isActive: false }));
        sessionStorage.removeItem('currentQuiz');
    };

    const updateAnswer = (questionId, answerData) => {
        setCurrentQuiz(prev => ({
            ...prev,
            answers: {
                ...prev.answers,
                [questionId]: answerData
            }
        }));
    };

    const nextQuestion = () => setCurrentQuiz(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    const prevQuestion = () => setCurrentQuiz(prev => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));

    const value = {
        currentQuiz,
        startQuiz,
        endQuiz,
        updateAnswer,
        nextQuestion,
        prevQuestion,
        setCurrentQuiz
    };

    return (
        <QuizContext.Provider value={value}>
            {children}
        </QuizContext.Provider>
    );
}
