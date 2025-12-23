
import React, { createContext, useContext, useState, useEffect } from 'react';

const SocialContext = createContext();

export function useSocial() {
    return useContext(SocialContext);
}

export function SocialProvider({ children }) {
    const [socialData, setSocialData] = useState({
        schools: [],
        studyGroups: [],
        helpRequests: [],
        weeklyChallenge: null
    });

    const [userProfile, setUserProfile] = useState({
        name: 'Student',
        points: 0,
        weeklyPoints: 0,
        weeklyQuestions: 0,
        rank: 0,
        school: '',
        recentActivity: []
    });

    // Load initial data (mock data for now, would fetch from Firebase in real app)
    useEffect(() => {
        // In a real migration, this would be a Firestore listener or fetch
        const loadMockData = () => {
            setSocialData({
                schools: [
                    { id: 1, name: 'Presec Legon', avgScore: 78, students: 45, rank: 1 },
                    { id: 2, name: 'Achimota School', avgScore: 75, students: 38, rank: 2 },
                    { id: 3, name: 'Wesley Girls', avgScore: 72, students: 42, rank: 3 },
                    { id: 4, name: 'St. Thomas Aquinas', avgScore: 68, students: 35, rank: 4 },
                    { id: 5, name: 'Mfantsipim School', avgScore: 65, students: 40, rank: 5 }
                ],
                studyGroups: [
                    {
                        id: 1,
                        name: 'Math Warriors',
                        subject: 'Mathematics',
                        members: 8,
                        createdBy: 'Kwame Mensah',
                        activity: '2 hours ago'
                    },
                    {
                        id: 2,
                        name: 'Science Squad',
                        subject: 'Integrated Science',
                        members: 5,
                        createdBy: 'Ama Serwaa',
                        activity: '1 day ago'
                    }
                ],
                helpRequests: [
                    {
                        id: 1,
                        student: 'Kofi Annan',
                        subject: 'Mathematics',
                        topic: 'Algebra',
                        question: 'Struggling with quadratic equations',
                        timestamp: '2 hours ago',
                        helped: false
                    },
                    {
                        id: 2,
                        student: 'Esi Boateng',
                        subject: 'English',
                        topic: 'Grammar',
                        question: 'Need help with verb tenses',
                        timestamp: '5 hours ago',
                        helped: false
                    }
                ],
                weeklyChallenge: {
                    title: 'Math Mastery Week',
                    description: 'Solve 50 Mathematics questions with 80%+ accuracy',
                    reward: '500 points + Math Champion Badge',
                    progress: 32,
                    target: 50,
                    endDate: 'in 3 days'
                }
            });

            setUserProfile({
                name: 'Current Student',
                points: 1250,
                weeklyPoints: 320,
                weeklyQuestions: 45,
                rank: 15,
                school: 'Presec Legon',
                recentActivity: [
                    { action: 'Helped with Algebra', points: 50, timestamp: '2 hours ago' },
                    { action: 'Completed Math Quiz', points: 25, timestamp: '5 hours ago' },
                    { action: 'Joined Science Squad', points: 10, timestamp: '1 day ago' }
                ]
            });
        };

        loadMockData();
    }, []);

    const createGroup = (groupData) => {
        const newGroup = {
            id: Date.now(),
            ...groupData,
            members: 1,
            createdBy: userProfile.name,
            activity: 'just now'
        };
        setSocialData(prev => ({
            ...prev,
            studyGroups: [newGroup, ...prev.studyGroups]
        }));
        return newGroup;
    };

    const joinGroup = (groupId) => {
        setSocialData(prev => ({
            ...prev,
            studyGroups: prev.studyGroups.map(g =>
                g.id === groupId ? { ...g, members: g.members + 1, activity: 'just now' } : g
            )
        }));
    };

    const helpStudent = (requestId) => {
        let success = false;
        setSocialData(prev => {
            const updatedRequests = prev.helpRequests.map(r => {
                if (r.id === requestId && !r.helped) {
                    success = true;
                    return { ...r, helped: true, helpedBy: userProfile.name };
                }
                return r;
            });
            return { ...prev, helpRequests: updatedRequests };
        });

        if (success) {
            setUserProfile(prev => ({
                ...prev,
                points: prev.points + 50,
                weeklyPoints: prev.weeklyPoints + 50,
                recentActivity: [
                    { action: 'Helped a student', points: 50, timestamp: 'just now' },
                    ...prev.recentActivity
                ]
            }));
        }
        return success;
    };

    const value = {
        socialData,
        userProfile,
        createGroup,
        joinGroup,
        helpStudent
    };

    return (
        <SocialContext.Provider value={value}>
            {children}
        </SocialContext.Provider>
    );
}
