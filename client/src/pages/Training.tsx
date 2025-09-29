import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton, IonList, IonItem, IonLabel, IonModal, IonButtons, IonIcon } from '@ionic/react';
import { StravaService, Activity } from '../services/StravaService';
import { close } from 'ionicons/icons';

const STRAVA_TOKEN_KEY = 'strava_access_token';
const STRAVA_ACTIVITIES_KEY = 'strava_activities_cache';

// Helper to format seconds into HH:MM:SS
const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

export const Training: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>(() => {
        const cachedActivities = localStorage.getItem(STRAVA_ACTIVITIES_KEY);
        return cachedActivities ? JSON.parse(cachedActivities) : [];
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            const accessToken = localStorage.getItem(STRAVA_TOKEN_KEY);
            // Only fetch if we have a token AND no activities are cached/loaded
            if (accessToken && activities.length === 0) {
                try {
                    const userActivities = await StravaService.getActivities(accessToken);
                    localStorage.setItem(STRAVA_ACTIVITIES_KEY, JSON.stringify(userActivities));
                    setActivities(userActivities);
                } catch (error) {
                    console.error("Error fetching Strava activities:", error);
                    if ((error as Error).message.includes('401')) {
                        // Token is invalid, clear it. The user will have to reconnect from settings.
                        localStorage.removeItem(STRAVA_TOKEN_KEY);
                        localStorage.removeItem(STRAVA_ACTIVITIES_KEY);
                        setActivities([]);
                    }
                }
            }
        };

        fetchActivities();
    }, [activities.length]);


    const openActivityDetails = async (activity: Activity) => {
        const accessToken = localStorage.getItem(STRAVA_TOKEN_KEY);
        if (!accessToken) return;
        try {
            const detailedActivity = await StravaService.getActivityDetails(accessToken, activity.id);
            setSelectedActivity(detailedActivity);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching activity details:', error);
            // Fallback to basic activity details if fetch fails
            setSelectedActivity(activity);
            setShowModal(true);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Training</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
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
                        {selectedActivity && (
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

                {activities.length > 0 ? (
                    <>
                        <p>Your recent Strava activities:</p>
                        <IonList>
                            {activities.map(activity => (
                                <IonItem button key={activity.id} onClick={() => openActivityDetails(activity)}>
                                    <IonLabel>
                                        <h2>{activity.name}</h2>
                                        <p>{new Date(activity.startDate).toLocaleDateString()}</p>
                                    </IonLabel>
                                </IonItem>
                            ))}
                        </IonList>
                    </>
                ) : (
                    <p>No Strava activities found. Connect your Strava account from the Settings page.</p>
                )}
            </IonContent>
        </IonPage>
    );
};
