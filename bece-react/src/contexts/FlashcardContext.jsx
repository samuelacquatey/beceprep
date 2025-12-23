
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const FlashcardContext = createContext();

export function useFlashcards() {
    return useContext(FlashcardContext);
}

const DEFAULT_FLASHCARDS = [
    {
        subject: 'Mathematics',
        topic: 'Geometry',
        question: 'What is the formula for the area of a circle?',
        answer: 'πr²',
        explanation: 'The area is calculated by multiplying π (approximately 3.14159) by the square of the radius.',
        hint: 'Think about π and radius'
    },
    {
        subject: 'Mathematics',
        topic: 'Algebra',
        question: 'Solve for x: 2x + 5 = 13',
        answer: 'x = 4',
        explanation: 'Subtract 5 from both sides: 2x = 8, then divide both sides by 2: x = 4',
        hint: 'Isolate x by moving numbers to the other side'
    },
    {
        subject: 'English',
        topic: 'Grammar',
        question: 'What is a noun?',
        answer: 'A word that represents a person, place, thing, or idea.',
        explanation: 'Nouns are one of the main parts of speech and can be common or proper.',
        hint: 'People, places, things...'
    },
    {
        subject: 'Integrated Science',
        topic: 'Biology',
        question: 'What is photosynthesis?',
        answer: 'The process by which plants convert light energy into chemical energy.',
        explanation: 'Plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.',
        hint: 'Think about what plants do with sunlight'
    }
];

export function FlashcardProvider({ children }) {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper: Convert Firestore timestamp to Date
    const toDate = (timestamp) => {
        if (!timestamp) return new Date();
        if (timestamp.toDate) return timestamp.toDate();
        if (typeof timestamp === 'string') return new Date(timestamp);
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        return new Date(timestamp);
    };

    const loadUserCards = useCallback(async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'flashcards'),
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            const userCards = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dueDate: toDate(data.dueDate)
                };
            });

            if (userCards.length === 0) {
                // Create default cards
                await createDefaultCards(userId);
            } else {
                setCards(userCards);
            }
        } catch (error) {
            console.error('Error loading flashcards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createDefaultCards = async (userId) => {
        try {
            const newCards = [];
            for (const cardData of DEFAULT_FLASHCARDS) {
                const card = {
                    userId: userId,
                    ...cardData,
                    createdAt: Timestamp.now(),
                    interval: 1,
                    ease: 2.5,
                    dueDate: new Date(),
                    reviews: 0,
                    lastReview: null,
                    difficulty: 'new'
                };
                const docRef = await addDoc(collection(db, 'flashcards'), card);
                newCards.push({ id: docRef.id, ...card });
            }
            setCards(newCards);
        } catch (error) {
            console.error('Error creating default cards:', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadUserCards(currentUser.uid);
        } else {
            setCards([]);
        }
    }, [currentUser, loadUserCards]);

    const createCard = async (cardData) => {
        if (!currentUser) return;
        try {
            const card = {
                userId: currentUser.uid,
                ...cardData,
                createdAt: Timestamp.now(),
                interval: 1,
                ease: 2.5,
                dueDate: new Date(),
                reviews: 0,
                lastReview: null,
                difficulty: 'new'
            };

            const docRef = await addDoc(collection(db, 'flashcards'), card);
            const newCard = { id: docRef.id, ...card };
            setCards(prev => [...prev, newCard]);
            return newCard;
        } catch (error) {
            console.error('Error creating card:', error);
            throw error;
        }
    };

    const rateCard = async (cardId, difficulty) => {
        setCards(prevCards => {
            return prevCards.map(card => {
                if (card.id !== cardId) return card;

                const now = new Date();
                let interval = card.interval || 1;
                let ease = card.ease || 2.5;

                switch (difficulty) {
                    case 'again':
                        interval = 1;
                        ease = Math.max(1.3, ease - 0.2);
                        break;
                    case 'hard':
                        interval = Math.max(1, interval * 1.2);
                        ease = Math.max(1.3, ease - 0.15);
                        break;
                    case 'good':
                        interval = Math.max(1, interval * ease);
                        break;
                    case 'easy':
                        interval = Math.max(1, interval * ease * 1.3);
                        ease = ease + 0.1;
                        break;
                }

                const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

                // Update in Firestore asynchronously
                updateDoc(doc(db, 'flashcards', cardId), {
                    interval: Math.round(interval),
                    ease,
                    reviews: (card.reviews || 0) + 1,
                    lastReview: Timestamp.fromDate(now),
                    dueDate: Timestamp.fromDate(nextDueDate),
                    difficulty
                }).catch(err => console.error("Error updating card in DB:", err));

                return {
                    ...card,
                    interval: Math.round(interval),
                    ease,
                    reviews: (card.reviews || 0) + 1,
                    lastReview: now,
                    dueDate: nextDueDate,
                    difficulty
                };
            });
        });
    };

    const deleteCard = async (cardId) => {
        try {
            await deleteDoc(doc(db, 'flashcards', cardId));
            setCards(prev => prev.filter(c => c.id !== cardId));
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    };

    // Getters derived from state
    const getDueCards = () => {
        const now = new Date();
        return cards.filter(c => !c.dueDate || c.dueDate <= now);
    };

    const getStats = () => {
        const dueToday = getDueCards().length;
        const totalCards = cards.length;
        const mastered = cards.filter(c => c.interval > 21).length;

        // Simple streak calc
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentReviews = cards.filter(c => c.lastReview && c.lastReview > lastWeek).length;
        const streak = recentReviews > 0 ? Math.min(7, Math.max(1, Math.floor(recentReviews / 5))) : 0;

        return { dueToday, totalCards, mastered, streak };
    };

    const value = {
        cards,
        loading,
        createCard,
        rateCard,
        deleteCard,
        getDueCards,
        getStats
    };

    return (
        <FlashcardContext.Provider value={value}>
            {children}
        </FlashcardContext.Provider>
    );
}
