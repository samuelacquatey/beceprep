
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDOxJIMYJKPz8518ZfywPQtizwAVvZlJnQ",
    authDomain: "bece-2eb33.firebaseapp.com",
    projectId: "bece-2eb33",
    storageBucket: "bece-2eb33.firebasestorage.app",
    messagingSenderId: "3811495501",
    appId: "1:3811495501:web:a33ef4d4256093d1d35604",
    measurementId: "G-T0S5XLYLT5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Using setup from existing app to force long polling if needed, though standard getFirestore is usually fine.
// The existing app used: experimentalForceLongPolling: true. We'll replicate to be safe.
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
}, 'bece-prod-db');

export { app, auth, db };
