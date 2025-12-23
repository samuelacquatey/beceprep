
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    updateProfile,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { SchoolManager } from '../utils/SchoolManager';
import { Eye, EyeOff } from 'lucide-react'; // Using Lucide icons for cleaner look

const Landing = () => {
    const navigate = useNavigate();
    const schoolManager = new SchoolManager();

    // State
    const [activeTab, setActiveTab] = useState('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'error' });
    const [showPassword, setShowPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,

        // Signup specific
        fullname: '',
        signupEmail: '',
        signupPassword: '',
        confirmPassword: '',
        terms: false,
        schoolCode: '',
        isTeacher: false,

        // Teacher specific
        schoolName: '',
        schoolLocation: '',
        teacherId: ''
    });

    const showAlert = (message, type = 'error') => {
        setAlert({ show: true, message, type });
        setTimeout(() => {
            setAlert({ show: false, message: '', type: 'error' });
        }, 5000);
    };

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        // Map ID to state key where possible, or manual mapping
        let key = id;
        if (id === 'email') key = 'email';
        if (id === 'password') key = 'password';
        if (id === 'remember') key = 'rememberMe';
        if (id === 'fullname') key = 'fullname';
        if (id === 'signup-email') key = 'signupEmail';
        if (id === 'signup-password') key = 'signupPassword';
        if (id === 'confirm-password') key = 'confirmPassword';
        if (id === 'isTeacher') key = 'isTeacher';
        if (id === 'terms') key = 'terms';

        setFormData(prev => ({
            ...prev,
            [key]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSignIn = async () => {
        if (!formData.email || !formData.password) {
            showAlert('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            const persistence = formData.rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            showAlert('Sign in successful! Redirecting...', 'success');
            sessionStorage.clear(); // Clear legacy session data

            // Check redirection
            try {
                const schoolData = await schoolManager.getTeacherSchool(user.uid);
                if (schoolData) {
                    // navigate('/teacher-admin'); // TODO: Implement teacher route
                    navigate('/quiz'); // Default to quiz for now
                } else {
                    navigate('/quiz');
                }
            } catch (e) {
                navigate('/quiz');
            }

        } catch (error) {
            setIsLoading(false);
            handleAuthError(error);
        }
    };

    const handleSignUp = async () => {
        const { fullname, signupEmail, signupPassword, confirmPassword, terms, schoolCode, isTeacher, schoolName, schoolLocation, teacherId } = formData;

        if (!fullname || !signupEmail || !signupPassword || !confirmPassword) {
            showAlert('Please fill in all fields');
            return;
        }
        if (signupPassword.length < 6) {
            showAlert('Password must be at least 6 characters long');
            return;
        }
        if (signupPassword !== confirmPassword) {
            showAlert('Passwords do not match');
            return;
        }
        if (!terms) {
            showAlert('Please agree to the Terms & Conditions');
            return;
        }
        if (isTeacher && (!schoolName || !schoolLocation || !teacherId)) {
            showAlert('Please fill in all school registration details');
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullname });

            let successMessage = 'Account created successfully!';
            let redirectPath = '/quiz';

            if (isTeacher) {
                const schoolData = await schoolManager.registerSchool(
                    { name: schoolName, location: schoolLocation },
                    { userId: user.uid, fullName: fullname, teacherId: teacherId }
                );
                successMessage = `School registered successfully! Your school code is: ${schoolData.code}`;
                // redirectPath = '/teacher-admin'; 
            } else if (schoolCode) {
                await schoolManager.joinSchool(user.uid, schoolCode, {
                    fullName: fullname,
                    class: 'JHS 3'
                });
                successMessage = 'Successfully joined school!';
            }

            showAlert(successMessage, 'success');
            sessionStorage.clear();

            setTimeout(() => {
                navigate(redirectPath);
            }, 2000);

        } catch (error) {
            setIsLoading(false);
            handleAuthError(error, true);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            showAlert('Sign in successful! Redirecting...', 'success');
            sessionStorage.clear();
            setTimeout(() => navigate('/quiz'), 1500);
        } catch (error) {
            setIsLoading(false);
            console.error("Google Sign-In Error:", error);
            showAlert(`Google sign-in failed: ${error.message}`);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            showAlert('Please enter your email address first');
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, formData.email);
            setIsLoading(false);
            showAlert('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            setIsLoading(false);
            if (error.code === 'auth/user-not-found') {
                showAlert('No account found with this email');
            } else {
                showAlert('Failed to send reset email. Please try again.');
            }
        }
    };

    const handleAuthError = (error, isSignup = false) => {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-email') showAlert('Invalid email address');
        else if (errorCode === 'auth/user-disabled') showAlert('This account has been disabled');
        else if (errorCode === 'auth/user-not-found') showAlert('No account found with this email');
        else if (errorCode === 'auth/wrong-password') showAlert('Incorrect password');
        else if (errorCode === 'auth/email-already-in-use') showAlert('This email is already registered');
        else if (errorCode === 'auth/weak-password') showAlert('Password is too weak');
        else if (error.message.includes('school')) showAlert(error.message);
        else showAlert(isSignup ? 'Account creation failed. Please try again.' : 'Sign in failed. Please try again.');
    };

    return (
        <div className="container">
            <div className="card">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="loading-overlay" style={{ display: 'flex' }}>
                        <div className="spinner"></div>
                    </div>
                )}

                {/* Alert Box */}
                {alert.show && (
                    <div className={`alert alert-${alert.type}`} style={{ display: 'block' }}>
                        {alert.message}
                    </div>
                )}

                {/* Brand */}
                <div className="brand">
                    <div className="logo">BE</div>
                    <div className="brand-text">
                        <h1>BECE Prep</h1>
                        <p>Master your exams with practice</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <div
                        className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signin')}
                    >
                        Sign In
                    </div>
                    <div
                        className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Sign Up
                    </div>
                </div>

                {/* Sign In Form */}
                <div className={`form-page ${activeTab === 'signin' ? 'active' : ''}`}>
                    <div className="form-container">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group password-toggle">
                            <label htmlFor="password">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                            />
                            <span className="toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        </div>

                        <div className="remember-forgot">
                            <label className="remember">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot" onClick={handleForgotPassword}>Forgot password?</a>
                        </div>

                        <button className="btn" onClick={handleSignIn} disabled={isLoading}>Sign In</button>
                    </div>

                    <div className="divider">or continue with</div>

                    <div className="social-login">
                        <button className="social-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                    </div>

                    <div className="signup-prompt">
                        Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('signup'); }}>Sign up</a>
                    </div>
                </div>

                {/* Sign Up Form */}
                <div className={`form-page ${activeTab === 'signup' ? 'active' : ''}`}>
                    <div className="form-container">
                        <div className="form-group">
                            <label htmlFor="fullname">Full Name</label>
                            <input
                                type="text"
                                id="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-email">Email</label>
                            <input
                                type="email"
                                id="signup-email"
                                value={formData.signupEmail}
                                onChange={handleChange}
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group password-toggle">
                            <label htmlFor="signup-password">Password</label>
                            <input
                                type={showSignupPassword ? "text" : "password"}
                                id="signup-password"
                                value={formData.signupPassword}
                                onChange={handleChange}
                                placeholder="Create a password (min. 6 characters)"
                            />
                            <span className="toggle-icon" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                                {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        </div>

                        <div className="form-group password-toggle">
                            <label htmlFor="confirm-password">Confirm Password</label>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirm-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                            />
                            <span className="toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="schoolCode">School Code (Optional)</label>
                            <input
                                type="text"
                                id="schoolCode"
                                value={formData.schoolCode}
                                onChange={handleChange}
                                placeholder="Enter your school code if provided"
                            />
                            <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                                If your school registered with BECE Prep, enter the code to join your class
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="remember">
                                <input
                                    type="checkbox"
                                    id="isTeacher"
                                    checked={formData.isTeacher}
                                    onChange={handleChange}
                                />
                                <span>I am a teacher registering my school</span>
                            </label>
                        </div>

                        {formData.isTeacher && (
                            <div style={{ background: 'var(--glass)', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                                <h4 style={{ marginBottom: '16px', color: 'var(--accent)' }}>🏫 School Registration</h4>
                                <div className="form-group">
                                    <label htmlFor="schoolName">School Name</label>
                                    <input
                                        type="text"
                                        id="schoolName"
                                        value={formData.schoolName}
                                        onChange={handleChange}
                                        placeholder="e.g., Presec Legon"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="schoolLocation">School Location</label>
                                    <input
                                        type="text"
                                        id="schoolLocation"
                                        value={formData.schoolLocation}
                                        onChange={handleChange}
                                        placeholder="e.g., Accra, Ghana"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="teacherId">Teacher ID Number</label>
                                    <input
                                        type="text"
                                        id="teacherId"
                                        value={formData.teacherId}
                                        onChange={handleChange}
                                        placeholder="School-provided ID"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="remember">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                            />
                            <label htmlFor="terms">I agree to the <a href="#" style={{ color: 'var(--accent)' }}>Terms & Conditions</a></label>
                        </div>

                        <button className="btn" onClick={handleSignUp} disabled={isLoading}>Create Account</button>
                    </div>

                    <div className="divider">or continue with</div>

                    <div className="social-login">
                        <button className="social-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                    </div>

                    <div className="signup-prompt">
                        Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('signin'); }}>Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
