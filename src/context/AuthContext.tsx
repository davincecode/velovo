import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';


interface AuthState {
    user?: UserProfile;
    stravaAccessToken?: string;
    login: (user: UserProfile) => void;
    logout: () => void;
    setStravaToken: (token: string) => void;
}


const AuthContext = createContext<AuthState | undefined>(undefined);


export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | undefined>(() => {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : undefined;
    });
    const [stravaAccessToken, setStravaAccessToken] = useState<string | undefined>(() => localStorage.getItem('strava_token') ?? undefined);


    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    }, [user]);
    useEffect(() => {
        if (stravaAccessToken) localStorage.setItem('strava_token', stravaAccessToken);
        else localStorage.removeItem('strava_token');
    }, [stravaAccessToken]);


    return (
        <AuthContext.Provider value={{ user, stravaAccessToken, login: setUser as any, logout: () => { setUser(undefined); setStravaAccessToken(undefined); }, setStravaToken: setStravaAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
