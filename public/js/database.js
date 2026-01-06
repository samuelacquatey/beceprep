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
  writeBatch,
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

    // --- 1. OPTIMIZED COMPOUND FILTERS ---
    // If specific subjects are selected, we can optimise. 
    // Firestore 'in' query supports up to 10 items (we have <10 subjects).
    if (filters.subjects && filters.subjects.length > 0) {
      // NOTE: This usually requires an index if combined with field sorting
      q = query(q, where('subject', 'in', filters.subjects));
    }

    if (filters.year && filters.year !== 'all') {
      // NOTE: Ensure year is handled as consistent type (DB uses String '2023' or Number 2023?)
      // We'll try generic comparison or match DB type.
      // If DB has string '2023', Number() will mismatch in Firestore.
      // Safe bet: Don't cast if not sure, OR cast to match DB.
      // Assuming DB might have Strings for legacy reasons in questionBank.js.
      q = query(q, where('year', '==', filters.year)); // Removed Number() forceful cast
    }

    // Limit for initial load speed (Snappy!)
    // In a real endless mode, we would use cursors. 
    q = query(q, limit(10));

    const querySnapshot = await getDocs(q);
    let questions = [];

    querySnapshot.forEach((doc) => {
      // FIX: Support String IDs (Subject_Year_Hash) - kept as string
      questions.push({ id: doc.id, ...doc.data() });
    });

    // Client-side fallback if no results (rare but possible if index fails silently or empty DB)
    if (questions.length === 0) {
      console.log("Firestore empty or filtered out. Checking local fallback...");
      return fetchLocalFallback(filters);
    }

    return questions;

  } catch (error) {
    console.error("Firestore Error (likely missing index or network):", error);

    // --- 2. GRACEFUL FALLBACK ---
    // If "failed-precondition" (Missing Index), we fall back to local data or simpler query.
    // For this 24h rollout to be safe, we fall back to local data immediately.
    return fetchLocalFallback(filters);
  }
}

function fetchLocalFallback(filters) {
  console.log("Using Local Logic for Fallback");
  let questions = [...ENHANCED_QUESTIONS];

  if (filters.year && filters.year !== 'all') {
    questions = questions.filter(q => String(q.year) === String(filters.year));
  }

  if (filters.subjects && filters.subjects.length > 0) {
    questions = questions.filter(q => filters.subjects.includes(q.subject));
  }

  // Mock a limit
  return questions.slice(0, 50);
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

// Batch track question attempts (Optimized)
export async function batchTrackQuestionAttempts(userId, attempts) {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'questionAttempts');

    // 1. Queue all attempt writes
    attempts.forEach(attempt => {
      const docRef = doc(collectionRef); // generated ID
      const data = {
        userId,
        ...attempt,
        timestamp: Timestamp.now()
      };

      // Fallback metadata if missing
      if (!data.subject || !data.topic) {
        let question = ENHANCED_QUESTIONS.find(q => q.id === attempt.questionId);
        if (question) {
          data.subject = question.subject;
          data.topic = question.topic;
          data.year = question.year;
        }
      }

      batch.set(docRef, data);
    });

    // 2. Commit batch
    await batch.commit();
    console.log(`✅ Batch saved ${attempts.length} question attempts.`);

    // 3. Update Aggregates (Fire and forget, or await if critical)
    await updateTopicAggregates(userId, attempts);

    return true;
  } catch (error) {
    console.error('❌ Error batch saving attempts: ', error);
    return false;
  }
}

// Helper: Update aggregate stats
async function updateTopicAggregates(userId, newAttempts) {
  try {
    const statsRef = doc(db, 'user_stats', userId);
    const statsSnap = await getDoc(statsRef);

    let topicPerformance = {};
    if (statsSnap.exists()) {
      topicPerformance = statsSnap.data().topicPerformance || {};
    }

    // Process new attempts into the aggregate
    newAttempts.forEach(attempt => {
      // Enforce metadata lookup if missing (re-doing simpler version here)
      let subject = attempt.subject;
      let topic = attempt.topic;

      if (!subject || !topic) {
        const q = ENHANCED_QUESTIONS.find(x => x.id === attempt.questionId);
        if (q) {
          subject = q.subject;
          topic = q.topic;
        }
      }

      if (!subject || !topic) return;

      const key = `${subject}-${topic}`;
      if (!topicPerformance[key]) {
        topicPerformance[key] = {
          subject,
          topic,
          total: 0,
          correct: 0,
          totalTime: 0,
          avgConfidence: 0, // Running average
          confidenceCount: 0
        };
      }

      const t = topicPerformance[key];
      t.total++;
      if (attempt.isCorrect || attempt.correct) t.correct++;
      // t.totalTime += attempt.timeSpent || 0; // Optional if we track time per q

      // Update confidence average
      if (attempt.confidence) {
        const currentTotalConf = (t.avgConfidence || 0) * (t.confidenceCount || 0);
        t.confidenceCount = (t.confidenceCount || 0) + 1;
        t.avgConfidence = (currentTotalConf + attempt.confidence) / t.confidenceCount;
      }
    });

    // Recalculate derived stats like accuracy for the snapshot
    Object.values(topicPerformance).forEach(t => {
      t.accuracy = (t.correct / t.total) * 100;
    });

    // Save back
    await setDoc(statsRef, { topicPerformance, lastUpdated: Timestamp.now() }, { merge: true });
    console.log('✅ Aggregated stats updated.');

  } catch (err) {
    console.error('❌ Error updating aggregates:', err);
  }
}

// Get user insights (optimized to use quiz_attempts)
export async function getUserInsights(userId, days = 30) {
  try {
    const quizHistory = await getUserQuizHistory(userId, days);

    // Group by date and calculate daily stats
    const dailyStats = {};

    quizHistory.forEach(quiz => {
      const date = quiz.timestamp.toDate().toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date: quiz.timestamp.toDate(),
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

    return Object.values(dailyStats).sort((a, b) => a.date - b.date);

  } catch (error) {
    console.error('❌ Error getting user insights: ', error);
    return [];
  }
}

// Fetch raw quiz history
export async function getUserQuizHistory(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // FIX: Simplified query to avoid "Requires Index" error.
    // We only query by userId, then Sort/Filter in client memory.
    const q = query(
      collection(db, 'quiz_attempts'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    // Process results in memory
    const history = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(record => {
        // Handle both Firebase Timestamp and Date strings
        const recordDate = record.timestamp && record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
        return recordDate >= startDate;
      })
      .sort((a, b) => {
        // Sort Descending (Newest first)
        const dateA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB - dateA;
      });

    return history;
  } catch (error) {
    console.error('❌ Error getting quiz history: ', error);
    return [];
  }
}

// Get topic performance (from Aggregate with fallback)
export async function getUserTopicPerformance(userId) {
  try {
    // 1. Try fetching prepared aggregate
    const statsRef = doc(db, 'user_stats', userId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists() && statsSnap.data().topicPerformance) {
      console.log("⚡ Loaded topic performance from Aggregate.");
      return statsSnap.data().topicPerformance;
    }

    console.log("⚠️ No aggregate found. Calculating from scratch (Legacy Mode)...");

    // 2. Fallback: Calculate from scratch
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

    // Optional: Save this calculation to bootstrap the aggregate
    if (Object.keys(topicPerformance).length > 0) {
      await setDoc(statsRef, { topicPerformance, lastUpdated: Timestamp.now() }, { merge: true });
      console.log("✅ Bootstrapped aggregate stats from legacy data.");
    }

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

// System Logging
export async function logSystemError(error, context = {}, userId = null) {
  try {
    const logData = {
      message: error.message || String(error),
      stack: error.stack || null,
      context: context,
      userId: userId,
      timestamp: Timestamp.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    await addDoc(collection(db, 'system_logs'), logData);
    console.error('System error logged:', logData);
  } catch (loggingError) {
    console.error('Failed to log system error:', loggingError);
  }
}