import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton, IonList, IonItem, IonLabel, IonModal, IonButtons, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { StravaService, Activity } from '../services/StravaService';
import { PerformanceCard } from '../components/PerformanceCard';
import { close } from 'ionicons/icons';
import '../theme/global.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../userProfile';

const STRAVA_TOKEN_KEY = 'strava_access_token';
const STRAVA_ACTIVITIES_KEY = 'strava_activities_cache';
const ACTIVITIES_PER_PAGE = 10;

// Helper to format seconds into HH:MM:SS
const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substring(11, 19);

export const Home: React.FC = () => {
    const { user } = useAuth();
    const [profileName, setProfileName] = useState<string>('');
    const [activities, setActivities] = useState<Activity[]>(() => {
        const cachedActivities = localStorage.getItem(STRAVA_ACTIVITIES_KEY);
        return cachedActivities ? JSON.parse(cachedActivities) : [];
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

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
        void fetchUserProfile();
    }, [user?.id]);

    const fetchActivities = async (pageNum: number, perPage: number) => {
        const accessToken = localStorage.getItem(STRAVA_TOKEN_KEY);
        if (!accessToken) return;

        try {
            const newActivities = await StravaService.getActivities(accessToken, pageNum, perPage);
            if (newActivities.length < perPage) {
                setHasMore(false);
            }
            setActivities(prev => [...prev, ...newActivities]);
            // Update cache
            localStorage.setItem(STRAVA_ACTIVITIES_KEY, JSON.stringify([...activities, ...newActivities]));
        } catch (error) {
            console.error("Error fetching Strava activities:", error);
            if ((error as Error).message.includes('401')) {
                localStorage.removeItem(STRAVA_TOKEN_KEY);
                localStorage.removeItem(STRAVA_ACTIVITIES_KEY);
                setActivities([]);
            }
        }
    };

    useEffect(() => {
        // Clear cache and fetch initial activities only if activities are not already loaded
        if (activities.length === 0) {
            localStorage.removeItem(STRAVA_ACTIVITIES_KEY);
            void fetchActivities(1, ACTIVITIES_PER_PAGE);
            setPage(2);
        }
    }, []); // Run only once on mount

    const loadMoreActivities = async (event: CustomEvent<void>) => {
        const infiniteScroll = event.target as HTMLIonInfiniteScrollElement;
        if (hasMore) {
            await fetchActivities(page, ACTIVITIES_PER_PAGE);
            setPage(page + 1);
        }
        infiniteScroll.complete();
    };


    const openActivityDetails = async (activity: Activity) => {
        const accessToken = localStorage.getItem(STRAVA_TOKEN_KEY);
        if (!accessToken) return;
        try {
            const detailedActivity = await StravaService.getActivityDetails(accessToken, activity.id);
            setSelectedActivity(detailedActivity);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching activity details:', error);
            setSelectedActivity(activity);
            setShowModal(true);
        }
    };

    const welcomeName = profileName || user?.name;

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Welcome{welcomeName ? `, ${welcomeName}` : ''}!</IonTitle></IonToolbar></IonHeader>
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
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <div className="statRowStyle"><strong>Distance:</strong><span>{(selectedActivity.distanceM / 1000).toFixed(2)}{'\u00A0'}km</span></div>
                                        <div className="statRowStyle"><strong>Moving Time:</strong><span>{formatTime(selectedActivity.movingTimeS)}</span></div>
                                        <div className="statRowStyle"><strong>Elapsed Time:</strong><span>{formatTime(selectedActivity.elapsedTimeS)}</span></div>
                                        <div className="statRowStyle"><strong>Ave Speed:</strong><span>{((selectedActivity.averageSpeed ?? 0) * 3.6).toFixed(1)}{'\u00A0'}km/h</span></div>
                                        <div className="statRowStyle"><strong>Max Speed:</strong><span>{((selectedActivity.maxSpeed ?? 0) * 3.6).toFixed(1)}{'\u00A0'}km/h</span></div>
                                    </div>
                                    <div>
                                        <div className="statRowStyle"><strong>Elevation:</strong><span>{selectedActivity.elevationGainM?.toLocaleString()}{'\u00A0'}m</span></div>
                                        <div className="statRowStyle"><strong>Ave Power:</strong><span>{selectedActivity.averageWatts?.toFixed(0)}{'\u00A0'}W</span></div>
                                        <div className="statRowStyle"><strong>Max Power:</strong><span>{selectedActivity.maxWatts?.toFixed(0)}{'\u00A0'}W</span></div>
                                        <div className="statRowStyle"><strong>Ave Cadence:</strong><span>{selectedActivity.averageCadence?.toFixed(0)}{'\u00A0'}rpm</span></div>
                                        <div className="statRowStyle"><strong>Calories:</strong><span>{selectedActivity.calories?.toLocaleString()}</span></div>
                                        <div className="statRowStyle"><strong>Total Work:</strong><span>{selectedActivity.kilojoules?.toLocaleString()}{'\u00A0'}kJ</span></div>
                                    </div>
                                </div>
                                
                                {selectedActivity.description && (
                                    <div style={{ marginTop: '16px' }}>
                                        <h3>Description</h3>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{selectedActivity.description}</p>
                                    </div>
                                )}
                                {selectedActivity.privateNote && (
                                    <div style={{ marginTop: '16px' }}>
                                        <h3>Private Note</h3>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{selectedActivity.privateNote}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </IonContent>
                </IonModal>

                <PerformanceCard activities={activities} />
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
                        <p>No Strava activities found. Connect your Strava account from the Settings page.</p>
                    )}
                </section>
            </IonContent>
        </IonPage>
    );
};
