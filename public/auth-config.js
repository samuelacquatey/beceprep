// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOxJIMYJKPz8518ZfywPQtizwAVvZlJnQ",
  authDomain: "bece-2eb33.firebaseapp.com",
  projectId: "bece-2eb33",
  storageBucket: "bece-2eb33.firebasestorage.app",
  messagingSenderId: "3811495501",
  appId: "1:3811495501:web:a33ef4d4256093d1d35604",
  measurementId: "G-T0S5XLYLT5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);