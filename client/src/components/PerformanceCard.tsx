import React, { useState, useEffect } from 'react';
import { useStravaData } from '../context/StravaContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner } from '@ionic/react';

export const PerformanceCard: React.FC = () => {
    const { user } = useAuth();
    const { latestFitness, latestFatigue, latestBalance, loading: stravaLoading } = useStravaData();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) {
                const userDocRef = doc(db, 'users', user.id);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setUserProfile(userDocSnap.data() as UserProfile);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            }
            setLoadingProfile(false);
        };
        fetchUserProfile();
    }, [user?.id]);

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

    const ftp = userProfile?.health_lifestyle?.ftp;
    const maxHr = userProfile?.health_lifestyle?.max_hr;

    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>Performance Status</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <div style={{ marginBottom: '1rem' }}>
                    <p><strong>1. Current FTP:</strong> {ftp ? `${ftp} W` : 'N/A'}</p>
                    <p><strong>2. Current Max HR:</strong> {maxHr ? `${maxHr} bpm` : 'N/A'}</p>
                    <p><strong>3. Current training status:</strong></p>
                    <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                        <li>a. 🚴 Fitness: {latestFitness ?? 'N/A'}</li>
                        <li>b. 💤 Fatigue: {latestFatigue ?? 'N/A'}</li>
                        <li>c. ⚖️ Balance: {latestBalance ?? 'N/A'}</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <p><strong>4. AI generated comments:</strong></p>
                    <div style={{ border: '1px solid var(--ion-color-medium)', borderRadius: '5px', padding: '0.5rem', fontSize: '0.9rem' }}>
                        <p><strong>Long Term Analysis:</strong> ⬆️ You are not seeing improvements in your ability despite a high training volume. Try to focus on improving the quality of your training rather than quantity.</p>
                        <p><strong>Short Term Analysis:</strong> 😃 You are maintaining good condition through appropriate levels of training.</p>
                    </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium-shade)' }}>
                    <p><strong>Balance Guide:</strong> -10 ~ -30.</p>
                    <p><strong>Fitness, Fatigue, Balance?</strong> Riduck's Fitness chart is based on the Training Stress Balance model. You can train systematically through personalized cumulative training figures and fitness/fatigue/balance scores. 'Fitness' means a positive effect and reflects the last 6 weeks of training. 'Fatigue' means negative impact and reflects the last 7 days of training. 'Balance' is (fitness-fatigue). The best balance for training is -10 to -30, anything below -30 is risk of overtraining, and above +15 can lead to poor fitness.</p>
                    <p><strong>Fitness Guide:</strong> 33 ~ 49</p>
                </div>
            </IonCardContent>
        </IonCard>
    );
};
