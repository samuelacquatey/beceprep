import { getUserInsights, getUserTopicPerformance } from './database.js';

export class AnalyticsEngine {
  constructor(userId) {
    this.userId = userId;
    this.insights = [];
    this.topicPerformance = {};
  }

  async loadData(days = 30) {
    try {
      this.insights = await getUserInsights(this.userId, days);
      this.topicPerformance = await getUserTopicPerformance(this.userId);
      
      console.log(`Loaded ${this.insights.length} insights and ${Object.keys(this.topicPerformance).length} topics`);
      
      return { 
        insights: this.insights, 
        topicPerformance: this.topicPerformance 
      };
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Return empty arrays instead of failing
      return { insights: [], topicPerformance: {} };
    }
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
      totalStudyTime: Math.round(totalTime / 60) // in minutes
    };
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

    // Topic-specific recommendations
    weaknesses.slice(0, 3).forEach(weakness => {
      let message = '';
      let action = '';
      
      if (weakness.accuracy < 40) {
        message = `You're struggling with ${weakness.topic}. Consider reviewing fundamental concepts.`;
        action = `Study ${weakness.topic} basics and attempt easier questions first`;
      } else if (weakness.accuracy < 70) {
        message = `You need more practice with ${weakness.topic} to improve consistency.`;
        action = `Practice more ${weakness.topic} questions with varied difficulty`;
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
        topic: weakness.topic
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
    
    const recentAccuracy = this.insights[0].correctAnswers / this.insights[0].totalQuestions;
    const olderAccuracy = this.insights[this.insights.length - 1].correctAnswers / this.insights[this.insights.length - 1].totalQuestions;
    
  }
}