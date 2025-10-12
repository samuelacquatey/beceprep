import { db } from './auth.js';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Track question attempts
export async function trackQuestionAttempt(userId, question, trackingData) {
  try {
    const attemptData = {
      userId: userId,
      questionId: question.id,
      subject: question.subject,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      year: question.year,
      correct: trackingData.isCorrect,
      choice: trackingData.choice,
      timeSpent: trackingData.timeSpent,
      confidence: trackingData.confidence,
      sessionId: trackingData.sessionId,
      mode: trackingData.mode,
      timestamp: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'questionAttempts'), attemptData);
    console.log('✅ Question attempt saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving question attempt: ', error);
    throw error;
  }
}

// Get user insights for dashboard
export async function getUserInsights(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'questionAttempts'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const attempts = querySnapshot.docs.map(doc => doc.data());
    
    // Group by date and calculate daily stats
    const dailyStats = {};
    attempts.forEach(attempt => {
      const date = attempt.timestamp.toDate().toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date: attempt.timestamp.toDate(),
          totalQuestions: 0,
          correctAnswers: 0,
          timeSpent: 0,
          sessionCount: 0,
          subjects: {}
        };
      }
      
      dailyStats[date].totalQuestions++;
      dailyStats[date].timeSpent += attempt.timeSpent || 0;
      
      if (attempt.correct) {
        dailyStats[date].correctAnswers++;
      }
      
      // Track by subject
      if (!dailyStats[date].subjects[attempt.subject]) {
        dailyStats[date].subjects[attempt.subject] = { total: 0, correct: 0 };
      }
      dailyStats[date].subjects[attempt.subject].total++;
      if (attempt.correct) {
        dailyStats[date].subjects[attempt.subject].correct++;
      }
    });

    // Convert to array and calculate session count (simplified)
    return Object.values(dailyStats).map(day => ({
      ...day,
      sessionCount: 1 // Simplified - you can enhance this
    }));

  } catch (error) {
    console.error('❌ Error getting user insights: ', error);
    return [];
  }
}

// Get topic performance
export async function getUserTopicPerformance(userId) {
  try {
    const q = query(
      collection(db, 'questionAttempts'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const attempts = querySnapshot.docs.map(doc => doc.data());
    
    // Group by topic
    const topicPerformance = {};
    attempts.forEach(attempt => {
      const topicKey = `${attempt.subject}-${attempt.topic}`;
      if (!topicPerformance[topicKey]) {
        topicPerformance[topicKey] = {
          subject: attempt.subject,
          topic: attempt.topic,
          total: 0,
          correct: 0,
          totalTime: 0,
          avgConfidence: 0,
          confidenceCount: 0
        };
      }
      
      topicPerformance[topicKey].total++;
      topicPerformance[topicKey].totalTime += attempt.timeSpent || 0;
      
      if (attempt.correct) {
        topicPerformance[topicKey].correct++;
      }
      
      if (attempt.confidence) {
        topicPerformance[topicKey].avgConfidence += attempt.confidence;
        topicPerformance[topicKey].confidenceCount++;
      }
    });

    // Calculate averages and accuracy
    Object.values(topicPerformance).forEach(topic => {
      topic.accuracy = topic.total > 0 ? (topic.correct / topic.total) * 100 : 0;
      topic.avgTime = topic.total > 0 ? topic.totalTime / topic.total : 0;
      topic.avgConfidence = topic.confidenceCount > 0 ? topic.avgConfidence / topic.confidenceCount : 0.5;
    });

    return topicPerformance;

  } catch (error) {
    console.error('❌ Error getting topic performance: ', error);
    return {};
  }
}