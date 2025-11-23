import { db } from './auth.js';
import { collection, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ENHANCED_QUESTIONS } from './data/questionBank.js';

export async function migrateQuestions() {
    console.log('Starting migration...');
    const batchSize = 400; // Firestore batch limit is 500
    const questionsRef = collection(db, 'questions');

    let batch = writeBatch(db);
    let count = 0;
    let totalMigrated = 0;

    for (const q of ENHANCED_QUESTIONS) {
        // Use the ID from the question as the document ID for consistency
        const docRef = doc(questionsRef, String(q.id));

        // Add to batch
        batch.set(docRef, {
            ...q,
            _migratedAt: new Date()
        });

        count++;

        // Commit batch if size limit reached
        if (count >= batchSize) {
            await batch.commit();
            totalMigrated += count;
            console.log(`Migrated ${totalMigrated} questions...`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    // Commit remaining
    if (count > 0) {
        await batch.commit();
        totalMigrated += count;
    }

    console.log(`Migration complete! Total questions migrated: ${totalMigrated}`);
    return totalMigrated;
}
