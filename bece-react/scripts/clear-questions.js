
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize with service account
initializeApp({
    credential: cert(serviceAccount)
});

// Target the specific database: 'bece-prod-db'
// Note: If this fails, we might need to verify the database ID format.
const db = getFirestore(getApp(), 'bece-prod-db');
const COLLECTION_NAME = 'questions';

async function deleteCollection(db, collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function run() {
    console.log(`Checking connection to database: bece-prod-db...`);
    try {
        // Simple check
        const collections = await db.listCollections();
        console.log(`Connected. Found collections: ${collections.map(c => c.id).join(', ')}`);

        console.log(`Starting deletion of collection: ${COLLECTION_NAME}...`);
        await deleteCollection(db, COLLECTION_NAME, 400);
        console.log('Successfully cleared all questions.');
    } catch (error) {
        console.error('Error clearing questions:', error);
    }
}

run();
