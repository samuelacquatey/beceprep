import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './auth.js';
import { ENHANCED_QUESTIONS } from './data/questionBank.js';

// --- Question Management ---

/**
 * Fetch questions based on filters
 * @param {Object} filters - { subjects, year, mode, limit }
 * @returns {Promise<Array>} - Array of question objects
 */
export async function fetchQuestions(filters = {}) {
  try {
    const questionsRef = collection(db, 'questions');
    let q = query(questionsRef);

    if (filters.year && filters.year !== 'all') {
      q = query(q, where('year', '==', Number(filters.year)));
    }

    const querySnapshot = await getDocs(q);
    let questions = [];

    querySnapshot.forEach((doc) => {
      questions.push({ id: Number(doc.id), ...doc.data() });
    });

    // Fallback to local data if Firestore returns empty
    if (questions.length === 0) {
      console.log("Firestore returned empty, using local fallback.");
      questions = [...ENHANCED_QUESTIONS];

      // Apply filters to local data
      if (filters.year && filters.year !== 'all') {
        questions = questions.filter(q => q.year === Number(filters.year));
      }
    }

    // Client-side filtering for subjects
    if (filters.subjects && filters.subjects.length > 0) {
      questions = questions.filter(q => filters.subjects.includes(q.subject));
    }

    return questions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    // Fallback on error too
    console.log("Error fetching from Firestore, using local fallback.");
    let questions = [...ENHANCED_QUESTIONS];

    if (filters.year && filters.year !== 'all') {
      questions = questions.filter(q => q.year === Number(filters.year));
    }

    if (filters.subjects && filters.subjects.length > 0) {
      questions = questions.filter(q => filters.subjects.includes(q.subject));
    }

    return questions;
  }
}

// --- Analytics & Tracking ---

// Track question attempts
export async function trackQuestionAttempt(userId, questionId, isCorrect, choice, confidence, metadata = {}) {
  try {
    const attemptData = {
      userId: userId,
      questionId: questionId,
      correct: isCorrect,
      choice: choice,
      confidence: confidence,
      timestamp: Timestamp.now(),
      ...metadata
    };

    // Fallback lookup if metadata is missing
    if (!attemptData.subject || !attemptData.topic) {
      let question = ENHANCED_QUESTIONS.find(q => q.id === questionId);
      if (question) {
        attemptData.subject = question.subject;
        attemptData.topic = question.topic;
        attemptData.year = question.year;
      }
    }

    const docRef = await addDoc(collection(db, 'questionAttempts'), attemptData);
    console.log('✅ Question attempt saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving question attempt: ', error);
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
      // dailyStats[date].timeSpent += attempt.timeSpent || 0; 

      if (attempt.correct) {
        dailyStats[date].correctAnswers++;
      }

      // Track by subject
      if (attempt.subject) {
        if (!dailyStats[date].subjects[attempt.subject]) {
          dailyStats[date].subjects[attempt.subject] = { total: 0, correct: 0 };
        }
        dailyStats[date].subjects[attempt.subject].total++;
        if (attempt.correct) {
          dailyStats[date].subjects[attempt.subject].correct++;
        }
      }
    });

    return Object.values(dailyStats).map(day => ({
      ...day,
      sessionCount: 1
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

    const topicPerformance = {};
    attempts.forEach(attempt => {
      if (!attempt.subject || !attempt.topic) return;

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

      if (attempt.correct) {
        topicPerformance[topicKey].correct++;
      }

      if (attempt.confidence) {
        topicPerformance[topicKey].avgConfidence += attempt.confidence;
        topicPerformance[topicKey].confidenceCount++;
      }
    });

    Object.values(topicPerformance).forEach(topic => {
      topic.accuracy = topic.total > 0 ? (topic.correct / topic.total) * 100 : 0;
      topic.avgConfidence = topic.confidenceCount > 0 ? topic.avgConfidence / topic.confidenceCount : 0.5;
    });

    return topicPerformance;

  } catch (error) {
    console.error('❌ Error getting topic performance: ', error);
    return {};
  }
}

// Track study session
export async function trackStudySession(sessionData) {
  try {
    const sessionWithTimestamp = {
      ...sessionData,
      timestamp: Timestamp.now()
    };

    await addDoc(collection(db, 'study_sessions'), sessionWithTimestamp);
    console.log('Study session tracked:', sessionData);
    return true;
  } catch (error) {
    console.error('Error tracking study session:', error);
    return false;
  }
}

// Track quiz attempt
export async function trackQuizAttempt(quizData) {
  try {
    const attemptWithTimestamp = {
      ...quizData,
      timestamp: Timestamp.now()
    };

    await addDoc(collection(db, 'quiz_attempts'), attemptWithTimestamp);
    console.log('Quiz attempt tracked:', quizData);
    return true;
  } catch (error) {
    console.error('Error tracking quiz attempt:', error);
    return false;
  }
}

// Update user progress
export async function updateUserProgress(userId, progressData) {
  try {
    const userProgressRef = doc(db, 'user_progress', userId);

    await setDoc(userProgressRef, {
      ...progressData,
      lastUpdated: Timestamp.now()
    }, { merge: true });

    console.log('User progress updated for:', userId);
    return true;
  } catch (error) {
    console.error('Error updating user progress:', error);
    return false;
  }
}

// Get user progress
export async function getUserProgress(userId) {
  try {
    const userProgressRef = doc(db, 'user_progress', userId);
    const docSnap = await getDoc(userProgressRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}