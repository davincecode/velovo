import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { StravaService, Activity } from '../services/StravaService';

const ACTIVITIES_PER_PAGE = 20;
const MAX_ACTIVITIES = 60; // Set the hard limit for total activities

interface StravaData {
    activities: Activity[];
    latestFitness: number | null;
    latestFatigue: number | null;
    latestBalance: number | null;
    hasOvertrainingWarning: boolean;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    stravaAccessToken: string | null;
    refreshStravaData: () => Promise<void>;
    loadMoreActivities: () => Promise<void>;
    hasMoreActivities: boolean;
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
    stravaAccessToken: null,
    refreshStravaData: async () => {},
    loadMoreActivities: async () => {},
    hasMoreActivities: false,
};

const StravaContext = createContext<StravaData>(defaultStravaData);

export const StravaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [stravaState, setStravaState] = useState<StravaData>(defaultStravaData);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const initialFetchDone = useRef(false);

    const userId = user?.id;

    const fetchStravaData = useCallback(async (isRefresh = false) => {
        if (!userId) {
            setStravaState(prev => ({ ...prev, loading: false, isConnected: false }));
            return;
        }

        setStravaState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            const profile = userDocSnap.exists() ? userDocSnap.data() as UserProfile : null;
            const token = profile?.stravaAccessToken || null;

            if (token) {
                const currentPage = isRefresh ? 1 : page;
                const fetchedActivities = await StravaService.getActivities(token, currentPage, ACTIVITIES_PER_PAGE);

                // Use a functional update to get the latest state and prevent stale data
                setStravaState(prev => {
                    const currentActivities = isRefresh ? [] : prev.activities;
                    const newActivityList = [...currentActivities, ...fetchedActivities];

                    const moreAvailableFromApi = fetchedActivities.length === ACTIVITIES_PER_PAGE;
                    const underMaxLimit = newActivityList.length < MAX_ACTIVITIES;
                    setHasMore(moreAvailableFromApi && underMaxLimit);

                    let performanceMetrics = {};
                    if (currentPage === 1 && newActivityList.length > 0) {
                        const latestActivity = newActivityList[0];
                        if (latestActivity.privateNote) {
                            const note = latestActivity.privateNote;
                            performanceMetrics = {
                                latestFitness: (note.match(/Fitness (\d+)/) || [])[1] ? parseInt((note.match(/Fitness (\d+)/) || [])[1]) : null,
                                latestFatigue: (note.match(/Fatigue (\d+)/) || [])[1] ? parseInt((note.match(/Fatigue (\d+)/) || [])[1]) : null,
                                latestBalance: (note.match(/Balance (-?\d+)/) || [])[1] ? parseInt((note.match(/Balance (-?\d+)/) || [])[1]) : null,
                                hasOvertrainingWarning: !!note.match(/Overtraining warning \((\d+)\)/),
                            };
                        }
                    }

                    return {
                        ...prev,
                        ...performanceMetrics,
                        activities: newActivityList,
                        isConnected: true,
                        loading: false,
                        error: null,
                        stravaAccessToken: token,
                    };
                });

                if (isRefresh) {
                    setPage(2); // Reset page count for subsequent loads
                }

            } else {
                setStravaState(prev => ({ ...prev, isConnected: false, loading: false, activities: [] }));
            }
        } catch (error) {
            console.error("StravaContext: Error fetching data:", error);
            setStravaState(prev => ({ ...prev, error: 'Failed to fetch Strava data.', loading: false }));
        }
    }, [userId, page]);

    const refreshStravaData = async () => {
        setPage(1);
        await fetchStravaData(true);
    };

    const loadMoreActivities = async () => {
        if (!stravaState.loading && hasMore) {
            setPage(prevPage => prevPage + 1);
        }
    };

    useEffect(() => {
        if (userId && !initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchStravaData();
        }
    }, [userId, fetchStravaData]);

    useEffect(() => {
        if (page > 1) {
            fetchStravaData();
        }
    }, [page, fetchStravaData]); // fetchStravaData is stable

    const contextValue = {
        ...stravaState,
        refreshStravaData,
        loadMoreActivities,
        hasMoreActivities: hasMore,
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
