import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonList, IonItem, IonLabel, IonModal, useIonAlert, IonRefresher, IonRefresherContent } from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../context/AuthContext';
import { useStravaData } from '../context/StravaContext';
import { StravaService, Activity } from '../services/StravaService';
import { PerformanceCard } from '../components/PerformanceCard';
import '../theme/global.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../userProfile';

const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

export const Home: React.FC = () => {
    const { user } = useAuth();
    // Removed loadMoreActivities and hasMoreActivities as we are no longer lazy loading
    const { activities, isConnected, error, loading: stravaLoading, stravaAccessToken, refreshStravaData } = useStravaData();
    const [profileName, setProfileName] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [presentAlert] = useIonAlert();

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) {
                const userDocRef = doc(db, 'users', user.id);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const profileData = userDocSnap.data() as UserProfile;
                        if (profileData.basic_info && profileData.basic_info.name) {
                            setProfileName(profileData.basic_info.name);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            }
        };
        fetchUserProfile();
    }, [user?.id]);

    const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
        await refreshStravaData();
        event.detail.complete();
    };

    const openActivityDetails = async (activity: Activity) => {
        if (!stravaAccessToken) {
            presentAlert({ header: 'Error', message: 'Strava access token not available. Please reconnect Strava.', buttons: ['OK'] });
            return;
        }
        setModalLoading(true);
        try {
            const detailedActivity = await StravaService.getActivityDetails(stravaAccessToken, activity.id);
            setSelectedActivity(detailedActivity);
            setShowModal(true);
        } catch (detailError) {
            console.error('Error fetching activity details:', detailError);
            presentAlert({ header: 'Error', message: 'Failed to load activity details.', buttons: ['OK'] });
            setSelectedActivity(activity);
            setShowModal(true);
        } finally {
            setModalLoading(false);
        }
    };

    const welcomeName = profileName || user?.name;

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Welcome{welcomeName ? `, ${welcomeName}` : ''}!</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                    {/* Modal Content will be added here */}
                </IonModal>

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
                                {activities.map(activity => (
                                    <IonItem button key={activity.id} onClick={() => openActivityDetails(activity)} style={{ border: '1px solid var(--ion-color-medium)', borderRadius: '5px', marginBottom: '10px' }}>
                                        <IonLabel>
                                            <h2>{activity.name}</h2>
                                            <small>{new Date(activity.startDate).toLocaleDateString()}</small>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                                                <div>
                                                    <div className="statRowStyle"><strong>Distance:</strong><span>{(activity.distanceM / 1000).toFixed(2)}{'\u00A0'}km</span></div>
                                                    <div className="statRowStyle"><strong>Time:</strong><span>{formatTime(activity.movingTimeS)}</span></div>
                                                    <div className="statRowStyle"><strong>Avg Speed:</strong><span>{((activity.averageSpeed ?? 0) * 3.6).toFixed(1)}{'\u00A0'}km/h</span></div>
                                                </div>
                                                <div>
                                                    <div className="statRowStyle"><strong>Elevation:</strong><span>{activity.elevationGainM?.toLocaleString()}{'\u00A0'}m</span></div>
                                                    <div className="statRowStyle"><strong>Avg Power:</strong><span>{activity.averageWatts?.toFixed(0)}{'\u00A0'}W</span></div>
                                                    <div className="statRowStyle"><strong>Calories:</strong><span>{activity.calories?.toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                            <div style={{ textAlign: 'center', color: 'var(--ion-color-medium-shade)', fontSize: '0.8rem', padding: '1rem' }}>
                                <p>Only the last 50 days of activities are shown for analytics purposes.</p>
                            </div>
                        </>
                    ) : (
                        <p>No recent Strava activities found.</p>
                    )}
                </section>
            </IonContent>
        </IonPage>
    );
};
