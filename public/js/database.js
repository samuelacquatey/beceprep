import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { app } from './auth.js';

const db = getFirestore(app);
const auth = getAuth(app);

// User performance tracking
export const trackQuestionAttempt = async (userId, questionData, userResponse) => {
  const attemptData = {
    userId,
    questionId: questionData.id,
    timestamp: new Date(),
    subject: questionData.subject,
    topic: questionData.topic,
    difficulty: questionData.difficulty || 'medium',
    userAnswer: userResponse.choice,
    correctAnswer: questionData.a,
    isCorrect: userResponse.isCorrect,
    timeSpent: userResponse.timeSpent || 0,
    confidence: userResponse.confidence || 0.5,
    sessionId: userResponse.sessionId,
    mode: userResponse.mode
  };

  try {
    await addDoc(collection(db, 'questionAttempts'), attemptData);
    await updateUserAnalytics(userId, attemptData);
    return true;
  } catch (error) {
    console.error('Error tracking attempt:', error);
    return false;
  }
};

// User analytics aggregation
export const updateUserAnalytics = async (userId, attemptData) => {
  const today = new Date().toISOString().split('T')[0];
  const analyticsRef = doc(db, 'userAnalytics', `${userId}_${today}`);
  
  try {
    const existing = await getDoc(analyticsRef);
    const currentData = existing.exists() ? existing.data() : {
      userId,
      date: today,
      totalQuestions: 0,
      correctAnswers: 0,
      timeSpent: 0,
      subjects: {},
      topics: {},
      sessionCount: 0,
      sessions: []
    };

    // Update aggregates
    currentData.totalQuestions++;
    if (attemptData.isCorrect) currentData.correctAnswers++;
    currentData.timeSpent += attemptData.timeSpent;
    
    // Update sessions
    if (!currentData.sessions.includes(attemptData.sessionId)) {
      currentData.sessions.push(attemptData.sessionId);
      currentData.sessionCount = currentData.sessions.length;
    }

    // Update subject performance
    if (!currentData.subjects[attemptData.subject]) {
      currentData.subjects[attemptData.subject] = { total: 0, correct: 0, timeSpent: 0 };
    }
    currentData.subjects[attemptData.subject].total++;
    if (attemptData.isCorrect) currentData.subjects[attemptData.subject].correct++;
    currentData.subjects[attemptData.subject].timeSpent += attemptData.timeSpent;

    // Update topic performance
    const topicKey = `${attemptData.subject}_${attemptData.topic}`;
    if (!currentData.topics[topicKey]) {
      currentData.topics[topicKey] = { total: 0, correct: 0, subject: attemptData.subject, topic: attemptData.topic };
    }
    currentData.topics[topicKey].total++;
    if (attemptData.isCorrect) currentData.topics[topicKey].correct++;

    await setDoc(analyticsRef, currentData);
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
};

// Get user insights
export const getUserInsights = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    const q = query(
      collection(db, 'userAnalytics'),
      where('userId', '==', userId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting insights:', error);
    return [];
  }
};

// Get user performance by topic
export const getUserTopicPerformance = async (userId) => {
  try {
    const q = query(
      collection(db, 'questionAttempts'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    
    const snapshot = await getDocs(q);
    const attempts = snapshot.docs.map(doc => doc.data());
    
    const topicPerformance = {};
    attempts.forEach(attempt => {
      const key = `${attempt.subject}_${attempt.topic}`;
      if (!topicPerformance[key]) {
        topicPerformance[key] = {
          subject: attempt.subject,
          topic: attempt.topic,
          total: 0,
          correct: 0,
          totalTime: 0,
          avgConfidence: 0
        };
      }
      
      topicPerformance[key].total++;
      if (attempt.isCorrect) topicPerformance[key].correct++;
      topicPerformance[key].totalTime += attempt.timeSpent;
      topicPerformance[key].avgConfidence += attempt.confidence;
    });
    
    // Calculate averages
    Object.keys(topicPerformance).forEach(key => {
      const topic = topicPerformance[key];
      topic.accuracy = topic.total > 0 ? (topic.correct / topic.total) * 100 : 0;
      topic.avgTime = topic.total > 0 ? topic.totalTime / topic.total : 0;
      topic.avgConfidence = topic.total > 0 ? topic.avgConfidence / topic.total : 0;
    });
    
    return topicPerformance;
  } catch (error) {
    console.error('Error getting topic performance:', error);
    return {};
  }
};