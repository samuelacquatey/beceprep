
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../contexts/SocialContext';
import { Users, Trophy, Target, Star, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import '../assets/styles/dashboard.css';

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
                            <div key={school.id} className={`leaderboard-item ${school.name === userProfile.school ? 'highlight' : ''}`} style={{
                                display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border)', gap: '15px'
                            }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--accent)', minWidth: '30px' }}>#{school.rank}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600' }}>{school.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{school.students} students</div>
                                </div>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{school.avgScore}%</div>
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
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                            <h3 style={{ margin: '10px 0' }}>{challenge.title}</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>{challenge.description}</p>

                            <div style={{ margin: '15px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                                    <span>Progress</span>
                                    <span>{challenge.progress}/{challenge.target}</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(challenge.progress / challenge.target) * 100}%`, background: 'var(--accent)' }}></div>
                                </div>
                                <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>Ends {challenge.endDate}</div>
                            </div>

                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', color: '#10B981', fontWeight: '500' }}>
                                🏆 Reward: {challenge.reward}
                            </div>

                            <div className="stats-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your Points</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{userProfile.weeklyPoints}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Questions</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{userProfile.weeklyQuestions}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rank</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>#{userProfile.rank}</div>
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
                            <div className="no-data">No groups yet. Create one!</div>
                        ) : (
                            socialData.studyGroups.map(group => (
                                <div key={group.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <h4 style={{ margin: 0 }}>{group.name}</h4>
                                        <span className="chip" style={{ fontSize: '10px', padding: '2px 8px' }}>{group.subject}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
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
                            <div className="no-data">No active help requests.</div>
                        ) : (
                            socialData.helpRequests.filter(r => !r.helped).map(req => (
                                <div key={req.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: '600' }}>{req.student}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{req.timestamp}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '5px' }}>{req.subject} • {req.topic}</div>
                                    <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>"{req.question}"</p>
                                    <button className="btn btn-primary" style={{ width: '100%', padding: '8px' }} onClick={() => helpStudent(req.id)}>Offer Help (+50pts)</button>
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
                        <div style={{ flex: 1, background: 'var(--glass)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Points</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>{userProfile.points}</div>
                            <button className="btn btn-ghost" style={{ marginTop: '10px' }}>View Rewards Shop</button>
                        </div>

                        <div style={{ flex: 2 }}>
                            <h4 style={{ marginBottom: '10px' }}>Recent Activity</h4>
                            {userProfile.recentActivity.map((act, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span>{act.action}</span>
                                    <span style={{ color: '#10B981', fontWeight: '600' }}>+{act.points} pts</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{act.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
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

// Inline CSS for the simple input fields since they aren't global yet
const styles = `
.input-field {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: inherit;
}
`;
