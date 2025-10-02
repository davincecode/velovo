import React, { useEffect, useState, useCallback } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonList, IonItem, IonLabel, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonModal, IonButtons, IonBackButton } from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../context/AuthContext';
import { useStravaData } from '../context/StravaContext';
import { PerformanceCard } from '../components/PerformanceCard';
import '../theme/global.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../userProfile';
import { TrainingAnalyticsService } from '../services/TrainingAnalyticsService';
import { helpCircleOutline, arrowBack } from 'ionicons/icons'; // Import the help circle icon and arrowBack

// Component to render HTML content safely
const HtmlContent: React.FC<{ html: string }> = ({ html }) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

export const Home: React.FC = () => {
    const { user } = useAuth();
    const { activities, isConnected, error, loading: stravaLoading, refreshStravaData, stravaAccessToken } = useStravaData();
    const [profileName, setProfileName] = useState<string>('');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [currentFtp, setCurrentFtp] = useState<number | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false); // State to control info modal visibility

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) {
                const userDocRef = doc(db, 'users', user.id);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const profile = userDocSnap.data() as UserProfile;
                        setUserProfile(profile);
                        if (profile.basic_info && profile.basic_info.name) {
                            setProfileName(profile.basic_info.name);
                        }
                        // Set FTP from profile if available, otherwise it will be estimated later
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
            } else {
                setCurrentFtp(183); // Fallback to default if no activities and no user profile FTP
            }
        };

        if (!stravaLoading && !loadingProfile) {
            estimateAndSetFtp();
        }
    }, [activities, stravaAccessToken, userProfile, stravaLoading, loadingProfile]);

    const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
        await refreshStravaData();
        event.detail.complete();
    };

    const handleInfoIconClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setShowInfoModal(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setShowInfoModal(false);
    }, []);

    const welcomeName = profileName || user?.name;

    const activityScoreExplanationHtml = `
        <p><b>RP (Relative Power):</b></p>
        <p>This is likely your normalized power relative to FTP, scaled to reflect effort. A higher RP means you pushed closer to or beyond your FTP.</p>
        <p><i>Example: RP of 163 suggests a strong effort—possibly above threshold.</i></p>
        <br/>
        <p><b>INT (Intensity Factor):</b></p>
        <p>This is normalized power ÷ FTP.</p>
        <p><i>0.93 means you rode at 93% of your FTP on average—solid tempo or sweet spot territory. Intensity Factor helps gauge how hard the ride felt physiologically.</i></p>
        <br/>
        <p><b>LOAD:</b></p>
        <p>This is your Training Stress Score (TSS) or equivalent.</p>
        <p><i>It blends duration × intensity to reflect total strain. 159 is a substantial load—likely a long or hard ride that will impact your CTL (fitness) and ATL (fatigue).</i></p>
    `;

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Welcome{welcomeName ? `, ${welcomeName}` : ''}!</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                <PerformanceCard />

                <section style={{marginTop:16}}>
                    <h3>Recent Activities</h3>
                    {stravaLoading && activities.length === 0 ? (
                        <p>Loading activities...</p>
                    ) : !isConnected ? (
                        <>
                            <p>Connect your Strava account from the Settings page.</p>
                            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                        </>
                    ) : activities.length > 0 ? (
                        <>
                            <IonList>
                                {activities.map(activity => {
                                    const power = ('weightedAverageWatts' in activity && typeof activity.weightedAverageWatts === 'number')
                                        ? activity.weightedAverageWatts
                                        : activity.averageWatts;

                                    let tss = 0;
                                    let intensityFactor = 0;
                                    if (currentFtp && currentFtp > 0 && power && activity.movingTimeS) {
                                        tss = TrainingAnalyticsService.calculateTss(activity, currentFtp);
                                        intensityFactor = power / currentFtp;
                                    }

                                    return (
                                        <IonItem key={activity.id} style={{ border: '1px solid var(--ion-color-medium)', borderRadius: '5px', marginBottom: '10px', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }}>
                                            <IonLabel style={{ width: '100%' }}>
                                                <h2>{activity.name}</h2>
                                                <p><small>{new Date(activity.startDate).toLocaleDateString()}</small></p>
                                                {activity.description && <p><em>{activity.description}</em></p>}
                                                <div style={{ marginTop: '8px' }}>
                                                    <div className="statRowStyle"><strong>Distance:</strong><span>{(activity.distanceM / 1000).toFixed(2)} km</span></div>
                                                    <div className="statRowStyle"><strong>Duration:</strong><span>{formatTime(activity.movingTimeS)}</span></div>
                                                    <div className="statRowStyle">
                                                        <strong>Avg Power:</strong><span>{power ? power.toFixed(0) + '\u00A0' + 'W' : 'N/A'}</span>
                                                    </div>
                                                    <div className="statRowStyle" style={{ marginTop: '8px' }}>
                                                        <strong>Activity Score:</strong>
                                                        <span style={{ marginLeft: '5px' }}>
                                                            RP: {power ? power.toFixed(0) : 'N/A'}
                                                            {' '}
                                                            Int: {intensityFactor ? intensityFactor.toFixed(2) : 'N/A'}
                                                            {' '}
                                                            Load: {tss ? tss.toFixed(0) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <IonButton
                                                    href={`https://www.strava.com/activities/${activity.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    expand="block"
                                                    style={{ marginTop: '10px', '--background': '#FC4C02', color: 'white' }}
                                                >
                                                    View on Strava
                                                </IonButton>
                                            </IonLabel>
                                            {/* Moved IonIcon to upper right corner of IonItem */}
                                            <IonIcon
                                                icon={helpCircleOutline}
                                                onClick={handleInfoIconClick}
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px', // Adjust as needed
                                                    right: '10px', // Adjust as needed
                                                    fontSize: '24px',
                                                    cursor: 'pointer',
                                                    zIndex: 1
                                                }}
                                            />
                                        </IonItem>
                                    );
                                })}
                            </IonList>
                            <div style={{ textAlign: 'center', color: 'var(--ion-color-medium-shade)', fontSize: '0.8rem', padding: '1rem' }}>
                                <p>Showing {activities.length} activities from the last 42 days.</p>
                            </div>
                        </>
                    ) : (
                        <p>No recent Strava activities found.</p>
                    )}
                </section>

                <IonModal
                    isOpen={showInfoModal}
                    onDidDismiss={handleModalClose}
                >
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonButton onClick={handleModalClose}>
                                    <IonIcon icon={arrowBack} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>Activity Score Explanation</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <HtmlContent html={activityScoreExplanationHtml} />
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};
