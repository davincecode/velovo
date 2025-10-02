import React, { useState, useEffect } from 'react';
import { useStravaData } from '../context/StravaContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner } from '@ionic/react';
import { TrainingAnalyticsService, FitnessData } from '../services/TrainingAnalyticsService';

export const PerformanceCard: React.FC = () => {
    const { user } = useAuth();
    const { activities, loading: stravaLoading } = useStravaData();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
    const [aiMessage, setAiMessage] = useState<string>('');
    const [estimatedFtp, setEstimatedFtp] = useState<number>(183); // Default FTP

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) {
                const userDocRef = doc(db, 'users', user.id);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const profile = userDocSnap.data() as UserProfile;
                        setUserProfile(profile);
                        // Safely access ftp. The 'health_lifestyle' object or 'ftp' property might not exist in the data.
                        if (profile.health_lifestyle && typeof profile.health_lifestyle.ftp === 'number') {
                            setEstimatedFtp(profile.health_lifestyle.ftp);
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
        // Use all available activities for a more accurate calculation
        if (activities && activities.length > 0 && estimatedFtp > 0) {
            const dailyLoads = activities.map(activity => ({
                date: new Date(activity.startDate),
                tss: TrainingAnalyticsService.calculateTss(activity, estimatedFtp)
            })).filter(load => load.tss > 0); // Filter out activities with 0 TSS

            if (dailyLoads.length > 0) {
                const { ctl, atl } = TrainingAnalyticsService.calculateFitnessAndFatigue(dailyLoads);
                const tsb = ctl - atl;

                setFitnessData({ ctl, atl, tsb });

                // The AI message is generated for the most recent activity
                const latestActivity = activities[0];
                const latestTss = dailyLoads.find(load => new Date(latestActivity.startDate).getTime() === load.date.getTime())?.tss || 0;
                const message = TrainingAnalyticsService.generateAiMessage(latestActivity, ctl, atl, tsb, latestTss);
                setAiMessage(message);
            }
        }
    }, [activities, estimatedFtp]);

    if (stravaLoading || loadingProfile) {
        return (
            <IonCard>
                <IonCardContent style={{ textAlign: 'center' }}>
                    <IonSpinner />
                    <p>Loading Performance Data...</p>
                </IonCardContent>
            </IonCard>
        );
    }

    // Safely access max_hr from the user profile.
    const maxHr = userProfile && userProfile.health_lifestyle ? userProfile.health_lifestyle.max_hr : undefined;

    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>Performance Status</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <div style={{ marginBottom: '1rem' }}>
                    <p><strong>1. Current FTP:</strong> {estimatedFtp ? `${estimatedFtp} W` : 'N/A'}</p>
                    <p><strong>2. Current Max HR:</strong> {maxHr ? `${maxHr} bpm` : 'N/A'}</p>
                    <p><strong>3. Current training status:</strong></p>
                    <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                        <li>a. 🚴 Fitness (CTL): {fitnessData?.ctl ?? 'N/A'}</li>
                        <li>b. 💤 Fatigue (ATL): {fitnessData?.atl ?? 'N/A'}</li>
                        <li>c. ⚖️ Balance (TSB): {fitnessData?.tsb ?? 'N/A'}</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <p><strong>4. AI generated comments:</strong></p>
                    <div style={{ border: '1px solid var(--ion-color-medium)', borderRadius: '5px', padding: '0.5rem', fontSize: '0.9rem' }}>
                        <p>{aiMessage || 'Not enough data to generate comments.'}</p>
                    </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium-shade)' }}>
                    <p><strong>Balance Guide:</strong> A TSB between -10 and -30 suggests a good balance of training and recovery. Above +15 indicates rest, while below -30 may mean overtraining.</p>
                    <p><strong>Fitness (CTL):</strong> Reflects your training load over the last 42 days. A higher number indicates greater fitness.</p>
                    <p><strong>Fatigue (ATL):</strong> Reflects your training load over the last 7 days. A high number suggests recent hard training.</p>
                </div>
            </IonCardContent>
        </IonCard>
    );
};
