import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { UserProfile } from '../types';
import app from '../services/firebase';

interface AuthState {
    user?: UserProfile;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | undefined>(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                localStorage.removeItem('user');
            }
        }
        return undefined;
    });
    const auth = getAuth(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
            if (firebaseUser) {
                const userProfile: UserProfile = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email || 'User',
                };
                setUser(userProfile);
                localStorage.setItem('user', JSON.stringify(userProfile));
            } else {
                setUser(undefined);
                localStorage.removeItem('user');
            }
        });

        return () => unsubscribe();
    }, [auth]);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle setting the user state and navigating.
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will handle clearing the user state.
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
