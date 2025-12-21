# BECE Prep (v0)

**BECE Prep** is a comprehensive, interactive e-learning platform designed to help students master their Basic Education Certificate Examination (BECE) through targeted practice, real-time analytics, and gamified learning. This "v0" release lays the foundation for a modern, engaging educational experience.

## 🚀 Features

### 1. User Authentication & Roles
- **Secure Sign-In/Up**: Support for Email/Password and personalized Google Sign-In.
- **Role-Based Access**:
  - **Students**: Create profile, join schools using unique codes, and track personal progress.
  - **Teachers/Schools**: Register institutions and generate school codes to manage student cohorts.

### 2. Interactive Quiz Engine
The core of the application is a robust quiz interface designed for both learning and assessment.
- **Flexible Modes**:
  - **Practice Mode**: Learn at your own pace with immediate feedback.
  - **Exam Mode**: Simulate real exam conditions (timed, no immediate feedback).
  - **Endless Mode**: Continuous stream of questions for intensive study sessions.
- **Smart Filtering**: Select specific subjects (Math, English, Science, etc.) and years to target weak areas.
- **Confidence Tracking**: Innovative "Confidence Rating" alongside answers (Guessing vs. Confident) to gauge true mastery.
- **Session Management**: Auto-save progress allows students to resume quizzes exactly where they left off.

### 3. Advanced Analytics Dashboard
Data-driven insights to help students improve efficiently.
- **Performance Metrics**: Real-time tracking of Accuracy, Total Questions Attempted, and Study Time.
- **readiness Score**: An algorithmic score (0-100%) indicating exam preparedness.
- **Weak Area Detection**: Automatically identifies struggling topics and provides specific recommendations.
- **Visual Charts**: Interactive graphs showing improvement trends over time and subject mastery radar charts.

### 4. Additional Modules
- **Social Hub**: Connect with peers for collaborative learning.
- **Flashcards**: Quick-fire revision tool for key concepts and definitions.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern features like Glassmorphism, CSS Grid/Flexbox), and JavaScript (ES6+ Modules).
- **Backend & Database**: Firebase (Authentication, Firestore, Hosting).
- **Charts**: Chart.js for data visualization.
- **Design System**: Custom CSS variables for consistent theming (`css/styles.css`, `css/dashboard-modern.css`).

## 📦 Project Structure

```
/public
  ├── css/                  # Stylesheets for different modules
  ├── js/                   # Core logic (Auth, Database, Analytics, UI)
  ├── index.html            # Landing page (Auth entry point)
  ├── quiz.html             # Main Hub (Filter selection & Mode choice)
  ├── qna.html              # The active Quiz Interface
  ├── dashboard.html        # Analytics & Progress tracking
  ├── social.html           # Social interaction module
  └── flashcards.html       # Revision tool
```

## 🔧 Setup & Installation

1. **Prerequisites**: Node.js installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Locally**:
   ```bash
   npm start
   ```
   This will serve the `public` directory (default: `http://localhost:3000`).

## 🤝 Contributing

This is the **v0** MVP (Minimum Viable Product). Future updates will focus on:
- Enhanced Gamification (Badges, Leaderboards)
- Teacher Dashboard with Class Analytics
- Offline Support (PWA)
- AI-driven Personal Tutor

---
*Built for the Future Mind of Education.*