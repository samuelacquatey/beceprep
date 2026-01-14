/**
 * ClassMaster - User Onboarding Tour
 * Uses driver.js to create interactive feature walkthroughs.
 */

// Tour Configurations for each page
const TOURS = {
    'dashboard': [
        {
            element: '.header h1',
            popover: {
                title: 'Welcome to Your Dashboard! 👋',
                description: 'This is your command center. Track your progress, readiness, and daily activity here.',
                side: "bottom",
                align: 'start'
            }
        },
        {
            element: '.metric-card.orange',
            popover: {
                title: 'Exam Readiness Score 🚀',
                description: 'This is your most important metric. It aggregates your quiz performance to estimate how ready you are for the real exam. Aim for 80%+!',
                side: "bottom"
            }
        },
        {
            element: '#weakAreasList', // Targeting the container of weak areas
            popover: {
                title: 'Focus Areas 🎯',
                description: 'We analyze your mistakes and list the topics you need to work on here. Click on them to find relevant practice questions.',
                side: "top"
            }
        },
        {
            element: '#backToQuiz',
            popover: {
                title: 'Take Action 📝',
                description: 'Ready to study? Click here to start a new quiz session.',
                side: "bottom"
            }
        }
    ],
    'quiz': [
        {
            element: '.filter-group',
            popover: {
                title: 'Customize Your Session ⚙️',
                description: 'Select specific years or choose "All Years". You can also switch between Practice Mode (immediate feedback) and Exam Mode (timer enabled).',
                side: "bottom"
            }
        },
        {
            element: '#subjectsList',
            popover: {
                title: 'Select Subjects 📚',
                description: 'Tap on the subjects you want to practice. You can select multiple subjects at once!',
                side: "top"
            }
        },
        {
            element: '#startBtn',
            popover: {
                title: 'Start Practicing 🚀',
                description: 'Once you are set, click here to begin your quiz.',
                side: "top"
            }
        }
    ],
    'flashcards': [
        {
            element: '.flashcard-container',
            popover: {
                title: 'Smart Flashcards 🎴',
                description: 'Master definitions and formulas. Click the card to flip it and see the answer.',
                side: "bottom"
            }
        },
        {
            element: '.difficulty-buttons',
            popover: {
                title: 'Rate Your Recall 🧠',
                description: 'After flipping, tell us how easy it was. We use this to schedule the next review for optimal memory retention.',
                side: "top"
            }
        },
        {
            element: '#createCardBtn',
            popover: {
                title: 'Create Your Own ✍️',
                description: 'Add your own custom cards to the deck to study exactly what you need.',
                side: "bottom"
            }
        }
    ],
    'social': [
        {
            element: '#schoolLeaderboard',
            popover: {
                title: 'School Rankings 🏆',
                description: 'See how your school compares to others. Contribute to your school\'s score by doing well in quizzes!',
                side: "right"
            }
        },
        {
            element: '#weeklyChallenge',
            popover: {
                title: 'Weekly Challenges 🎯',
                description: 'Complete these special challenges to earn bonus points and badges.',
                side: "left"
            }
        },
        {
            element: '#studyGroups',
            popover: {
                title: 'Study Groups 👥',
                description: 'Join a group to study with friends or create your own.',
                side: "top"
            }
        },
        {
            element: '#helpRequests',
            popover: {
                title: 'Peer Learning 🤝',
                description: 'Stuck? Ask for help here. Or help others to earn huge reputation points.',
                side: "top"
            }
        }
    ],
    'profile': [
        {
            element: '.card.fade-in',
            popover: {
                title: 'Your Profile 👤',
                description: 'Manage your account details and school linkage here.',
                side: "bottom"
            }
        },
        {
            element: '#logoutBtn',
            popover: {
                title: 'Log Out',
                description: 'Securely sign out of your account here.',
                side: "top"
            }
        }
    ]
};

export function initTour(pageKey) {
    // Check if driver is loaded
    if (!window.driver) {
        console.warn('Driver.js not loaded');
        return;
    }

    const driver = window.driver.js.driver;

    // Check if user has already seen this tour
    if (hasSeenTour(pageKey)) {
        return;
    }

    const steps = TOURS[pageKey];
    if (!steps) {
        console.warn(`No tour configuration for ${pageKey}`);
        return;
    }

    const tourDriver = driver({
        showProgress: true,
        animate: true,
        steps: steps,
        onDestroyed: () => {
            markTourSeen(pageKey);
        }
    });

    // Small delay to ensure UI renders
    setTimeout(() => {
        tourDriver.drive();
    }, 1000);
}

function hasSeenTour(pageKey) {
    const key = `classmaster_tour_${pageKey}_seen`;
    return localStorage.getItem(key) === 'true';
}

function markTourSeen(pageKey) {
    const key = `classmaster_tour_${pageKey}_seen`;
    localStorage.setItem(key, 'true');
    console.log(`Tour ${pageKey} marked as seen.`);
}
