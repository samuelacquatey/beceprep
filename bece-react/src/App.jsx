
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';
import { SocialProvider } from './contexts/SocialContext';
import { FlashcardProvider } from './contexts/FlashcardContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import QuizHub from './pages/QuizHub';
import ExamRoom from './pages/ExamRoom';
import Social from './pages/Social';
import Flashcards from './pages/Flashcards';
import './assets/styles/styles.css';
import DevDashboard from './pages/DevDashboard';
import DevQuestions from './pages/DevQuestions';

import Layout from './components/layout/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuizProvider>
          <SocialProvider>
            <FlashcardProvider>
              <Routes>
                <Route path="/" element={<Landing />} />

                {/* Protected Routes wrapped in Layout */}
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/quiz" element={<QuizHub />} />
                  <Route path="/qna" element={<ExamRoom />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/flashcards" element={<Flashcards />} />
                  <Route path="/dev" element={<DevDashboard />} />
                  <Route path="/dev/questions" element={<DevQuestions />} />
                </Route>

                {/* Redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </FlashcardProvider>
          </SocialProvider>
        </QuizProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
