
import { useState, useCallback } from 'react';
import { getUserTopicPerformance, trackStudySession, trackQuizAttempt, getUserQuizHistory } from '../utils/database';
import { TOPIC_HIERARCHY } from '../data/topicData';

export function useAnalytics(userId) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        insights: [],
        history: [],
        topicPerformance: {}
    });

    // Calculate consistency score
    const calculateConsistency = useCallback((insights) => {
        if (!insights || insights.length === 0) return 0;
        const activeDays = insights.filter(day => day.totalQuestions > 0).length;
        const totalDays = Math.max(insights.length, 1);
        return Math.round((activeDays / totalDays) * 100);
    }, []);

    // Calculate BECE readiness score
    const calculateBECEReadiness = useCallback((insights, topicPerformance) => {
        // A complex score based on:
        // 1. Accuracy (50% weight)
        // 2. Coverage (30% weight) - how many topics attempted
        // 3. Consistency (20% weight)

        const totalQuestions = insights.reduce((sum, day) => sum + day.totalQuestions, 0);
        if (totalQuestions < 10) return 0; // Not enough data

        const correctAnswers = insights.reduce((sum, day) => sum + day.correctAnswers, 0);
        const accuracy = (correctAnswers / totalQuestions) * 100;

        // Coverage: Assume ~20 topics total for now (can be dynamic)
        const topicsAttempted = Object.keys(topicPerformance).length;
        const coverage = Math.min((topicsAttempted / 10) * 100, 100); // Cap at 100% if 10+ topics

        const consistency = calculateConsistency(insights);

        const score = (accuracy * 0.5) + (coverage * 0.3) + (consistency * 0.2);
        return Math.round(score);
    }, [calculateConsistency]);

    const loadData = useCallback(async (days = 30) => {
        if (!userId) return;

        setLoading(true);
        try {
            // Fetch raw history and topic performance
            const rawHistory = await getUserQuizHistory(userId, days);

            // Sanitize history (convert Timestamps to Dates)
            const history = rawHistory.map(h => ({
                ...h,
                date: h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp)
            }));

            const topicPerformance = await getUserTopicPerformance(userId);

            // Aggregate history into daily insights
            const dailyStats = {};

            history.forEach(quiz => {
                // Ensure we have a valid date object
                const dateObj = quiz.timestamp.toDate ? quiz.timestamp.toDate() : new Date(quiz.timestamp);
                const date = dateObj.toDateString();

                if (!dailyStats[date]) {
                    dailyStats[date] = {
                        date: dateObj,
                        totalQuestions: 0,
                        correctAnswers: 0,
                        timeSpent: 0,
                        sessionCount: 0
                    };
                }

                dailyStats[date].totalQuestions += (quiz.totalQuestions || 0);
                dailyStats[date].correctAnswers += (quiz.correctCount || 0);
                dailyStats[date].timeSpent += (quiz.timeSpent || 0);
                dailyStats[date].sessionCount += 1;
            });

            // Return sorted by date (ascending) for charts
            const insights = Object.values(dailyStats).sort((a, b) => a.date - b.date);

            setData({
                insights,
                history,
                topicPerformance
            });

            return { insights, history, topicPerformance };
        } catch (error) {
            console.error('Error loading analytics data:', error);
            return { insights: [], history: [], topicPerformance: {} };
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const calculateOverallProgress = useCallback(() => {
        const { insights, topicPerformance } = data;
        const totalQuestions = insights.reduce((sum, day) => sum + day.totalQuestions, 0);
        const correctAnswers = insights.reduce((sum, day) => sum + day.correctAnswers, 0);
        const totalTime = insights.reduce((sum, day) => sum + day.timeSpent, 0);
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        return {
            totalQuestions,
            correctAnswers,
            accuracy: Math.round(accuracy),
            averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
            consistencyScore: calculateConsistency(insights),
            totalStudyTime: Math.round(totalTime / 60), // in minutes
            readinessScore: calculateBECEReadiness(insights, topicPerformance)
        };
    }, [data, calculateConsistency, calculateBECEReadiness]);

    const identifyWeaknesses = useCallback(() => {
        const { topicPerformance } = data;
        const weaknesses = [];

        Object.values(topicPerformance).forEach(topic => {
            if (topic.total >= 3) { // Only consider topics with sufficient attempts
                const performanceScore = topic.accuracy * (topic.avgConfidence || 0.5);
                const priority = (topic.accuracy < 40 && topic.total >= 5) ? 'high' :
                    (topic.accuracy < 60 && topic.total >= 3) ? 'medium' : 'low';

                weaknesses.push({
                    subject: topic.subject,
                    topic: topic.topic,
                    accuracy: Math.round(topic.accuracy),
                    totalAttempts: topic.total,
                    performanceScore: Math.round(performanceScore),
                    avgTime: Math.round(topic.avgTime || 0), // Fallback if avgTime missing
                    priority
                });
            }
        });

        return weaknesses
            .sort((a, b) => a.performanceScore - b.performanceScore)
            .slice(0, 10);
    }, [data]);

    const generateRecommendations = useCallback(() => {
        const weaknesses = identifyWeaknesses();
        const overall = calculateOverallProgress();
        const recommendations = [];

        // Overall performance recommendations
        if (overall.accuracy < 60) {
            recommendations.push({
                type: 'foundation',
                priority: 'high',
                title: 'Strengthen Fundamentals',
                message: 'Focus on building strong foundational knowledge before tackling advanced topics.',
                action: 'Review basic concepts in your weakest subjects'
            });
        }

        if (overall.averageTimePerQuestion > 90) {
            recommendations.push({
                type: 'time_management',
                priority: 'medium',
                title: 'Improve Time Management',
                message: `You're spending ${overall.averageTimePerQuestion}s per question on average.`,
                action: 'Practice with timed sessions to improve speed'
            });
        }

        // Topic-specific recommendations with Hierarchy
        weaknesses.slice(0, 3).forEach(weakness => {
            let message = '';
            let action = '';
            let foundations = [];
            let tips = '';

            // Check hierarchy for remedial help
            if (TOPIC_HIERARCHY[weakness.subject] && TOPIC_HIERARCHY[weakness.subject][weakness.topic]) {
                const topicData = TOPIC_HIERARCHY[weakness.subject][weakness.topic];
                foundations = topicData.foundations || [];
                tips = topicData.tips || '';
            }

            if (weakness.accuracy < 40) {
                message = `You're struggling with ${weakness.topic}.`;
                if (foundations.length > 0) {
                    action = `Review these foundations: ${foundations.join(', ')}.`;
                } else {
                    action = `Study ${weakness.topic} basics and attempt easier questions first`;
                }
            } else if (weakness.accuracy < 70) {
                message = `You need more practice with ${weakness.topic}.`;
                action = tips ? `Tip: ${tips}` : `Practice more ${weakness.topic} questions`;
            } else {
                message = `You're doing well with ${weakness.topic}, aim for mastery.`;
                action = `Challenge yourself with advanced ${weakness.topic} problems`;
            }

            recommendations.push({
                type: 'topic_focus',
                priority: weakness.priority,
                title: `${weakness.subject}: ${weakness.topic}`,
                message: message,
                action: action,
                accuracy: weakness.accuracy,
                subject: weakness.subject,
                topic: weakness.topic,
                foundations: foundations
            });
        });

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }, [calculateOverallProgress, identifyWeaknesses]);

    return {
        loading,
        data,
        loadData,
        calculateOverallProgress,
        identifyWeaknesses,
        generateRecommendations,
        trackSession: trackStudySession,
        trackQuiz: trackQuizAttempt
    };
}
