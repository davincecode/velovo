import React, { useState, useEffect } from 'react';
import { useStravaData } from '../context/StravaContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { IonSpinner } from '@ionic/react';
import { TrainingAnalyticsService, FitnessData } from '../services/TrainingAnalyticsService';

export const PerformanceCard: React.FC = () => {
    const { user } = useAuth();
    const { activities, loading: stravaLoading, stravaAccessToken } = useStravaData();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
    const [aiMessage, setAiMessage] = useState<string>('');
    const [currentFtp, setCurrentFtp] = useState<number | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) {
                const userDocRef = doc(db, 'users', user.id);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const profile = userDocSnap.data() as UserProfile;
                        setUserProfile(profile);
                        if (profile.health_lifestyle && typeof profile.health_lifestyle.ftp === 'number') {
                            setCurrentFtp(profile.health_lifestyle.ftp);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            }
            setLoadingProfile(false);
        };
        fetchUserProfile();
    }, [user?.id]);

    useEffect(() => {
        const estimateAndSetFtp = async () => {
            if (activities.length > 0 && stravaAccessToken) {
                const estimated = await TrainingAnalyticsService.estimateFtpFromActivities(activities, stravaAccessToken);
                if (estimated) {
                    setCurrentFtp(estimated);
                } else if (userProfile?.health_lifestyle?.ftp) {
                    setCurrentFtp(userProfile.health_lifestyle.ftp);
                } else {
                    setCurrentFtp(183); // Fallback to default if no estimation and no user profile FTP
                }
            } else if (userProfile?.health_lifestyle?.ftp) {
                setCurrentFtp(userProfile.health_lifestyle.ftp);
            } else {
                setCurrentFtp(183); // Fallback to default if no activities and no user profile FTP
            }
        };

        if (!stravaLoading && !loadingProfile) {
            estimateAndSetFtp();
        }
    }, [activities, stravaAccessToken, userProfile, stravaLoading, loadingProfile]);

    useEffect(() => {
        if (activities && activities.length > 0 && currentFtp && currentFtp > 0) {
            const dailyLoads = activities.map(activity => ({
                date: new Date(activity.startDate),
                tss: TrainingAnalyticsService.calculateTss(activity, currentFtp)
            })).filter(load => load.tss > 0);

            if (dailyLoads.length > 0) {
                const { ctl, atl } = TrainingAnalyticsService.calculateFitnessAndFatigue(dailyLoads);
                const tsb = ctl - atl;

                setFitnessData({ ctl, atl, tsb });

                const latestActivity = activities[0];
                const latestTss = dailyLoads.find(load => new Date(latestActivity.startDate).getTime() === load.date.getTime())?.tss || 0;
                const message = TrainingAnalyticsService.generateAiMessage(latestActivity, ctl, atl, tsb, latestTss);
                setAiMessage(message);
            }
        }
    }, [activities, currentFtp]);

    if (stravaLoading || loadingProfile || currentFtp === null) {
        return (
            <div style={{ textAlign: 'center' }}>
                <IonSpinner />
                <p>Loading Performance Data...</p>
            </div>
        );
    }

    const maxHr = userProfile && userProfile.health_lifestyle ? userProfile.health_lifestyle.max_hr : undefined;

    return (
        <section>
            <h3>Performance Status</h3>
            <div style={{ marginBottom: '1rem' }}>
                <p><strong>Current FTP:</strong> {currentFtp ? `${currentFtp} W` : 'N/A'}</p>
                <p><strong>Current Max HR:</strong> {maxHr ? `${maxHr} bpm` : 'N/A'}</p>
                <p><strong>Current training status:</strong></p>
                <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                    <li>a. 🚴 Fitness (CTL): {fitnessData?.ctl ?? 'N/A'}</li>
                    <li>b. 💤 Fatigue (ATL): {fitnessData?.atl ?? 'N/A'}</li>
                    <li>c. ⚖️ Balance (TSB): {fitnessData?.tsb ?? 'N/A'}</li>
                </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <p><strong>AI generated comments:</strong></p>
                <div style={{ border: '1px solid var(--ion-color-medium)', borderRadius: '5px', padding: '0.5rem', fontSize: '0.9rem' }}>
                    <p>{aiMessage || 'Not enough data to generate comments.'}</p>
                </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium-shade)' }}>
                <p><strong>Balance Guide:</strong> A TSB between -10 and -30 suggests a good balance of training and recovery. Above +15 indicates rest, while below -30 may mean overtraining.</p>
                <p><strong>Fitness (CTL):</strong> Reflects your training load over the last 42 days. A higher number indicates greater fitness.</p>
                <p><strong>Fatigue (ATL):</strong> Reflects your training load over the last 7 days. A high number suggests recent hard training.</p>
            </div>
        </section>
    );
};
