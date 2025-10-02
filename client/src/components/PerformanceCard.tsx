import React, { useState, useEffect, useCallback } from 'react';
import { useStravaData } from '../context/StravaContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { IonSpinner, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton } from '@ionic/react';
import { TrainingAnalyticsService, FitnessData } from '../services/TrainingAnalyticsService';
import { helpCircleOutline, arrowBack } from 'ionicons/icons';

export const PerformanceCard: React.FC = () => {
    const { user } = useAuth();
    const { activities, loading: stravaLoading, stravaAccessToken } = useStravaData();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
    const [aiMessage, setAiMessage] = useState<string>('');
    const [currentFtp, setCurrentFtp] = useState<number | null>(null);
    const [showFtpInfoModal, setShowFtpInfoModal] = useState(false);

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
                }
            } else if (userProfile?.health_lifestyle?.ftp) {
                setCurrentFtp(userProfile.health_lifestyle.ftp);
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

    const handleFtpInfoClick = useCallback(() => {
        setShowFtpInfoModal(true);
    }, []);

    const handleCloseFtpInfoModal = useCallback(() => {
        setShowFtpInfoModal(false);
    }, []);

    if (stravaLoading || loadingProfile || currentFtp === null) {
        return (
            <div style={{ textAlign: 'center' }}>
                <IonSpinner />
                <p>Loading Performance Data...</p>
            </div>
        );
    }

    const maxHr = userProfile && userProfile.health_lifestyle ? userProfile.health_lifestyle.max_hr : undefined;

    const ftpExplanationHtml = `
        <p>Your Functional Threshold Power (FTP) is determined in one of two ways:</p>
        <ol>
            <li><b>From your profile:</b> If you have manually entered an FTP in your profile settings, this value will be used.</li>
            <li><b>Estimated from Strava activities:</b> If no FTP is set in your profile, we estimate it from your recent Strava activities. This estimation is based on a 20-minute maximal effort within a ride, or a similar sustained high-power output.</li>
            <li><b>Default Fallback:</b> If neither of the above provides an FTP, a default value of 183 W is used.</li>
        </ol>
        <p>For the most accurate performance metrics, ensure your FTP is up-to-date in your profile settings.</p>
    `;

    const HtmlContent: React.FC<{ html: string }> = ({ html }) => {
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <section>
            <h3>Performance Status</h3>
            <div style={{ marginBottom: '1.5rem' }}>
                <p className="ftp-highlight" style={{
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(to right, #0033A0, #E4002B, #000000, #FBB613, #008230)', // UCI Rainbow Colors
                    padding: '0.5rem',
                    borderRadius: '5px',
                    color: 'white',
                    fontWeight: 'bold'
                }}>
                    <span><strong>Current FTP:</strong> {currentFtp ? `${currentFtp} W` : 'N/A'}</span>
                    <IonIcon
                        icon={helpCircleOutline}
                        onClick={handleFtpInfoClick}
                        style={{ fontSize: '1.5em', verticalAlign: 'middle', cursor: 'pointer', color: 'white' }}
                    />
                </p>
                <p style={{ margin: '0' }}><strong>Current Max HR:</strong> {maxHr ? `${maxHr} bpm` : 'N/A'}</p>
                <p style={{ margin: '0' }}><strong>Current training status:</strong></p>
                <ul style={{ margin:'6px', listStyle: 'none', paddingLeft: '1rem' }}>
                    <li>a. 🚴 Fitness (CTL): {fitnessData?.ctl ?? 'N/A'}</li>
                    <li>b. 💤 Fatigue (ATL): {fitnessData?.atl ?? 'N/A'}</li>
                    <li>c. ⚖️ Balance (TSB): {fitnessData?.tsb ?? 'N/A'}</li>
                </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '6px' }}><strong>Coaching Notes:</strong></p>
                <div style={{ border: '1px solid var(--ion-color-medium)', borderRadius: '5px', padding: '0.5rem', fontSize: '0.9rem' }}>
                    <p>{aiMessage || 'Not enough data to generate comments.'}</p>
                </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium-shade)' }}>
                <p><strong>Balance Guide:</strong> A TSB between -10 and -30 suggests a good balance of training and recovery. Above +15 indicates rest, while below -30 may mean overtraining.</p>
                <p><strong>Fitness (CTL):</strong> Reflects your training load over the last 42 days. A higher number indicates greater fitness.</p>
                <p><strong>Fatigue (ATL):</strong> Reflects your training load over the last 7 days. A high number suggests recent hard training.</p>
            </div>

            <IonModal
                isOpen={showFtpInfoModal}
                onDidDismiss={handleCloseFtpInfoModal}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={handleCloseFtpInfoModal}>
                                <IonIcon icon={arrowBack} />
                            </IonButton>
                        </IonButtons>
                        <IonTitle>FTP Explanation</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <HtmlContent html={ftpExplanationHtml} />
                </IonContent>
            </IonModal>
        </section>
    );
};
