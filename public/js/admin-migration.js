import { db } from './auth.js';
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ENHANCED_QUESTIONS } from './data/questionBank.js';

export async function migrateQuestions() {
    console.log('🚀 migrateQuestions function called');

    if (!ENHANCED_QUESTIONS || ENHANCED_QUESTIONS.length === 0) {
        console.error('❌ No questions found in ENHANCED_QUESTIONS');
        throw new Error('No questions to migrate');
    }

    console.log(`Found ${ENHANCED_QUESTIONS.length} questions to migrate.`);

    // Test connection first
    try {
        console.log('Testing Firestore connection...');
        await setDocWithTimeout(doc(db, 'system', 'connection_test'), {
            status: 'connected',
            timestamp: new Date()
        });
        console.log('✅ Connection test successful!');
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        if (error.code === 'permission-denied') {
            throw new Error("Permission denied! Please check your Firestore Security Rules in the Firebase Console.");
        }
        throw new Error(`Could not connect to Firestore: ${error.message}`);
    }

    const questionsRef = collection(db, 'questions');
    let totalMigrated = 0;

    console.log('Starting loop...');

    for (const q of ENHANCED_QUESTIONS) {
        console.log(`Processing question ID: ${q.id}`);

        const docRef = doc(questionsRef, String(q.id));

        try {
            // Using setDoc directly instead of batch to isolate errors
            await setDocWithTimeout(docRef, {
                ...q,
                _migratedAt: new Date()
            });
            console.log(`✅ Migrated question ${q.id}`);
            totalMigrated++;
        } catch (e) {
            console.error(`❌ Error migrating question ${q.id}:`, e);
            if (e.code === 'permission-denied') {
                throw new Error("Permission denied! Please check your Firestore Security Rules.");
            }
        }
    }

    console.log(`🎉 Migration complete! Total questions migrated: ${totalMigrated}`);
    return totalMigrated;
}

async function setDocWithTimeout(docRef, data) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore write timed out (10s). Check your internet connection or firewall.")), 10000)
    );

    try {
        await Promise.race([setDoc(docRef, data), timeout]);
    } catch (error) {
        throw error;
    }
}
