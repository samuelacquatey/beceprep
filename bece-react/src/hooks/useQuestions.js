
import { useState, useEffect } from 'react';
import { secureStorage } from '../utils/secureStorage';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ENHANCED_QUESTIONS as FALLBACK_QUESTIONS } from '../data/questionBank';

const CACHE_KEY = 'bece_questions_v2';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOffline, setIsOffline] = useState(false);

    const loadQuestions = async (forceRefresh = false) => {
        // If refreshing, show loading but don't clear generic questions yet to avoid UI flash if possible, 
        // but for now let's set loading true to show activity
        setLoading(true);

        try {
            // 1. Check Local Cache (Skip if forceRefresh is true)
            if (!forceRefresh) {
                const cachedData = await secureStorage.getItem(CACHE_KEY);

                if (cachedData && cachedData.timestamp && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
                    console.log('Loaded questions from secure cache');
                    setQuestions(cachedData.data);
                    setLoading(false);
                    return;
                }
            }

            // 2. If no cache or expired, try fetching from Firestore
            if (navigator.onLine) {
                try {
                    const querySnapshot = await getDocs(collection(db, 'questions'));
                    if (!querySnapshot.empty) {
                        const params = querySnapshot.docs.map(doc => doc.data());

                        // Update Cache
                        await secureStorage.setItem(CACHE_KEY, {
                            data: params,
                            timestamp: Date.now()
                        });

                        setQuestions(params);
                        setLoading(false);
                        return;
                    } else {
                        console.warn('Firestore empty, using fallback data');
                        await cacheFallback();
                    }
                } catch (err) {
                    console.error('Firestore fetch failed:', err);
                    await cacheFallback();
                }
            } else {
                setIsOffline(true);
                // Offline fallback
                setQuestions(FALLBACK_QUESTIONS);
                setLoading(false);
            }

        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    const cacheFallback = async () => {
        console.log('Using fallback static data');
        setQuestions(FALLBACK_QUESTIONS);
        await secureStorage.setItem(CACHE_KEY, {
            data: FALLBACK_QUESTIONS,
            timestamp: Date.now()
        });
        setLoading(false);
    };

    useEffect(() => {
        loadQuestions(false);
    }, []);

    const refresh = () => loadQuestions(true);

    return { questions, loading, error, isOffline, refresh };
};
