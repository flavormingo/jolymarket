import { useState, useEffect, useCallback } from 'react';
import pb from '../lib/pocketbase';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthActions {
    signup: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const model = pb.authStore.model;
            if (model) {
                setUser({
                    id: model.id,
                    email: model.email,
                    walletAddress: model.walletAddress,
                    createdAt: new Date(model.created)
                });
            }
            setIsLoading(false);
        };

        checkAuth();

        pb.authStore.onChange(() => {
            const model = pb.authStore.model;
            if (model) {
                setUser({
                    id: model.id,
                    email: model.email,
                    walletAddress: model.walletAddress,
                    createdAt: new Date(model.created)
                });
            } else {
                setUser(null);
            }
        });
    }, []);

    const signup = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await pb.collection('users').create({
                email,
                password,
                passwordConfirm: password
            });

            await pb.collection('users').authWithPassword(email, password);

            const model = pb.authStore.model;
            if (model) {
                setUser({
                    id: model.id,
                    email: model.email,
                    walletAddress: model.walletAddress,
                    createdAt: new Date(model.created)
                });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'failed to sign up';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await pb.collection('users').authWithPassword(email, password);

            const model = pb.authStore.model;
            if (model) {
                setUser({
                    id: model.id,
                    email: model.email,
                    walletAddress: model.walletAddress,
                    createdAt: new Date(model.created)
                });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'failed to log in';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        pb.authStore.clear();
        setUser(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        signup,
        login,
        logout,
        clearError
    };
}
