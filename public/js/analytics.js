import { getUserTopicPerformance, trackStudySession, trackQuizAttempt, getUserQuizHistory } from './database.js';
import { TOPIC_HIERARCHY, BECE_PASS_MARK, EXAM_DATE } from './data/topicData.js';

export class AnalyticsEngine {
  constructor(userId) {
    this.userId = userId;
    this.insights = [];
    this.topicPerformance = {};
  }

  async loadData(days = 30) {
    try {
      // Fetch raw history and topic performance
      const rawHistory = await getUserQuizHistory(this.userId, days);

      // Sanitize history (convert Timestamps to Dates)
      this.history = rawHistory.map(h => ({
        ...h,
        date: h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp)
      }));

      this.topicPerformance = await getUserTopicPerformance(this.userId);

      // Aggregate history into daily insights
      this.insights = this.aggregateDailyStats(this.history);

      console.log(`Loaded ${this.history.length} quiz attempts and ${Object.keys(this.topicPerformance).length} topics`);

      return {
        insights: this.insights,
        history: this.history,
        topicPerformance: this.topicPerformance
      };
    } catch (error) {
      console.error('Error loading analytics data:', error);
      return { insights: [], history: [], topicPerformance: {} };
    }
  }

  aggregateDailyStats(history) {
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
    return Object.values(dailyStats).sort((a, b) => a.date - b.date);
  }

  calculateOverallProgress() {
    const totalQuestions = this.insights.reduce((sum, day) => sum + day.totalQuestions, 0);
    const correctAnswers = this.insights.reduce((sum, day) => sum + day.correctAnswers, 0);
    const totalTime = this.insights.reduce((sum, day) => sum + day.timeSpent, 0);
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy),
      averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
      consistencyScore: this.calculateConsistency(),
      totalStudyTime: Math.round(totalTime / 60), // in minutes
      readinessScore: this.calculateBECEReadiness()
    };
  }

  calculateBECEReadiness() {
    // A complex score based on:
    // 1. Accuracy (50% weight)
    // 2. Coverage (30% weight) - how many topics attempted
    // 3. Consistency (20% weight)

    const totalQuestions = this.insights.reduce((sum, day) => sum + day.totalQuestions, 0);
    if (totalQuestions < 10) return 0; // Not enough data

    const correctAnswers = this.insights.reduce((sum, day) => sum + day.correctAnswers, 0);
    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Coverage: Assume ~20 topics total for now (can be dynamic)
    const topicsAttempted = Object.keys(this.topicPerformance).length;
    const coverage = Math.min((topicsAttempted / 10) * 100, 100); // Cap at 100% if 10+ topics

    const consistency = this.calculateConsistency();

    const score = (accuracy * 0.5) + (coverage * 0.3) + (consistency * 0.2);
    return Math.round(score);
  }

  identifyWeaknesses() {
    const weaknesses = [];

    Object.values(this.topicPerformance).forEach(topic => {
      if (topic.total >= 3) { // Only consider topics with sufficient attempts
        const performanceScore = topic.accuracy * (topic.avgConfidence || 0.5);

        weaknesses.push({
          subject: topic.subject,
          topic: topic.topic,
          accuracy: Math.round(topic.accuracy),
          totalAttempts: topic.total,
          performanceScore: Math.round(performanceScore),
          avgTime: Math.round(topic.avgTime),
          priority: this.calculatePriority(topic.accuracy, topic.total)
        });
      }
    });

    return weaknesses
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, 10);
  }

  calculatePriority(accuracy, attempts) {
    if (accuracy < 40 && attempts >= 5) return 'high';
    if (accuracy < 60 && attempts >= 3) return 'medium';
    return 'low';
  }

  generateRecommendations() {
    const weaknesses = this.identifyWeaknesses();
    const overall = this.calculateOverallProgress();

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

    // Study habit recommendations
    const consistency = this.calculateConsistency();
    if (consistency < 50) {
      recommendations.push({
        type: 'study_habits',
        priority: 'medium',
        title: 'Improve Study Consistency',
        message: `You're studying ${consistency}% of days. Regular practice leads to better retention.`,
        action: 'Set a daily study schedule and stick to it'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  calculateConsistency() {
    const activeDays = this.insights.filter(day => day.totalQuestions > 0).length;
    const totalDays = Math.max(this.insights.length, 1);
    return Math.round((activeDays / totalDays) * 100);
  }

  getStudyPatterns() {
    const patterns = {
      preferredSubjects: {},
      timeDistribution: {},
      performanceTrend: this.calculatePerformanceTrend()
    };

    // Analyze subject preferences based on attempt count
    Object.values(this.topicPerformance).forEach(topic => {
      if (!patterns.preferredSubjects[topic.subject]) {
        patterns.preferredSubjects[topic.subject] = 0;
      }
      patterns.preferredSubjects[topic.subject] += topic.total;
    });

    return patterns;
  }

  calculatePerformanceTrend() {
    if (this.insights.length < 2) return 'insufficient_data';

    const recent = this.insights[0];
    const older = this.insights[this.insights.length - 1];

    const recentAccuracy = recent.totalQuestions > 0 ? (recent.correctAnswers / recent.totalQuestions) * 100 : 0;
    const olderAccuracy = older.totalQuestions > 0 ? (older.correctAnswers / older.totalQuestions) * 100 : 0;

    if (recentAccuracy > olderAccuracy + 5) return 'improving';
    if (recentAccuracy < olderAccuracy - 5) return 'declining';
    return 'stable';
  }

  // Track a study session (call this when user completes a quiz)
  async trackSession(sessionData) {
    const data = {
      userId: this.userId,
      ...sessionData
    };

    return await trackStudySession(data);
  }

  // Track a quiz attempt
  async trackQuiz(quizData) {
    const data = {
      userId: this.userId,
      ...quizData
    };

    return await trackQuizAttempt(data);
  }
}