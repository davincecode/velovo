import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { StravaService, Activity } from '../services/StravaService';

const ACTIVITIES_PER_PAGE = 50; // Number of activities to fetch per API call
const FETCH_DAYS_AGO = 50;      // We need enough data for a 42-day CTL, so 50 days is a safe buffer.

interface StravaData {
    activities: Activity[];
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    stravaAccessToken: string | null;
    refreshStravaData: () => Promise<void>;
}

const defaultStravaData: StravaData = {
    activities: [],
    loading: true,
    error: null,
    isConnected: false,
    stravaAccessToken: null,
    refreshStravaData: async () => {},
};

const StravaContext = createContext<StravaData>(defaultStravaData);

export const StravaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [stravaState, setStravaState] = useState<StravaData>(defaultStravaData);
    const initialFetchDone = useRef(false);

    const userId = user?.id;

    const fetchAllActivitiesSinceDate = useCallback(async () => {
        if (!userId || initialFetchDone.current) {
            // Prevent re-fetching if already done or no user
            if(!userId) setStravaState(prev => ({ ...prev, loading: false, isConnected: false }));
            return;
        }
        initialFetchDone.current = true; // Mark fetch as started

        setStravaState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            const profile = userDocSnap.exists() ? userDocSnap.data() as UserProfile : null;
            const token = profile?.stravaAccessToken || null;

            if (token) {
                const afterTimestamp = Math.floor((new Date().getTime() - FETCH_DAYS_AGO * 24 * 60 * 60 * 1000) / 1000);
                
                let allActivities: Activity[] = [];
                let page = 1;
                let moreToFetch = true;

                // Loop to fetch all pages of activities since the target date
                while (moreToFetch) {
                    const fetchedActivities = await StravaService.getActivities(token, page, ACTIVITIES_PER_PAGE, afterTimestamp);
                    allActivities.push(...fetchedActivities);

                    if (fetchedActivities.length < ACTIVITIES_PER_PAGE) {
                        moreToFetch = false;
                    } else {
                        page++;
                    }
                }

                setStravaState(prev => ({
                    ...prev,
                    // Sort activities with the most recent one first
                    activities: allActivities.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
                    isConnected: true,
                    loading: false,
                    error: null,
                    stravaAccessToken: token,
                }));

            } else {
                setStravaState(prev => ({ ...prev, isConnected: false, loading: false, activities: [] }));
            }
        } catch (error) {
            console.error("StravaContext: Error fetching data:", error);
            setStravaState(prev => ({ ...prev, error: 'Failed to fetch Strava data.', loading: false }));
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchAllActivitiesSinceDate();
        }
    }, [userId, fetchAllActivitiesSinceDate]);

    const contextValue = {
        ...stravaState,
        refreshStravaData: fetchAllActivitiesSinceDate,
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
