import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOxJIMYJKPz8518ZfywPQtizwAVvZlJnQ",
  authDomain: "bece-2eb33.firebaseapp.com",
  projectId: "bece-2eb33",
  storageBucket: "bece-2eb33.firebasestorage.app",
  messagingSenderId: "3811495501",
  appId: "1:3811495501:web:a33ef4d4256093d1d35604",
  measurementId: "G-T0S5XLYLT5"
};


import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'bece-prod-db');

/**
 * Checks if user is authenticated.
 * @param {Function} onAuthSuccess - Callback function to run if user is authenticated.
 * @param {string} redirectUrl - URL to redirect to if not authenticated (default: 'index.html').
 */
function requireAuth(onAuthSuccess, redirectUrl = 'login.html') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user);
    } else {
      window.location.href = redirectUrl;
    }
  });
}

/**
 * Checks if user is a teacher.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isTeacher(userId) {
  // Basic check implementation or can import from schools.js if needed circularly
  // For now, simpler to leave this specific logic to the caller or move school logic here later.
  // Leaving placeholder or avoiding if not strictly needed for this refactor.
}

export { app, auth, db, requireAuth };