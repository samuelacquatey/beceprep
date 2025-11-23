import { db } from './auth.js';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Default flashcards for new users
export const defaultFlashcards = [
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
    subject: 'English',
    topic: 'Vocabulary',
    question: 'What is the synonym for "happy"?',
    answer: 'Joyful, glad, pleased, delighted',
    explanation: 'Synonyms are words that have similar meanings.',
    hint: 'Think of other words that mean the same as happy'
  },
  {
    subject: 'Integrated Science',
    topic: 'Biology',
    question: 'What is photosynthesis?',
    answer: 'The process by which plants convert light energy into chemical energy.',
    explanation: 'Plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.',
    hint: 'Think about what plants do with sunlight'
  },
  {
    subject: 'Integrated Science',
    topic: 'Physics',
    question: 'What is the unit of force?',
    answer: 'Newton (N)',
    explanation: 'Force is measured in Newtons, named after Sir Isaac Newton.',
    hint: 'Named after a famous scientist'
  },
  {
    subject: 'Social Studies',
    topic: 'Geography',
    question: 'What is the capital city of Ghana?',
    answer: 'Accra',
    explanation: 'Accra is the capital and largest city of Ghana, located on the Atlantic coast.',
    hint: 'Starts with "A"'
  },
  {
    subject: 'Social Studies',
    topic: 'Civics',
    question: 'What is democracy?',
    answer: 'A system of government by the whole population, typically through elected representatives.',
    explanation: 'In a democracy, power is held by the people who elect their leaders.',
    hint: 'Government by the people'
  }
];

export class FlashcardSystem {
  constructor() {
    this.cards = [];
    this.currentDeck = null;
  }

  // Load user's flashcards or create default ones if none exist
  async loadUserCards(userId) {
    try {
      const q = query(
        collection(db, 'flashcards'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      this.cards = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure dueDate is a Date object
          dueDate: data.dueDate ? this.toDate(data.dueDate) : new Date()
        };
      });
      
      console.log(`Loaded ${this.cards.length} flashcards for user ${userId}`);
      
      // If user has no cards, create default ones
      if (this.cards.length === 0) {
        console.log('No flashcards found for user, creating default cards...');
        await this.createDefaultCards(userId);
        // Reload after creating default cards
        return await this.loadUserCards(userId);
      }
      
      return this.cards;
    } catch (error) {
      console.error('Error loading flashcards:', error);
      return [];
    }
  }

  // Convert Firebase timestamp to Date
  toDate(timestamp) {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  }

  // Create default flashcards for new users
  async createDefaultCards(userId) {
    try {
      console.log('Creating default flashcards for new user...');
      
      for (const cardData of defaultFlashcards) {
        const card = {
          userId: userId,
          ...cardData,
          createdAt: Timestamp.now(),
          interval: 1, // days until next review
          ease: 2.5, // ease factor
          // Set due date to NOW so they're immediately available
          dueDate: new Date(),
          reviews: 0,
          lastReview: null,
          difficulty: 'new'
        };

        await addDoc(collection(db, 'flashcards'), card);
        console.log(`Created default card: ${cardData.question}`);
      }
      
      console.log('Default flashcards created successfully');
    } catch (error) {
      console.error('Error creating default flashcards:', error);
    }
  }

  // Create new flashcard
  async createCard(userId, cardData) {
    try {
      const card = {
        userId,
        ...cardData,
        createdAt: Timestamp.now(),
        interval: 1,
        ease: 2.5,
        dueDate: new Date(), // Due immediately
        reviews: 0,
        lastReview: null,
        difficulty: 'new'
      };

      const docRef = await addDoc(collection(db, 'flashcards'), card);
      const newCard = { 
        id: docRef.id, 
        ...card,
        dueDate: new Date() // Ensure it's a Date object
      };
      this.cards.push(newCard);
      
      console.log('Created new flashcard:', cardData.question);
      return newCard;
    } catch (error) {
      console.error('Error creating flashcard:', error);
      throw new Error('Failed to create flashcard');
    }
  }

  // Rate card difficulty (spaced repetition algorithm)
  async rateCard(cardId, difficulty) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) {
      console.error('Card not found:', cardId);
      return;
    }

    const now = new Date();
    let interval = card.interval || 1;
    let ease = card.ease || 2.5;

    // SuperMemo-2 algorithm simplified
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

    // Calculate next due date
    const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    // Update card
    card.interval = Math.round(interval);
    card.ease = ease;
    card.reviews = (card.reviews || 0) + 1;
    card.lastReview = now;
    card.dueDate = nextDueDate;
    card.difficulty = difficulty;

    console.log(`Rated card as ${difficulty}. New interval: ${interval} days, Due: ${nextDueDate}`);

    // Save to Firebase
    try {
      await updateDoc(doc(db, 'flashcards', cardId), {
        interval: card.interval,
        ease: card.ease,
        reviews: card.reviews,
        lastReview: card.lastReview,
        dueDate: card.dueDate,
        difficulty: card.difficulty
      });
    } catch (error) {
      console.error('Error updating card:', error);
    }
  }

  // Get cards due for review - FIXED LOGIC
  getDueCards() {
    const now = new Date();
    console.log('Current time:', now);
    
    const dueCards = this.cards.filter(card => {
      if (!card.dueDate) {
        console.log('Card has no dueDate:', card.question);
        return true; // If no due date, it's due
      }
      
      const dueDate = this.toDate(card.dueDate);
      const isDue = dueDate <= now;
      
      console.log(`Card: "${card.question.substring(0, 30)}..." | Due: ${dueDate} | Is due: ${isDue}`);
      return isDue;
    });
    
    console.log(`Found ${dueCards.length} cards due for review out of ${this.cards.length} total cards`);
    return dueCards;
  }

  // Get cards by subject
  getDecksBySubject() {
    const decks = {};
    this.cards.forEach(card => {
      if (!decks[card.subject]) {
        decks[card.subject] = [];
      }
      decks[card.subject].push(card);
    });
    
    console.log('Decks by subject:', Object.keys(decks));
    return decks;
  }

  // Set current deck for studying
  setCurrentDeck(subject) {
    this.currentDeck = subject;
    console.log('Set current deck to:', subject);
  }

  // Get study statistics
  getStats() {
    const dueToday = this.getDueCards().length;
    const totalCards = this.cards.length;
    const mastered = this.cards.filter(card => card.interval > 21).length;
    const streak = this.calculateStreak();

    const stats = {
      dueToday,
      totalCards,
      mastered,
      streak
    };

    console.log('Flashcard stats:', stats);
    return stats;
  }

  // Calculate study streak
  calculateStreak() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentReviews = this.cards.filter(card => {
      if (!card.lastReview) return false;
      const reviewDate = this.toDate(card.lastReview);
      return reviewDate > lastWeek;
    }).length;
    
    return recentReviews > 0 ? Math.min(7, Math.floor(recentReviews / 3)) : 0;
  }

  // Get cards for a specific subject
  getCardsBySubject(subject) {
    const subjectCards = this.cards.filter(card => card.subject === subject);
    console.log(`Found ${subjectCards.length} cards for subject: ${subject}`);
    return subjectCards;
  }

  // Search cards
  searchCards(query) {
    const lowerQuery = query.toLowerCase();
    const results = this.cards.filter(card => 
      card.question.toLowerCase().includes(lowerQuery) ||
      card.answer.toLowerCase().includes(lowerQuery) ||
      card.topic.toLowerCase().includes(lowerQuery)
    );
    
    console.log(`Search for "${query}" found ${results.length} cards`);
    return results;
  }

  // Delete card
  async deleteCard(cardId) {
    try {
      await deleteDoc(doc(db, 'flashcards', cardId));
      this.cards = this.cards.filter(card => card.id !== cardId);
      console.log('Deleted card:', cardId);
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new Error('Failed to delete card');
    }
  }

  // Get new cards (cards with 0 or 1 reviews)
  getNewCards() {
    const newCards = this.cards.filter(card => (card.reviews || 0) < 2);
    console.log(`Found ${newCards.length} new cards`);
    return newCards;
  }

  // Get mastered cards (interval > 21 days)
  getMasteredCards() {
    const masteredCards = this.cards.filter(card => card.interval > 21);
    console.log(`Found ${masteredCards.length} mastered cards`);
    return masteredCards;
  }

  // Force all cards to be due (for testing)
  forceAllCardsDue() {
    const now = new Date();
    this.cards.forEach(card => {
      card.dueDate = now;
    });
    console.log('Forced all cards to be due');
  }
}