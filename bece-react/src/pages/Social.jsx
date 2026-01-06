
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../contexts/SocialContext';
import { Users, Trophy, Target, Star, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import '../assets/styles/dashboard.css';
import '../assets/styles/social.css';

export default function Social() {
    const navigate = useNavigate();
    const { socialData, userProfile, joinGroup, helpStudent, createGroup } = useSocial();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', subject: 'Mathematics', description: '' });

    const handleCreateGroup = () => {
        if (!newGroup.name) {
            alert('Group name is required');
            return;
        }
        createGroup(newGroup);
        setShowCreateModal(false);
        setNewGroup({ name: '', subject: 'Mathematics', description: '' });
    };

    const schools = [...socialData.schools].sort((a, b) => a.rank - b.rank);
    const challenge = socialData.weeklyChallenge;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="logo" style={{ width: '40px', height: '40px', fontSize: '18px' }}>BE</div>
                    <div>
                        <h1>Social Hub</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Collaborate, Compete, and Learn Together</p>
                    </div>
                </div>
                <button onClick={() => window.location.reload()} className="btn btn-ghost">
                    🔄 Refresh
                </button>
            </header>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* School Leaderboard */}
                <div className="content-card">
                    <div className="section-title">
                        <Trophy size={20} color="var(--accent)" />
                        <span>School Rankings</span>
                    </div>
                    <div className="leaderboard">
                        {schools.map(school => (
                            <div key={school.id} className={`school-item ${school.name === userProfile.school ? 'my-school' : ''}`}> {/* Use class from CSS */}
                                <div className="school-rank">#{school.rank}</div>
                                <div className="school-info">
                                    <div className="school-name">{school.name}</div>
                                    <div className="school-stats">{school.students} students</div>
                                </div>
                                <div className="school-score">{school.avgScore}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weekly Challenge */}
                <div className="content-card">
                    <div className="section-title">
                        <Target size={20} color="#F59E0B" />
                        <span>Weekly Challenge</span>
                    </div>

                    {challenge && (
                        <div className="challenge-content">
                            <h3 style={{ margin: '10px 0' }}>{challenge.title}</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>{challenge.description}</p>

                            <div className="challenge-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}></div>
                                </div>
                                <div className="progress-text">{challenge.progress}/{challenge.target} • Ends {challenge.endDate}</div>
                            </div>

                            <div className="challenge-reward">
                                🏆 Reward: {challenge.reward}
                            </div>

                            <div className="my-stats">
                                <div className="stat-item">
                                    <span>Your Points</span>
                                    <strong>{userProfile.weeklyPoints}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Questions</span>
                                    <strong>{userProfile.weeklyQuestions}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Current Rank</span>
                                    <strong>#{userProfile.rank}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Study Groups */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div className="section-title" style={{ marginBottom: 0 }}>
                            <Users size={20} color="#3B82F6" />
                            <span>Study Groups</span>
                        </div>
                        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setShowCreateModal(true)}>+ Create</button>
                    </div>

                    <div className="groups-list">
                        {socialData.studyGroups.length === 0 ? (
                            <div className="empty-state">No groups yet. Create one!</div>
                        ) : (
                            socialData.studyGroups.map(group => (
                                <div key={group.id} className="group-card">
                                    <div className="group-header">
                                        <h4>{group.name}</h4>
                                        <span className="group-subject">{group.subject}</span>
                                    </div>
                                    <div className="group-details">
                                        <span>👥 {group.members} members</span>
                                        <span>{group.activity}</span>
                                    </div>
                                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => joinGroup(group.id)}>Join Group</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Help Requests */}
                <div className="content-card">
                    <div className="section-title">
                        <HelpCircle size={20} color="#EF4444" />
                        <span>Help Requests</span>
                    </div>

                    <div className="help-list">
                        {socialData.helpRequests.filter(r => !r.helped).length === 0 ? (
                            <div className="empty-state">No active help requests.</div>
                        ) : (
                            socialData.helpRequests.filter(r => !r.helped).map(req => (
                                <div key={req.id} className="help-request">
                                    <div className="request-header">
                                        <span className="student-name">{req.student}</span>
                                        <span className="request-time">{req.timestamp}</span>
                                    </div>
                                    <div className="request-subject">{req.subject} • {req.topic}</div>
                                    <p className="request-question">"{req.question}"</p>
                                    <button className="btn btn-primary help-btn" onClick={() => helpStudent(req.id)}>Offer Help (+50pts)</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* User Stats / Activity */}
                <div className="content-card" style={{ gridColumn: 'span 2' }}>
                    <div className="section-title">
                        <Star size={20} color="#F59E0B" />
                        <span>My Rewards & Activity</span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div className="points-balance" style={{ flex: 1, flexDirection: 'column' }}>
                            <div className="points-display">
                                <span>Total Points</span>
                                <strong>{userProfile.points}</strong>
                            </div>
                            <button className="btn btn-ghost" style={{ marginTop: '10px' }}>View Rewards Shop</button>
                        </div>

                        <div style={{ flex: 2 }}>
                            <h4 style={{ marginBottom: '10px' }}>Recent Activity</h4>
                            {userProfile.recentActivity.map((act, i) => (
                                <div key={i} className="activity-item">
                                    <span>{act.action}</span>
                                    <span className="activity-points">+{act.points} pts</span>
                                    <span className="activity-time">{act.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Create Study Group</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Group Name</label>
                                <input type="text" className="input-field" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="e.g. Math Wizards" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Subject</label>
                                <select className="input-field" value={newGroup.subject} onChange={e => setNewGroup({ ...newGroup, subject: e.target.value })}>
                                    <option>Mathematics</option><option>English</option><option>Integrated Science</option><option>Social Studies</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Description</label>
                                <textarea className="input-field" rows="3" value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}></textarea>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateGroup}>Create Group</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
