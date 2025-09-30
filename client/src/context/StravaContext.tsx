import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { StravaService, Activity } from '../services/StravaService';

interface StravaData {
    activities: Activity[];
    latestFitness: number | null;
    latestFatigue: number | null;
    latestBalance: number | null;
    hasOvertrainingWarning: boolean;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    stravaAccessToken: string | null; // Add stravaAccessToken
    refreshStravaData: () => void;
}

const defaultStravaData: StravaData = {
    activities: [],
    latestFitness: null,
    latestFatigue: null,
    latestBalance: null,
    hasOvertrainingWarning: false,
    loading: true,
    error: null,
    isConnected: false,
    stravaAccessToken: null, // Add to default
    refreshStravaData: () => {},
};

const StravaContext = createContext<StravaData>(defaultStravaData);

export const StravaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [stravaState, setStravaState] = useState<StravaData>(defaultStravaData);

    const userId = user?.id;

    const fetchStravaData = useCallback(async () => {
        console.log("StravaContext: Initiating fetchStravaData for userId:", userId);
        if (!userId) {
            setStravaState(prev => ({ ...prev, loading: false, isConnected: false, stravaAccessToken: null }));
            console.log("StravaContext: No userId, setting isConnected to false.");
            return;
        }

        setStravaState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            let profile: UserProfile | null = null;

            if (userDocSnap.exists()) {
                profile = userDocSnap.data() as UserProfile;
                console.log("StravaContext: User profile fetched.", profile);
            } else {
                console.log("StravaContext: No user profile found for userId:", userId);
            }

            const token = profile?.stravaAccessToken || null;
            setStravaState(prev => ({ ...prev, stravaAccessToken: token })); // Set token in state

            if (token) {
                console.log("StravaContext: Strava access token found.");
                try {
                    const fetchedActivities = await StravaService.getActivities(token, 1, 10);
                    console.log("StravaContext: Fetched activities successfully.", fetchedActivities);
                    
                    let latestFitness: number | null = null;
                    let latestFatigue: number | null = null;
                    let latestBalance: number | null = null;
                    let hasOvertrainingWarning = false;

                    if (fetchedActivities.length > 0) {
                        const latestActivity = fetchedActivities[0];
                        if (latestActivity.privateNote) {
                            const note = latestActivity.privateNote;
                            console.log("StravaContext: Raw privateNote for latest activity:", note);

                            const fatigueMatch = note.match(/Fatigue (\d+)/);
                            const fitnessMatch = note.match(/Fitness (\d+)/);
                            const balanceMatch = note.match(/Balance (-?\d+)/);
                            const overtrainingMatch = note.match(/Overtraining warning \((\d+)\)/);

                            latestFitness = fitnessMatch ? parseInt(fitnessMatch[1]) : null;
                            latestFatigue = fatigueMatch ? parseInt(fatigueMatch[1]) : null;
                            latestBalance = balanceMatch ? parseInt(balanceMatch[1]) : null;
                            hasOvertrainingWarning = !!overtrainingMatch;

                            console.log("StravaContext: Parsed Metrics - Fitness:", latestFitness, "Fatigue:", latestFatigue, "Balance:", latestBalance, "Overtraining Warning:", hasOvertrainingWarning);
                        }
                    }

                    setStravaState(prev => ({
                        ...prev,
                        activities: fetchedActivities,
                        latestFitness,
                        latestFatigue,
                        latestBalance,
                        hasOvertrainingWarning,
                        isConnected: true,
                        loading: false,
                    }));

                } catch (stravaError) {
                    console.error("StravaContext: Error fetching Strava activities:", stravaError);
                    setStravaState(prev => ({
                        ...prev,
                        error: 'Failed to fetch Strava activities. Your token might be expired.',
                        isConnected: false,
                        loading: false,
                    }));
                }
            } else {
                setStravaState(prev => ({
                    ...prev,
                    activities: [],
                    latestFitness: null,
                    latestFatigue: null,
                    latestBalance: null,
                    hasOvertrainingWarning: false,
                    isConnected: false,
                    loading: false,
                }));
                console.log("StravaContext: No Strava access token found in user profile.");
            }
        } catch (profileError) {
            console.error("StravaContext: Error fetching user profile:", profileError);
            setStravaState(prev => ({
                ...prev,
                error: 'Failed to load user profile.',
                isConnected: false,
                loading: false,
            }));
        }
    }, [userId]);

    useEffect(() => {
        fetchStravaData();
    }, [fetchStravaData]);

    const contextValue = {
        ...stravaState,
        refreshStravaData: fetchStravaData,
    };

    return (
        <StravaContext.Provider value={contextValue}>
            {children}
        </StravaContext.Provider>
    );
};

export const useStravaData = (): StravaData => {
    return useContext(StravaContext);
};
