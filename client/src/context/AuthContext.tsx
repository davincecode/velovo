import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User, signInWithCustomToken } from 'firebase/auth';
import app from '../services/firebase';
import { exchangeGoogleTokenForFirebaseCustomToken } from '../services/authService';

// Define a simpler type for the authenticated user in this context
export interface AuthUser {
    id: string;
    name: string;
}

interface AuthState {
    user?: AuthUser;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (googleIdToken: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | undefined>(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser) as AuthUser;
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
                const authUser: AuthUser = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email || 'User',
                };
                setUser(authUser);
                localStorage.setItem('user', JSON.stringify(authUser));
            } else {
                setUser(undefined);
                localStorage.removeItem('user');
            }
        });

        return () => unsubscribe();
    }, [auth]);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle setting the user state.
    };

    const loginWithGoogle = async (googleIdToken: string) => {
        const { firebaseCustomToken } = await exchangeGoogleTokenForFirebaseCustomToken(googleIdToken);
        await signInWithCustomToken(auth, firebaseCustomToken);
        // onAuthStateChanged will handle setting the user state.
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will clear user state. We force a redirect to ensure
        // the app state is cleared and the user lands on the login page.
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
