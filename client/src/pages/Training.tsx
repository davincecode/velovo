import React, { useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonList, IonItem, IonLabel, IonText, IonModal, IonButtons, IonButton, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, useIonAlert } from '@ionic/react';
import { close } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useStravaData } from '../context/StravaContext';
import { StravaService, Activity } from '../services/StravaService'; // Keep StravaService for getActivityDetails
import '../theme/global.css';

const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${remainingSeconds}s`;
};

export const Training: React.FC = () => {
    const { user } = useAuth();
    const { activities, latestFitness, latestFatigue, latestBalance, hasOvertrainingWarning, loading, error, isConnected, stravaAccessToken } = useStravaData(); // Get stravaAccessToken from context

    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [presentAlert] = useIonAlert();

    // For now, hasMore is false as useStravaData only fetches the first 10 activities
    const [hasMore, setHasMore] = useState(false); 

    // Placeholder for loading more activities - current StravaService.getActivities fetches only 10
    const loadMoreActivities = async (event: CustomEvent<void>) => {
        // In a real scenario, you would increment a page number and fetch more activities
        // For now, we'll just complete the infinite scroll and set hasMore to false
        (event.target as HTMLIonInfiniteScrollElement).complete();
        setHasMore(false); // No more activities to load with current hook implementation
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
            // Fallback to basic activity details if fetch fails
            setSelectedActivity(activity);
            setShowModal(true);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Training</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <p>Loading training data...</p>
                </IonContent>
            </IonPage>
        );
    }

    if (!user?.id) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Training</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <p>Please log in to view your training data.</p>
                </IonContent>
            </IonPage>
        );
    }

    if (!isConnected) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Training</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <p>Connect your Strava account from the Settings page to see your training summary.</p>
                    {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Training Summary</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonText>
                    <h2>Latest Training Status</h2>
                    {hasOvertrainingWarning && (
                        <p style={{ color: 'red', fontWeight: 'bold' }}>
                            😨 OVERTRAINING WARNING DETECTED! Please prioritize rest and recovery.
                        </p>
                    )}
                    <p>Fitness: {latestFitness ?? 'N/A'}</p>
                    <p>Fatigue: {latestFatigue ?? 'N/A'}</p>
                    <p>Balance: {latestBalance ?? 'N/A'}</p>
                </IonText>

                <section style={{marginTop:16}}>
                    <h3>Recent Activities</h3>
                    {activities.length > 0 ? (
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
                        <IonInfiniteScroll threshold="100px" disabled={!hasMore} onIonInfinite={loadMoreActivities}>
                            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more activities..."></IonInfiniteScrollContent>
                        </IonInfiniteScroll>
                    </>
                    ) : (
                        <p>No recent Strava activities found.</p>
                    )}
                </section>

                <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>{selectedActivity?.name}</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowModal(false)}><IonIcon icon={close} /></IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        {modalLoading ? (
                            <p>Loading activity details...</p>
                        ) : selectedActivity && (
                            <IonList lines="none">
                                <IonItem><IonLabel>Distance: {(selectedActivity.distanceM / 1000).toFixed(2)} km</IonLabel></IonItem>
                                <IonItem><IonLabel>Moving Time: {formatTime(selectedActivity.movingTimeS)}</IonLabel></IonItem>
                                <IonItem><IonLabel>Elapsed Time: {formatTime(selectedActivity.elapsedTimeS)}</IonLabel></IonItem>
                                <IonItem><IonLabel>Elevation Gain: {selectedActivity.elevationGainM?.toLocaleString()} m</IonLabel></IonItem>
                                <IonItem><IonLabel>Total Work: {selectedActivity.kilojoules?.toLocaleString()} kJ</IonLabel></IonItem>
                                <IonItem><IonLabel>Ave Speed: {((selectedActivity.averageSpeed ?? 0) * 3.6).toFixed(1)} km/h</IonLabel></IonItem>
                                <IonItem><IonLabel>Max Speed: {((selectedActivity.maxSpeed ?? 0) * 3.6).toFixed(1)} km/h</IonLabel></IonItem>
                                <IonItem><IonLabel>Ave Power: {selectedActivity.averageWatts?.toFixed(0)} W</IonLabel></IonItem>
                                <IonItem><IonLabel>Max Power: {selectedActivity.maxWatts?.toFixed(0)} W</IonLabel></IonItem>
                                <IonItem><IonLabel>Ave Cadence: {selectedActivity.averageCadence?.toFixed(0)} rpm</IonLabel></IonItem>
                                <IonItem><IonLabel>Calories: {selectedActivity.calories?.toLocaleString()}</IonLabel></IonItem>
                                {selectedActivity.description && (
                                    <IonItem>
                                        <IonLabel><h2>Description</h2><p style={{ whiteSpace: 'pre-wrap' }}>{selectedActivity.description}</p></IonLabel>
                                    </IonItem>
                                )}
                                {selectedActivity.privateNote && (
                                    <IonItem>
                                        <IonLabel><h2>Private Note</h2><p style={{ whiteSpace: 'pre-wrap' }}>{selectedActivity.privateNote}</p></IonLabel>
                                    </IonItem>
                                )}
                            </IonList>
                        )}
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};
