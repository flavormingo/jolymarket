// sign up modal shown on page load

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SignUpModalProps {
    onClose: () => void;
}

export function SignUpModal({ onClose }: SignUpModalProps) {
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { signup, login, error: authError, clearError } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearError();

        if (!email || !password) {
            setFormError('please fill in all fields');
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setFormError('passwords do not match');
            return;
        }

        if (password.length < 8) {
            setFormError('password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isSignUp) {
                await signup(email, password);
            } else {
                await login(email, password);
            }
            onClose();
        } catch {
            // error is handled by useAuth hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setFormError(null);
        clearError();
    };

    const displayError = formError || authError;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isSignUp ? 'create account' : 'welcome back'}
                    </h2>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                        {isSignUp
                            ? 'sign up to start trading on jolymarket'
                            : 'sign in to access your portfolio'
                        }
                    </p>

                    {displayError && (
                        <div style={{
                            padding: 'var(--space-sm)',
                            background: 'var(--accent-danger)',
                            color: 'white',
                            fontSize: '0.875rem'
                        }}>
                            {displayError}
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {isSignUp && (
                        <div className="input-group">
                            <label className="input-label">confirm password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    <div className="modal-footer" style={{ flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'loading...'
                                : isSignUp
                                    ? 'create account'
                                    : 'sign in'
                            }
                        </button>

                        <button
                            type="button"
                            className="btn"
                            style={{ width: '100%' }}
                            onClick={toggleMode}
                            disabled={isSubmitting}
                        >
                            {isSignUp
                                ? 'already have an account? sign in'
                                : "don't have an account? sign up"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
